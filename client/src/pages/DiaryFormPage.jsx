import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { diariesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import TiptapEditor from '../components/TiptapEditor';

export default function DiaryFormPage() {
    const { pairId, diaryId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryDate = searchParams.get('date');
    const isEdit = !!diaryId;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [isCurrentlyDraft, setIsCurrentlyDraft] = useState(true);
    // ターゲット日付（新規作成時はクエリパラメータor今日、編集時は既存の日付）
    const [targetDate, setTargetDate] = useState(queryDate ? new Date(queryDate) : new Date());


    // For dirty checking
    const [lastSavedTitle, setLastSavedTitle] = useState('');
    const [lastSavedContent, setLastSavedContent] = useState('');

    // Date formatting for placeholder
    const getFormattedDate = (date) => {
        const formatter = new Intl.DateTimeFormat('ja-JP', {
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        });
        // Format: 01月28日 (水)
        const parts = formatter.formatToParts(date);
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const weekday = parts.find(p => p.type === 'weekday').value;
        return `${month}月${day}日 (${weekday})`;
    };

    const titlePlaceholder = getFormattedDate(targetDate);

    // Initial load
    useEffect(() => {
        if (isEdit) {
            fetchDiary();
        } else {
            // New diary: Init clean state
            setLastSavedTitle('');
            setLastSavedContent('');
            setLoading(false);
        }
    }, [diaryId]);

    const fetchDiary = async () => {
        try {
            const response = await diariesAPI.get(pairId, diaryId);
            const { title, content, is_draft, author_id, created_at } = response.data.data;

            // Check authorization
            if (author_id !== user.id) {
                navigate(`/pairs/${pairId}/diaries/${diaryId}`);
                return;
            }

            setTitle(title);
            setContent(content);
            setLastSavedTitle(title);
            setLastSavedContent(content);
            setIsCurrentlyDraft(is_draft);
            setTargetDate(new Date(created_at));

        } catch (error) {
            console.error(error);
            navigate(`/pairs/${pairId}/diaries`);
        } finally {
            setLoading(false);
        }
    };

    // Derived state for UI
    const isDirty = title !== lastSavedTitle || content !== lastSavedContent;
    // Special case: If new and empty, might not be "dirty" in traditional sense but we want to allow saving if user typed something?
    // Actually simplicity: if different from last saved, it is dirty.
    // "Saved" state means !isDirty (and not saving).

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Tab' && title === '') {
            e.preventDefault();
            setTitle(titlePlaceholder);
        }
    };

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Default title if empty? User plan said "Tab to autofill", implies manual.
            // But if user clicks save with empty title, maybe we should auto-fill?
            // Let's stick to: Must have title as per original validaton provided by strict "required" in previous form.
            // But here we want a smoother UX. Let's auto-fill if empty on save, or require it. 
            // Plan said "default to date", so let's autofill if empty.
            let titleToSave = title;
            if (!titleToSave.trim()) {
                titleToSave = titlePlaceholder;
                setTitle(titleToSave);
            }

            const data = {
                title: titleToSave,
                content,
                is_draft: isDraft,
                created_at: targetDate // Explicitly save the date (from query param or existing)
            };

            if (isEdit) {
                await diariesAPI.update(pairId, diaryId, data);
            } else {
                const res = await diariesAPI.create(pairId, data);
                // If create, we might need to redirect to edit mode or just stay? 
                // Original redirected to list. Let's redirect to list as per original behavior for now, 
                // OR stay and switch to edit mode to allow further editing?
                // Minimalist UI usually stays. But let's follow existing pattern: navigate to list
                navigate(`/pairs/${pairId}/diaries`);
                return; // Early return because we navigated away
            }

            // If we stayed (update case):
            setLastSavedTitle(titleToSave);
            setLastSavedContent(content);
            setIsCurrentlyDraft(isDraft);

            // Optionally show success toast/indicator?
            // For now, button state "Saved" is the indicator.

        } catch (error) {
            console.error(error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="flex justify-center items-center h-screen text-gray-400">Loading...</div></Layout>;

    return (
        <Layout hideHeader={true}>
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

                {/* Save Actions - Fixed top right or inline? 
                    Design image didn't show buttons. Let's put them top right or bottom right cleanly.
                    Let's put them top right for easy access. */}
                <div className="fixed top-6 right-6 flex items-center gap-6 z-10 transition-opacity duration-300">
                    {/* Draft Save / Saved Indicator / Revert to Draft */}
                    <div className="flex items-center">
                        {!isCurrentlyDraft ? (
                            <button
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={saving}
                                className="text-sm text-gray-400 hover:text-gray-800 transition-colors"
                            >
                                下書きに戻す
                            </button>
                        ) : isDirty ? (
                            <button
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={saving}
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                下書き保存
                            </button>
                        ) : (
                            <span className="text-sm text-gray-300">保存済み</span>
                        )}
                    </div>


                    {/* Publish / Update Button */}
                    {!!(isDirty || isCurrentlyDraft) && (

                        <button
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={saving || (!title.trim() && (!content || content === '<p></p>'))}
                            className={`text-sm px-5 py-1.5 rounded-full shadow-sm transition-all animate-fade-in ${(saving || (!title.trim() && (!content || content === '<p></p>')))
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {!isCurrentlyDraft ? '更新する' : (saving ? '保存中...' : '公開する')}
                        </button>


                    )}
                </div>


                {/* Main Content Container */}
                <div className="max-w-[620px] mx-auto w-full">
                    {/* Header / Title */}
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

                    {/* Editor */}
                    <div className="flex-grow">
                        <TiptapEditor
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
