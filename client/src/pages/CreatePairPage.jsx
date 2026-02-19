import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pairsAPI } from '../api';
import Layout from '../components/Layout';

export default function CreatePairPage() {
    const [inviteCode, setInviteCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCreate = async () => {
        try {
            const response = await pairsAPI.create();
            setCreatedCode(response.data.data.invite_code);
            setError('');
        } catch (err) {
            setError('招待コードの発行に失敗しました');
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            await pairsAPI.join(inviteCode);
            navigate('/pairs');
        } catch (err) {
            setError(err.response?.data?.error || '参加に失敗しました');
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto pt-16 px-6 space-y-10">
                <h1 className="text-2xl font-bold text-black font-sans">友達とつながる</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-sans">{error}</div>
                )}

                {/* 招待コード発行セクション */}
                <div>
                    <h2 className="text-sm font-medium text-gray-600 mb-3 font-sans">招待コードを発行する</h2>
                    <p className="text-sm text-gray-400 mb-4 font-sans">
                        招待コードを発行して、友達に伝えてください。
                    </p>

                    {createdCode ? (
                        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
                            <p className="text-xs text-gray-500 mb-2 font-sans">招待コード</p>
                            <div className="text-3xl font-mono font-bold text-black tracking-wider mb-4 select-all">
                                {createdCode}
                            </div>
                            <button
                                onClick={() => navigate('/pairs')}
                                className="text-sm text-black font-medium hover:underline font-sans"
                            >
                                友達一覧に戻る
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleCreate}
                            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-sans font-medium"
                        >
                            招待コードを発行する
                        </button>
                    )}
                </div>

                {/* 区切り線 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-400 font-sans">または</span>
                    </div>
                </div>

                {/* 招待コード入力セクション */}
                <div>
                    <h2 className="text-sm font-medium text-gray-600 mb-3 font-sans">招待コードを持っていますか？</h2>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="招待コードを入力"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-mono"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-white border border-gray-200 text-black py-3 rounded-lg hover:bg-gray-50 transition-colors font-sans font-medium"
                        >
                            友達になる
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
