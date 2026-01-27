import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { requireAuth, generateSessionId } from '../middleware/auth';

const auth = new Hono();

// ユーザー登録
auth.post('/register', async (c) => {
    const { username, password } = await c.req.json();
    const db = c.env.DB;

    // バリデーション
    if (!username || !password) {
        return c.json({ success: false, error: '入力が不足しています' }, 400);
    }

    if (password.length < 8) {
        return c.json({ success: false, error: 'パスワードは8文字以上必要です' }, 400);
    }

    // 重複チェック
    const existing = await db
        .prepare('SELECT id FROM users WHERE username = ?')
        .bind(username)
        .first();

    if (existing) {
        return c.json({ success: false, error: 'このユーザー名は既に使用されています' }, 409);
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // ユーザー作成
    const result = await db
        .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
        .bind(username, passwordHash)
        .run();

    const user = await db
        .prepare('SELECT id, username, created_at FROM users WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first();

    return c.json({ success: true, data: user });
});

// ログイン
auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    const db = c.env.DB;

    // ユーザー検索
    const user = await db
        .prepare('SELECT * FROM users WHERE username = ?')
        .bind(username)
        .first();

    if (!user) {
        return c.json({ success: false, error: 'ユーザー名またはパスワードが間違っています' }, 401);
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return c.json({ success: false, error: 'ユーザー名またはパスワードが間違っています' }, 401);
    }

    // セッション作成
    const sessionId = generateSessionId();
    await db
        .prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)')
        .bind(sessionId, user.id)
        .run();

    return c.json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            sessionId: sessionId
        }
    });
});

// ログアウト
auth.post('/logout', requireAuth, async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    const db = c.env.DB;

    await db
        .prepare('DELETE FROM sessions WHERE id = ?')
        .bind(sessionId)
        .run();

    return c.json({ success: true });
});

// ログイン中のユーザー情報
auth.get('/me', requireAuth, async (c) => {
    const userId = c.get('userId');
    const db = c.env.DB;

    const user = await db
        .prepare('SELECT id, username FROM users WHERE id = ?')
        .bind(userId)
        .first();

    return c.json({ success: true, data: user });
});

export default auth;