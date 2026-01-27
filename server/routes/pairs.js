const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { generateInviteCode } = require('../utils/generateCode');

// 新規ペア作成と招待コード生成
router.post('/create', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const inviteCode = generateInviteCode();

        try {
            const result = await db.run(
                'INSERT INTO pairs (user1_id, invite_code) VALUES (?, ?)',
                userId, inviteCode
            );
            res.json({
                success: true,
                data: {
                    pair_id: result.lastID,
                    invite_code: inviteCode
                }
            });
        } catch (e) {
            // e.code might vary with sqlite3/better-sqlite3 but constraint error handling similar
            if (e.message.includes('UNIQUE constraint failed')) {
                return res.status(500).json({ success: false, error: '招待コード生成に失敗しました。もう一度お試しください。' });
            }
            throw e;
        }

    } catch (error) {
        next(error);
    }
});

// 招待コードでペアに参加
router.post('/join', requireAuth, async (req, res, next) => {
    try {
        const { invite_code } = req.body;
        const db = req.app.locals.db;
        const userId = req.session.userId;

        if (!invite_code) {
            return res.status(400).json({ success: false, error: '招待コードが必要です' });
        }

        const pair = await db.get('SELECT * FROM pairs WHERE invite_code = ?', invite_code);

        if (!pair) {
            return res.status(404).json({ success: false, error: '無効な招待コードです' });
        }

        if (pair.user2_id) {
            return res.status(400).json({ success: false, error: 'この招待コードは既に使用されています' });
        }

        if (pair.user1_id === userId) {
            return res.status(400).json({ success: false, error: '自分で作成したペアには参加できません' });
        }

        await db.run('UPDATE pairs SET user2_id = ? WHERE id = ?', userId, pair.id);

        res.json({
            success: true,
            data: {
                pair_id: pair.id
            }
        });

    } catch (error) {
        next(error);
    }
});

// 自分が所属するペア一覧取得
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.userId;

        const sql = `
            SELECT 
                p.id, 
                p.created_at,
                CASE 
                    WHEN p.user1_id = ? THEN u2.id
                    ELSE u1.id
                END as partner_id,
                CASE 
                    WHEN p.user1_id = ? THEN u2.username
                    ELSE u1.username
                END as partner_username
            FROM pairs p
            LEFT JOIN users u1 ON p.user1_id = u1.id
            LEFT JOIN users u2 ON p.user2_id = u2.id
            WHERE p.user1_id = ? OR p.user2_id = ?
        `;

        const pairs = await db.all(sql, userId, userId, userId, userId);

        const formattedPairs = pairs.map(p => ({
            id: p.id,
            partner_id: p.partner_id,
            partner_username: p.partner_username || '(パートナー待ち)',
            created_at: p.created_at
        }));

        res.json({
            success: true,
            data: {
                pairs: formattedPairs
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
