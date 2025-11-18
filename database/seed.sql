-- Sample data for testing Correspondence Lines

-- Insert sample students
INSERT INTO students (id, moodle_user_id, username, email) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1001, 'student1', 'student1@kaist.ac.kr'),
('550e8400-e29b-41d4-a716-446655440002', 1002, 'student2', 'student2@kaist.ac.kr'),
('550e8400-e29b-41d4-a716-446655440003', 1003, 'student3', 'student3@kaist.ac.kr');

-- Insert sample problem: English-Korean vocabulary matching
INSERT INTO problems (id, moodle_question_id, title, description, instructions, difficulty_level, time_limit_seconds, max_attempts, randomize_order, created_by) VALUES
('660e8400-e29b-41d4-a716-446655440001', 2001, 'Basic English-Korean Vocabulary', 'Match English words with their Korean translations', 'Draw lines to connect each English word with its correct Korean translation. You can change your connections before submitting.', 1, 180, 3, TRUE, 'teacher1');

-- Insert correspondence pairs for English-Korean problem
INSERT INTO correspondence_pairs (id, problem_id, left_item_id, left_item_text, right_item_id, right_item_text, is_correct_match, display_order) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'left_1', 'Apple', 'right_1', '사과', TRUE, 1),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'left_2', 'Book', 'right_2', '책', TRUE, 2),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'left_3', 'Computer', 'right_3', '컴퓨터', TRUE, 3),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'left_4', 'Water', 'right_4', '물', TRUE, 4),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 'left_5', 'Tree', 'right_5', '나무', TRUE, 5);

-- Insert sample problem: Math operations matching
INSERT INTO problems (id, moodle_question_id, title, description, instructions, difficulty_level, time_limit_seconds, max_attempts, randomize_order, created_by) VALUES
('660e8400-e29b-41d4-a716-446655440002', 2002, 'Math Operations and Results', 'Match mathematical expressions with their results', 'Connect each mathematical operation with its correct answer.', 2, 120, 3, TRUE, 'teacher1');

-- Insert correspondence pairs for Math problem
INSERT INTO correspondence_pairs (id, problem_id, left_item_id, left_item_text, right_item_id, right_item_text, is_correct_match, display_order) VALUES
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440002', 'left_1', '5 + 3', 'right_1', '8', TRUE, 1),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440002', 'left_2', '10 - 4', 'right_2', '6', TRUE, 2),
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440002', 'left_3', '3 × 4', 'right_3', '12', TRUE, 3),
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440002', 'left_4', '15 ÷ 3', 'right_4', '5', TRUE, 4);

-- Insert sample problem: Animals and their sounds
INSERT INTO problems (id, moodle_question_id, title, description, instructions, difficulty_level, time_limit_seconds, max_attempts, randomize_order, created_by) VALUES
('660e8400-e29b-41d4-a716-446655440003', 2003, 'Animals and Sounds', 'Match each animal with the sound it makes', 'Draw lines to connect animals with their sounds.', 1, 150, 3, FALSE, 'teacher2');

-- Insert correspondence pairs for Animals problem
INSERT INTO correspondence_pairs (id, problem_id, left_item_id, left_item_text, right_item_id, right_item_text, is_correct_match, display_order) VALUES
('770e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440003', 'left_1', '🐶 Dog', 'right_1', 'Woof', TRUE, 1),
('770e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440003', 'left_2', '🐱 Cat', 'right_2', 'Meow', TRUE, 2),
('770e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440003', 'left_3', '🐮 Cow', 'right_3', 'Moo', TRUE, 3),
('770e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440003', 'left_4', '🐸 Frog', 'right_4', 'Ribbit', TRUE, 4),
('770e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440003', 'left_5', '🐦 Bird', 'right_5', 'Tweet', TRUE, 5);
