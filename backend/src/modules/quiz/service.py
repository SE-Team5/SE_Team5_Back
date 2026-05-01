"""Quiz Service"""
from .repository import QuizRepository

class QuizService:
    """비즈니스 로직 처리"""
    
    def __init__(self):
        self.repository = QuizRepository()
    
    # TODO: 개발자가 비즈니스 로직을 구현할 부분
