import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { publicDiariesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import TiptapEditor from '../components/TiptapEditor';

export default function PublicDiaryFormPage() {
    const { diaryId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isEdit = !!diaryId;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [lastSavedTitle, setLastSavedTitle] = useState('');
    const [lastSavedContent, setLastSavedContent] = useState('');
    const [isCurrentlyDraft, setIsCurrentlyDraft] = useState(false);
    const [createdDiaryId, setCreatedDiaryId] = useState(null);
    const [lastSavedDraftStatus, setLastSavedDraftStatus] = useState(false);
    const [targetDate, setTargetDate] = useState(new Date());
    const autoSaveTimeoutRef = useRef(null);
    const editorRef = useRef(null);

    // Date formatting for placeholder
    const getFormattedDate = (date) => {
        const formatter = new Intl.DateTimeFormat('ja-JP', {
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        });
        const parts = formatter.formatToParts(date);
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const weekday = parts.find(p => p.type === 'weekday').value;
        return `${month}月${day}日 (${weekday})`;
    };

    const titlePlaceholder = getFormattedDate(targetDate);

    useEffect(() => {
        if (isEdit) {
            fetchDiary();
        }
    }, [diaryId]);

    const fetchDiary = async () => {
        try {
            const response = await publicDiariesAPI.get(user.account_id, diaryId);
            const { title, content, is_draft, created_at } = response.data.data;
            setTitle(title);
            setContent(content);
            setLastSavedTitle(title);
            setLastSavedContent(content);
            setIsCurrentlyDraft(!!is_draft);
            setLastSavedDraftStatus(!!is_draft);
            if (created_at) setTargetDate(new Date(created_at));
        } catch (error) {
            console.error(error);
            navigate('/my-public-diaries');
        } finally {
            setLoading(false);
        }
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Tab' && title === '') {
            e.preventDefault();
            setTitle(titlePlaceholder);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            editorRef.current?.focus();
        }
    };

    // Auto-save
    useEffect(() => {
        if (loading) return;

        const hasContent = title.trim() || (content && content !== '<p></p>');
        if (!hasContent) return;

        const contentDirty = title !== lastSavedTitle || content !== lastSavedContent;
        const draftStatusDirty = isCurrentlyDraft !== lastSavedDraftStatus;
        if (!contentDirty && !draftStatusDirty) return;

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(async () => {
            await performAutoSave();
        }, 1500);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [title, content, isCurrentlyDraft, loading]);

    const performAutoSave = async () => {
        if (saving) return;
        setSaving(true);

        try {
            let titleToSave = title;
            if (!titleToSave.trim()) {
                titleToSave = titlePlaceholder;
                setTitle(titleToSave);
            }

            const data = { title: titleToSave, content, is_draft: isCurrentlyDraft };
            const currentDiaryId = diaryId || createdDiaryId;

            if (currentDiaryId) {
                await publicDiariesAPI.update(currentDiaryId, data);
            } else {
                const res = await publicDiariesAPI.create(data);
                setCreatedDiaryId(res.data.data.id);
            }

            setLastSavedTitle(titleToSave);
            setLastSavedContent(content);
            setLastSavedDraftStatus(isCurrentlyDraft);
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="flex justify-center items-center h-screen text-gray-400">Loading...</div></Layout>;

    return (
        <Layout hideHeader={true}>
            <div className="max-w-[1500px] mx-auto px-4 py-8 min-h-[calc(100vh-100px)] flex flex-col relative">

                {/* Back Button */}
                <div className="fixed top-6 left-6 z-50 group">
                    <Link
                        to="/my-public-diaries"
                        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-black/5"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </Link>
                    <div className="absolute top-12 left-0 whitespace-nowrap bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        公開日記一覧へ戻る
                    </div>
                </div>

                {/* Status and Visibility Toggle */}
                <div className="fixed top-6 right-6 flex items-center gap-4 z-50">
                    <button
                        type="button"
                        onClick={() => setIsCurrentlyDraft(!isCurrentlyDraft)}
                        className={`text-sm px-4 py-2 rounded-2xl bg-white shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer transition-colors ${isCurrentlyDraft ? 'text-gray-400 font-medium' : 'text-blue-500 font-bold'}`}
                    >
                        {isCurrentlyDraft ? '下書き' : '公開'}
                    </button>
                </div>

                {/* Main Content */}
                <div className="max-w-[620px] mx-auto w-full">
                    <div className="mb-8 mt-12 text-left">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            placeholder={titlePlaceholder}
                            className="w-full text-left text-black placeholder-gray-200 text-3xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none p-0 tracking-wide"
                        />
                    </div>

                    <div className="flex-grow">
                        <TiptapEditor
                            ref={editorRef}
                            content={content}
                            onChange={setContent}
                            editable={!saving}
                        />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
