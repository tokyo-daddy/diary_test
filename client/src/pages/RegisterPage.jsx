import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import Layout from '../components/Layout';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authAPI.register(username, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || '登録に失敗しました');
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold mb-6 text-center">新規登録</h2>
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
                        <label className="block text-gray-700 mb-2">パスワード (8文字以上)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            minLength={8}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        登録する
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    すでにアカウントをお持ちの方は <Link to="/login" className="text-blue-600 hover:underline">ログイン</Link>
                </p>
            </div>
        </Layout>
    );
}
