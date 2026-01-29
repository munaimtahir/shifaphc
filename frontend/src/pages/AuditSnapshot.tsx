import React, { useState, useEffect } from 'react';
import { fetchAuditSnapshot } from '../api';
import { useToast } from '../components/Toast';

export default function AuditSnapshot() {
    const [snapshot, setSnapshot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        loadSnapshot();
    }, []);

    async function loadSnapshot() {
        setLoading(true);
        try {
            const data = await fetchAuditSnapshot({});
            setSnapshot(data);
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    function handleExportCSV() {
        if (!snapshot) return;

        const headers = ['Section', 'Standard', 'Indicator', 'Status', 'Last Compliant', 'Next Due'];
        const rows = snapshot.indicators.map((ind: any) => [
            ind.section,
            ind.standard,
            ind.text.replace(/,/g, ' '),
            ind.status,
            ind.last_compliant || 'N/A',
            ind.next_due || 'N/A'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((e: any) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `compliance_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Generating snapshot...</div>;
    if (!snapshot) return <div className="p-8 text-center text-red-500">Failed to load snapshot</div>;

    return (
        <div className="space-y-8 pb-20 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">Compliance Snapshot</h1>
                <div className="space-x-4">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                    >
                        Print PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(snapshot.summary).map(([status, count]: [string, any]) => (
                    <div key={status} className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                        <div className="text-sm text-gray-500 uppercase font-bold">{status}</div>
                        <div className="text-3xl font-bold">{count}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicator</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Evidence</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {snapshot.indicators.map((ind: any) => (
                            <tr key={ind.indicator_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{ind.standard}</div>
                                    <div className="text-xs text-gray-500 truncate w-64">{ind.text}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${ind.status === 'COMPLIANT' ? 'bg-green-100 text-green-800' :
                                            ind.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {ind.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {ind.next_due ? new Date(ind.next_due).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {ind.evidence?.[0]?.created_at ? new Date(ind.evidence[0].created_at).toLocaleDateString() : 'None'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
