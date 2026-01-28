import Header from './Header';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-text-main pb-20">
            <Header />
            <main className="max-w-[1500px] mx-auto px-6">

                {children}
            </main>
        </div>
    );
}
