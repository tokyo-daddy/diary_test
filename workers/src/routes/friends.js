import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { generateInviteCode } from '../utils/generateCode';

const app = new Hono();

// account_idでユーザー検索
app.get('/search/:accountId', requireAuth, async (c) => {
    try {
        const accountId = c.req.param('accountId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const user = await db.prepare('SELECT id, username, account_id FROM users WHERE account_id = ?')
            .bind(accountId)
            .first();

        if (!user) {
            return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
        }

        if (user.id === userId) {
            return c.json({ success: false, error: '自分自身は検索できません' }, 400);
        }

        // 既存のフレンド関係を確認
        const existing = await db.prepare(`
            SELECT id, status FROM friends 
            WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
        `)
            .bind(userId, user.id, user.id, userId)
            .first();

        return c.json({
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
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// フレンド申請を送信
app.post('/request', requireAuth, async (c) => {
    try {
        const { receiver_id } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        if (!receiver_id) {
            return c.json({ success: false, error: '対象ユーザーが指定されていません' }, 400);
        }

        if (receiver_id === userId) {
            return c.json({ success: false, error: '自分自身にフレンド申請はできません' }, 400);
        }

        // 相手が存在するか確認
        const receiver = await db.prepare('SELECT id FROM users WHERE id = ?')
            .bind(receiver_id)
            .first();

        if (!receiver) {
            return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
        }

        // 既存のフレンド関係を確認
        const existing = await db.prepare(`
            SELECT id, status FROM friends 
            WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
        `)
            .bind(userId, receiver_id, receiver_id, userId)
            .first();

        if (existing) {
            if (existing.status === 'accepted') {
                return c.json({ success: false, error: '既にフレンドです' }, 400);
            }
            return c.json({ success: false, error: '既にフレンド申請が存在します' }, 400);
        }

        const result = await db.prepare(`
            INSERT INTO friends (requester_id, receiver_id, status)
            VALUES (?, ?, 'pending')
        `)
            .bind(userId, receiver_id)
            .run();

        return c.json({
            success: true,
            data: { id: result.meta.last_row_id }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 受け取った申請一覧
app.get('/requests', requireAuth, async (c) => {
    try {
        const db = c.env.DB;
        const userId = c.get('userId');

        const { results } = await db.prepare(`
            SELECT f.id, f.requester_id, f.created_at, u.username, u.account_id
            FROM friends f
            JOIN users u ON f.requester_id = u.id
            WHERE f.receiver_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `)
            .bind(userId)
            .all();

        return c.json({
            success: true,
            data: { requests: results }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// フレンド申請を承認 → ペア自動作成
app.post('/accept/:friendshipId', requireAuth, async (c) => {
    try {
        const friendshipId = c.req.param('friendshipId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const friendship = await db.prepare('SELECT * FROM friends WHERE id = ? AND receiver_id = ? AND status = ?')
            .bind(friendshipId, userId, 'pending')
            .first();

        if (!friendship) {
            return c.json({ success: false, error: 'フレンド申請が見つかりません' }, 404);
        }

        // ペアを作成
        const inviteCode = generateInviteCode();

        // バッチで一貫性を確保: ペア作成 → フレンドステータス更新
        const pairInsert = db.prepare('INSERT INTO pairs (user1_id, user2_id, invite_code) VALUES (?, ?, ?)')
            .bind(friendship.requester_id, friendship.receiver_id, inviteCode);

        const pairResult = await pairInsert.run();
        const pairId = pairResult.meta.last_row_id;

        await db.prepare("UPDATE friends SET status = 'accepted', pair_id = ? WHERE id = ?")
            .bind(pairId, friendshipId)
            .run();

        return c.json({
            success: true,
            data: { pair_id: pairId }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// フレンド申請を拒否
app.post('/reject/:friendshipId', requireAuth, async (c) => {
    try {
        const friendshipId = c.req.param('friendshipId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const friendship = await db.prepare('SELECT id FROM friends WHERE id = ? AND receiver_id = ? AND status = ?')
            .bind(friendshipId, userId, 'pending')
            .first();

        if (!friendship) {
            return c.json({ success: false, error: 'フレンド申請が見つかりません' }, 404);
        }

        await db.prepare('DELETE FROM friends WHERE id = ?')
            .bind(friendshipId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// フレンド一覧
app.get('/', requireAuth, async (c) => {
    try {
        const db = c.env.DB;
        const userId = c.get('userId');

        const { results } = await db.prepare(`
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
        `)
            .bind(userId, userId, userId, userId, userId)
            .all();

        return c.json({
            success: true,
            data: { friends: results }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// フレンド解除
app.delete('/:friendshipId', requireAuth, async (c) => {
    try {
        const friendshipId = c.req.param('friendshipId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const friendship = await db.prepare(`
            SELECT id FROM friends 
            WHERE id = ? AND (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
        `)
            .bind(friendshipId, userId, userId)
            .first();

        if (!friendship) {
            return c.json({ success: false, error: 'フレンド関係が見つかりません' }, 404);
        }

        await db.prepare('DELETE FROM friends WHERE id = ?')
            .bind(friendshipId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

export default app;
