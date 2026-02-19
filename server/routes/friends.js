const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { generateInviteCode } = require('../utils/generateCode');

// account_idでユーザー検索
router.get('/search/:accountId', requireAuth, async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const user = await db.get('SELECT id, username, account_id FROM users WHERE account_id = ?', accountId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
        }

        if (user.id === userId) {
            return res.status(400).json({ success: false, error: '自分自身は検索できません' });
        }

        const existing = await db.get(`
            SELECT id, status FROM friends 
            WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
        `, userId, user.id, user.id, userId);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    account_id: user.account_id
                },
                friendship: existing ? { id: existing.id, status: existing.status } : null
            }
        });

    } catch (error) {
        next(error);
    }
});

// フレンド申請を送信
router.post('/request', requireAuth, async (req, res, next) => {
    try {
        const { receiver_id } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        if (!receiver_id) {
            return res.status(400).json({ success: false, error: '対象ユーザーが指定されていません' });
        }

        if (receiver_id === userId) {
            return res.status(400).json({ success: false, error: '自分自身にフレンド申請はできません' });
        }

        const receiver = await db.get('SELECT id FROM users WHERE id = ?', receiver_id);
        if (!receiver) {
            return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
        }

        const existing = await db.get(`
            SELECT id, status FROM friends 
            WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
        `, userId, receiver_id, receiver_id, userId);

        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(400).json({ success: false, error: '既にフレンドです' });
            }
            return res.status(400).json({ success: false, error: '既にフレンド申請が存在します' });
        }

        const result = await db.run(`
            INSERT INTO friends (requester_id, receiver_id, status)
            VALUES (?, ?, 'pending')
        `, userId, receiver_id);

        res.json({
            success: true,
            data: { id: result.lastID }
        });

    } catch (error) {
        next(error);
    }
});

// 受け取った申請一覧
router.get('/requests', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const requests = await db.all(`
            SELECT f.id, f.requester_id, f.created_at, u.username, u.account_id
            FROM friends f
            JOIN users u ON f.requester_id = u.id
            WHERE f.receiver_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `, userId);

        res.json({
            success: true,
            data: { requests }
        });

    } catch (error) {
        next(error);
    }
});

// フレンド申請を承認 → ペア自動作成
router.post('/accept/:friendshipId', requireAuth, async (req, res, next) => {
    try {
        const { friendshipId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const friendship = await db.get(
            'SELECT * FROM friends WHERE id = ? AND receiver_id = ? AND status = ?',
            friendshipId, userId, 'pending'
        );

        if (!friendship) {
            return res.status(404).json({ success: false, error: 'フレンド申請が見つかりません' });
        }

        const inviteCode = generateInviteCode();

        // ペアを作成
        const pairResult = await db.run(
            'INSERT INTO pairs (user1_id, user2_id, invite_code) VALUES (?, ?, ?)',
            friendship.requester_id, friendship.receiver_id, inviteCode
        );

        const pairId = pairResult.lastID;

        // フレンドステータスを更新
        await db.run(
            "UPDATE friends SET status = 'accepted', pair_id = ? WHERE id = ?",
            pairId, friendshipId
        );

        res.json({
            success: true,
            data: { pair_id: pairId }
        });

    } catch (error) {
        next(error);
    }
});

// フレンド申請を拒否
router.post('/reject/:friendshipId', requireAuth, async (req, res, next) => {
    try {
        const { friendshipId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const friendship = await db.get(
            'SELECT id FROM friends WHERE id = ? AND receiver_id = ? AND status = ?',
            friendshipId, userId, 'pending'
        );

        if (!friendship) {
            return res.status(404).json({ success: false, error: 'フレンド申請が見つかりません' });
        }

        await db.run('DELETE FROM friends WHERE id = ?', friendshipId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

// フレンド一覧
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const friends = await db.all(`
            SELECT 
                f.id as friendship_id,
                f.pair_id,
                f.created_at,
                CASE 
                    WHEN f.requester_id = ? THEN f.receiver_id
                    ELSE f.requester_id
                END as friend_id,
                CASE 
                    WHEN f.requester_id = ? THEN u2.username
                    ELSE u1.username
                END as friend_username,
                CASE 
                    WHEN f.requester_id = ? THEN u2.account_id
                    ELSE u1.account_id
                END as friend_account_id
            FROM friends f
            JOIN users u1 ON f.requester_id = u1.id
            JOIN users u2 ON f.receiver_id = u2.id
            WHERE (f.requester_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
            ORDER BY f.created_at DESC
        `, userId, userId, userId, userId, userId);

        res.json({
            success: true,
            data: { friends }
        });

    } catch (error) {
        next(error);
    }
});

// フレンド解除
router.delete('/:friendshipId', requireAuth, async (req, res, next) => {
    try {
        const { friendshipId } = req.params;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const friendship = await db.get(`
            SELECT id FROM friends 
            WHERE id = ? AND (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
        `, friendshipId, userId, userId);

        if (!friendship) {
            return res.status(404).json({ success: false, error: 'フレンド関係が見つかりません' });
        }

        await db.run('DELETE FROM friends WHERE id = ?', friendshipId);

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
