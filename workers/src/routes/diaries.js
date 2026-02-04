import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';

const app = new Hono();

// 指定した月のカレンダー情報（日記が存在する日の一覧）を取得
app.get('/:pairId/calendar/:year/:month', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const year = c.req.param('year');
        const month = c.req.param('month');
        const db = c.env.DB;
        const userId = c.get('userId');

        const isSoloSql = `SELECT user1_id, user2_id, (user2_id IS NULL) as is_solo FROM pairs WHERE id = ?`;
        const pair = await db.prepare(isSoloSql)
            .bind(pairId)
            .first();

        if (!pair) return c.json({ success: false, error: 'ペアが見つかりません' }, 404);
        if (pair.user1_id !== userId && pair.user2_id !== userId) return c.json({ success: false, error: '権限がありません' }, 403);

        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`;

        const sql = `
            SELECT DISTINCT strftime('%d', created_at) as day
            FROM diaries
            WHERE pair_id = ? ${pair.is_solo ? '' : 'AND is_draft = 0'}
            AND created_at >= ? AND created_at <= ?
        `;

        const { results } = await db.prepare(sql)
            .bind(pairId, startDate, endDate)
            .all();

        return c.json({
            success: true,
            data: {
                days: results.map(d => parseInt(d.day))
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 指定ペアの日記一覧取得
app.get('/:pairId', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const order = c.req.query('order') || 'desc';
        const db = c.env.DB;
        const userId = c.get('userId');

        const isSoloSql = `SELECT user1_id, user2_id, (user2_id IS NULL) as is_solo FROM pairs WHERE id = ?`;
        const pair = await db.prepare(isSoloSql)
            .bind(pairId)
            .first();

        if (!pair) {
            return c.json({ success: false, error: 'ペアが見つかりません' }, 404);
        }
        if (pair.user1_id !== userId && pair.user2_id !== userId) {
            return c.json({ success: false, error: 'アクセス権限がありません' }, 403);
        }

        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

        const sql = `
            SELECT d.*, u.username as author_username 
            FROM diaries d
            JOIN users u ON d.author_id = u.id
            WHERE d.pair_id = ? ${pair.is_solo ? '' : 'AND d.is_draft = 0'}
            ORDER BY d.created_at ${sortOrder}
        `;

        const { results } = await db.prepare(sql)
            .bind(pairId)
            .all();

        return c.json({
            success: true,
            data: { diaries: results }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 自分の下書き一覧取得
app.get('/:pairId/drafts', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const db = c.env.DB;
        const userId = c.get('userId');
        const isSoloSql = `SELECT (user2_id IS NULL) as is_solo FROM pairs WHERE id = ?`;
        const pair = await db.prepare(isSoloSql).bind(pairId).first();

        if (pair?.is_solo) {
            return c.json({
                success: true,
                data: { drafts: [] }
            });
        }

        const sql = `
            SELECT d.id, d.pair_id, d.author_id, d.title, d.content, d.is_draft, d.created_at, u.username as author_username
            FROM diaries d
            JOIN users u ON d.author_id = u.id
            WHERE d.pair_id = ? AND d.author_id = ? AND d.is_draft = 1
            ORDER BY d.created_at DESC
        `;
        const { results } = await db.prepare(sql)
            .bind(pairId, userId)
            .all();

        return c.json({
            success: true,
            data: { drafts: results }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 日記詳細取得
app.get('/:pairId/:diaryId', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const diaryId = c.req.param('diaryId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const pair = await db.prepare('SELECT user1_id, user2_id FROM pairs WHERE id = ?')
            .bind(pairId)
            .first();

        if (!pair) return c.json({ success: false, error: 'ペアが見つかりません' }, 404);
        if (pair.user1_id !== userId && pair.user2_id !== userId) return c.json({ success: false, error: '権限がありません' }, 403);

        const diary = await db.prepare(`
            SELECT d.*, u.username as author_username 
            FROM diaries d
            JOIN users u ON d.author_id = u.id
            WHERE d.id = ? AND d.pair_id = ?
        `)
            .bind(diaryId, pairId)
            .first();

        if (!diary) {
            return c.json({ success: false, error: '日記が見つかりません' }, 404);
        }

        if (diary.is_draft === 1 && diary.author_id !== userId) {
            return c.json({ success: false, error: '他人の下書きは閲覧できません' }, 403);
        }

        return c.json({
            success: true,
            data: diary
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 日記作成
app.post('/:pairId', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const { title, content, is_draft, created_at } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        const pair = await db.prepare('SELECT user1_id, user2_id FROM pairs WHERE id = ?')
            .bind(pairId)
            .first();

        if (!pair) return c.json({ success: false, error: 'ペアが見つかりません' }, 404);
        if (pair.user1_id !== userId && pair.user2_id !== userId) return c.json({ success: false, error: '権限がありません' }, 403);

        if (!title) {
            return c.json({ success: false, error: 'タイトルは必須です' }, 400);
        }

        // created_atが指定されている場合はそれを使用し、なければ現在時刻
        const dateToSave = created_at ? new Date(created_at).toISOString() : new Date().toISOString();

        const result = await db.prepare(`
            INSERT INTO diaries (pair_id, author_id, title, content, is_draft, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `)
            .bind(pairId, userId, title, content || '', is_draft ? 1 : 0, dateToSave)
            .run();

        return c.json({
            success: true,
            data: {
                id: result.meta.last_row_id,
                title,
                content,
                author_id: userId,
                is_draft: is_draft ? 1 : 0,
                created_at: dateToSave
            }
        });

        return c.json({
            success: true,
            data: {
                id: result.meta.last_row_id,
                title,
                content,
                author_id: userId,
                is_draft: is_draft ? 1 : 0,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 日記更新
app.put('/:pairId/:diaryId', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const diaryId = c.req.param('diaryId');
        const { title, content, is_draft, created_at } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        const diary = await db.prepare('SELECT author_id, created_at FROM diaries WHERE id = ? AND pair_id = ?')
            .bind(diaryId, pairId)
            .first();

        if (!diary) return c.json({ success: false, error: '日記が見つかりません' }, 404);
        if (diary.author_id !== userId) return c.json({ success: false, error: '編集権限がありません' }, 403);

        // 指定があれば更新、なければ元のまま
        const dateToSave = created_at ? new Date(created_at).toISOString() : diary.created_at;

        await db.prepare(`
            UPDATE diaries 
            SET title = ?, content = ?, is_draft = ?, created_at = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `)
            .bind(title, content, is_draft ? 1 : 0, dateToSave, diaryId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 日記削除
app.delete('/:pairId/:diaryId', requireAuth, async (c) => {
    try {
        const pairId = c.req.param('pairId');
        const diaryId = c.req.param('diaryId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const diary = await db.prepare('SELECT author_id FROM diaries WHERE id = ? AND pair_id = ?')
            .bind(diaryId, pairId)
            .first();

        if (!diary) return c.json({ success: false, error: '日記が見つかりません' }, 404);
        if (diary.author_id !== userId) return c.json({ success: false, error: '削除権限がありません' }, 403);

        await db.prepare('DELETE FROM diaries WHERE id = ?')
            .bind(diaryId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

export default app;
