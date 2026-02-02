import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pairsAPI } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export default function PairsPage() {
    const { user } = useAuth();
    const [pairs, setPairs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPairs();
    }, []);

    const fetchPairs = async () => {
        try {
            const response = await pairsAPI.list();
            setPairs(response.data.data.pairs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pairId) => {
        if (!window.confirm('このペアを削除してもよろしいですか？')) return;
        try {
            await pairsAPI.delete(pairId);
            fetchPairs();
        } catch (error) {
            console.error('Failed to delete pair:', error);
            alert('ペアの削除に失敗しました');
        }
    };

    if (loading) return <Layout><div>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">ペア一覧</h1>
                <Link
                    to="/pairs/create"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    ペアを新しく作る / 参加する
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pairs.map(pair => {
                    const isWaiting = !pair.partner_id && !pair.is_solo;

                    if (isWaiting) {
                        return (
                            <div
                                key={pair.id}
                                className="block p-6 rounded-lg shadow bg-white relative"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-lg font-bold text-gray-500">
                                        パートナー待ち
                                    </div>
                                    <button
                                        onClick={() => handleDelete(pair.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title="削除"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="mt-4 mb-2">
                                    <p className="text-sm text-gray-500 mb-1">招待コード</p>
                                    <p className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">
                                        {pair.invite_code}
                                    </p>
                                </div>
                                <div className="text-gray-400 text-sm mt-4">
                                    作成日: {new Date(pair.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={pair.id}
                            to={`/pairs/${pair.id}/diaries`}
                            className={`block p-6 rounded-lg shadow hover:shadow-md transition-shadow ${pair.is_solo ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-white'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-lg font-bold text-indigo-900">
                                    {pair.is_solo ? `${user?.username}の部屋` : `パートナー: ${pair.partner_username}`}
                                </div>
                                {pair.is_solo && (
                                    <span className="bg-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded">個人</span>
                                )}
                            </div>
                            <div className="text-gray-500 text-sm">
                                開始日: {new Date(pair.created_at).toLocaleDateString()}
                            </div>
                        </Link>
                    );
                })}

                {pairs.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 mb-4">まだペアがありません</p>
                        <Link
                            to="/pairs/create"
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            ペアを作成して交換日記を始めましょう
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
