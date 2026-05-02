-- 数据库初始化脚本 (PostgreSQL)
-- 适用于生产环境部署

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(32) UNIQUE NOT NULL DEFAULT REPLACE(uuid_generate_v4()::text, '-', ''),
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    university_id INTEGER NOT NULL,
    gender VARCHAR(10),
    prefer_gender VARCHAR(10),
    age INTEGER,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verification_code VARCHAR(6),
    verification_code_expires TIMESTAMP,
    hashed_password VARCHAR(255),
    survey_completed BOOLEAN DEFAULT FALSE,
    survey_answers JSONB DEFAULT '{}',
    survey_score_normalized FLOAT DEFAULT 0.0,
    bio TEXT DEFAULT '',
    photos JSONB DEFAULT '[]',
    city_preference VARCHAR(20) DEFAULT 'anywhere',
    is_admin BOOLEAN DEFAULT FALSE,
    is_active_matching BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_matched_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_university ON users(university_id);
CREATE INDEX idx_users_status ON users(verification_status);
CREATE INDEX idx_users_survey ON users(survey_completed);

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) DEFAULT 'register',
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vc_email ON verification_codes(email);

-- 匹配表
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id),
    user2_id INTEGER NOT NULL REFERENCES users(id),
    compatibility_score FLOAT DEFAULT 0.0,
    city_bonus FLOAT DEFAULT 0.0,
    detail_scores JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    user1_action VARCHAR(20),
    user2_action VARCHAR(20),
    week_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    revealed_at TIMESTAMP,
    action_deadline TIMESTAMP
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_week ON matches(week_number);

-- 匹配历史表
CREATE TABLE IF NOT EXISTS match_history (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    result VARCHAR(20),  -- matched / rejected / expired
    score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mh_match_id ON match_history(match_id);

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    target_user_id INTEGER,
    detail TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建默认管理员账户 (密码: admin123，部署后请立即修改)
-- INSERT INTO users (email, nickname, university_id, hashed_password, verification_status, is_admin, survey_completed)
-- VALUES ('admin@topdate.cn', '管理员', 1, '$2b$12$...', 'active', TRUE, TRUE);
