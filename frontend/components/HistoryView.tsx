import { useEffect, useState, useRef } from "react";
import "./HistoryView.css";

type Telemetry = {
  timestamp: number;
  altitude: number;
  latitude: number;
  longitude: number;
  speed: number;
  battery: number;
  ai: {
    severity: number;
    summary: string;
  } | null;
};

type Props = {
  onClose: () => void;
};

import { ApiService } from "../services/ApiService";

const PLAYBACK_SPEEDS = [0.5, 1, 2, 5, 10];

export function HistoryView({ onClose }: Props) {
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const json = await ApiService.getHistory(500);
        const sortedHistory = json.reverse();
        setHistory(sortedHistory);
        setCurrentIndex(0);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex >= history.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, history.length]);


  const handlePlayPause = () => {
    if (currentIndex >= history.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const currentFrame = history[currentIndex];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Telemetry Replay</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {loading && <p>Loading history...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && history.length > 0 && (
            <div className="history-viewer">
              <div className="frame-display">
                {currentFrame && (
                  <div className="frame-details">
                    <p><strong>Timestamp:</strong> {new Date(currentFrame.timestamp).toLocaleString()}</p>
                    <p><strong>Altitude:</strong> {currentFrame.altitude.toFixed(1)} m</p>
                    <p><strong>Latitude:</strong> {currentFrame.latitude.toFixed(4)}</p>
                    <p><strong>Longitude:</strong> {currentFrame.longitude.toFixed(4)}</p>
                    <p><strong>Speed:</strong> {currentFrame.speed.toFixed(1)} m/s</p>
                    <p><strong>Battery:</strong> {currentFrame.battery}%</p>
                    <p><strong>AI Severity:</strong> {currentFrame.ai?.severity ?? "N/A"}</p>
                    <p><strong>AI Summary:</strong> {currentFrame.ai?.summary ?? "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="timeline-controls">
                <div className="playback-controls">
                  <button onClick={handlePlayPause} className="replay-button">
                    {isPlaying ? "❚❚ Pause" : "► Play"}
                  </button>
                  <div className="speed-control">
                    <label htmlFor="speed">Speed:</label>
                    <select
                      id="speed"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    >
                      {PLAYBACK_SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                  </div>
                </div>
                <div className="timeline-slider">
                  <input
                    type="range"
                    min="0"
                    max={history.length - 1}
                    value={currentIndex}
                    onChange={(e) => setCurrentIndex(Number(e.target.value))}
                    className="slider"
                  />
                  <div className="timeline-labels">
                    <span>{new Date(history[0]?.timestamp).toLocaleTimeString()}</span>
                    <span>{new Date(history[history.length - 1]?.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
