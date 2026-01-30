import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { diariesAPI, pairsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import TiptapEditor from '../components/TiptapEditor';

export default function DiaryDetailPage() {
    const { pairId, diaryId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [diary, setDiary] = useState(null);
    const [isSolo, setIsSolo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDiary();
    }, [pairId, diaryId]);

    const fetchDiary = async () => {
        try {
            const [diaryRes, pairRes] = await Promise.all([
                diariesAPI.get(pairId, diaryId),
                pairsAPI.get(pairId)
            ]);
            setDiary(diaryRes.data.data);
            setIsSolo(pairRes.data.data.is_solo);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 404) {
                navigate(`/pairs/${pairId}/diaries`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('本当に削除しますか？')) return;
        try {
            await diariesAPI.delete(pairId, diaryId);
            navigate(`/pairs/${pairId}/diaries`);
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
    };

    if (loading) return <Layout><div className="flex justify-center items-center h-screen text-gray-400">Loading...</div></Layout>;
    if (!diary) return null;

    const isAuthor = diary.author_id === user.id;

    return (
        <Layout>
            <div className="max-w-[1500px] mx-auto px-4 py-8 min-h-[calc(100vh-100px)] flex flex-col relative">

                {/* Back Button - Top Left Corner */}
                <div className="fixed top-6 left-6 z-50 group">

                    <Link
                        to={`/pairs/${pairId}/diaries`}
                        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-black/5"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </Link>
                    {/* Tooltip */}
                    <div className="absolute top-12 left-0 whitespace-nowrap bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        記事一覧へ戻る
                    </div>
                </div>

                {/* Actions - Top Right */}
                <div className="fixed top-6 right-6 flex items-center gap-6 z-10">
                    {isAuthor && (
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/pairs/${pairId}/diaries/${diaryId}/edit`}
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                編集
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="text-sm text-red-400 hover:text-red-600 transition-colors"
                            >
                                削除
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Container */}
                <div className="max-w-[620px] mx-auto w-full">
                    {/* Header / Title */}
                    <div className="mb-8 mt-12 text-left">
                        <h1 className="text-3xl font-bold text-black tracking-wide">
                            {diary.title}
                        </h1>
                        <div className="mt-4 flex justify-start items-center gap-2 text-xs text-gray-400">
                            <span>{new Date(diary.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</span>
                            {!isSolo && (
                                <>
                                    <span>•</span>
                                    <span>by {diary.author_username}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content - Using TiptapEditor in read-only mode */}
                    <div className="flex-grow">
                        <TiptapEditor
                            content={diary.content}
                            onChange={() => { }}
                            editable={false}
                        />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
