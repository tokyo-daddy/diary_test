import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787/api',
    withCredentials: false // Workersではcredentialsは使わない
});

// セッションIDをローカルストレージで管理
let sessionId = localStorage.getItem('sessionId');

// リクエストインターセプター
api.interceptors.request.use((config) => {
    if (sessionId) {
        config.headers['X-Session-ID'] = sessionId;
    }
    return config;
});

// レスポンスインターセプター
api.interceptors.response.use(
    (response) => {
        // ログイン時にセッションIDを保存
        if (response.data.data?.sessionId) {
            sessionId = response.data.data.sessionId;
            localStorage.setItem('sessionId', sessionId);
        }
        return response;
    },
    (error) => {
        // 401エラー時にセッションIDをクリア
        if (error.response?.status === 401) {
            sessionId = null;
            localStorage.removeItem('sessionId');
            // 必要に応じてログインページへリダイレクトなどの処理を追加
        }
        return Promise.reject(error);
    }
);

// 認証API
export const authAPI = {
    register: (username, password) =>
        api.post('/auth/register', { username, password }),
    login: (username, password) =>
        api.post('/auth/login', { username, password }),
    logout: () =>
        api.post('/auth/logout'),
    me: () =>
        api.get('/auth/me')
};

// ペアAPI
export const pairsAPI = {
    create: () =>
        api.post('/pairs/create'),
    join: (invite_code) =>
        api.post('/pairs/join', { invite_code }),
    list: () =>
        api.get('/pairs')
};

// 日記API
export const diariesAPI = {
    list: (pairId, order = 'desc') =>
        api.get(`/diaries/${pairId}?order=${order}`),
    get: (pairId, diaryId) =>
        api.get(`/diaries/${pairId}/${diaryId}`),
    create: (pairId, data) =>
        api.post(`/diaries/${pairId}`, data),
    update: (pairId, diaryId, data) =>
        api.put(`/diaries/${pairId}/${diaryId}`, data),
    delete: (pairId, diaryId) =>
        api.delete(`/diaries/${pairId}/${diaryId}`),
    drafts: (pairId) =>
        api.get(`/diaries/${pairId}/drafts`)
};

export default api;
