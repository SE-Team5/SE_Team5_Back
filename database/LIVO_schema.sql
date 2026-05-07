-- LIVO Database Schema
-- Created for LIVO project

CREATE DATABASE IF NOT EXISTS LIVO
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE LIVO;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_words_status;
DROP TABLE IF EXISTS game_records;
DROP TABLE IF EXISTS words;
DROP TABLE IF EXISTS users;

-- users table
CREATE TABLE users (
  user_no INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(50) NOT NULL,
  user_nickname VARCHAR(50) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  attendance_streak INT DEFAULT 0,
  attendance_today BOOLEAN DEFAULT FALSE,
  daily_target_count INT NOT NULL DEFAULT 20,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_no),
  UNIQUE KEY unique_user_id (user_id),
  UNIQUE KEY unique_email (email),
  CHECK (attendance_streak >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- words table
CREATE TABLE words (
  word_no INT NOT NULL AUTO_INCREMENT,
  word_english VARCHAR(100) NOT NULL,
  word_korean VARCHAR(100) NOT NULL,
  example_sentence TEXT,
  PRIMARY KEY (word_no),
  UNIQUE KEY unique_word_english (word_english)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- game_records table
CREATE TABLE game_records (
  record_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_words INT NOT NULL,
  correct_answers INT NOT NULL,
  played_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_user_id (user_id),
  KEY idx_played_at (played_at),
  CONSTRAINT fk_game_records_user FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_words_status table
CREATE TABLE user_words_status (
  status_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  word_id INT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_memorized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (status_id),
  UNIQUE KEY unique_user_word (user_id, word_id),
  KEY idx_user_id (user_id),
  KEY idx_word_id (word_id),
  CONSTRAINT fk_user_words_status_user FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
  CONSTRAINT fk_user_words_status_word FOREIGN KEY (word_id) REFERENCES words(word_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
