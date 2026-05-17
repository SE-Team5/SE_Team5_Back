import sys
sys.path.insert(0, 'backend/src')
from db import db
res = db.execute_query('SELECT user_no, user_id, daily_target_count FROM users WHERE user_id=%s OR user_no=%s', ('admin', 2))
print(res)
