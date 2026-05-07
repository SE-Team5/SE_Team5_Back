# Script to delete all words and related user_words_status entries in RIVO database
# Run with the backend virtualenv Python from project root

import sys
import os

# Ensure backend src is on path so `import db` works
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db

try:
    # Delete user_words_status entries that reference words
    delete_status_query = """
    DELETE s FROM RIVO.user_words_status s
    INNER JOIN RIVO.words w ON s.word_id = w.word_no
    """
    deleted_status = db.execute_update(delete_status_query)

    # Delete words
    delete_words_query = "DELETE FROM RIVO.words"
    deleted_words = db.execute_update(delete_words_query)

    print(f"Deleted user_words_status rows: {deleted_status}")
    print(f"Deleted words rows: {deleted_words}")
except Exception as e:
    print(f"Error while deleting words: {e}")
    raise
