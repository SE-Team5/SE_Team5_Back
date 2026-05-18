"""Pet Service"""
import random
from .repository import PetRepository

# GAI API 실패 시 fallback 메시지
FALLBACK_MESSAGES = [
    "조금만 더 화이팅!",
    "잘 하고 있어!",
    "오늘도 열심히!",
    "거의 다 왔어!",
    "최고야!",
    "포기하지 마!",
    "넌 할 수 있어!",
]


class PetService:
    def __init__(self):
        self.repo = PetRepository()

    def get_pet_status(self, user_no: int):
        """펫 상태 조회"""
        try:
            status = self.repo.get_pet_status(user_no)
            if not status:
                return {"status": "error", "message": "사용자를 찾을 수 없습니다."}
            return {
                "status": "success",
                "data": status,
            }
        except Exception as e:
            print(f"Error in PetService.get_pet_status: {e}")
            return {"status": "error", "message": "서버 오류가 발생했습니다."}

    def update_pet_level(self, user_no: int, is_studied: bool):
        """펫 레벨 업데이트"""
        try:
            result = self.repo.update_pet_level(user_no, is_studied)
            if not result:
                return {"status": "error", "message": "사용자를 찾을 수 없습니다."}
            return {
                "status": "success",
                "data": result,
            }
        except Exception as e:
            print(f"Error in PetService.update_pet_level: {e}")
            return {"status": "error", "message": "서버 오류가 발생했습니다."}

    def get_cheer_message(self):
        """GAI 응원 메시지 생성 (실패 시 fallback)"""
        try:
            # GAI API 호출 시도
            message = self._call_gai_api()
            if message:
                return {
                    "status": "success",
                    "data": {"message": message},
                }
        except Exception as e:
            print(f"GAI API 호출 실패, fallback 사용: {e}")

        # fallback: 랜덤 메시지 반환
        return {
            "status": "success",
            "data": {"message": random.choice(FALLBACK_MESSAGES)},
        }

    def _call_gai_api(self):
        """
        Claude API 또는 OpenAI API로 응원 메시지 생성
        API 키가 없으면 None 반환 → fallback 처리
        """
        import os

        # Claude API 시도
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=anthropic_key)
                message = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=100,
                    messages=[
                        {
                            "role": "user",
                            "content": (
                                "영단어 퀴즈를 풀고 있는 사용자에게 짧고 따뜻한 응원 메시지를 "
                                "한국어로 한 문장만 작성해줘. 이모지 없이 20자 이내로."
                            ),
                        }
                    ],
                )
                return message.content[0].text.strip()
            except Exception as e:
                print(f"Claude API 오류: {e}")

        # OpenAI API 시도
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            try:
                import openai
                client = openai.OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "user",
                            "content": (
                                "영단어 퀴즈를 풀고 있는 사용자에게 짧고 따뜻한 응원 메시지를 "
                                "한국어로 한 문장만 작성해줘. 이모지 없이 20자 이내로."
                            ),
                        }
                    ],
                    max_tokens=50,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI API 오류: {e}")

        return None
