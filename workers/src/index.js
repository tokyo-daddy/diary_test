import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import pairsRoutes from './routes/pairs';
import diariesRoutes from './routes/diaries';

const app = new Hono();

// CORS設定
app.use('/*', cors({
    origin: (origin) => {
        // ローカル開発環境を許可
        if (origin === 'http://localhost:5173') {
            return origin;
        }
        // Cloudflare Pagesのすべてのサブドメインを許可
        if (origin && origin.endsWith('.pages.dev')) {
            return origin;
        }
        // それ以外は拒否
        return 'http://localhost:5173';
    },
    credentials: true,
}));



// ルート設定
app.route('/api/auth', authRoutes);
app.route('/api/pairs', pairsRoutes);
app.route('/api/diaries', diariesRoutes);

export default app;