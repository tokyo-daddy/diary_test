import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';

const app = new Hono();

// 指定ユーザーの公開日記一覧（認証不要）
app.get('/:accountId', async (c) => {
    try {
        const accountId = c.req.param('accountId');
        const db = c.env.DB;

        const user = await db.prepare('SELECT id, username, account_id FROM users WHERE account_id = ?')
            .bind(accountId)
            .first();

        if (!user) {
            return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
        }

        const { results } = await db.prepare(`
            SELECT id, title, content, is_draft, created_at, updated_at
            FROM public_diaries
            WHERE author_id = ? AND is_draft = 0
            ORDER BY created_at DESC
        `)
            .bind(user.id)
            .all();

        return c.json({
            success: true,
            data: {
                user: { username: user.username, account_id: user.account_id },
                diaries: results
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 公開日記詳細（認証不要）
app.get('/:accountId/:diaryId', async (c) => {
    try {
        const accountId = c.req.param('accountId');
        const diaryId = c.req.param('diaryId');
        const db = c.env.DB;
        const sessionId = c.req.header('X-Session-ID');

        let userId = null;
        if (sessionId) {
            const session = await db.prepare('SELECT user_id FROM sessions WHERE id = ?')
                .bind(sessionId)
                .first();
            if (session) {
                userId = session.user_id;
            }
        }

        const user = await db.prepare('SELECT id, username, account_id FROM users WHERE account_id = ?')
            .bind(accountId)
            .first();

        if (!user) {
            return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
        }

        const diary = await db.prepare(`
            SELECT id, author_id, title, content, is_draft, created_at, updated_at
            FROM public_diaries
            WHERE id = ? AND author_id = ?
        `)
            .bind(diaryId, user.id)
            .first();

        if (!diary) {
            return c.json({ success: false, error: '日記が見つかりません' }, 404);
        }

        // 下書き公開制限: 著者以外は見ることができない
        if (diary.is_draft && diary.author_id !== userId) {
            return c.json({ success: false, error: 'この日記は下書きとして保存されています' }, 403);
        }

        return c.json({
            success: true,
            data: {
                ...diary,
                author_username: user.username,
                author_account_id: user.account_id
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 自分の公開日記一覧（認証必要）
app.get('/', requireAuth, async (c) => {
    try {
        const db = c.env.DB;
        const userId = c.get('userId');

        const { results } = await db.prepare(`
            SELECT id, title, content, is_draft, created_at, updated_at
            FROM public_diaries
            WHERE author_id = ?
            ORDER BY created_at DESC
        `)
            .bind(userId)
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

// 公開日記作成
app.post('/', requireAuth, async (c) => {
    try {
        const { title, content, is_draft } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        if (!title) {
            return c.json({ success: false, error: 'タイトルは必須です' }, 400);
        }

        const result = await db.prepare(`
            INSERT INTO public_diaries (author_id, title, content, is_draft)
            VALUES (?, ?, ?, ?)
        `)
            .bind(userId, title, content || '', is_draft ? 1 : 0)
            .run();

        return c.json({
            success: true,
            data: {
                id: result.meta.last_row_id,
                title,
                content,
                author_id: userId,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 公開日記更新
app.put('/:diaryId', requireAuth, async (c) => {
    try {
        const diaryId = c.req.param('diaryId');
        const { title, content, is_draft } = await c.req.json();
        const db = c.env.DB;
        const userId = c.get('userId');

        const diary = await db.prepare('SELECT author_id FROM public_diaries WHERE id = ?')
            .bind(diaryId)
            .first();

        if (!diary) return c.json({ success: false, error: '日記が見つかりません' }, 404);
        if (diary.author_id !== userId) return c.json({ success: false, error: '編集権限がありません' }, 403);

        await db.prepare(`
            UPDATE public_diaries 
            SET title = ?, content = ?, is_draft = ?, updated_at = datetime('now')
            WHERE id = ?
        `)
            .bind(title, content, is_draft ? 1 : 0, diaryId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

// 公開日記削除
app.delete('/:diaryId', requireAuth, async (c) => {
    try {
        const diaryId = c.req.param('diaryId');
        const db = c.env.DB;
        const userId = c.get('userId');

        const diary = await db.prepare('SELECT author_id FROM public_diaries WHERE id = ?')
            .bind(diaryId)
            .first();

        if (!diary) return c.json({ success: false, error: '日記が見つかりません' }, 404);
        if (diary.author_id !== userId) return c.json({ success: false, error: '削除権限がありません' }, 403);

        await db.prepare('DELETE FROM public_diaries WHERE id = ?')
            .bind(diaryId)
            .run();

        return c.json({ success: true });

    } catch (error) {
        console.error(error);
        return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500);
    }
});

export default app;
