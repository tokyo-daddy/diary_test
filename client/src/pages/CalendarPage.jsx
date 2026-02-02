import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { diariesAPI, pairsAPI } from '../api';
import Layout from '../components/Layout';
import Calendar from '../components/Calendar';
import { List } from 'lucide-react';

export default function CalendarPage() {
    const { pairId } = useParams();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [diaryDays, setDiaryDays] = useState([]);
    const [pair, setPair] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const year = format(currentDate, 'yyyy');
                const month = format(currentDate, 'M');

                const [calendarRes, pairRes] = await Promise.all([
                    diariesAPI.getCalendar(pairId, year, month),
                    pairsAPI.get(pairId)
                ]);

                setDiaryDays(calendarRes.data.data.days);
                setPair(pairRes.data.data);
            } catch (error) {
                console.error('Error fetching calendar data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pairId, currentDate]);

    const handleDateClick = (date) => {
        // もし月が違う場合は月を移動
        if (format(date, 'yyyy-MM') !== format(currentDate, 'yyyy-MM')) {
            setCurrentDate(date);
            return;
        }

        // 日記がある日もない日も、その日の日記一覧ページ（フィルタ付き）へ遷移する
        const dateStr = format(date, 'yyyy-MM-dd');
        navigate(`/pairs/${pairId}/diaries?date=${dateStr}`);
    };

    if (loading && !pair) return <Layout><div className="text-center py-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-black font-sans">
                        {pair?.is_solo ? '自分の部屋' : `${pair?.partner_username || 'パートナー'}との交換日記`}
                    </h1>
                    <button
                        onClick={() => navigate(`/pairs/${pairId}/diaries`)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <List size={18} />
                        <span>一覧表示</span>
                    </button>
                </div>

                <Calendar
                    currentDate={currentDate}
                    onDateClick={handleDateClick}
                    diaryDays={diaryDays}
                />

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">
                        日付を選択すると、その日の日記を確認したり新しく書いたりできます。
                    </p>
                </div>
            </div>
        </Layout>
    );
}
