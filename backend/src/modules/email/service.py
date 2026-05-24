"""이메일 발송 서비스"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config


class EmailService:
    """이메일 발송 서비스"""
    
    @staticmethod
    def send_inactivity_email(user_email: str, user_nickname: str) -> bool:
        """
        미활동 사용자에게 학습 권장 이메일 발송
        
        Args:
            user_email: 사용자 이메일
            user_nickname: 사용자 닉네임
            
        Returns:
            bool: 성공 여부
        """
        try:
            subject = "📚 LIVO에 돌아오세요! 영어 학습을 재개해보세요"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }}
                    .header h1 {{ margin: 0; font-size: 28px; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .highlight {{ color: #667eea; font-weight: bold; }}
                    .cta-button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; color: #888; font-size: 12px; margin-top: 20px; }}
                    ul {{ padding-left: 20px; }}
                    li {{ margin: 10px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📚 LIVO</h1>
                        <p>영어 학습의 새로운 경험</p>
                    </div>
                    
                    <div class="content">
                        <h2>안녕하세요, <span class="highlight">{user_nickname}</span>님!</h2>
                        
                        <p>
                            우리는 당신을 그리워합니다. 최근에 LIVO에서 활동이 없으셨네요.
                            <br>
                            지금이 영어 학습을 다시 시작하기에 좋은 기회입니다! 🚀
                        </p>
                        
                        <h3>LIVO에서 즐길 수 있는 것들:</h3>
                        <ul>
                            <li>✅ 매일 새로운 영단어 학습</li>
                            <li>🎮 재미있는 단어 퀴즈 게임</li>
                            <li>📊 학습 진행도 추적</li>
                            <li>🏆 연속 출석 달성</li>
                            <li>🎯 개인 맞춤형 학습 경로</li>
                        </ul>
                        
                        <p>
                            지금 바로 LIVO에 접속하여 영어 학습을 재개해보세요!
                        </p>
                        
                        <center>
                            <a href="http://localhost:5173" class="cta-button">
                                LIVO 시작하기
                            </a>
                        </center>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="color: #666; font-size: 14px;">
                            도움이 필요하신가요? 언제든지 저희에게 문의해주세요.
                            <br>
                            <strong>이메일:</strong> support@livo.com
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 LIVO. All rights reserved.</p>
                        <p>이 이메일은 등록된 사용자에게만 발송됩니다.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # SMTP 연결 및 이메일 발송
            with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
                if Config.MAIL_USE_TLS:
                    server.starttls()
                
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                
                # 이메일 구성
                message = MIMEMultipart('alternative')
                message['Subject'] = subject
                message['From'] = Config.MAIL_DEFAULT_SENDER
                message['To'] = user_email
                
                # HTML 버전
                html_part = MIMEText(html_content, 'html', 'utf-8')
                message.attach(html_part)
                
                # 발송
                server.send_message(message)
            
            print(f"[OK] Inactivity email sent to {user_email}")
            return True
            
        except Exception as e:
            print(f"[ERR] Failed to send email to {user_email}: {e}")
            return False

    @staticmethod
    def send_welcome_email(user_email: str, user_nickname: str) -> bool:
        """
        신규 가입자에게 환영 이메일 발송
        
        Args:
            user_email: 사용자 이메일
            user_nickname: 사용자 닉네임
            
        Returns:
            bool: 성공 여부
        """
        try:
            subject = "🎉 LIVO에 오신 것을 환영합니다!"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }}
                    .content {{ background: #f9f9f9; padding: 30px; }}
                    .highlight {{ color: #667eea; font-weight: bold; }}
                    .cta-button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 LIVO에 오신 것을 환영합니다!</h1>
                    </div>
                    
                    <div class="content">
                        <h2>안녕하세요, <span class="highlight">{user_nickname}</span>님!</h2>
                        
                        <p>
                            LIVO에 가입해주셔서 감사합니다!
                            <br>
                            이제 영어 학습의 새로운 경험을 시작할 준비가 되었습니다.
                        </p>
                        
                        <h3>첫 단계:</h3>
                        <ol>
                            <li>프로필 설정에서 하루 학습할 단어 개수 설정</li>
                            <li>단어장에서 영단어 추가 또는 검색</li>
                            <li>매일 단어 퀴즈로 학습하기</li>
                        </ol>
                        
                        <center>
                            <a href="http://localhost:5173" class="cta-button">
                                지금 시작하기
                            </a>
                        </center>
                    </div>
                </div>
            </body>
            </html>
            """
            
            with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
                if Config.MAIL_USE_TLS:
                    server.starttls()
                
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                
                message = MIMEMultipart('alternative')
                message['Subject'] = subject
                message['From'] = Config.MAIL_DEFAULT_SENDER
                message['To'] = user_email
                
                html_part = MIMEText(html_content, 'html', 'utf-8')
                message.attach(html_part)
                
                server.send_message(message)
            
            return True
            
        except Exception as e:
            print(f"[ERR] Failed to send welcome email to {user_email}: {e}")
            return False
