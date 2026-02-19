import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            // リダイレクト先があればそこへ、なければトップへ
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'ログインに失敗しました');
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto pt-16 px-6">
                <h2 className="text-2xl font-bold mb-10 text-black font-sans">ログイン</h2>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-sans">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">ユーザー名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-sans"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-sans"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-sans font-medium"
                    >
                        ログイン
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500 font-sans">
                    アカウントをお持ちでない方は <Link to="/register" className="text-black font-medium hover:underline">新規登録</Link>
                </p>
            </div>
        </Layout>
    );
}
