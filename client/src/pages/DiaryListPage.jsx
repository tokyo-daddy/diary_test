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
            <div className="space-y-2">
                {diaries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-serif mb-4">まだ日記がありません</p>
                        <p className="text-sm text-gray-400">右下のボタンから最初の日記を書いてみましょう</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {diaries.map(diary => (
                            <DiaryCard key={diary.id} diary={diary} currentUserId={user.id} />
                        ))}
                    </div>
                )}
            </div>

            {/* TODO: Handle Drafts better or keep them simple? For now hidden or need a section */}
            {drafts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-400 mb-4 text-center">下書き</h2>
                    <div className="space-y-4">
                        {drafts.map(draft => (
                            <Link
                                key={draft.id}
                                to={`/pairs/${pairId}/diaries/${draft.id}/edit`}
                                className="block bg-white border border-gray-200 rounded-xl p-4 opacity-75 hover:opacity-100"
                            >
                                <div className="font-bold text-sm mb-1">{draft.title}</div>
                                <div className="text-xs text-gray-400">
                                    {new Date(draft.created_at).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-20"></div> {/* Spacer for FAB */}
            <FloatingActionButton to={`/pairs/${pairId}/diaries/new`} />
        </Layout>
    );
}
