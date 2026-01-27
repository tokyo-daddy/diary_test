import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="py-8 text-center bg-transparent">
            <Link to="/pairs" className="inline-block group">
                <div className="flex flex-col items-center">
                    <div className="text-xs tracking-[0.2em] text-gray-800 font-sans mb-2 font-bold group-hover:text-gray-600 transition-colors">
                        <span className='bg-gray-800 text-white rounded-full w-5 h-5 inline-flex items-center justify-center mr-2 text-[10px]'>K</span>
                        KOUKAN
                    </div>
                    <h1 className="text-2xl font-serif text-gray-800 tracking-wider group-hover:text-gray-600 transition-colors">
                        みんなの日記
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-1 font-sans">
                        静かなインターネットの広場
                    </p>
                </div>
            </Link>
        </header>
    );
}
