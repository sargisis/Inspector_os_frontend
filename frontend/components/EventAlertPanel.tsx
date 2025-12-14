import { useEffect, useState, useRef } from "react";
import "./EventAlertPanel.css";
import "./EventAlertPanel.css";

import type { Event } from "../src/types";

import { ApiService } from "../services/ApiService";

export function EventAlertPanel() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'console'>('list');
    const listRef = useRef<HTMLDivElement>(null);
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchEvents = async () => {
            try {
                const json = await ApiService.getRecentEvents();
                if (!cancelled) {
                    // Reverse to show newest at top if needed, or keep as is.
                    // Assuming backend returns chronological order (oldest first), 
                    // we might want to reverse to show newest first.
                    setEvents(json.reverse());
                    setLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Events fetch failed", error);
                }
            }
        };

        fetchEvents();
        // Poll for events. Using a slightly slower interval than telemetry to reduce load.
        const interval = window.setInterval(fetchEvents, 2000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    // Auto-scroll console to bottom when new events arrive
    useEffect(() => {
        if (viewMode === 'console' && consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [events, viewMode]);

    const getSeverityClass = (severity: number) => {
        if (severity >= 80) return "severity-high";
        if (severity >= 30) return "severity-medium";
        return "severity-info";
    };

    return (
        <div className="event-panel">
            <div className="event-panel-header">
                <div className="event-panel-title">System Alerts</div>
                <button
                    className="event-view-toggle"
                    onClick={() => setViewMode(v => v === 'list' ? 'console' : 'list')}
                    title={viewMode === 'list' ? "Switch to Console" : "Switch to List"}
                >
                    {viewMode === 'list' ? ">_" : "☰"}
                </button>
            </div>

            {viewMode === 'list' ? (
                <div className="event-list" ref={listRef}>
                    {events.length === 0 ? (
                        <div className="event-empty">
                            {loading ? "Loading events..." : "No recent events"}
                        </div>
                    ) : (
                        events.map((evt, idx) => (
                            <div key={`${evt.tick}-${idx}`} className={`event-item ${getSeverityClass(evt.severity)}`}>
                                <div className="event-header">
                                    <span className="event-type">{evt.type}</span>
                                    <span className="event-time">TICK #{evt.tick}</span>
                                </div>
                                <div className="event-message">{evt.message}</div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="event-console" ref={consoleRef}>
                    {events.slice().reverse().map((evt, idx) => (
                        <div key={idx} className="console-line">
                            <span className="console-tick">[{evt.tick}]</span>
                            <span className="console-json">{JSON.stringify(evt)}</span>
                        </div>
                    ))}
                    {events.length === 0 && <div className="console-empty">// No events log</div>}
                </div>
            )}
        </div>
    );
}
