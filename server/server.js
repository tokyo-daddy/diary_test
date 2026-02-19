const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./db/init');
const authRoutes = require('./routes/auth');
const pairsRoutes = require('./routes/pairs');
const diariesRoutes = require('./routes/diaries');
const publicDiariesRoutes = require('./routes/public-diaries');
const friendsRoutes = require('./routes/friends');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Exchange Diary API Server');
});

// ミドルウェア
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Viteのデフルトポート
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
        httpOnly: true,
        secure: false // HTTPSでない場合はfalseが必要
    }
}));

// データベース初期化とサーバー起動
initDatabase().then(db => {
    app.locals.db = db;

    // ルート
    app.use('/api/auth', authRoutes);
    app.use('/api/pairs', pairsRoutes);
    app.use('/api/diaries', diariesRoutes);
    app.use('/api/public-diaries', publicDiariesRoutes);
    app.use('/api/friends', friendsRoutes);

    // エラーハンドリング
    app.use(errorHandler);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
