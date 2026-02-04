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

    if (loading) return <Layout><div className="flex justify-center items-center h-screen text-gray-400">Loading...</div></Layout>;

    const soloRooms = pairs.filter(p => p.is_solo);
    const friendRooms = pairs.filter(p => !p.is_solo);
    // Assuming there is only one solo room per user based on current logic, but we map just in case.
    const myRoom = soloRooms[0];

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* My Room Section */}
                <section className="mb-16">
                    <h2 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">My Room</h2>
                    {myRoom ? (
                        <Link
                            to={`/pairs/${myRoom.id}/diaries`}
                            className="group block relative w-full aspect-3/1 md:aspect-4/1 bg-linear-to-br from-pastel-blue to-pastel-green rounded-[32px] p-8 md:p-12 transition-all hover:shadow-lg hover:scale-[1.01]"
                        >
                            <div className="flex flex-col h-full justify-center relative z-10">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-blue-600 mb-3">
                                        Personal
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">自分の部屋</h3>
                                    <div className="text-sm font-medium text-gray-400">
                                        <span>作成日: {new Date(myRoom.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                        </Link>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-100">
                            自分の部屋がまだありません。
                        </div>
                    )}
                </section>

                {/* Friends List Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Friends</h2>
                        <Link
                            to="/pairs/create"
                            className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            + 新しい友達
                        </Link>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {friendRooms.map(pair => {
                            const isWaiting = !pair.partner_id;

                            if (isWaiting) {
                                return (
                                    <div
                                        key={pair.id}
                                        className="relative block p-6 h-full bg-white rounded-3xl border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold">
                                                WAITING
                                            </span>
                                            <button
                                                onClick={() => handleDelete(pair.id)}
                                                className="text-gray-300 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="text-center py-4">
                                            <p className="text-xs text-gray-400 mb-2">招待コード</p>
                                            <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider select-all">
                                                {pair.invite_code}
                                            </p>
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6 text-center text-xs text-gray-400">
                                            パートナーを待っています...
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={pair.id}
                                    to={`/pairs/${pair.id}/diaries`}
                                    className="block p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold">
                                            FRIEND
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {pair.partner_username}
                                    </h3>
                                    <div className="flex items-center text-xs text-gray-300">
                                        <span>開始: {new Date(pair.created_at).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                            );
                        })}

                        {friendRooms.length === 0 && (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-gray-300 mb-2">まだ友達とのペアがありません</p>
                                <Link to="/pairs/create" className="text-sm text-blue-500 hover:underline">
                                    新しいペアを作成する
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
}
