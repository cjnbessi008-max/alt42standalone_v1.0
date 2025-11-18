-- Vector 3D Sense - Database Setup Script
-- Run this script to create database and user

-- Create database
CREATE DATABASE IF NOT EXISTS vector3d_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password in production)
CREATE USER IF NOT EXISTS 'vector3d_user'@'localhost' IDENTIFIED BY 'V3cT0r_S3cur3_P@ss';

-- Grant privileges
GRANT ALL PRIVILEGES ON vector3d_sense.* TO 'vector3d_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Use database
USE vector3d_sense;

-- Source schema
SOURCE ../database/schema.sql;
