import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { generateInviteCode } from '../utils/generateCode';

const app = new Hono();

// 新規ペア作成と招待コード生成
app.post('/create', requireAuth, async (c) => {
    try {
        const db = c.env.DB;
        const userId = c.get('userId');

        const inviteCode = generateInviteCode();

        try {
            const result = await db.prepare(
                'INSERT INTO pairs (user1_id, invite_code) VALUES (?, ?)'
            )
                .bind(userId, inviteCode)
                .run();

            return c.json({
                success: true,
                data: {
                    pair_id: result.meta.last_row_id,
                    invite_code: inviteCode
                }
            });
        } catch (e) {
            // D1のエラーメッセージに基づいてハンドリング
            // D1/SQLiteのエラーオブジェクトの構造に依存するが、
            // 一般的にmessageプロパティにエラー内容が含まれる
            if (e.message && e.message.includes('UNIQUE constraint failed')) {
                return c.json({ success: false, error: '招待コード生成に失敗しました。もう一度お試しください。' }, 500);
            }
            throw e;
        }

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 招待コードでペアに参加
app.post('/join', requireAuth, async (c) => {
    try {
        const { invite_code } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        if (!invite_code) {
            return c.json({ success: false, error: '招待コードが必要です' }, 400);
        }

        const pair = await db.prepare('SELECT * FROM pairs WHERE invite_code = ?')
            .bind(invite_code)
            .first();

        if (!pair) {
            return c.json({ success: false, error: '無効な招待コードです' }, 404);
        }

        if (pair.user2_id) {
            return c.json({ success: false, error: 'この招待コードは既に使用されています' }, 400);
        }

        if (pair.user1_id === userId) {
            return c.json({ success: false, error: '自分で作成したペアには参加できません' }, 400);
        }

        await db.prepare('UPDATE pairs SET user2_id = ? WHERE id = ?')
            .bind(userId, pair.id)
            .run();

        return c.json({
            success: true,
            data: {
                pair_id: pair.id
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 自分が所属するペア一覧取得
app.get('/', requireAuth, async (c) => {
    try {
        const db = c.env.DB;
        const userId = c.get('userId');

        const sql = `
            SELECT 
                p.id, 
                p.is_solo,
                p.created_at,
                CASE 
                    WHEN p.is_solo = 1 THEN NULL
                    WHEN p.user1_id = ? THEN u2.id
                    ELSE u1.id
                END as partner_id,
                CASE 
                    WHEN p.is_solo = 1 THEN '自分の部屋'
                    WHEN p.user1_id = ? THEN u2.username
                    ELSE u1.username
                END as partner_username
            FROM pairs p
            LEFT JOIN users u1 ON p.user1_id = u1.id
            LEFT JOIN users u2 ON p.user2_id = u2.id
            WHERE p.user1_id = ? OR p.user2_id = ?
            ORDER BY p.is_solo DESC, p.created_at DESC
        `;

        // D1のallメソッドは結果セットをresultsプロパティに持つオブジェクトを返す
        const { results } = await db.prepare(sql)
            .bind(userId, userId, userId, userId)
            .all();

        const formattedPairs = results.map(p => ({
            id: p.id,
            partner_id: p.partner_id,
            partner_username: p.partner_username || '(パートナー待ち)',
            is_solo: p.is_solo === 1,
            created_at: p.created_at
        }));

        return c.json({
            success: true,
            data: {
                pairs: formattedPairs
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 指定ペアの詳細取得
app.get('/:id', requireAuth, async (c) => {
    try {
        const id = c.req.param('id');
        const db = c.env.DB;
        const userId = c.get('userId');

        const sql = `
            SELECT 
                p.*,
                CASE 
                    WHEN p.user1_id = ? THEN u2.username
                    ELSE u1.username
                END as partner_username
            FROM pairs p
            LEFT JOIN users u1 ON p.user1_id = u1.id
            LEFT JOIN users u2 ON p.user2_id = u2.id
            WHERE p.id = ? AND (p.user1_id = ? OR p.user2_id = ?)
        `;

        const pair = await db.prepare(sql).bind(userId, id, userId, userId).first();

        if (!pair) {
            return c.json({ success: false, error: 'ペアが見つかりません' }, 404);
        }

        return c.json({
            success: true,
            data: {
                ...pair,
                is_solo: pair.is_solo === 1
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

export default app;
