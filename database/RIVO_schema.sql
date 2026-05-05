-- RIVO database schema reference
-- Use this file as the source of truth when working on SQL, backend queries, or prompts.

-- Database name
-- RIVO

-- users table
-- user_no            INT            PK, AUTO_INCREMENT
-- user_id            VARCHAR(50)    UNIQUE, NOT NULL
-- user_nickname      VARCHAR(50)    NOT NULL
-- password_hash      VARCHAR(100)   NOT NULL
-- email              VARCHAR(100)   UNIQUE, NOT NULL
-- role               ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER'
-- attendance_streak  INT            DEFAULT 0, CHECK(attendance_streak >= 0)
-- attendance_today   BOOLEAN        DEFAULT FALSE
-- daily_target_count  INT            NOT NULL DEFAULT 20

-- words table
-- word_no            INT            PRIMARY KEY, AUTO_INCREMENT
-- word_english       VARCHAR(100)   UNIQUE, NOT NULL
-- word_korean        VARCHAR(100)   NOT NULL
-- example_sentence   TEXT           NULL

-- user_words_status table
-- status_id          INT            PRIMARY KEY, AUTO_INCREMENT
-- user_id            INT            NOT NULL, FOREIGN KEY
-- word_id            INT            NOT NULL, FOREIGN KEY
-- is_favorite        BOOLEAN        NOT NULL DEFAULT FALSE
-- is_memorized       BOOLEAN        NOT NULL DEFAULT FALSE
-- created_at         DATETIME       DEFAULT CURRENT_TIMESTAMP
-- updated_at         DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- game_records table
-- record_id          INT            PRIMARY KEY, AUTO_INCREMENT
-- user_id            INT            NOT NULL, FOREIGN KEY
-- total_words        INT            NOT NULL
-- correct_answers    INT            NOT NULL
-- played_at          DATETIME       NOT NULL
-- created_at         DATETIME       DEFAULT CURRENT_TIMESTAMP
-- updated_at         DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

USE RIVO;
