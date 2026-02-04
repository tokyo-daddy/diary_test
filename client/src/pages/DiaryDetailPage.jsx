import { useState, useEffect, useRef } from 'react';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null); // Actually, we need to import useRef first

    useEffect(() => {
        fetchDiary();
    }, [pairId, diaryId]);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                {/* Actions - Top Right (Three dots menu) */}
                <div className="fixed top-6 right-6 flex items-center gap-6 z-10">
                    {isAuthor && (
                        <div className="relative group">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors z-20 rounded-full hover:bg-gray-100/50"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div
                                    ref={menuRef}
                                    className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl py-2 w-48 z-30 ring-1 ring-black ring-opacity-5 animate-fade-in"
                                >
                                    <Link
                                        to={`/pairs/${pairId}/diaries/${diaryId}/edit`}
                                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="mr-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        編集する
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-50 transition-colors"
                                    >

                                        <svg className="mr-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                        ごみ箱にいれる
                                    </button>
                                </div>
                            )}
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
