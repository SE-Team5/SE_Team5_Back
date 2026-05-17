import requests
import json

BASE = 'http://localhost:5000/api'

# Login as admin
r = requests.post(f'{BASE}/login', json={'userId':'admin','password':'admin1234'})
print('LOGIN STATUS:', r.status_code)
print(r.text)

if r.status_code == 200:
    token = r.json().get('token')
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    # Start quiz
    r2 = requests.get(f'{BASE}/quiz/start?limit=5', headers=headers)
    print('QUIZ START STATUS:', r2.status_code)
    try:
        quiz_payload = r2.json()
        print(json.dumps(quiz_payload, ensure_ascii=False, indent=2))
    except Exception:
        print(r2.text)

    # Extract appeared word ids from the quiz payload
    appeared_ids = []
    try:
        words = quiz_payload.get('data', {}).get('words') or quiz_payload.get('words') or []
        for w in words:
            wid = w.get('id') or w.get('word_no') or w.get('wordId')
            if wid:
                appeared_ids.append(wid)
    except Exception:
        appeared_ids = []

    # Submit quiz result, including appearedWordIds
    submit_body = {
        'userNo': r.json().get('user_no') or r.json().get('userNo') or 1,
        'total': len(appeared_ids),
        'correct': 0,
        'appearedWordIds': appeared_ids,
    }

    r3 = requests.post(f'{BASE}/quiz/submit', json=submit_body, headers=headers)
    print('QUIZ SUBMIT STATUS:', r3.status_code)
    try:
        print(json.dumps(r3.json(), ensure_ascii=False, indent=2))
    except Exception:
        print(r3.text)
else:
    print('Failed to login')
