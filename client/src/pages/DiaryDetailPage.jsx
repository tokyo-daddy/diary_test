import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { diariesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function DiaryDetailPage() {
    const { pairId, diaryId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [diary, setDiary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDiary();
    }, [pairId, diaryId]);

    const fetchDiary = async () => {
        try {
            const response = await diariesAPI.get(pairId, diaryId);
            setDiary(response.data.data);
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

    if (loading) return <Layout><div>Loading...</div></Layout>;
    if (!diary) return null;

    const isAuthor = diary.author_id === user.id;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className={`p-6 border-b-4 ${isAuthor ? 'border-blue-200 bg-blue-50' : 'border-pink-200 bg-pink-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">{diary.title}</h1>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">
                                {new Date(diary.created_at).toLocaleString()}
                            </div>
                            <div className="text-sm font-bold text-gray-700 mt-1">
                                by {diary.author_username}
                            </div>
                        </div>
                    </div>

                    {isAuthor && (
                        <div className="flex space-x-2 mt-2">
                            <Link
                                to={`/pairs/${pairId}/diaries/${diaryId}/edit`}
                                className="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
                            >
                                編集
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="text-sm bg-white border border-red-300 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                            >
                                削除
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-8 whitespace-pre-wrap leading-relaxed text-gray-800 text-lg">
                    {diary.content}
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <Link
                        to={`/pairs/${pairId}/diaries`}
                        className="text-indigo-600 hover:underline"
                    >
                        &larr; 一覧に戻る
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
