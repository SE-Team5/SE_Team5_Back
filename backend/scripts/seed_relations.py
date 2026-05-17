import sys
sys.path.insert(0, 'backend/src')
from db import db

# Seed simple synonym relations for words that have none.
# For each word in words table that has no relations, pair it with next word as synonym.

words = db.execute_query('SELECT word_no FROM words ORDER BY word_no') or []
word_ids = [w['word_no'] for w in words]

inserted = 0
for i, wid in enumerate(word_ids):
    # check if this word already has relations
    res = db.execute_query('SELECT COUNT(*) as cnt FROM word_relations WHERE word_no = %s', (wid,))
    cnt = int(res[0].get('cnt', 0)) if res else 0
    if cnt > 0:
        continue
    # pick next word as related (wrap around), avoid same id
    related = word_ids[(i+1) % len(word_ids)] if len(word_ids) > 1 else None
    if not related or related == wid:
        continue
    try:
        q = 'INSERT INTO word_relations (word_no, related_word_no, relation_type) VALUES (%s, %s, %s)'
        db.execute_update(q, (wid, related, 'synonym'))
        inserted += 1
    except Exception as e:
        print('Failed to insert relation for', wid, e)

print('Inserted relations:', inserted)
