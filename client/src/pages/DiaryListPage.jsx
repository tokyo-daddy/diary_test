import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { diariesAPI, pairsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DiaryCard from '../components/DiaryCard';
import FloatingActionButton from '../components/FloatingActionButton';
import { Calendar as CalendarIcon, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function DiaryListPage() {
    const { pairId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateFilter = searchParams.get('date');
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

    const filteredDiaries = dateFilter
        ? diaries.filter(d => {
            const dDate = new Date(d.created_at);
            const filterDate = new Date(dateFilter);
            return dDate.getFullYear() === filterDate.getFullYear() &&
                dDate.getMonth() === filterDate.getMonth() &&
                dDate.getDate() === filterDate.getDate();
        })
        : diaries;

    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-12">
                <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
                    <h1
                        className="text-2xl font-bold text-black font-sans cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => navigate(`/pairs/${pairId}/diaries`)}
                    >
                        {pair?.is_solo ? '自分の部屋' : `${pair?.partner_username || 'パートナー'}との交換日記`}
                    </h1>
                    <button
                        onClick={() => navigate(`/pairs/${pairId}/calendar`)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <CalendarIcon size={18} />
                        <span>カレンダー</span>
                    </button>
                </div>

                {dateFilter && (
                    <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 font-sans border-l-4 border-black pl-4">
                            {new Date(dateFilter).toLocaleDateString('ja-JP')} の日記
                        </h2>
                    </div>
                )}

                {filteredDiaries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-sans mb-4">
                            {dateFilter ? 'この日の日記はありません' : 'まだ日記がありません'}
                        </p>
                        {!dateFilter && <p className="text-sm text-gray-400">右上のボタンから最初の日記を書いてみましょう</p>}
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                            {filteredDiaries.map(diary => (
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
            <FloatingActionButton to={`/pairs/${pairId}/diaries/new${dateFilter ? `?date=${dateFilter}` : ''}`} />
        </Layout>
    );
}
