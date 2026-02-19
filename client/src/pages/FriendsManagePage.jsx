import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { friendsAPI, pairsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Search, UserPlus, UserCheck, UserX, Globe, MessageSquare, X, Check, Copy, Ticket } from 'lucide-react';

export default function FriendsManagePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [copied, setCopied] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [inviteError, setInviteError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                friendsAPI.list(),
                friendsAPI.getRequests()
            ]);
            setFriends(friendsRes.data.data.friends);
            setRequests(requestsRes.data.data.requests);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setSearching(true);
        setSearchResult(null);
        setSearchError('');

        try {
            const response = await friendsAPI.search(searchId.trim());
            setSearchResult(response.data.data);
        } catch (error) {
            if (error.response?.status === 404) {
                setSearchError('ユーザーが見つかりません');
            } else if (error.response?.status === 400) {
                setSearchError(error.response.data.error || 'エラーが発生しました');
            } else {
                setSearchError('検索に失敗しました');
            }
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (receiverId) => {
        setActionLoading(receiverId);
        try {
            await friendsAPI.sendRequest(receiverId);
            // Re-search to update status
            if (searchId.trim()) {
                const response = await friendsAPI.search(searchId.trim());
                setSearchResult(response.data.data);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'フレンド申請に失敗しました');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAccept = async (friendshipId) => {
        setActionLoading(friendshipId);
        try {
            await friendsAPI.accept(friendshipId);
            await fetchData();
        } catch (error) {
            alert('承認に失敗しました');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (friendshipId) => {
        setActionLoading(friendshipId);
        try {
            await friendsAPI.reject(friendshipId);
            await fetchData();
        } catch (error) {
            alert('拒否に失敗しました');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveFriend = async (friendshipId) => {
        if (!window.confirm('このフレンドを解除しますか？')) return;
        setActionLoading(friendshipId);
        try {
            await friendsAPI.remove(friendshipId);
            await fetchData();
        } catch (error) {
            alert('フレンド解除に失敗しました');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCopyId = () => {
        if (user?.account_id) {
            navigator.clipboard.writeText(user.account_id)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('コピーに失敗しました');
                });
        }
    };

    const handleCreateCode = async () => {
        try {
            const response = await pairsAPI.create();
            setCreatedCode(response.data.data.invite_code);
            setInviteError('');
        } catch (err) {
            setInviteError('招待コードの発行に失敗しました');
        }
    };

    const handleJoinCode = async (e) => {
        e.preventDefault();
        try {
            await pairsAPI.join(inviteCode);
            navigate('/pairs');
        } catch (err) {
            setInviteError(err.response?.data?.error || '参加に失敗しました');
        }
    };

    if (loading) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    const tabs = [
        { id: 'friends', label: 'フレンド一覧', icon: UserCheck },
        { id: 'requests', label: `申請 ${requests.length > 0 ? `(${requests.length})` : ''}`, icon: UserPlus },
        { id: 'search', label: 'ID検索', icon: Search },
        { id: 'invite', label: '招待コード', icon: Ticket },
    ];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="max-w-6xl mx-auto w-full">
                    <h1 className="text-2xl font-bold text-black font-sans">フレンド管理</h1>
                    {user && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-400 font-sans">
                                あなたのID:
                            </span>
                            <button
                                onClick={handleCopyId}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                title="IDをコピー"
                            >
                                <span className="font-mono font-bold text-gray-600 select-all text-sm">{user.account_id}</span>
                                {copied ? (
                                    <Check size={14} className="text-green-500" />
                                ) : (
                                    <Copy size={14} className="text-gray-400 group-hover:text-gray-600" />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex gap-2 border-b border-gray-100 pb-0">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${activeTab === tab.id
                                        ? 'text-black border-black'
                                        : 'text-gray-400 border-transparent hover:text-gray-600'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="max-w-6xl mx-auto w-full">
                    {/* Friends List Tab */}
                    {activeTab === 'friends' && (
                        <div>
                            {friends.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 font-sans">まだフレンドがいません</p>
                                    <p className="text-sm text-gray-300 mt-2">「ID検索」タブからフレンドを追加しましょう</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {friends.map(friend => (
                                        <div key={friend.friendship_id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center">
                                                    <UserCheck size={18} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 font-sans">{friend.friend_username}</p>
                                                    <p className="text-xs text-gray-400 font-mono">@{friend.friend_account_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/user/${friend.friend_account_id}`}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <Globe size={12} />
                                                    公開日記
                                                </Link>
                                                {friend.pair_id && (
                                                    <Link
                                                        to={`/pairs/${friend.pair_id}/diaries`}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                                                    >
                                                        <MessageSquare size={12} />
                                                        共有日記
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveFriend(friend.friendship_id)}
                                                    disabled={actionLoading === friend.friendship_id}
                                                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-full"
                                                    title="フレンド解除"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div>
                            {requests.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 font-sans">フレンド申請はありません</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map(request => (
                                        <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                                    <UserPlus size={18} className="text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 font-sans">{request.username}</p>
                                                    <p className="text-xs text-gray-400 font-mono">@{request.account_id}</p>
                                                    <p className="text-[10px] text-gray-300 mt-0.5">
                                                        {new Date(request.created_at).toLocaleDateString('ja-JP')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAccept(request.id)}
                                                    disabled={actionLoading === request.id}
                                                    className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={14} />
                                                    承認
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={actionLoading === request.id}
                                                    className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                                                >
                                                    <X size={14} />
                                                    拒否
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search Tab */}
                    {activeTab === 'search' && (
                        <div className="space-y-6">
                            <form onSubmit={handleSearch} className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    placeholder="アカウントIDを入力"
                                    className="flex-grow px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={searching || !searchId.trim()}
                                    className="px-6 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-2xl transition-colors disabled:opacity-50"
                                >
                                    {searching ? '検索中...' : '検索'}
                                </button>
                            </form>

                            {searchError && (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 font-sans">{searchError}</p>
                                </div>
                            )}

                            {searchResult && (
                                <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center">
                                                <UserCheck size={22} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-gray-800 font-sans">{searchResult.user.username}</p>
                                                <p className="text-sm text-gray-400 font-mono">@{searchResult.user.account_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/user/${searchResult.user.account_id}`}
                                                className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <Globe size={12} />
                                                公開日記を見る
                                            </Link>
                                            {searchResult.friendship ? (
                                                <span className="px-4 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded-full">
                                                    {searchResult.friendship.status === 'accepted' ? 'フレンド済み' : '申請中'}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendRequest(searchResult.user.id)}
                                                    disabled={actionLoading === searchResult.user.id}
                                                    className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                                                >
                                                    <UserPlus size={14} />
                                                    {actionLoading === searchResult.user.id ? '送信中...' : 'フレンド申請'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invite Code Tab */}
                    {activeTab === 'invite' && (
                        <div className="space-y-8">
                            {inviteError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-sm font-sans">{inviteError}</div>
                            )}

                            {/* 招待コード発行セクション */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-3 font-sans">招待コードを発行する</h3>
                                <p className="text-sm text-gray-400 mb-4 font-sans">
                                    招待コードを発行して、友達に伝えてください。
                                </p>

                                {createdCode ? (
                                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                                        <p className="text-xs text-gray-500 mb-2 font-sans">招待コード</p>
                                        <div className="text-3xl font-mono font-bold text-black tracking-wider mb-4 select-all">
                                            {createdCode}
                                        </div>
                                        <button
                                            onClick={() => navigate('/pairs')}
                                            className="text-sm text-black font-medium hover:underline font-sans"
                                        >
                                            友達一覧に戻る
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCreateCode}
                                        className="w-full bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-colors font-sans font-medium"
                                    >
                                        招待コードを発行する
                                    </button>
                                )}
                            </div>

                            {/* 区切り線 */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-50 text-gray-400 font-sans">または</span>
                                </div>
                            </div>

                            {/* 招待コード入力セクション */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-3 font-sans">招待コードを持っていますか？</h3>
                                <form onSubmit={handleJoinCode} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="招待コードを入力"
                                        className="flex-grow px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 font-mono"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-2xl transition-colors font-sans"
                                    >
                                        参加する
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
