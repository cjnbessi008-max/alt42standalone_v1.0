-- Similarity Insight Database Schema
-- SQLite 3.x

-- Table: geometric_shapes
-- Stores geometric shapes (triangles, polygons) for similarity analysis
CREATE TABLE IF NOT EXISTS geometric_shapes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    shape_type TEXT NOT NULL CHECK(shape_type IN ('triangle', 'quadrilateral', 'polygon')),
    vertices TEXT NOT NULL, -- JSON array of vertices [{x, y}, ...]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: similarity_problems
-- Stores similarity problems with two shapes to compare
CREATE TABLE IF NOT EXISTS similarity_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    shape_a_id INTEGER NOT NULL,
    shape_b_id INTEGER NOT NULL,
    is_similar BOOLEAN,
    similarity_ratio REAL,
    similarity_type TEXT, -- 'AA', 'SAS', 'SSS', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_a_id) REFERENCES geometric_shapes(id),
    FOREIGN KEY (shape_b_id) REFERENCES geometric_shapes(id)
);

-- Table: student_solutions
-- Stores student attempts at solving similarity problems
CREATE TABLE IF NOT EXISTS student_solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,
    student_name TEXT,
    answer_is_similar BOOLEAN,
    answer_ratio REAL,
    is_correct BOOLEAN,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES similarity_problems(id)
);

-- Insert sample data for demonstration
INSERT INTO geometric_shapes (name, shape_type, vertices) VALUES
    ('Small Triangle A', 'triangle', '[{"x":50,"y":200},{"x":150,"y":200},{"x":100,"y":100}]'),
    ('Large Triangle B', 'triangle', '[{"x":200,"y":400},{"x":400,"y":400},{"x":300,"y":200}]'),
    ('Triangle C', 'triangle', '[{"x":30,"y":180},{"x":120,"y":180},{"x":75,"y":90}]'),
    ('Quadrilateral A', 'quadrilateral', '[{"x":50,"y":50},{"x":150,"y":50},{"x":150,"y":150},{"x":50,"y":150}]');

INSERT INTO similarity_problems (title, description, shape_a_id, shape_b_id, is_similar, similarity_ratio, similarity_type) VALUES
    (
        'Basic Triangle Similarity',
        'Determine if these two triangles are similar and find the similarity ratio.',
        1,
        2,
        1,
        2.0,
        'SSS'
    ),
    (
        'Triangle Comparison',
        'Compare these triangles and identify the similarity relationship.',
        1,
        3,
        1,
        1.5,
        'AA'
    );
