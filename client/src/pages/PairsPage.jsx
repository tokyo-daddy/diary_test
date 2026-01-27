import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pairsAPI } from '../api';
import Layout from '../components/Layout';

export default function PairsPage() {
    const [pairs, setPairs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPairs();
    }, []);

    const fetchPairs = async () => {
        try {
            const response = await pairsAPI.list();
            setPairs(response.data.data.pairs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">ペア一覧</h1>
                <Link
                    to="/pairs/create"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    ペアを新しく作る / 参加する
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pairs.map(pair => (
                    <Link
                        key={pair.id}
                        to={`/pairs/${pair.id}/diaries`}
                        className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="text-lg font-bold mb-2">
                            パートナー: {pair.partner_username}
                        </div>
                        <div className="text-gray-500 text-sm">
                            開始日: {new Date(pair.created_at).toLocaleDateString()}
                        </div>
                    </Link>
                ))}

                {pairs.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 mb-4">まだペアがありません</p>
                        <Link
                            to="/pairs/create"
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            ペアを作成して交換日記を始めましょう
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
