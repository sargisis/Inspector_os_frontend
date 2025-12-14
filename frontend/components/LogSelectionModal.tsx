import React, { useEffect, useState } from 'react';
import './LogSelectionModal.css';

interface LogSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLog: (filename: string) => void;
}

export const LogSelectionModal: React.FC<LogSelectionModalProps> = ({ isOpen, onClose, onSelectLog }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = (import.meta as any).env.VITE_BACKEND_HTTP_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/api/v0.0.5/logs`);
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            setLogs(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Select Flight Log</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {loading && <div className="loading">Loading logs...</div>}
                    {error && <div className="error">{error}</div>}
                    {!loading && !error && logs.length === 0 && (
                        <div className="no-logs">No saved logs found.</div>
                    )}
                    {!loading && !error && logs.length > 0 && (
                        <ul className="log-list">
                            {logs.map(log => (
                                <li key={log} onClick={() => onSelectLog(log)}>
                                    <span className="log-name">{log}</span>
                                    <span className="log-date">
                                        {/* Extract date from filename history_snapshot_YYYYMMDD_HHMMSS.json.gz */}
                                        {log.replace('history_snapshot_', '').replace('.json.gz', '').replace('_', ' ')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
