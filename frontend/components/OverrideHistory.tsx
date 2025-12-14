import { useEffect, useState } from "react";
import { ApiService } from "../services/ApiService";
import type { Event } from "../src/types";
import "./HistoryView.css"; // Reuse HistoryView styles for consistency

type Props = {
    onClose: () => void;
};

export function OverrideHistory({ onClose }: Props) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOverrides() {
            try {
                // Fetch recent events and filter for "Override" type
                const allEvents = await ApiService.getRecentEvents();
                const overrides = allEvents.filter((e: Event) => e.type === "Override");
                // Sort by tick descending (newest first)
                overrides.sort((a, b) => b.tick - a.tick);
                setEvents(overrides);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchOverrides();
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Override History</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {loading && <p>Loading history...</p>}
                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && events.length === 0 && (
                        <div className="empty-state-message">
                            <p>No override events found in recent history.</p>
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <div className="history-list">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Tick</th>
                                        <th>Message</th>
                                        <th>Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((evt, idx) => (
                                        <tr key={idx}>
                                            <td>#{evt.tick}</td>
                                            <td>{evt.message}</td>
                                            <td>
                                                <span className={`severity-badge severity-${evt.severity > 80 ? 'high' : 'medium'}`}>
                                                    {evt.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
