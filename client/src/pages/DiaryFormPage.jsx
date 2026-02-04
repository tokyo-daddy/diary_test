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
    const [isCurrentlyDraft, setIsCurrentlyDraft] = useState(false);
    const [targetDate, setTargetDate] = useState(queryDate ? new Date(queryDate) : new Date());
    const [isSolo, setIsSolo] = useState(false);
    const [createdDiaryId, setCreatedDiaryId] = useState(null); // for auto-save new diary
    const [lastSavedDraftStatus, setLastSavedDraftStatus] = useState(false); // track draft status separately for auto-save


    // For dirty checking
    const [lastSavedTitle, setLastSavedTitle] = useState('');
    const [lastSavedContent, setLastSavedContent] = useState('');
    const autoSaveTimeoutRef = useRef(null);
    const editorRef = useRef(null);

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
        fetchInitialData();
    }, [diaryId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const pairResponse = await diariesAPI.getPair(pairId);
            setIsSolo(pairResponse.data.data.is_solo);

            if (isEdit) {
                await fetchDiary();
            } else {
                setLastSavedTitle('');
                setLastSavedContent('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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
            setLastSavedDraftStatus(is_draft);
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
        } else if (e.key === 'Enter') {
            e.preventDefault();
            editorRef.current?.focus();
        }
    };

    // Auto-save for all rooms
    useEffect(() => {
        if (loading) return;

        // Don't auto-save if nothing to save
        const hasContent = title.trim() || (content && content !== '<p></p>');
        if (!hasContent) return;

        // Check if dirty (content or draft status changed)
        const contentDirty = title !== lastSavedTitle || content !== lastSavedContent;
        const draftStatusDirty = isCurrentlyDraft !== lastSavedDraftStatus;
        if (!contentDirty && !draftStatusDirty) return;

        // Clear previous timeout
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        // Set new timeout for auto-save (1.5 seconds debounce)
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

            const data = {
                title: titleToSave,
                content,
                is_draft: isSolo ? false : isCurrentlyDraft,
                created_at: targetDate
            };

            const currentDiaryId = diaryId || createdDiaryId;

            if (currentDiaryId) {
                await diariesAPI.update(pairId, currentDiaryId, data);
            } else {
                const res = await diariesAPI.create(pairId, data);
                setCreatedDiaryId(res.data.data.id);
            }

            setLastSavedTitle(titleToSave);
            setLastSavedContent(content);
            setLastSavedDraftStatus(isSolo ? false : isCurrentlyDraft);
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setSaving(false);
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
                is_draft: isSolo ? false : isDraft,
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
                <div className="fixed top-6 right-6 flex items-center gap-4 z-10 transition-opacity duration-300">
                    {/* Visibility Dropdown - only for pair rooms */}
                    {!isSolo && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCurrentlyDraft(!isCurrentlyDraft)}
                                className="text-sm px-4 py-2 rounded-2xl bg-white shadow-sm text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                {isCurrentlyDraft ? '下書き' : '公開'}
                            </button>
                        </div>
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
