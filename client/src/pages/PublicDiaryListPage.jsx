import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicDiariesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import FloatingActionButton from '../components/FloatingActionButton';
import PublicDiaryCard from '../components/PublicDiaryCard';
import { Globe } from 'lucide-react';

export default function PublicDiaryListPage() {
    const { accountId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [diaries, setDiaries] = useState([]);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 自分の公開日記かどうか
    const isMyPage = !accountId || (user && profileUser && user.account_id === profileUser.account_id);

    useEffect(() => {
        fetchDiaries();
    }, [accountId]);

    const fetchDiaries = async () => {
        try {
            if (accountId) {
                // 他ユーザーの公開日記
                const response = await publicDiariesAPI.list(accountId);
                setDiaries(response.data.data.diaries);
                setProfileUser(response.data.data.user);
            } else {
                // 自分の公開日記
                const response = await publicDiariesAPI.myList();
                setDiaries(response.data.data.diaries);
                if (user) {
                    setProfileUser({ username: user.username, account_id: user.account_id });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const publishedDiaries = diaries.filter(d => d.is_draft === 0);
    const draftDiaries = diaries.filter(d => d.is_draft === 1);

    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-12">
                {/* Header */}
                <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-black font-sans flex items-center gap-3">
                            <Globe size={24} className="text-gray-400" />
                            {isMyPage ? '公開日記' : `${profileUser?.username} の公開日記`}
                        </h1>
                        {profileUser && (
                            <p className="text-sm text-gray-400 mt-1 font-sans">
                                @{profileUser.account_id}
                            </p>
                        )}
                    </div>
                </div>

                {/* Published Diaries Grid */}
                {publishedDiaries.length === 0 && draftDiaries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-sans mb-4">
                            {isMyPage ? 'まだ公開日記がありません' : 'このユーザーの公開日記はありません'}
                        </p>
                        {isMyPage && <p className="text-sm text-gray-400">右下のボタンから最初の日記を書いてみましょう</p>}
                    </div>
                ) : (
                    <>
                        {publishedDiaries.length > 0 ? (
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                                    {publishedDiaries.map(diary => (
                                        <PublicDiaryCard
                                            key={diary.id}
                                            diary={diary}
                                            isMyPage={isMyPage}
                                            currentUser={user}
                                            accountId={accountId}
                                            onStatusChange={fetchDiaries}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : isMyPage && draftDiaries.length > 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 font-sans">公開中の日記はありません</p>
                            </div>
                        )}

                        {/* Drafts Section */}
                        {isMyPage && draftDiaries.length > 0 && (
                            <div className="mt-16 pt-16 border-t border-gray-100">
                                <div className="max-w-6xl mx-auto w-full">
                                    <h2 className="text-sm font-bold text-gray-400 mb-8 text-left uppercase tracking-[0.2em] font-sans">
                                        下書き
                                    </h2>
                                </div>
                                <div className="max-w-6xl mx-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 opacity-80 hover:opacity-100 transition-opacity">
                                        {draftDiaries.map(diary => (
                                            <PublicDiaryCard
                                                key={diary.id}
                                                diary={diary}
                                                isMyPage={isMyPage}
                                                currentUser={user}
                                                accountId={accountId}
                                                onStatusChange={fetchDiaries}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {isMyPage && user && (
                <FloatingActionButton to="/my-public-diaries/new" />
            )}
        </Layout>
    );
}
