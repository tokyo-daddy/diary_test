import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Copy, Check, Globe, Users, LogOut, ExternalLink } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const menuRef = useRef(null);

    // メニュー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleCopy = (text, setter) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setter(true);
                setTimeout(() => setter(false), 2000);
            })
            .catch(() => alert('コピーに失敗しました'));
    };

    const publicDiaryUrl = user ? `${window.location.origin}/user/${user.account_id}` : '';

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        navigate('/login');
    };

    return (
        <header className="py-8 bg-transparent">
            <div className="max-w-[1500px] mx-auto px-6 relative flex items-center justify-center">
                <Link to="/pairs" className="inline-block">
                    <h1 className="text-3xl font-bold text-black tracking-tight font-sans">
                        Nikky
                    </h1>
                </Link>

                {user && (
                    <div className="absolute right-6" ref={menuRef}>
                        {/* アカウントボタン */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold font-sans hover:bg-gray-800 transition-colors"
                        >
                            {user.username?.charAt(0).toUpperCase()}
                        </button>

                        {/* ドロップダウンメニュー */}
                        {menuOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* ユーザー情報ヘッダー */}
                                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold font-sans">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 font-sans">{user.username}</p>
                                            <button
                                                onClick={() => handleCopy(user.account_id, setCopiedId)}
                                                className="flex items-center gap-1.5 group"
                                            >
                                                <span className="text-xs text-gray-400 font-mono">@{user.account_id}</span>
                                                {copiedId ? (
                                                    <Check size={11} className="text-green-500" />
                                                ) : (
                                                    <Copy size={11} className="text-gray-300 group-hover:text-gray-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 公開日記URL */}
                                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                                        <p className="text-[10px] text-gray-400 mb-1 font-sans">公開日記URL</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600 font-mono truncate flex-1">{publicDiaryUrl}</span>
                                            <button
                                                onClick={() => handleCopy(publicDiaryUrl, setCopiedUrl)}
                                                className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                                            >
                                                {copiedUrl ? (
                                                    <Check size={12} className="text-green-500" />
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ナビゲーションリンク */}
                                <div className="py-2">
                                    <Link
                                        to="/my-public-diaries"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-sans"
                                    >
                                        <Globe size={16} className="text-gray-400" />
                                        公開日記管理
                                    </Link>
                                    <Link
                                        to="/friends"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-sans"
                                    >
                                        <Users size={16} className="text-gray-400" />
                                        フレンド管理
                                    </Link>
                                    <Link
                                        to={`/user/${user.account_id}`}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-sans"
                                    >
                                        <ExternalLink size={16} className="text-gray-400" />
                                        公開日記を見る
                                    </Link>
                                </div>

                                {/* フッター（登録日 + ログアウト） */}
                                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                                    {user.created_at && (
                                        <span className="text-[10px] text-gray-300 font-sans">
                                            {new Date(user.created_at).toLocaleDateString('ja-JP')} 登録
                                        </span>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors font-sans ml-auto"
                                    >
                                        <LogOut size={13} />
                                        ログアウト
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
