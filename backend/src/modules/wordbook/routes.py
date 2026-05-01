"""Wordbook Routes"""
from flask import request, jsonify
from . import wordbook_bp
from .service import WordbookService

service = WordbookService()

@wordbook_bp.route('/get-wordbooks', methods=['GET'])
def get_wordbooks():
    """단어장 목록 조회"""
    # TODO: 개발자가 구현할 부분
    pass

@wordbook_bp.route('/create-wordbook', methods=['POST'])
def create_wordbook():
    """단어장 생성"""
    # TODO: 개발자가 구현할 부분
    pass

@wordbook_bp.route('/add-word', methods=['POST'])
def add_word():
    """단어 추가"""
    # TODO: 개발자가 구현할 부분
    pass

@wordbook_bp.route('/delete-word', methods=['DELETE'])
def delete_word():
    """단어 삭제"""
    # TODO: 개발자가 구현할 부분
    pass
