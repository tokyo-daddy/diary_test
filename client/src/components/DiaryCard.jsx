import { Link } from 'react-router-dom';

export default function DiaryCard({ diary, currentUserId }) {
    // Deterministic color selection based on diary ID
    const colors = [
        'bg-pastel-pink',
        'bg-pastel-blue',
        'bg-pastel-green',
        'bg-pastel-yellow'
    ];
    // Use modulo to cycle through colors. Ensure id is treated as number.
    const colorIndex = (typeof diary.id === 'string' ? diary.id.charCodeAt(0) : diary.id) % colors.length;
    const bgColor = colors[colorIndex] || colors[0];

    return (
        <Link
            to={`/pairs/${diary.pair_id}/diaries/${diary.id}`}
            className={`block ${bgColor} rounded-3xl p-6 mb-6 transition-transform hover:scale-[1.02] active:scale-95`}
        >
            <div className="flex justify-between items-baseline mb-4 text-xs tracking-wider text-text-muted">
                <span className="font-sans">
                    {new Date(diary.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                </span>
                <span className="uppercase">
                    • BY {diary.author_username}
                </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 font-sans">
                {diary.title}
            </h3>

            <p className="text-gray-700 leading-relaxed text-sm mb-4 line-clamp-3 font-sans opacity-90">
                {diary.content}
            </p>

            <div className="text-right text-gray-400">
                <span className="text-xl leading-none">...</span>
            </div>
        </Link>
    );
}
