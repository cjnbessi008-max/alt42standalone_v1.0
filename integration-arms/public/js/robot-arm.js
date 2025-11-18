/**
 * Robot Arm Class
 * 3-segment robotic arm with inverse kinematics
 */

class RobotArm {
    constructor(canvas, x, y, side = 'left') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseX = x;
        this.baseY = y;
        this.side = side; // 'left' or 'right'

        // Arm segments
        this.segments = [
            { length: 100, angle: 0, color: '#FF9800' }, // Upper arm
            { length: 80, angle: 0, color: '#FF5722' },  // Forearm
            { length: 40, angle: 0, color: '#F44336' }   // Hand
        ];

        // Gripper state
        this.gripperOpen = true;
        this.grippedObject = null;

        // Animation state
        this.targetAngles = [0, 0, 0];
        this.animationSpeed = 0.1;
    }

    /**
     * Calculate forward kinematics (joint angles -> end position)
     */
    forwardKinematics() {
        let x = this.baseX;
        let y = this.baseY;
        let angle = 0;

        const positions = [{ x, y }];

        for (const segment of this.segments) {
            angle += segment.angle;
            x += Math.cos(angle) * segment.length;
            y += Math.sin(angle) * segment.length;
            positions.push({ x, y });
        }

        return positions;
    }

    /**
     * Simple inverse kinematics (end position -> joint angles)
     * Using CCD (Cyclic Coordinate Descent)
     */
    inverseKinematics(targetX, targetY, iterations = 10) {
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = this.segments.length - 1; i >= 0; i--) {
                const positions = this.forwardKinematics();
                const joint = positions[i];
                const endEffector = positions[positions.length - 1];

                // Vector from joint to end effector
                const toEnd = {
                    x: endEffector.x - joint.x,
                    y: endEffector.y - joint.y
                };

                // Vector from joint to target
                const toTarget = {
                    x: targetX - joint.x,
                    y: targetY - joint.y
                };

                // Calculate angle difference
                const currentAngle = Math.atan2(toEnd.y, toEnd.x);
                const targetAngle = Math.atan2(toTarget.y, toTarget.x);
                let angleDiff = targetAngle - currentAngle;

                // Normalize angle
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                // Apply angle change
                this.segments[i].angle += angleDiff;
            }
        }

        return this.forwardKinematics();
    }

    /**
     * Move to target position smoothly
     */
    moveTo(targetX, targetY, duration = 1000) {
        return new Promise((resolve) => {
            const startAngles = this.segments.map(s => s.angle);

            // Calculate target angles using IK
            this.inverseKinematics(targetX, targetY);
            const targetAngles = this.segments.map(s => s.angle);

            // Reset to start angles
            this.segments.forEach((s, i) => s.angle = startAngles[i]);

            // Animate using GSAP
            gsap.to(this.segments, {
                duration: duration / 1000,
                ease: 'power2.inOut',
                angle: (i) => targetAngles[i],
                onUpdate: () => this.draw(),
                onComplete: resolve
            });
        });
    }

    /**
     * Grab an object
     */
    grab(object) {
        this.gripperOpen = false;
        this.grippedObject = object;
        return new Promise((resolve) => {
            setTimeout(resolve, 500);
        });
    }

    /**
     * Release the object
     */
    release() {
        this.gripperOpen = true;
        const object = this.grippedObject;
        this.grippedObject = null;
        return new Promise((resolve) => {
            setTimeout(() => resolve(object), 500);
        });
    }

    /**
     * Pull gesture animation
     */
    pull(direction = -1) {
        const pullDistance = 30 * direction;
        const originalX = this.baseX;

        return new Promise((resolve) => {
            gsap.to(this, {
                duration: 0.8,
                baseX: this.baseX + pullDistance,
                ease: 'elastic.out(1, 0.5)',
                onUpdate: () => this.draw(),
                onComplete: () => {
                    gsap.to(this, {
                        duration: 0.5,
                        baseX: originalX,
                        ease: 'power2.out',
                        onUpdate: () => this.draw(),
                        onComplete: resolve
                    });
                }
            });
        });
    }

    /**
     * Draw the arm
     */
    draw() {
        const positions = this.forwardKinematics();

        // Draw segments
        for (let i = 0; i < this.segments.length; i++) {
            const start = positions[i];
            const end = positions[i + 1];
            const segment = this.segments[i];

            // Draw segment
            this.ctx.strokeStyle = segment.color;
            this.ctx.lineWidth = 15 - i * 3;
            this.ctx.lineCap = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();

            // Draw joint
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw gripper (end effector)
        const endPos = positions[positions.length - 1];
        this.drawGripper(endPos.x, endPos.y);

        // Draw gripped object if any
        if (this.grippedObject) {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.grippedObject, endPos.x, endPos.y - 20);
        }
    }

    /**
     * Draw gripper
     */
    drawGripper(x, y) {
        const gripperWidth = this.gripperOpen ? 20 : 10;

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        // Left finger
        this.ctx.beginPath();
        this.ctx.moveTo(x - gripperWidth / 2, y);
        this.ctx.lineTo(x - gripperWidth / 2, y + 15);
        this.ctx.stroke();

        // Right finger
        this.ctx.beginPath();
        this.ctx.moveTo(x + gripperWidth / 2, y);
        this.ctx.lineTo(x + gripperWidth / 2, y + 15);
        this.ctx.stroke();

        // Palm
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#666';
        this.ctx.fill();
    }

    /**
     * Reset to default position
     */
    reset() {
        this.segments.forEach(s => s.angle = 0);
        this.gripperOpen = true;
        this.grippedObject = null;
        this.draw();
    }

    /**
     * Get end effector position
     */
    getEndPosition() {
        const positions = this.forwardKinematics();
        return positions[positions.length - 1];
    }
}
