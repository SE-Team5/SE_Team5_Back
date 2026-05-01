"""Wordbook Service"""
from .repository import WordbookRepository

class WordbookService:
    """비즈니스 로직 처리"""
    
    def __init__(self):
        self.repository = WordbookRepository()
    
    # TODO: 개발자가 비즈니스 로직을 구현할 부분
