import * as THREE from 'three';

/**
 * GeometryFactory - Creates various 3D geometries based on type and parameters
 */
export class GeometryFactory {
    /**
     * Create geometry based on type
     * @param {string} type - Geometry type
     * @param {object} data - Geometry parameters
     * @returns {THREE.BufferGeometry}
     */
    static create(type, data = {}) {
        switch (type.toLowerCase()) {
            case 'cube':
            case 'box':
                return this.createBox(data);

            case 'sphere':
                return this.createSphere(data);

            case 'cylinder':
                return this.createCylinder(data);

            case 'cone':
                return this.createCone(data);

            case 'pyramid':
                return this.createPyramid(data);

            case 'torus':
                return this.createTorus(data);

            case 'dodecahedron':
                return this.createDodecahedron(data);

            case 'icosahedron':
                return this.createIcosahedron(data);

            case 'octahedron':
                return this.createOctahedron(data);

            case 'tetrahedron':
                return this.createTetrahedron(data);

            case 'prism':
                return this.createPrism(data);

            case 'custom':
                return this.createCustom(data);

            default:
                console.warn(`Unknown geometry type: ${type}, using box`);
                return this.createBox(data);
        }
    }

    /**
     * Create box geometry
     */
    static createBox(data) {
        const width = data.width || 2;
        const height = data.height || 2;
        const depth = data.depth || 2;
        return new THREE.BoxGeometry(width, height, depth);
    }

    /**
     * Create sphere geometry
     */
    static createSphere(data) {
        const radius = data.radius || 1.5;
        const widthSegments = data.widthSegments || 32;
        const heightSegments = data.heightSegments || 32;
        return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    }

    /**
     * Create cylinder geometry
     */
    static createCylinder(data) {
        const radiusTop = data.radiusTop || 1;
        const radiusBottom = data.radiusBottom || 1;
        const height = data.height || 3;
        const radialSegments = data.radialSegments || 32;
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    }

    /**
     * Create cone geometry
     */
    static createCone(data) {
        const radius = data.radius || 1.5;
        const height = data.height || 3;
        const radialSegments = data.radialSegments || 32;
        return new THREE.ConeGeometry(radius, height, radialSegments);
    }

    /**
     * Create pyramid geometry (4-sided)
     */
    static createPyramid(data) {
        const radius = data.radius || 1.5;
        const height = data.height || 3;
        return new THREE.ConeGeometry(radius, height, 4);
    }

    /**
     * Create torus geometry
     */
    static createTorus(data) {
        const radius = data.radius || 1.5;
        const tube = data.tube || 0.4;
        const radialSegments = data.radialSegments || 16;
        const tubularSegments = data.tubularSegments || 100;
        return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    }

    /**
     * Create dodecahedron geometry
     */
    static createDodecahedron(data) {
        const radius = data.radius || 1.5;
        const detail = data.detail || 0;
        return new THREE.DodecahedronGeometry(radius, detail);
    }

    /**
     * Create icosahedron geometry
     */
    static createIcosahedron(data) {
        const radius = data.radius || 1.5;
        const detail = data.detail || 0;
        return new THREE.IcosahedronGeometry(radius, detail);
    }

    /**
     * Create octahedron geometry
     */
    static createOctahedron(data) {
        const radius = data.radius || 1.5;
        const detail = data.detail || 0;
        return new THREE.OctahedronGeometry(radius, detail);
    }

    /**
     * Create tetrahedron geometry
     */
    static createTetrahedron(data) {
        const radius = data.radius || 1.5;
        const detail = data.detail || 0;
        return new THREE.TetrahedronGeometry(radius, detail);
    }

    /**
     * Create prism geometry (n-sided)
     */
    static createPrism(data) {
        const sides = data.sides || 6;
        const radius = data.radius || 1.5;
        const height = data.height || 3;
        return new THREE.CylinderGeometry(radius, radius, height, sides);
    }

    /**
     * Create custom geometry from vertex/face data
     */
    static createCustom(data) {
        const geometry = new THREE.BufferGeometry();

        if (data.vertices && data.faces) {
            // Convert face indices to flat array
            const positions = [];
            const normals = [];

            data.faces.forEach(face => {
                const v1 = data.vertices[face[0]];
                const v2 = data.vertices[face[1]];
                const v3 = data.vertices[face[2]];

                positions.push(v1[0], v1[1], v1[2]);
                positions.push(v2[0], v2[1], v2[2]);
                positions.push(v3[0], v3[1], v3[2]);

                // Calculate face normal
                const vec1 = new THREE.Vector3(v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]);
                const vec2 = new THREE.Vector3(v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]);
                const normal = new THREE.Vector3().crossVectors(vec1, vec2).normalize();

                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
            });

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        } else {
            // Fallback to simple box
            console.warn('Custom geometry missing vertices/faces data, using box');
            return this.createBox({});
        }

        geometry.computeBoundingSphere();
        return geometry;
    }

    /**
     * Create geometry from parametric equation
     * Example for educational purposes
     */
    static createParametric(data) {
        const func = data.function || ((u, v, target) => {
            const x = Math.cos(u) * Math.sin(v);
            const y = Math.sin(u) * Math.sin(v);
            const z = Math.cos(v);
            target.set(x, y, z).multiplyScalar(1.5);
        });

        const slices = data.slices || 25;
        const stacks = data.stacks || 25;

        return new THREE.ParametricGeometry(func, slices, stacks);
    }
}
