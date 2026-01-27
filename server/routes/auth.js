const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// ユーザー登録
router.post('/register', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const db = req.app.locals.db;

        // バリデーション
        if (!username || !password || password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'ユーザー名は必須、パスワードは8文字以上である必要があります'
            });
        }

        // 重複チェック
        const existing = await db.get('SELECT id FROM users WHERE username = ?', username);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'このユーザー名は既に使用されています'
            });
        }

        // ハッシュ化と保存
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            username, hashedPassword
        );

        res.json({
            success: true,
            data: {
                id: result.lastID,
                username,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
});

// ログイン
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const db = req.app.locals.db;

        const user = await db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'ユーザー名またはパスワードが間違っています'
            });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({
                success: false,
                error: 'ユーザー名またはパスワードが間違っています'
            });
        }

        // セッション保存
        req.session.userId = user.id;

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        next(error);
    }
});

// ログアウト
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 自分の情報取得
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const user = await db.get('SELECT id, username FROM users WHERE id = ?', req.session.userId);

        if (!user) {
            req.session.destroy();
            return res.status(401).json({ success: false, error: 'ユーザーが見つかりません' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
