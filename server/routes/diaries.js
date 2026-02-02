const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// 指定した月のカレンダー情報（日記が存在する日の一覧）を取得
router.get('/:pairId/calendar/:year/:month', requireAuth, async (req, res, next) => {
    try {
        const { pairId, year, month } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const pair = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', pairId);
        if (!pair) return res.status(404).json({ success: false, error: 'ペアが見つかりません' });
        if (pair.user1_id !== userId && pair.user2_id !== userId) return res.status(403).json({ success: false, error: '権限がありません' });

        // 指定された月の最初と最後
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`; // SQLite handles this, but properly would be last day of month

        const sql = `
            SELECT DISTINCT strftime('%d', created_at) as day
            FROM diaries
            WHERE pair_id = ? AND is_draft = 0
            AND created_at >= ? AND created_at <= ?
        `;

        const days = await db.all(sql, pairId, startDate, endDate);

        res.json({
            success: true,
            data: {
                days: days.map(d => parseInt(d.day))
            }
        });

    } catch (error) {
        next(error);
    }
});

// 指定ペアの日記一覧取得
router.get('/:pairId', requireAuth, async (req, res, next) => {
    try {
        const { pairId } = req.params;
        const { order = 'desc' } = req.query;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const pair = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', pairId);
        if (!pair) {
            return res.status(404).json({ success: false, error: 'ペアが見つかりません' });
        }
        if (pair.user1_id !== userId && pair.user2_id !== userId) {
            return res.status(403).json({ success: false, error: 'アクセス権限がありません' });
        }

        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
        const sql = `
            SELECT d.*, u.username as author_username 
            FROM diaries d
            JOIN users u ON d.author_id = u.id
            WHERE d.pair_id = ? AND d.is_draft = 0
            ORDER BY d.created_at ${sortOrder}
        `;

        const diaries = await db.all(sql, pairId);

        res.json({
            success: true,
            data: { diaries }
        });

    } catch (error) {
        next(error);
    }
});

// 自分の下書き一覧取得
router.get('/:pairId/drafts', requireAuth, async (req, res, next) => {
    try {
        const { pairId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const sql = `
            SELECT id, pair_id, title, content, created_at
            FROM diaries
            WHERE pair_id = ? AND author_id = ? AND is_draft = 1
            ORDER BY created_at DESC
        `;
        const drafts = await db.all(sql, pairId, userId);

        res.json({
            success: true,
            data: { drafts }
        });

    } catch (error) {
        next(error);
    }
});

// 日記詳細取得
router.get('/:pairId/:diaryId', requireAuth, async (req, res, next) => {
    try {
        const { pairId, diaryId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const pair = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', pairId);
        if (!pair) return res.status(404).json({ success: false, error: 'ペアが見つかりません' });
        if (pair.user1_id !== userId && pair.user2_id !== userId) return res.status(403).json({ success: false, error: '権限がありません' });

        const diary = await db.get(`
            SELECT d.*, u.username as author_username 
            FROM diaries d
            JOIN users u ON d.author_id = u.id
            WHERE d.id = ? AND d.pair_id = ?
        `, diaryId, pairId);

        if (!diary) {
            return res.status(404).json({ success: false, error: '日記が見つかりません' });
        }

        if (diary.is_draft === 1 && diary.author_id !== userId) {
            return res.status(403).json({ success: false, error: '他人の下書きは閲覧できません' });
        }

        res.json({
            success: true,
            data: diary
        });

    } catch (error) {
        next(error);
    }
});

// 日記作成
router.post('/:pairId', requireAuth, async (req, res, next) => {
    try {
        const { pairId } = req.params;
        const { title, content, is_draft } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const pair = await db.get('SELECT user1_id, user2_id FROM pairs WHERE id = ?', pairId);
        if (!pair) return res.status(404).json({ success: false, error: 'ペアが見つかりません' });
        if (pair.user1_id !== userId && pair.user2_id !== userId) return res.status(403).json({ success: false, error: '権限がありません' });

        if (!title) {
            return res.status(400).json({ success: false, error: 'タイトルは必須です' });
        }

        const result = await db.run(`
            INSERT INTO diaries (pair_id, author_id, title, content, is_draft)
            VALUES (?, ?, ?, ?, ?)
        `, pairId, userId, title, content || '', is_draft ? 1 : 0);

        res.json({
            success: true,
            data: {
                id: result.lastID,
                title,
                content,
                author_id: userId,
                is_draft: is_draft ? 1 : 0,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        next(error);
    }
});

// 日記更新
router.put('/:pairId/:diaryId', requireAuth, async (req, res, next) => {
    try {
        const { pairId, diaryId } = req.params;
        const { title, content, is_draft } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const diary = await db.get('SELECT author_id FROM diaries WHERE id = ? AND pair_id = ?', diaryId, pairId);

        if (!diary) return res.status(404).json({ success: false, error: '日記が見つかりません' });
        if (diary.author_id !== userId) return res.status(403).json({ success: false, error: '編集権限がありません' });

        await db.run(`
            UPDATE diaries 
            SET title = ?, content = ?, is_draft = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `, title, content, is_draft ? 1 : 0, diaryId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

// 日記削除
router.delete('/:pairId/:diaryId', requireAuth, async (req, res, next) => {
    try {
        const { pairId, diaryId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const diary = await db.get('SELECT author_id FROM diaries WHERE id = ? AND pair_id = ?', diaryId, pairId);

        if (!diary) return res.status(404).json({ success: false, error: '日記が見つかりません' });
        if (diary.author_id !== userId) return res.status(403).json({ success: false, error: '削除権限がありません' });

        await db.run('DELETE FROM diaries WHERE id = ?', diaryId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
