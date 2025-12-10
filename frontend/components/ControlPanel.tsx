import "./ControlPanel.css";
import { ApiService } from "../services/ApiService";

type Props = {
  connected: boolean;
  follow: boolean;
  mapVisible: boolean;
  gpsDrift: boolean;
  onToggleFollow: () => void;
  onToggleMap: () => void;
  onResetPath: () => void;
  onToggleGpsDrift: () => void; // NEW
  onClearWarnings: () => void;
  onReconnect: () => void;
  onViewHistory: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onGoLive: () => void;
  showGoLive: boolean; // NEW
  onShutdown: () => void;
};

export function ControlPanel({
  connected,
  follow,
  mapVisible,
  gpsDrift,
  onToggleFollow,
  onToggleGpsDrift,
  onToggleMap,
  onResetPath,
  onClearWarnings,
  onReconnect,
  onViewHistory,
  muted,
  onToggleMute,
  onGoLive,
  showGoLive,
  onShutdown,
}: Props) {

  return (
    <div className="control-panel">
      <h3 className="control-title">Controls</h3>

      <button
        className={`ctrl-btn ${connected ? "ok" : "bad"}`}
        onClick={onReconnect}
      >
        {connected ? "🔌 Connected" : "⚠️ Reconnect"}
      </button>

      <button
        className={`ctrl-btn ${follow ? "ok" : "neutral"}`}
        onClick={onToggleFollow}
      >
        {follow ? "🛰 Follow: ON" : "🛰 Follow: OFF"}
      </button>

      <button className="ctrl-btn neutral" onClick={onResetPath}>
        🧹 Reset Path
      </button>

      <button className="ctrl-btn neutral" onClick={onClearWarnings}>
        ⚡ Clear Warnings
      </button>

      <button className="ctrl-btn neutral" onClick={onViewHistory}>
        📜 View History
      </button>

      {showGoLive && (
        <button className="ctrl-btn active" onClick={onGoLive}>
          🔴 Go Live
        </button>
      )}

      <button
        className="ctrl-btn ghost"
        onClick={onToggleGpsDrift}
      >
        GPS Drift: {gpsDrift ? "ON" : "OFF"}
      </button>

      <button
        className={`ctrl-btn ${mapVisible ? "ok" : "neutral"}`}
        onClick={onToggleMap}
      >
        🗺 Map: {mapVisible ? "Visible" : "Hidden"}
      </button>

      <button
        className="ctrl-btn ghost"
        onClick={onToggleMute}
      >
        {muted ? "🔇 Unmute" : "🔊 Mute Alerts"}
      </button>

      <button
        className="ctrl-btn warning"
        onClick={async () => {
          try {
            await ApiService.triggerEvent();
          } catch (e) {
            console.error("Failed to trigger event", e);
          }
        }}
      >
        ⚡ Trigger Cloud Event
      </button>

      <button className="ctrl-btn critical" onClick={onShutdown}>
        🛑 Shutdown Server
      </button>
    </div>
  );
}
