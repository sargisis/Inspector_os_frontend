import "./ControlPanel.css";
import React, { useState } from "react";
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
  gridMode?: boolean;
  autopilotActive: boolean;
  onToggleAutopilot: () => void;
  lastCommand?: any;
  autopilotMode?: string;
  onError?: (msg: string) => void;
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
  gridMode = false,
  autopilotActive,
  onToggleAutopilot,
  lastCommand = "--",
  autopilotMode = "Offline",
  onError,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleCommand = async (actionName: string, fn: () => Promise<void>) => {
    if (loadingAction) return;
    setLoadingAction(actionName);
    try {
      await fn();
    } catch (e: any) {
      console.error(`${actionName} failed`, e);
      if (onError) onError(`${actionName} failed: ${e.message || "Unknown error"}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const isBusy = loadingAction !== null;

  // KEYBOARD SHORTCUTS
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input focused (e.g. altitude slider if it was precise input) or generic inputs
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (!connected || isBusy) return;

      switch (e.key.toLowerCase()) {
        case "t":
          handleCommand("takeoff", () => ApiService.takeoff());
          break;
        case "l":
          handleCommand("land", () => ApiService.land());
          break;
        case "h":
        case " ": // Spacebar
          handleCommand("hold", () => ApiService.hold());
          e.preventDefault(); // prevent scroll
          break;
        case "r":
          handleCommand("return", () => ApiService.returnToHome());
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [connected, isBusy, loadingAction]); // loadingAction dependency crucial for closure freshness if not using ref

  return (
    <div className={`control-panel ${gridMode ? "grid-mode" : ""}`}>
      <h3 className="control-title">Controls</h3>

      <button
        className={`ctrl-btn ${connected ? "ok" : "bad"}`}
        onClick={onReconnect}
        disabled={isBusy}
      >
        {connected ? "🔌 Connected" : "⚠️ Reconnect"}
      </button>

      <button
        className={`ctrl-btn ${autopilotActive ? "active" : "neutral"}`}
        onClick={onToggleAutopilot}
        disabled={!connected || isBusy}
      >
        {autopilotActive ? `🤖 Auto: ${autopilotMode}` : "🤖 Autopilot: OFF"}
      </button>

      <button
        className={`ctrl-btn ${follow ? "ok" : "neutral"}`}
        onClick={onToggleFollow}
        disabled={!connected || isBusy}
      >
        {follow ? "🛰 Follow: ON" : "🛰 Follow: OFF"}
      </button>

      <button className="ctrl-btn neutral" onClick={onResetPath} disabled={!connected || isBusy}>
        🧹 Reset Path
      </button>

      <button className="ctrl-btn neutral" onClick={onClearWarnings} disabled={!connected || isBusy}>
        ⚡ Clear Warnings
      </button>

      <button className="ctrl-btn neutral" onClick={onViewHistory} disabled={isBusy}>
        📜 View History
      </button>

      <div style={{ width: '100%', gridColumn: '1 / -1', marginTop: '8px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="control-title" style={{ margin: 0 }}>Flight Control</h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          LAST: {(typeof lastCommand === 'string' ? lastCommand : JSON.stringify(lastCommand)).toUpperCase()}
        </span>
      </div>

      <button
        className="ctrl-btn ok"
        disabled={!connected || isBusy}
        onClick={() => handleCommand("takeoff", () => ApiService.takeoff())}
        title="Shortcut: T"
      >
        {loadingAction === "takeoff" ? "⏳ Taking off..." : "🛫 Takeoff [T]"}
      </button>

      <button
        className="ctrl-btn warning"
        disabled={!connected || isBusy}
        onClick={() => handleCommand("land", () => ApiService.land())}
        title="Shortcut: L"
      >
        {loadingAction === "land" ? "⏳ Landing..." : "🛬 Land [L]"}
      </button>

      <button
        className="ctrl-btn neutral"
        disabled={!connected || isBusy}
        onClick={() => handleCommand("hold", () => ApiService.hold())}
        title="Shortcut: H or Space"
      >
        {loadingAction === "hold" ? "⏳ Holding..." : "✋ Hold [H]"}
      </button>

      <button
        className="ctrl-btn primary"
        disabled={!connected || isBusy}
        onClick={() => handleCommand("return", () => ApiService.returnToHome())}
        title="Shortcut: R"
      >
        {loadingAction === "return" ? "⏳ Returning..." : "🏠 Return [R]"}
      </button>

      <div className="sidebar-section" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="sidebar-label" style={{ margin: 0 }}>Target Altitude</span>
          <span className="sidebar-label" style={{ margin: 0, color: 'var(--text)' }}>
            <span id="alt-val-display">--</span> m
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={150}
          step="5"
          defaultValue="0"
          className="altitude-slider"
          disabled={!connected || isBusy}
          onChange={(e) => {
            const val = Number(e.target.value);
            const display = document.getElementById('alt-val-display');
            if (display) display.innerText = val.toString();
            ApiService.setAltitude(val).catch(console.error);
          }}
        />
      </div>

      <div style={{ width: '100%', gridColumn: '1 / -1', marginTop: '8px', marginBottom: '4px' }}>
        <h3 className="control-title">System</h3>
      </div>

      {showGoLive && (
        <button className="ctrl-btn active" onClick={onGoLive} disabled={isBusy}>
          🔴 Go Live
        </button>
      )}

      <button
        className="ctrl-btn ghost"
        onClick={onToggleGpsDrift}
        disabled={!connected || isBusy}
      >
        GPS Drift: {gpsDrift ? "ON" : "OFF"}
      </button>

      <button
        className={`ctrl-btn ${mapVisible ? "ok" : "neutral"}`}
        onClick={onToggleMap}
        disabled={isBusy}
      >
        🗺 Map: {mapVisible ? "Visible" : "Hidden"}
      </button>

      <button
        className="ctrl-btn ghost"
        onClick={onToggleMute}
        disabled={isBusy}
      >
        {muted ? "🔇 Unmute" : "🔊 Mute Alerts"}
      </button>

      <button
        className="ctrl-btn warning"
        disabled={!connected || isBusy}
        onClick={() => handleCommand("trigger", () => ApiService.triggerEvent())}
      >
        {loadingAction === "trigger" ? "⚡ Triggering..." : "⚡ Trigger Cloud Event"}
      </button>

      <button className="ctrl-btn critical" onClick={onShutdown} disabled={!connected}>
        🛑 Shutdown Server
      </button>
    </div>
  );
}
