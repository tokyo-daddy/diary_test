import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pairsAPI } from '../api';
import Layout from '../components/Layout';
import { Trash2, Home, User, Clock } from 'lucide-react';

export default function PairsPage() {
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

    const handleDelete = async (e, pairId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('このペアを削除してもよろしいですか？')) return;
        try {
            await pairsAPI.delete(pairId);
            fetchPairs();
        } catch (error) {
            console.error('Failed to delete pair:', error);
            alert('ペアの削除に失敗しました');
        }
    };



    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    const soloRooms = pairs.filter(p => p.is_solo);
    const friendRooms = pairs.filter(p => !p.is_solo);
    const myRoom = soloRooms[0];

    return (
        <Layout>
            <div className="space-y-12">

                {/* My Room Section */}
                <section>
                    <div className="max-w-6xl mx-auto w-full mb-8">
                        <h2 className="text-2xl font-bold text-black font-sans">My Room</h2>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        {myRoom ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                                <div className="relative group">
                                    <Link
                                        to={`/pairs/${myRoom.id}/diaries`}
                                        className="block relative aspect-[4/3] bg-[#eff6ff] rounded-[32px] p-6 mb-4 transition-all hover:shadow-lg hover:translate-y-[-4px]"
                                    >
                                        <div className="w-full h-full bg-white rounded-lg shadow-sm flex flex-col items-center justify-center overflow-hidden">
                                            <Home size={40} className="text-gray-300 mb-3" />
                                            <p className="text-sm font-bold text-gray-600 font-sans">自分の部屋</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 font-sans">自分の部屋がまだありません。</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Friends List Section */}
                <section className="pt-4 border-t border-gray-100">
                    <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-black font-sans">Friends</h2>
                        <Link
                            to="/friends"
                            className="text-gray-400 hover:text-gray-600 px-3 py-2 rounded-full text-xs font-medium transition-colors font-sans"
                        >
                            フレンド管理
                        </Link>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                            {friendRooms.map(pair => {
                                const isWaiting = !pair.partner_id;

                                if (isWaiting) {
                                    return (
                                        <div key={pair.id} className="relative group">
                                            <div
                                                className="block relative aspect-[4/3] bg-gray-100 rounded-[32px] p-6 mb-4 transition-all"
                                            >
                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => handleDelete(e, pair.id)}
                                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 transition-colors z-20"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                                <div className="w-full h-full bg-white rounded-lg shadow-sm flex flex-col items-center justify-center overflow-hidden">
                                                    <Clock size={32} className="text-gray-300 mb-3" />
                                                    <p className="text-xs text-gray-400 mb-1 font-sans">招待コード</p>
                                                    <p className="text-xl font-mono font-bold text-black tracking-wider select-all">
                                                        {pair.invite_code}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <p className="text-xs text-gray-400">
                                                    作成日: {new Date(pair.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={pair.id} className="relative group">
                                        <Link
                                            to={`/pairs/${pair.id}/diaries`}
                                            className="block relative aspect-[4/3] bg-[#eff6ff] rounded-[32px] p-6 mb-4 transition-all hover:shadow-lg hover:translate-y-[-4px]"
                                        >
                                            <div className="w-full h-full bg-white rounded-lg shadow-sm flex flex-col items-center justify-center overflow-hidden">
                                                <User size={40} className="text-gray-300 mb-3" />
                                                <p className="text-sm font-bold text-gray-600 font-sans">{pair.partner_username}</p>
                                            </div>
                                        </Link>
                                        <div className="px-2">
                                            <p className="text-xs text-gray-400">
                                                開始: {new Date(pair.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {friendRooms.length === 0 && (
                                <div className="col-span-full text-center py-20">
                                    <p className="text-gray-400 font-sans">まだ友達がいません</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
