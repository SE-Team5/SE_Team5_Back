# models.py
from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id                 = db.Column(db.Integer, primary_key=True)
    email              = db.Column(db.String(255), unique=True, nullable=False)
    daily_target_count = db.Column(db.Integer, default=20, nullable=False)
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)


class Word(db.Model):
    __tablename__ = "words"

    id         = db.Column(db.Integer, primary_key=True)
    # 공용 사전 기획에 맞춰 user_id 컬럼 없음
    term       = db.Column(db.String(255), nullable=False, unique=True)  # 중복 단어 방지
    definition = db.Column(db.Text, nullable=False)
    example    = db.Column(db.Text)
    memo       = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserWordStatus(db.Model):
    __tablename__ = "user_words_status"

    id              = db.Column(db.Integer, primary_key=True)
    # 🔧 수정 1: ForeignKey 문자열 정상화
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    word_id         = db.Column(db.Integer, db.ForeignKey("words.id"), nullable=False)
    is_memorized    = db.Column(db.Boolean, default=False, nullable=False)
    is_bookmarked   = db.Column(db.Boolean, default=False, nullable=False)
    study_count     = db.Column(db.Integer, default=0, nullable=False)
    last_studied_at = db.Column(db.DateTime, nullable=True)

    # 🔧 수정 2: (user_id, word_id) 복합 유니크 제약
    # 동일 유저가 동일 단어에 대해 row가 2개 이상 생기는 것을 DB 레벨에서 방지
    __table_args__ = (
        db.UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )