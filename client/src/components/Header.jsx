import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="py-8 text-center bg-transparent">
            <Link to="/pairs" className="inline-block">
                <h1 className="text-3xl font-bold text-black tracking-tight font-sans">
                    Nikky
                </h1>
            </Link>

        </header>
    );
}
