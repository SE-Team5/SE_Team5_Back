# models.py
from datetime import datetime
from db import db

class User(db.Model):
    __tablename__ = "users"

    user_no            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id            = db.Column(db.String(50), nullable=False, unique=True)
    user_nickname      = db.Column(db.String(50), nullable=False)
    password_hash      = db.Column(db.String(100), nullable=False)
    email              = db.Column(db.String(100), unique=True, nullable=False)
    role               = db.Column(db.Enum('USER', 'ADMIN'), default='USER', nullable=False)
    attendance_streak  = db.Column(db.Integer, default=0)
    attendance_today   = db.Column(db.Boolean, default=False)
    daily_target_count = db.Column(db.Integer, default=20, nullable=False)
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at         = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Word(db.Model):
    __tablename__ = "words"

    word_no          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    word_english     = db.Column(db.String(100), nullable=False, unique=True)
    word_korean      = db.Column(db.String(100), nullable=False)
    example_sentence = db.Column(db.Text)
    # 기획 스키마에 맞춰 created_at, updated_at, memo 제거


class GameRecord(db.Model):
    __tablename__ = "game_records"
    
    # 🔧 추가: LIVO_schema.sql에는 있지만 기존 models.py에 없던 테이블 추가
    record_id       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.user_no", ondelete="CASCADE"), nullable=False)
    total_words     = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False)
    played_at       = db.Column(db.DateTime, nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserWordStatus(db.Model):
    __tablename__ = "user_words_status"

    status_id       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # 🔧 수정: ForeignKey가 'users.id'가 아니라 'users.user_no', 'words.word_no'를 바라보도록 변경
    user_id         = db.Column(db.Integer, db.ForeignKey("users.user_no", ondelete="CASCADE"), nullable=False)
    word_id         = db.Column(db.Integer, db.ForeignKey("words.word_no", ondelete="CASCADE"), nullable=False)
    is_favorite     = db.Column(db.Boolean, default=False, nullable=False)
    is_memorized    = db.Column(db.Boolean, default=False, nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 🔧 수정: SQL 제약조건 이름(unique_user_word)과 동일하게 맞춤
    __table_args__ = (
        db.UniqueConstraint("user_id", "word_id", name="unique_user_word"),
    )