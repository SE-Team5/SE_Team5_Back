"""백그라운드 작업 스케줄러"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from db import db
from modules.email.service import EmailService
from config import Config


class TaskScheduler:
    """배경 작업 스케줄러"""
    
    scheduler = None
    
    @classmethod
    def init(cls):
        """스케줄러 초기화"""
        if not Config.SCHEDULER_ENABLED:
            print("[WARN] Scheduler is disabled")
            return
        
        if cls.scheduler is None:
            cls.scheduler = BackgroundScheduler()
            cls.scheduler.start()
            print("[OK] Scheduler initialized")
    
    @classmethod
    def add_inactivity_check_job(cls):
        """미활동 사용자 확인 작업 추가"""
        if not Config.SCHEDULER_ENABLED or cls.scheduler is None:
            return
        
        # 매일 오전 9시에 실행
        cls.scheduler.add_job(
            cls.check_and_email_inactive_users,
            CronTrigger(hour=9, minute=0),
            id='check_inactive_users',
            name='Check and email inactive users',
            replace_existing=True
        )
        print("[OK] Added inactivity check job (daily at 09:00)")
    
    @classmethod
    def check_and_email_inactive_users(cls):
        """
        미활동 사용자를 찾아 이메일 발송
        2000시간 이상 활동이 없는 사용자에게 학습 권장 이메일 발송
        """
        print("\n>>> Starting inactivity check...")
        
        try:
            # 2000시간 이전 시점 계산
            inactivity_threshold = datetime.now() - timedelta(hours=Config.INACTIVITY_HOURS)
            
            query = """
                SELECT user_no, email, user_nickname, updated_at
                FROM LIVO.users
                WHERE updated_at < %s
                  AND email IS NOT NULL
                  AND email != ''
                ORDER BY updated_at ASC
                LIMIT 100
            """
            
            rows = db.execute_query(query, (inactivity_threshold,))
            
            if not rows:
                print("[OK] No inactive users found")
                return
            
            sent_count = 0
            for row in rows:
                user_no = row['user_no']
                email = row['email']
                nickname = row['user_nickname']
                last_active = row['updated_at']
                
                # 이메일 발송
                if EmailService.send_inactivity_email(email, nickname):
                    # 발송 기록 업데이트 (중복 발송 방지)
                    update_query = """
                        UPDATE LIVO.users
                        SET updated_at = NOW()
                        WHERE user_no = %s
                    """
                    db.execute_update(update_query, (user_no,))
                    sent_count += 1
                    print(f"  [OK] Email sent to {nickname} ({email}) - Last active: {last_active}")
            
            print(f"\n[OK] Inactivity check completed. {sent_count} emails sent.\n")
            
        except Exception as e:
            print(f"[ERR] Error during inactivity check: {e}")
    
    @classmethod
    def shutdown(cls):
        """스케줄러 종료"""
        if cls.scheduler is not None:
            cls.scheduler.shutdown()
            print("[OK] Scheduler shutdown")
