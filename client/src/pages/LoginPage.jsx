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
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold mb-6 text-center">ログイン</h2>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">ユーザー名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ログイン
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    アカウントをお持ちでない方は <Link to="/register" className="text-blue-600 hover:underline">新規登録</Link>
                </p>
            </div>
        </Layout>
    );
}
