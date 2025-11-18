-- LMS Keyword Extraction Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules table (for future LMS integration)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ko',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    normalized_keyword VARCHAR(255) NOT NULL,
    keyword_type VARCHAR(50) CHECK (keyword_type IN ('concept', 'operation', 'entity', 'attribute')),
    importance_score FLOAT CHECK (importance_score >= 0 AND importance_score <= 1),
    frequency INTEGER DEFAULT 1,
    category VARCHAR(100),
    source_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, normalized_keyword)
);

-- Keyword relationships table
CREATE TABLE IF NOT EXISTS keyword_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    target_keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) CHECK (relationship_type IN ('has_part', 'related_to', 'prerequisite')),
    strength FLOAT CHECK (strength >= 0 AND strength <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_reference CHECK (source_keyword_id != target_keyword_id)
);

-- Keyword visualizations table
CREATE TABLE IF NOT EXISTS keyword_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    bubble_layout JSONB NOT NULL,
    network_graph JSONB NOT NULL,
    layout_algorithm VARCHAR(50) DEFAULT 'force',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_module_id ON keywords(module_id);
CREATE INDEX IF NOT EXISTS idx_keywords_normalized ON keywords(normalized_keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_type ON keywords(keyword_type);
CREATE INDEX IF NOT EXISTS idx_keywords_importance ON keywords(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON keyword_relationships(source_keyword_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON keyword_relationships(target_keyword_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_module ON keyword_visualizations(module_id);

-- Full-text search index for keywords
CREATE INDEX IF NOT EXISTS idx_keywords_fulltext ON keywords USING gin(to_tsvector('english', keyword));

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visualizations_updated_at BEFORE UPDATE ON keyword_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO modules (title, description, content, language) VALUES
(
    '분수의 덧셈과 뺄셈',
    '분수의 기본 연산을 학습합니다',
    '분수의 덧셈과 뺄셈을 수행하세요. 분모가 다른 경우 통분이 필요합니다. 예를 들어, 1/2 + 1/3 = 3/6 + 2/6 = 5/6 입니다.',
    'ko'
);

COMMENT ON TABLE modules IS 'LMS 교육 모듈 정보';
COMMENT ON TABLE keywords IS '추출된 키워드 및 메타데이터';
COMMENT ON TABLE keyword_relationships IS '키워드 간의 관계';
COMMENT ON TABLE keyword_visualizations IS '버블 시각화 데이터';
