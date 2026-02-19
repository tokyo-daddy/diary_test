const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// 指定ユーザーの公開日記一覧（認証不要）
router.get('/:accountId', async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const db = req.app.locals.db;

        const user = await db.get('SELECT id, username, account_id FROM users WHERE account_id = ?', accountId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
        }

        const diaries = await db.all(`
            SELECT id, title, content, created_at, updated_at
            FROM public_diaries
            WHERE author_id = ?
            ORDER BY created_at DESC
        `, user.id);

        res.json({
            success: true,
            data: {
                user: { username: user.username, account_id: user.account_id },
                diaries
            }
        });

    } catch (error) {
        next(error);
    }
});

// 公開日記詳細（認証不要）
router.get('/:accountId/:diaryId', async (req, res, next) => {
    try {
        const { accountId, diaryId } = req.params;
        const db = req.app.locals.db;

        const user = await db.get('SELECT id, username, account_id FROM users WHERE account_id = ?', accountId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
        }

        const diary = await db.get(`
            SELECT id, title, content, created_at, updated_at
            FROM public_diaries
            WHERE id = ? AND author_id = ?
        `, diaryId, user.id);

        if (!diary) {
            return res.status(404).json({ success: false, error: '日記が見つかりません' });
        }

        res.json({
            success: true,
            data: {
                ...diary,
                author_username: user.username,
                author_account_id: user.account_id
            }
        });

    } catch (error) {
        next(error);
    }
});

// 自分の公開日記一覧（認証必要）
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const diaries = await db.all(`
            SELECT id, title, content, created_at, updated_at
            FROM public_diaries
            WHERE author_id = ?
            ORDER BY created_at DESC
        `, userId);

        res.json({
            success: true,
            data: { diaries }
        });

    } catch (error) {
        next(error);
    }
});

// 公開日記作成
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        if (!title) {
            return res.status(400).json({ success: false, error: 'タイトルは必須です' });
        }

        const result = await db.run(`
            INSERT INTO public_diaries (author_id, title, content)
            VALUES (?, ?, ?)
        `, userId, title, content || '');

        res.json({
            success: true,
            data: {
                id: result.lastID,
                title,
                content,
                author_id: userId,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        next(error);
    }
});

// 公開日記更新
router.put('/:diaryId', requireAuth, async (req, res, next) => {
    try {
        const { diaryId } = req.params;
        const { title, content } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const diary = await db.get('SELECT author_id FROM public_diaries WHERE id = ?', diaryId);

        if (!diary) return res.status(404).json({ success: false, error: '日記が見つかりません' });
        if (diary.author_id !== userId) return res.status(403).json({ success: false, error: '編集権限がありません' });

        await db.run(`
            UPDATE public_diaries 
            SET title = ?, content = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `, title, content, diaryId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

// 公開日記削除
router.delete('/:diaryId', requireAuth, async (req, res, next) => {
    try {
        const { diaryId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const diary = await db.get('SELECT author_id FROM public_diaries WHERE id = ?', diaryId);

        if (!diary) return res.status(404).json({ success: false, error: '日記が見つかりません' });
        if (diary.author_id !== userId) return res.status(403).json({ success: false, error: '削除権限がありません' });

        await db.run('DELETE FROM public_diaries WHERE id = ?', diaryId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
