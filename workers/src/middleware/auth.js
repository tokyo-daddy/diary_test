// workers/src/middleware/auth.js
import bcrypt from 'bcryptjs';

// セッションテーブル作成（マイグレーションに追加）
// CREATE TABLE sessions (
//   id TEXT PRIMARY KEY,
//   user_id INTEGER NOT NULL,
//   created_at TEXT NOT NULL DEFAULT (datetime('now')),
//   FOREIGN KEY (user_id) REFERENCES users(id)
// );

export async function requireAuth(c, next) {
    const sessionId = c.req.header('X-Session-ID');

    if (!sessionId) {
        return c.json({ success: false, error: 'ログインが必要です' }, 401);
    }

    const db = c.env.DB;
    const session = await db
        .prepare('SELECT user_id FROM sessions WHERE id = ?')
        .bind(sessionId)
        .first();

    if (!session) {
        return c.json({ success: false, error: 'セッションが無効です' }, 401);
    }

    console.log(`[Auth] Session valid for user_id: ${session.user_id}`);

    c.set('userId', session.user_id);
    await next();
}

export function generateSessionId() {
    return crypto.randomUUID();
}