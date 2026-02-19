import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicDiariesAPI } from '../api';

export default function PublicDiaryCard({ diary, isMyPage, currentUser, accountId, onStatusChange }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const linkDestination = accountId
        ? `/user/${accountId}/${diary.id}`
        : `/user/${diary.author_account_id || currentUser?.account_id}/${diary.id}`;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('この公開日記を削除してもよろしいですか？')) return;

        try {
            await publicDiariesAPI.delete(diary.id);
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
        setIsMenuOpen(false);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/my-public-diaries/${diary.id}/edit`);
    };

    const toggleMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleToggleStatus = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await publicDiariesAPI.update(diary.id, {
                title: diary.title,
                content: diary.content,
                is_draft: diary.is_draft === 1 ? 0 : 1
            });
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error(error);
            alert('変更に失敗しました');
        }
        setIsMenuOpen(false);
    };

    return (
        <div className="relative group">
            <Link
                to={linkDestination}
                className={`block relative aspect-[4/3] ${diary.is_draft === 1 ? 'bg-gray-50' : 'bg-[#f0fdf4]'} rounded-[32px] p-6 mb-4 transition-all hover:shadow-lg hover:translate-y-[-4px]`}
            >
                <div className="w-full h-full bg-white rounded-lg shadow-sm flex flex-col p-5 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-800 font-sans mb-2 line-clamp-2">
                        {diary.title}
                    </h3>
                    <div
                        className="text-xs text-gray-400 font-sans line-clamp-4 flex-grow"
                        dangerouslySetInnerHTML={{
                            __html: diary.content?.replace(/<[^>]*>/g, ' ').substring(0, 120)
                        }}
                    />
                    <p className="text-[10px] text-gray-300 mt-2 font-sans">
                        {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                    </p>
                </div>
            </Link>

            {/* Three dots menu button - Only for author */}
            {isMyPage && currentUser && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={toggleMenu}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <button
                                onClick={handleEdit}
                                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <svg className="mr-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                編集する
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <svg className="mr-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {diary.is_draft === 1 ? (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </>
                                    ) : (
                                        <>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </>
                                    )}
                                </svg>
                                {diary.is_draft === 1 ? '公開する' : '下書きに戻す'}
                            </button>
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
    );
}
