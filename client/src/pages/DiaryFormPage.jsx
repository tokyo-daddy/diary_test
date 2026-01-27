import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diariesAPI } from '../api';
import Layout from '../components/Layout';

export default function DiaryFormPage() {
    const { pairId, diaryId } = useParams();
    const navigate = useNavigate();
    const isEdit = !!diaryId;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchDiary();
        }
    }, [diaryId]);

    const fetchDiary = async () => {
        try {
            const response = await diariesAPI.get(pairId, diaryId);
            const { title, content } = response.data.data;
            setTitle(title);
            setContent(content);
        } catch (error) {
            console.error(error);
            navigate(`/pairs/${pairId}/diaries`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = { title, content, is_draft: isDraft };

            if (isEdit) {
                await diariesAPI.update(pairId, diaryId, data);
            } else {
                await diariesAPI.create(pairId, data);
            }

            navigate(`/pairs/${pairId}/diaries`);
        } catch (error) {
            console.error(error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6">
                    {isEdit ? '日記を編集' : '日記を書く'}
                </h1>

                <form className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                            placeholder="今日のタイトル"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2">本文</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-64 resize-y leading-relaxed"
                            placeholder="今日はどんなことがありましたか？"
                            required
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <button
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={saving}
                            className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg transition-colors"
                        >
                            下書き保存
                        </button>
                        <button
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={saving || !title}
                            className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
                        >
                            {saving ? '保存中...' : '公開する'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
