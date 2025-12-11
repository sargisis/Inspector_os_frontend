import React, { useEffect, useState, useRef } from 'react';
import './TimelineSlider.css';
import type { Telemetry } from '../hooks/useTelemetry';
import { GraphPreview } from './GraphPreview';

interface TimelineSliderProps {
    onFrameSelect: (frame: Telemetry | null) => void;
    externalHistory?: Telemetry[] | null;
    onGoLive?: () => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ onFrameSelect, externalHistory, onGoLive }) => {
    const [internalHistory, setInternalHistory] = useState<Telemetry[]>([]);
    const history = externalHistory || internalHistory;

    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackRef = useRef<number | null>(null);

    // Hover state
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [hoverX, setHoverX] = useState<number>(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Fetch history on mount
    useEffect(() => {
        if (externalHistory) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                // Use configured URL or default to localhost
                const baseUrl = (import.meta as any).env.VITE_BACKEND_HTTP_URL || 'http://localhost:8080';
                const response = await fetch(`${baseUrl}/api/v0.0.5/history?limit=1000`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setInternalHistory(data);
                // Set to end initially (live)
                setCurrentIndex(null);
            } catch (error) {
                console.error('Failed to fetch history:', error);
                setInternalHistory([]); // Ensure it's empty on error
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [externalHistory]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value, 10);
        setCurrentIndex(index);
        if (history[index]) {
            onFrameSelect(history[index]);
        }
        setIsPlaying(false); // Stop playback on manual interaction
    };

    const handleLiveClick = () => {
        setCurrentIndex(null);
        onFrameSelect(null);
        setIsPlaying(false);
        if (onGoLive) {
            onGoLive();
        }
    };

    const togglePlayback = () => {
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (isPlaying && history.length > 0) {
            playbackRef.current = window.setInterval(() => {
                setCurrentIndex((prev) => {
                    const next = (prev === null || prev >= history.length - 1) ? 0 : prev + 1;
                    onFrameSelect(history[next]);
                    return next;
                });
            }, 100); // 10fps playback
        } else {
            if (playbackRef.current) {
                clearInterval(playbackRef.current);
            }
        }
        return () => {
            if (playbackRef.current) clearInterval(playbackRef.current);
        };
    }, [isPlaying, history, onFrameSelect]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current || history.length === 0) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percent = Math.max(0, Math.min(1, x / width));
        const index = Math.floor(percent * (history.length - 1));

        setHoverIndex(index);
        setHoverX(x);
    };

    const handleMouseLeave = () => {
        setHoverIndex(null);
    };

    if (loading) return <div className="timeline-slider">Loading history...</div>;

    const maxIndex = history.length - 1;
    const val = currentIndex === null ? maxIndex + 1 : currentIndex;

    const handleRewind = () => {
        setCurrentIndex(0);
        if (history[0]) {
            onFrameSelect(history[0]);
        }
        // Keep playing if already playing, or stay paused
    };

    return (
        <div className="timeline-slider-container">
            {currentIndex !== null && (
                <div className="timeline-controls">
                    <button className="control-btn" onClick={handleRewind} title="Rewind to start">
                        ⏪
                    </button>
                    <button className="control-btn" onClick={togglePlayback} title={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? '⏸' : '▶️'}
                    </button>
                    <button className="control-btn go-live-btn" onClick={handleLiveClick} title="Return to live view">
                        🔴 Go Live
                    </button>
                    <span className="frame-info">
                        {`Frame: ${currentIndex} / ${maxIndex}`}
                    </span>
                </div>
            )}

            <div
                className="slider-wrapper"
                ref={sliderRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {hoverIndex !== null && (
                    <div className="hover-preview" style={{ left: hoverX }}>
                        <GraphPreview history={history} centerIndex={hoverIndex} />
                    </div>
                )}
                <input
                    type="range"
                    min="0"
                    max={Math.max(0, maxIndex + 1)} // Ensure max is at least 0
                    value={val}
                    disabled={maxIndex < 0}
                    onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (v > maxIndex) {
                            handleLiveClick();
                        } else {
                            handleSliderChange(e);
                        }
                    }}
                    className={`timeline-range ${maxIndex < 0 ? 'disabled' : ''}`}
                />
            </div>

            {maxIndex < 0 && !loading && (
                <div className="timestamp-display" style={{ color: '#ff4444' }}>
                    No history available
                </div>
            )}

            {currentIndex !== null && history[currentIndex] && (
                <div className="timestamp-display">
                    {new Date(history[currentIndex].timestamp).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};
