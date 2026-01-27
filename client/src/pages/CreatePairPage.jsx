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
            setError('ペア作成に失敗しました');
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
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold text-center">ペアを始める</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">新しいペアを作成する</h2>
                    <p className="text-gray-600 mb-4">
                        招待コードを発行して、パートナーに伝えてください。
                    </p>

                    {createdCode ? (
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-green-800 font-bold mb-2">招待コード</p>
                            <div className="text-3xl font-mono tracking-wider mb-4 select-all">
                                {createdCode}
                            </div>
                            <button
                                onClick={() => navigate('/pairs')}
                                className="text-green-700 hover:underline"
                            >
                                ペア一覧に戻る
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleCreate}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
                        >
                            招待コードを発行する
                        </button>
                    )}
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-500">または</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">招待コードを持っていますか？</h2>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="招待コードを入力"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg hover:bg-indigo-50"
                        >
                            ペアに参加する
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
