import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, getExportLogsUrl, AuditLog } from '../api';
import { useToast } from '../components/Toast';

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entity_type: '',
        q: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ count: 0, num_pages: 1 });
    const { addToast } = useToast();

    useEffect(() => {
        loadLogs();
    }, [filters]);

    async function loadLogs() {
        setLoading(true);
        try {
            const data = await fetchAuditLogs(filters);
            setLogs(data.results);
            setPagination({ count: data.count, num_pages: data.num_pages });
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    function handleExport() {
        window.location.href = getExportLogsUrl(filters);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Audit Logs</h1>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                    Export CSV
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <select
                        value={filters.action}
                        onChange={e => setFilters({ ...filters, action: e.target.value, page: 1 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="REVOKE">REVOKE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="IMPORT">IMPORT</option>
                        <option value="ASSIGN_ROLE">ASSIGN_ROLE</option>
                        <option value="REMOVE_ROLE">REMOVE_ROLE</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                    <select
                        value={filters.entity_type}
                        onChange={e => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">All Entities</option>
                        <option value="Indicator">Indicator</option>
                        <option value="ComplianceRecord">ComplianceRecord</option>
                        <option value="EvidenceItem">EvidenceItem</option>
                        <option value="User">User</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Search</label>
                    <input
                        type="text"
                        value={filters.q}
                        onChange={e => setFilters({ ...filters, q: e.target.value, page: 1 })}
                        placeholder="Search summary..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">No logs found.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => console.log(log)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {log.actor_username || 'System'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                log.action === 'REVOKE' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.entity_type} {log.entity_id && `(${log.entity_id.substring(0, 8)})`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {log.summary}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.num_pages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.num_pages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setFilters({ ...filters, page: i + 1 })}
                            className={`px-3 py-1 rounded ${filters.page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
