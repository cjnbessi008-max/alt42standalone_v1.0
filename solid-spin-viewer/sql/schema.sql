-- Solid Spin Viewer Database Schema
-- Compatible with MySQL 5.7

-- Table: solid_shapes
-- Stores 3D solid geometry definitions
CREATE TABLE IF NOT EXISTS `solid_shapes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT 'Shape name (e.g., cube, sphere, pyramid)',
  `name_kr` VARCHAR(100) NOT NULL COMMENT 'Korean name',
  `vertices` TEXT NOT NULL COMMENT 'JSON array of vertices',
  `faces` TEXT NOT NULL COMMENT 'JSON array of faces/indices',
  `color` VARCHAR(7) DEFAULT '#3498db' COMMENT 'Hex color code',
  `category` ENUM('basic', 'polyhedron', 'curved', 'composite') DEFAULT 'basic',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='3D solid shape definitions';

-- Table: moodle_questions
-- Links to Moodle question bank
CREATE TABLE IF NOT EXISTS `moodle_questions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_question_id` INT(11) NOT NULL COMMENT 'Moodle question ID',
  `solid_shape_id` INT(11) NOT NULL COMMENT 'Associated solid shape',
  `question_type` ENUM('identify', 'rotate', 'properties', 'volume', 'surface_area') DEFAULT 'identify',
  `difficulty` TINYINT(1) DEFAULT 1 COMMENT '1-5 difficulty level',
  `rotation_enabled` TINYINT(1) DEFAULT 1 COMMENT 'Allow user rotation',
  `auto_rotate` TINYINT(1) DEFAULT 0 COMMENT 'Auto-rotate on load',
  `rotation_speed` DECIMAL(3,2) DEFAULT 0.01 COMMENT 'Auto-rotation speed',
  `initial_rotation_x` DECIMAL(5,2) DEFAULT 0.00,
  `initial_rotation_y` DECIMAL(5,2) DEFAULT 0.00,
  `initial_rotation_z` DECIMAL(5,2) DEFAULT 0.00,
  `zoom_level` DECIMAL(3,2) DEFAULT 1.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_moodle_question` (`moodle_question_id`),
  KEY `idx_solid_shape` (`solid_shape_id`),
  CONSTRAINT `fk_moodle_questions_solid_shape`
    FOREIGN KEY (`solid_shape_id`) REFERENCES `solid_shapes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle question to solid shape mapping';

-- Table: user_interactions
-- Track user interactions with 3D viewer
CREATE TABLE IF NOT EXISTS `user_interactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` INT(11) NOT NULL COMMENT 'Moodle user ID',
  `question_id` INT(11) NOT NULL,
  `interaction_type` ENUM('rotate', 'zoom', 'pan', 'reset') NOT NULL,
  `rotation_x` DECIMAL(5,2) DEFAULT NULL,
  `rotation_y` DECIMAL(5,2) DEFAULT NULL,
  `rotation_z` DECIMAL(5,2) DEFAULT NULL,
  `zoom_level` DECIMAL(3,2) DEFAULT NULL,
  `time_spent_seconds` INT(11) DEFAULT 0,
  `session_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`moodle_user_id`),
  KEY `idx_question` (`question_id`),
  KEY `idx_session` (`session_id`),
  CONSTRAINT `fk_user_interactions_question`
    FOREIGN KEY (`question_id`) REFERENCES `moodle_questions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User interaction tracking';

-- Insert sample solid shapes
INSERT INTO `solid_shapes` (`name`, `name_kr`, `vertices`, `faces`, `color`, `category`) VALUES
('Cube', '정육면체',
 '[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]',
 '[[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]]',
 '#3498db', 'basic'),

('Sphere', '구',
 '{"type":"sphere","radius":1,"widthSegments":32,"heightSegments":32}',
 '[]',
 '#e74c3c', 'curved'),

('Cone', '원뿔',
 '{"type":"cone","radius":1,"height":2,"radialSegments":32}',
 '[]',
 '#f39c12', 'curved'),

('Cylinder', '원기둥',
 '{"type":"cylinder","radiusTop":1,"radiusBottom":1,"height":2,"radialSegments":32}',
 '[]',
 '#2ecc71', 'curved'),

('Pyramid', '사각뿔',
 '[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[0,0,2]]',
 '[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,1,2,3]]',
 '#9b59b6', 'polyhedron'),

('Tetrahedron', '정사면체',
 '[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]]',
 '[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]',
 '#1abc9c', 'polyhedron'),

('Octahedron', '정팔면체',
 '[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]',
 '[[0,2,4],[0,2,5],[0,3,4],[0,3,5],[1,2,4],[1,2,5],[1,3,4],[1,3,5]]',
 '#e67e22', 'polyhedron'),

('Dodecahedron', '정십이면체',
 '{"type":"dodecahedron","radius":1}',
 '[]',
 '#16a085', 'polyhedron'),

('Torus', '원환체',
 '{"type":"torus","radius":1,"tube":0.4,"radialSegments":16,"tubularSegments":32}',
 '[]',
 '#c0392b', 'curved'),

('Rectangular Prism', '직육면체',
 '[[-1.5,-1,-1],[1.5,-1,-1],[1.5,1,-1],[-1.5,1,-1],[-1.5,-1,1],[1.5,-1,1],[1.5,1,1],[-1.5,1,1]]',
 '[[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]]',
 '#34495e', 'basic');
