"""Wordbook Repository"""
from math import ceil
from db import db

def _to_word_dict(row):
    return {
        "id": str(row["word_no"]),
        "term": row["word_english"],
        "definition": row["word_korean"],
        "example": row.get("example_sentence"),
        "synonyms": row.get("synonyms"),  
        "antonyms": row.get("antonyms"),  
        "memo": None,
    }

def _to_related_word_dict(row):
    return {
        "id": str(row["related_word_no"]),
        "english": row["word_english"],
        "korean": row["word_korean"],
        "example": row.get("example_sentence"),
    }

class UserRepository:
    @staticmethod
    def find_by_id(user_id) -> dict | None:
        query = "SELECT user_no, email, daily_target_count FROM LIVO.users WHERE user_no = %s"
        results = db.execute_query(query, (user_id,))
        if not results:
            return None
        user = results[0]
        return {
            "id": user["user_no"],
            "email": user["email"],
            "daily_target_count": user["daily_target_count"],
        }


class WordRepository:
    @staticmethod
    def _build_where_clause(keyword):
        if not keyword:
            return "", []

        clause = "WHERE word_english LIKE %s OR word_korean LIKE %s OR example_sentence LIKE %s"
        like = f"%{keyword}%"
        return clause, [like, like, like]

    @staticmethod
    def _order_clause(sort):
        sort_map = {
            "created_at_desc": "ORDER BY word_no DESC",
            "created_at_asc": "ORDER BY word_no ASC",
            "term_asc": "ORDER BY word_english ASC",
            "term_desc": "ORDER BY word_english DESC",
        }
        return sort_map.get(sort, "ORDER BY word_no DESC")

    @staticmethod
    def get_words_paginated(user_id, page, per_page, sort, start_date, end_date, keyword) -> dict:
        """기존 관리자/검색용 페이지네이션 유지"""
        where_clause, params = WordRepository._build_where_clause(keyword)

        count_query = f"SELECT COUNT(*) AS total FROM LIVO.words {where_clause}"
        total_row = db.execute_query(count_query, tuple(params))
        total = total_row[0]["total"] if total_row else 0

        offset = max(page - 1, 0) * per_page
        select_query = f"""
            SELECT word_no, word_english, word_korean, example_sentence, synonyms, antonyms
            FROM LIVO.words
            {where_clause}
            {WordRepository._order_clause(sort)}
            LIMIT %s OFFSET %s
        """
        rows = db.execute_query(select_query, tuple(params + [per_page, offset]))

        items = [_to_word_dict(row) for row in rows]
        pages = ceil(total / per_page) if total else 0

        return {
            "total": total,
            "pages": pages,
            "items": items,
        }

    # 메인 단어장용 다중 필터링 & JOIN 조회 메서드
    @staticmethod
    def get_main_wordbook_list(user_id, page=1, size=20, date_filter=None, status_filter=None, sort='latest') -> dict:
        where_clauses = ["1=1"]
        params = [user_id] # LEFT JOIN ON절용 user_id

        # 1. 기간 필터 (updated_at 기준)
        if date_filter == 'today':
            where_clauses.append("DATE(uws.updated_at) = CURDATE()")
        elif date_filter == 'week':
            where_clauses.append("uws.updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)")
        elif date_filter == 'month':
            where_clauses.append("uws.updated_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)")
        elif date_filter == 'year':
            where_clauses.append("uws.updated_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)")

        # 2. 상태 필터
        if status_filter == 'favorites':
            where_clauses.append("uws.is_favorite = 1")
        elif status_filter == 'memorized':
            where_clauses.append("uws.is_memorized = 1")
        elif status_filter == 'unmemorized':
            where_clauses.append("(uws.is_memorized = 0 OR uws.is_memorized IS NULL)")

        where_string = " AND ".join(where_clauses)

        # 3. 정렬 조건
        order_by_string = "ORDER BY w.word_no DESC" # 기본(latest)
        if sort == 'alphabet':
            order_by_string = "ORDER BY w.word_english ASC"

        # 4. 전체 개수 조회
        count_query = f"""
            SELECT COUNT(*) AS total
            FROM LIVO.words w
            LEFT JOIN LIVO.user_words_status uws 
              ON w.word_no = uws.word_id AND uws.user_id = %s
            WHERE {where_string}
        """
        total_row = db.execute_query(count_query, tuple(params))
        total = total_row[0]["total"] if total_row else 0

        # 5. 데이터 조회
        offset = max(page - 1, 0) * size
        list_query = f"""
            SELECT 
                w.word_no AS wordId,
                w.word_english AS word,
                w.word_korean AS meaning,
                COALESCE(uws.is_favorite, 0) AS isFavorite,
                COALESCE(uws.is_memorized, 0) AS isMemorized
            FROM LIVO.words w
            LEFT JOIN LIVO.user_words_status uws 
              ON w.word_no = uws.word_id AND uws.user_id = %s
            WHERE {where_string}
            {order_by_string}
            LIMIT %s OFFSET %s
        """
        list_params = params + [size, offset]
        rows = db.execute_query(list_query, tuple(list_params))

        # Boolean 변환 처리
        for row in rows:
            row['isFavorite'] = bool(row['isFavorite'])
            row['isMemorized'] = bool(row['isMemorized'])

        return {
            "total_count": total,
            "content": rows
        }

    # 단어장 통계 대시보드 조회
    @staticmethod
    def get_words_statistics(user_id) -> dict:
        try:
            # 1. 전체 단어 개수 조회 (파라미터가 없어서 버그 발생 안 함)
            query_total = "SELECT COUNT(*) AS total FROM LIVO.words"
            res_total = db.execute_query(query_total)
            total = res_total[0]['total'] if res_total else 0
            
            # 2. 암기 완료 단어 개수 조회 (가장 스탠다드한 단일 WHERE문)
            query_mem = "SELECT COUNT(*) AS mem FROM LIVO.user_words_status WHERE user_id = %s AND is_memorized = 1"
            res_mem = db.execute_query(query_mem, (user_id,))
            memorized = res_mem[0]['mem'] if res_mem else 0
            
            return {
                "total_words": total,
                "memorized_words": memorized,
                "remaining_words": total - memorized
            }
        except Exception as e:
            print(f"통계 조회 중 DB 에러: {e}")
            return {"total_words": 0, "memorized_words": 0, "remaining_words": 0}
        
    @staticmethod
    def find_by_id(word_id) -> dict | None:
        # synonyms, antonyms 추가 반영
        query = "SELECT word_no, word_english, word_korean, example_sentence, synonyms, antonyms FROM LIVO.words WHERE word_no = %s"
        results = db.execute_query(query, (word_id,))
        return results[0] if results else None

    @staticmethod
    def find_by_term(term) -> dict | None:
        query = "SELECT word_no, word_english, word_korean, example_sentence, synonyms, antonyms FROM LIVO.words WHERE word_english = %s"
        results = db.execute_query(query, (term,))
        return results[0] if results else None

    @staticmethod
    def create(term, definition, example=None, synonyms=None, antonyms=None, memo=None) -> dict:
        query = "INSERT INTO LIVO.words (word_english, word_korean, example_sentence, synonyms, antonyms) VALUES (%s, %s, %s, %s, %s)"
        db.execute_update(query, (term, definition, example, synonyms, antonyms))
        return _to_word_dict(WordRepository.find_by_term(term))

    @staticmethod
    def update(word_id, term=None, definition=None, example=None, synonyms=None, antonyms=None, memo=None) -> dict:
        current = WordRepository.find_by_id(word_id)
        if not current:
            return {"message": "단어를 찾을 수 없습니다."}

        next_term = term if term is not None else current["word_english"]
        next_definition = definition if definition is not None else current["word_korean"]
        next_example = example if example is not None else current.get("example_sentence")
        next_synonyms = synonyms if synonyms is not None else current.get("synonyms")
        next_antonyms = antonyms if antonyms is not None else current.get("antonyms")

        query = """
            UPDATE LIVO.words
            SET word_english = %s, word_korean = %s, example_sentence = %s, synonyms = %s, antonyms = %s
            WHERE word_no = %s
        """
        db.execute_update(query, (next_term, next_definition, next_example, next_synonyms, next_antonyms, word_id))
        return _to_word_dict(WordRepository.find_by_id(word_id))

    @staticmethod
    def delete(word_id) -> None:
        query = "DELETE FROM LIVO.words WHERE word_no = %s"
        db.execute_update(query, (word_id,))

    @staticmethod
    def filter_existing_word_ids(word_ids: list) -> list:
        if not word_ids:
            return []
        placeholders = ",".join(["%s"] * len(word_ids))
        query = f"SELECT word_no FROM LIVO.words WHERE word_no IN ({placeholders})"
        rows = db.execute_query(query, tuple(word_ids))
        return [row["word_no"] for row in rows]

    @staticmethod
    def get_random_words(limit: int) -> list:
        query = """
            SELECT word_no, word_english, word_korean, example_sentence, synonyms, antonyms
            FROM LIVO.words
            ORDER BY RAND()
            LIMIT %s
        """
        rows = db.execute_query(query, (limit,))
        return [_to_word_dict(row) for row in rows]

    @staticmethod
    def get_daily_words(user_id, limit: int) -> list:
        if not user_id:
            return WordRepository.get_random_words(limit)
        query = """
            SELECT
                w.word_no,
                w.word_english,
                w.word_korean,
                w.example_sentence
            FROM LIVO.words w
            LEFT JOIN LIVO.user_words_status s
              ON s.word_id = w.word_no AND s.user_id = %s
            WHERE s.status_id IS NULL OR s.is_memorized = 0
            ORDER BY CRC32(CONCAT(w.word_no, '-', DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+09:00')), '-', %s))
            LIMIT %s
        """
        rows = db.execute_query(query, (user_id, user_id, limit))
        words = [_to_word_dict(row) for row in rows]
        relations = WordRepository.get_relations_by_word_ids([int(word["id"]) for word in words if word.get("id")])
        return [
            {
                **word,
                "relations": relations.get(int(word["id"]), {"synonym": [], "antonym": [], "homonym": []}),
            }
            for word in words
        ]
    @staticmethod
    def get_relations_by_word_ids(word_ids: list) -> dict:
        if not word_ids:
            return {}
        placeholders = ",".join(["%s"] * len(word_ids))
        query = f"""
            SELECT
                r.word_no,
                r.relation_type,
                w.word_no AS related_word_no,
                w.word_english,
                w.word_korean,
                w.example_sentence
            FROM LIVO.word_relations r
            INNER JOIN LIVO.words w ON w.word_no = r.related_word_no
            WHERE r.word_no IN ({placeholders})
            ORDER BY r.word_no, r.relation_type, w.word_english
        """
        rows = db.execute_query(query, tuple(word_ids))
        relations = {
            word_id: {"synonym": [], "antonym": [], "homonym": []}
            for word_id in word_ids
        }
        for row in rows:
            word_id = row["word_no"]
            relation_type = row["relation_type"]
            if word_id not in relations:
                relations[word_id] = {"synonym": [], "antonym": [], "homonym": []}
            relations[word_id][relation_type].append(_to_related_word_dict(row))
        return relations

class UserWordStatusRepository:
    @staticmethod
    def _get_status(user_id, word_id):
        query = """
            SELECT status_id, user_id, word_id, is_favorite, is_memorized, created_at, updated_at
            FROM LIVO.user_words_status
            WHERE user_id = %s AND word_id = %s
        """
        rows = db.execute_query(query, (user_id, word_id))
        return rows[0] if rows else None

    @staticmethod
    def get_unmemorized_random(user_id, limit) -> list:
        query = """
            SELECT w.word_no, w.word_english, w.word_korean, w.example_sentence,
                   COALESCE(s.is_memorized, 0) AS is_memorized,
                   COALESCE(s.is_favorite, 0) AS is_bookmarked
            FROM LIVO.words w
            LEFT JOIN LIVO.user_words_status s
              ON s.word_id = w.word_no AND s.user_id = %s
            WHERE s.status_id IS NULL OR s.is_memorized = 0
            ORDER BY RAND()
            LIMIT %s
        """
        rows = db.execute_query(query, (user_id, limit))
        return [
            {
                **_to_word_dict(row),
                "is_memorized": bool(row.get("is_memorized")),
                "is_bookmarked": bool(row.get("is_bookmarked")),
            }
            for row in rows
        ]

    @staticmethod
    def find_or_create_and_update(user_id, word_id, is_memorized=None, is_bookmarked=None) -> dict:
        status = UserWordStatusRepository._get_status(user_id, word_id)
        print(f"DEBUG: DB 업데이트 시작 -> 유저:{user_id}, 단어:{word_id}, 즐찾:{is_bookmarked}, 외움:{is_memorized}")
        if not status:
            insert_query = """
                INSERT INTO LIVO.user_words_status (user_id, word_id, is_favorite, is_memorized)
                VALUES (%s, %s, %s, %s)
            """
            db.execute_update(
                insert_query,
                (
                    user_id,
                    word_id,
                    1 if is_bookmarked else 0,
                    1 if is_memorized else 0,
                ),
            )
        else:
            next_favorite = status["is_favorite"] if is_bookmarked is None else int(bool(is_bookmarked))
            next_memorized = status["is_memorized"] if is_memorized is None else int(bool(is_memorized))
            update_query = """
                UPDATE LIVO.user_words_status
                SET is_favorite = %s, is_memorized = %s, updated_at = NOW()
                WHERE user_id = %s AND word_id = %s
            """
            db.execute_update(update_query, (next_favorite, next_memorized, user_id, word_id))

        refreshed = UserWordStatusRepository._get_status(user_id, word_id)
        return {
            "word_id": refreshed["word_id"],
            "is_memorized": bool(refreshed["is_memorized"]),
            "is_bookmarked": bool(refreshed["is_favorite"]),
        }

    @staticmethod
    def batch_update_study_records(user_id, word_ids: list) -> int:
        if not word_ids:
            return 0

        placeholders = ",".join(["%s"] * len(word_ids))
        query = f"""
            UPDATE LIVO.user_words_status
            SET updated_at = NOW()
            WHERE user_id = %s AND word_id IN ({placeholders})
        """
        return db.execute_update(query, tuple([user_id, *word_ids]))

    @staticmethod
    def delete_by_word(word_id) -> None:
        query = "DELETE FROM LIVO.user_words_status WHERE word_id = %s"
        db.execute_update(query, (word_id,))