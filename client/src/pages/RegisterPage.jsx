import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import Layout from '../components/Layout';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            return;
        }
        try {
            await authAPI.register(username, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || '登録に失敗しました');
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto pt-16 px-6">
                <h2 className="text-2xl font-bold mb-10 text-black font-sans">新規登録</h2>
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
                        <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">パスワード (8文字以上)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-sans"
                            required
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">パスワード (確認)</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-sans"
                            required
                            minLength={8}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-sans font-medium"
                    >
                        登録する
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500 font-sans">
                    すでにアカウントをお持ちの方は <Link to="/login" className="text-black font-medium hover:underline">ログイン</Link>
                </p>
            </div>
        </Layout>
    );
}
