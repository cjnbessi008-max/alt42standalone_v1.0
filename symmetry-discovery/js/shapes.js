/**
 * Shapes Database
 * Defines various geometric shapes with their symmetry properties
 */

class ShapeLibrary {
    constructor() {
        this.shapes = this.initializeShapes();
        this.currentShapeIndex = 0;
    }

    initializeShapes() {
        return [
            // Level 1: Simple shapes with basic symmetry
            {
                id: 1,
                name: '정삼각형',
                nameEn: 'Equilateral Triangle',
                description: '3개의 대칭축을 가진 정삼각형',
                difficulty: 1,
                symmetryLines: [
                    { angle: 90, tolerance: 5 },   // Vertical
                    { angle: 210, tolerance: 5 },  // 120° rotated
                    { angle: 330, tolerance: 5 }   // 240° rotated
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    // Draw triangle
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const angle = (i * 120 - 90) * Math.PI / 180;
                        const x = Math.cos(angle) * size;
                        const y = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();

                    // Gradient fill
                    const gradient = ctx.createLinearGradient(-size, -size, size, size);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 2,
                name: '정사각형',
                nameEn: 'Square',
                description: '4개의 대칭축을 가진 정사각형',
                difficulty: 1,
                symmetryLines: [
                    { angle: 0, tolerance: 5 },    // Horizontal
                    { angle: 90, tolerance: 5 },   // Vertical
                    { angle: 45, tolerance: 5 },   // Diagonal 1
                    { angle: 135, tolerance: 5 }   // Diagonal 2
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    // Draw square
                    const halfSize = size * 0.8;
                    ctx.beginPath();
                    ctx.rect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

                    const gradient = ctx.createLinearGradient(-halfSize, -halfSize, halfSize, halfSize);
                    gradient.addColorStop(0, '#f093fb');
                    gradient.addColorStop(1, '#f5576c');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 3,
                name: '정오각형',
                nameEn: 'Regular Pentagon',
                description: '5개의 대칭축을 가진 정오각형',
                difficulty: 2,
                symmetryLines: [
                    { angle: 90, tolerance: 5 },
                    { angle: 162, tolerance: 5 },
                    { angle: 234, tolerance: 5 },
                    { angle: 306, tolerance: 5 },
                    { angle: 18, tolerance: 5 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 72 - 90) * Math.PI / 180;
                        const x = Math.cos(angle) * size;
                        const y = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();

                    const gradient = ctx.createLinearGradient(-size, -size, size, size);
                    gradient.addColorStop(0, '#4facfe');
                    gradient.addColorStop(1, '#00f2fe');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 4,
                name: '정육각형',
                nameEn: 'Regular Hexagon',
                description: '6개의 대칭축을 가진 정육각형',
                difficulty: 2,
                symmetryLines: [
                    { angle: 0, tolerance: 5 },
                    { angle: 30, tolerance: 5 },
                    { angle: 60, tolerance: 5 },
                    { angle: 90, tolerance: 5 },
                    { angle: 120, tolerance: 5 },
                    { angle: 150, tolerance: 5 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * 60) * Math.PI / 180;
                        const x = Math.cos(angle) * size;
                        const y = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();

                    const gradient = ctx.createLinearGradient(-size, -size, size, size);
                    gradient.addColorStop(0, '#43e97b');
                    gradient.addColorStop(1, '#38f9d7');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 5,
                name: '원',
                nameEn: 'Circle',
                description: '무한개의 대칭축을 가진 원 (대표 4개)',
                difficulty: 1,
                symmetryLines: [
                    { angle: 0, tolerance: 180 },    // Any angle works for circle
                    { angle: 45, tolerance: 180 },
                    { angle: 90, tolerance: 180 },
                    { angle: 135, tolerance: 180 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);

                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);

                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.8);
                    gradient.addColorStop(0, '#fa709a');
                    gradient.addColorStop(1, '#fee140');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 6,
                name: '별 (5각)',
                nameEn: '5-Point Star',
                description: '5개의 대칭축을 가진 별',
                difficulty: 3,
                symmetryLines: [
                    { angle: 90, tolerance: 5 },
                    { angle: 162, tolerance: 5 },
                    { angle: 234, tolerance: 5 },
                    { angle: 306, tolerance: 5 },
                    { angle: 18, tolerance: 5 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    const outerRadius = size;
                    const innerRadius = size * 0.4;

                    ctx.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const angle = (i * 36 - 90) * Math.PI / 180;
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();

                    const gradient = ctx.createLinearGradient(-size, -size, size, size);
                    gradient.addColorStop(0, '#ffd89b');
                    gradient.addColorStop(1, '#19547b');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 7,
                name: '하트',
                nameEn: 'Heart',
                description: '1개의 대칭축을 가진 하트',
                difficulty: 1,
                symmetryLines: [
                    { angle: 90, tolerance: 5 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    const scale = size / 100;
                    ctx.scale(scale, scale);

                    ctx.beginPath();
                    ctx.moveTo(0, 20);
                    ctx.bezierCurveTo(-50, -20, -80, 0, -40, 50);
                    ctx.lineTo(0, 80);
                    ctx.lineTo(40, 50);
                    ctx.bezierCurveTo(80, 0, 50, -20, 0, 20);
                    ctx.closePath();

                    const gradient = ctx.createLinearGradient(-80, -20, 80, 80);
                    gradient.addColorStop(0, '#ff6b6b');
                    gradient.addColorStop(1, '#ee5a6f');
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    ctx.restore();
                }
            },
            {
                id: 8,
                name: '나비',
                nameEn: 'Butterfly',
                description: '1개의 대칭축을 가진 나비',
                difficulty: 2,
                symmetryLines: [
                    { angle: 90, tolerance: 5 }
                ],
                draw: function(ctx, centerX, centerY, size, rotation) {
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    const scale = size / 80;
                    ctx.scale(scale, scale);

                    // Left wing
                    ctx.beginPath();
                    ctx.ellipse(-30, -20, 40, 30, -0.3, 0, Math.PI * 2);
                    const gradient1 = ctx.createLinearGradient(-70, -50, 10, 10);
                    gradient1.addColorStop(0, '#667eea');
                    gradient1.addColorStop(1, '#764ba2');
                    ctx.fillStyle = gradient1;
                    ctx.fill();
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Right wing
                    ctx.beginPath();
                    ctx.ellipse(30, -20, 40, 30, 0.3, 0, Math.PI * 2);
                    const gradient2 = ctx.createLinearGradient(-10, -50, 70, 10);
                    gradient2.addColorStop(0, '#764ba2');
                    gradient2.addColorStop(1, '#667eea');
                    ctx.fillStyle = gradient2;
                    ctx.fill();
                    ctx.stroke();

                    // Body
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 8, 40, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#333';
                    ctx.fill();

                    // Antennae
                    ctx.beginPath();
                    ctx.moveTo(-3, -35);
                    ctx.quadraticCurveTo(-15, -50, -10, -55);
                    ctx.moveTo(3, -35);
                    ctx.quadraticCurveTo(15, -50, 10, -55);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.restore();
                }
            }
        ];
    }

    getShape(index) {
        return this.shapes[index % this.shapes.length];
    }

    getRandomShape() {
        const randomIndex = Math.floor(Math.random() * this.shapes.length);
        return this.shapes[randomIndex];
    }

    getCurrentShape() {
        return this.getShape(this.currentShapeIndex);
    }

    nextShape() {
        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.shapes.length;
        return this.getCurrentShape();
    }

    getTotalShapes() {
        return this.shapes.length;
    }
}
