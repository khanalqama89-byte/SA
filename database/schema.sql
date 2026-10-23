-- ======================================================================
-- SA Document Converter Platform - Database Schema
-- Database: sa_db
-- ======================================================================

CREATE DATABASE IF NOT EXISTS sa_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sa_db;

-- ----------------------------------------------------------------------
-- 1. Table: users
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 2. Table: files (Metadata only, files are stored on secure disk)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_files_user_id (user_id),
    INDEX idx_files_expires_at (expires_at),
    INDEX idx_files_stored_name (stored_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 3. Table: tools
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    source_format VARCHAR(20) NOT NULL,
    target_format VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tools_slug (slug),
    INDEX idx_tools_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 4. Table: conversion_jobs
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NULL,
    source_file_id VARCHAR(36) NOT NULL,
    output_file_id VARCHAR(36) NULL,
    source_format VARCHAR(20) NOT NULL,
    target_format VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    progress INT NOT NULL DEFAULT 0,
    error_message VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_jobs_source_file FOREIGN KEY (source_file_id) REFERENCES files(id) ON DELETE CASCADE,
    CONSTRAINT fk_jobs_output_file FOREIGN KEY (output_file_id) REFERENCES files(id) ON DELETE SET NULL,
    INDEX idx_jobs_user_id (user_id),
    INDEX idx_jobs_status (status),
    INDEX idx_jobs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 5. Table: conversion_history
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id VARCHAR(36) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    source_file_name VARCHAR(255) NOT NULL,
    output_file_name VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_job FOREIGN KEY (job_id) REFERENCES conversion_jobs(id) ON DELETE CASCADE,
    INDEX idx_history_user_id (user_id),
    INDEX idx_history_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- Seed Initial Tools (Phase 43 specification)
-- ----------------------------------------------------------------------
INSERT INTO tools (name, slug, description, source_format, target_format, enabled) VALUES
('PDF to Word', 'pdf-to-word', 'Convert PDF documents to editable Microsoft Word (DOCX) files accurately.', 'pdf', 'docx', TRUE),
('Word to PDF', 'word-to-pdf', 'Convert Word (DOCX) documents into standard PDF documents.', 'docx', 'pdf', TRUE),
('PDF to Text', 'pdf-to-text', 'Extract text content from PDF documents cleanly into Plain Text (TXT).', 'pdf', 'txt', TRUE),
('PDF to JPG', 'pdf-to-jpg', 'Extract or render PDF pages into high-resolution JPG images.', 'pdf', 'jpg', TRUE),
('JPG to PDF', 'jpg-to-pdf', 'Convert JPG images into a single professional PDF document.', 'jpg', 'pdf', TRUE),
('PNG to PDF', 'png-to-pdf', 'Convert PNG images into a clean, crisp PDF document.', 'png', 'pdf', TRUE),
('PDF to PNG', 'pdf-to-png', 'Render PDF pages into crystal clear lossless PNG images.', 'pdf', 'png', TRUE),
('Merge PDF', 'merge-pdf', 'Combine multiple PDF files into one single organized PDF document.', 'pdf', 'pdf', TRUE),
('Split PDF', 'split-pdf', 'Separate PDF pages or extract a specific range into standalone PDFs.', 'pdf', 'zip', TRUE),
('Compress PDF', 'compress-pdf', 'Reduce PDF file size efficiently while maintaining visual quality.', 'pdf', 'pdf', TRUE),
('Rotate PDF', 'rotate-pdf', 'Rotate PDF pages 90, 180, or 270 degrees permanently.', 'pdf', 'pdf', TRUE),
('Extract PDF Pages', 'extract-pdf-pages', 'Extract selected pages from any PDF document into a new PDF.', 'pdf', 'pdf', TRUE),
('Delete PDF Pages', 'delete-pdf-pages', 'Remove unwanted pages from a PDF document effortlessly.', 'pdf', 'pdf', TRUE),
('HTML to PDF', 'html-to-pdf', 'Convert HTML documents or webpages into formatted PDF documents.', 'html', 'pdf', TRUE),
('Text to PDF', 'text-to-pdf', 'Transform plain text files into cleanly styled PDF documents.', 'txt', 'pdf', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
