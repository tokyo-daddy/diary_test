import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { diariesAPI, pairsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DiaryCard from '../components/DiaryCard';
import FloatingActionButton from '../components/FloatingActionButton';

export default function DiaryListPage() {
    const { pairId } = useParams();
    const { user } = useAuth();
    const [diaries, setDiaries] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [pair, setPair] = useState(null);
    const [loading, setLoading] = useState(true);
    const order = 'desc';

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    const fetchData = async () => {
        try {
            const [diariesRes, draftsRes, pairRes] = await Promise.all([
                diariesAPI.list(pairId, order),
                diariesAPI.drafts(pairId),
                pairsAPI.get(pairId)
            ]);
            setDiaries(diariesRes.data.data.diaries);
            setDrafts(draftsRes.data.data.drafts);
            setPair(pairRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-12">
                <div className="max-w-6xl mx-auto w-full">
                    <h1 className="text-2xl font-bold text-black font-sans">
                        {pair?.is_solo ? '自分の部屋' : `${pair?.partner_username || 'パートナー'}との交換日記`}
                    </h1>
                </div>

                {diaries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-sans mb-4">まだ日記がありません</p>
                        <p className="text-sm text-gray-400">右上のボタンから最初の日記を書いてみましょう</p>

                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                            {diaries.map(diary => (
                                <DiaryCard
                                    key={diary.id}
                                    diary={diary}
                                    currentUserId={user.id}
                                    onDeleteSuccess={fetchData}
                                    showAuthor={!pair?.is_solo}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>


            {/* Drafts Section */}
            {drafts.length > 0 && (
                <div className="mt-16 pt-16 border-t border-gray-100">
                    <div className="max-w-6xl mx-auto w-full">
                        <h2 className="text-sm font-bold text-gray-400 mb-8 text-left uppercase tracking-[0.2em] font-sans">下書き</h2>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 opacity-80 hover:opacity-100 transition-opacity">
                            {drafts.map(draft => (
                                <DiaryCard
                                    key={draft.id}
                                    diary={draft}
                                    currentUserId={user.id}
                                    onDeleteSuccess={fetchData}
                                    to={`/pairs/${pairId}/diaries/${draft.id}/edit`}
                                    showAuthor={!pair?.is_solo}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}


            <div className="h-20"></div> {/* Spacer for FAB */}
            <FloatingActionButton to={`/pairs/${pairId}/diaries/new`} />
        </Layout>
    );
}
