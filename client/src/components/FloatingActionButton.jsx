import React from 'react';
import { Link } from 'react-router-dom';

export default function FloatingActionButton({ to }) {
    return (
        <Link
            to={to}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 hover:scale-105 transition-all duration-300 z-50 group"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:rotate-12 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        </Link>
    );
}
