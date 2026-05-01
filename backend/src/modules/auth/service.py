"""Auth Service"""
from .repository import AuthRepository

class AuthService:
    """비즈니스 로직 처리"""
    
    def __init__(self):
        self.repository = AuthRepository()
    
    # TODO: 개발자가 비즈니스 로직을 구현할 부분
