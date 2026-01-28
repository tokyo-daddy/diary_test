import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { diariesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DiaryCard from '../components/DiaryCard';
import FloatingActionButton from '../components/FloatingActionButton';

export default function DiaryListPage() {
    const { pairId } = useParams();
    const { user } = useAuth();
    const [diaries, setDiaries] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const order = 'desc';

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    const fetchData = async () => {
        try {
            const [diariesRes, draftsRes] = await Promise.all([
                diariesAPI.list(pairId, order),
                diariesAPI.drafts(pairId)
            ]);
            setDiaries(diariesRes.data.data.diaries);
            setDrafts(draftsRes.data.data.drafts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                {diaries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-serif mb-4">まだ日記がありません</p>
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
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>


            {/* TODO: Handle Drafts better or keep them simple? For now hidden or need a section */}
            {drafts.length > 0 && (
                <div className="mt-16 pt-16 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-400 mb-8 text-center uppercase tracking-[0.2em]">下書き</h2>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 opacity-80 hover:opacity-100 transition-opacity">
                            {drafts.map(draft => (
                                <DiaryCard
                                    key={draft.id}
                                    diary={draft}
                                    currentUserId={user.id}
                                    onDeleteSuccess={fetchData}
                                    to={`/pairs/${pairId}/diaries/${draft.id}/edit`}
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
