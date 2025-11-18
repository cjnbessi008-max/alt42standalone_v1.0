-- Log Gear App Installation Script
-- Run this script to set up the database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS log_gear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE log_gear_db;

-- Source the schema
SOURCE schema.sql;

-- Create database user (optional)
-- Uncomment and modify if you want to create a dedicated user
-- CREATE USER IF NOT EXISTS 'log_gear_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT ALL PRIVILEGES ON log_gear_db.* TO 'log_gear_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Verify installation
SELECT 'Installation complete!' as Status;
SELECT COUNT(*) as SampleProblems FROM problems;
