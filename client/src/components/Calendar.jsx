import React from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ currentDate, onDateClick, diaryDays = [] }) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => {
        onDateClick(addMonths(currentDate, 1));
    };

    const prevMonth = () => {
        onDateClick(subMonths(currentDate, 1));
    };

    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-800 font-sans">
                    {format(currentDate, 'yyyy年 M月', { locale: ja })}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-4">
                {dayNames.map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-50 rounded-lg overflow-hidden border border-gray-50">
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const hasDiary = diaryDays.includes(parseInt(format(day, 'd'))) && isCurrentMonth;
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={idx}
                            onClick={() => onDateClick(day)}
                            className={`
                relative h-24 bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
              `}
                        >
                            <span className={`
                inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                ${isToday ? 'bg-black text-white' : ''}
              `}>
                                {format(day, 'd')}
                            </span>

                            {hasDiary && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
