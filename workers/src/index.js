import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import pairsRoutes from './routes/pairs';
import diariesRoutes from './routes/diaries';
import publicDiariesRoutes from './routes/public-diaries';
import friendsRoutes from './routes/friends';

const app = new Hono();

// CORS設定
app.use('/*', cors({
    origin: (origin) => {
        if (origin === 'http://localhost:5173') return origin;
        if (origin && origin.endsWith('.pages.dev')) return origin;
        return 'https://nikky.pages.dev';
    },
    allowHeaders: ['Content-Type', 'X-Session-ID', 'Authorization'],
    credentials: true,
}));



// ルート設定
app.route('/api/auth', authRoutes);
app.route('/api/pairs', pairsRoutes);
app.route('/api/diaries', diariesRoutes);
app.route('/api/public-diaries', publicDiariesRoutes);
app.route('/api/friends', friendsRoutes);

export default app;