-- Sample 3D Problems for Testing
-- Insert these into your Moodle database to test the 3D Insight Mode plugin
-- Replace courseid=1 and createdby=2 with your actual values

-- 1. Basic Cube Problem
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Cube Properties',
    'Explore the properties of a cube by rotating it in 3D space. Count the vertices, edges, and faces.',
    'cube',
    '{"width": 2, "height": 2, "depth": 2, "color": 4491519}',
    1,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 2. Sphere Surface Area
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Sphere Surface Area',
    'Calculate the surface area of this sphere. The radius is 1.5 units.',
    'sphere',
    '{"radius": 1.5, "widthSegments": 32, "heightSegments": 32, "color": 5025535}',
    2,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 3. Cylinder Volume
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Cylinder Volume',
    'Determine the volume of this cylinder. Measure the radius and height by examining the model.',
    'cylinder',
    '{"radiusTop": 1, "radiusBottom": 1, "height": 3, "radialSegments": 32, "color": 65280}',
    2,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 4. Pyramid Volume
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Pyramid Volume',
    'Calculate the volume of this 4-sided pyramid. The base radius is 1.5 and height is 3 units.',
    'pyramid',
    '{"radius": 1.5, "height": 3, "color": 16744192}',
    3,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 5. Cone Properties
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Cone Surface Area',
    'Find the total surface area of this cone including the base.',
    'cone',
    '{"radius": 1.5, "height": 3, "radialSegments": 32, "color": 16753920}',
    3,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 6. Dodecahedron Exploration
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Dodecahedron Exploration',
    'This dodecahedron has 12 pentagonal faces. Rotate it to count all vertices and edges.',
    'dodecahedron',
    '{"radius": 1.5, "detail": 0, "color": 10027008}',
    4,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 7. Icosahedron
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Icosahedron Properties',
    'An icosahedron has 20 triangular faces. Explore its symmetry.',
    'icosahedron',
    '{"radius": 1.5, "detail": 0, "color": 5025535}',
    4,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 8. Torus
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Torus Volume',
    'Calculate the volume of this torus (donut shape). Main radius: 1.5, tube radius: 0.4',
    'torus',
    '{"radius": 1.5, "tube": 0.4, "radialSegments": 16, "tubularSegments": 100, "color": 16711935}',
    5,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 9. Hexagonal Prism
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Hexagonal Prism',
    'Examine this 6-sided prism. Calculate its volume and surface area.',
    'prism',
    '{"sides": 6, "radius": 1.5, "height": 3, "color": 4491519}',
    3,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 10. Octahedron
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Octahedron Dual',
    'This octahedron is the dual of a cube. Explore their relationship.',
    'octahedron',
    '{"radius": 1.5, "detail": 0, "color": 16776960}',
    4,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 11. Tetrahedron
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Tetrahedron Basics',
    'The simplest Platonic solid with 4 triangular faces. Count vertices and edges.',
    'tetrahedron',
    '{"radius": 1.5, "detail": 0, "color": 65535}',
    2,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- 12. Custom Geometry Example (Square-based Pyramid)
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
    1,
    'Custom Pyramid',
    'A custom-defined pyramid. Study its vertex coordinates and face connections.',
    'custom',
    '{
        "vertices": [
            [0, 2, 0],
            [1, 0, 1],
            [-1, 0, 1],
            [-1, 0, -1],
            [1, 0, -1]
        ],
        "faces": [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 1],
            [1, 4, 3],
            [1, 3, 2]
        ],
        "color": 10027008
    }',
    5,
    1,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2
);

-- Set course configuration for course 1
INSERT INTO mdl_block_3dinsight_config
(courseid, enable_rotation, enable_smartphone_view, default_camera_angle, smartphone_position, timecreated, timemodified)
VALUES
(1, 1, 1, 'isometric', 'bottom-right', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
    enable_rotation = 1,
    enable_smartphone_view = 1,
    default_camera_angle = 'isometric',
    smartphone_position = 'bottom-right',
    timemodified = UNIX_TIMESTAMP();

-- Verify insertion
SELECT
    id,
    title,
    geometry_type,
    difficulty,
    active
FROM mdl_block_3dinsight_problems
WHERE courseid = 1
ORDER BY difficulty, id;
