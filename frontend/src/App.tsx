import "./App.css";
import { useTelemetry } from "../hooks/useTelemetry";
import { useSmoothValue } from "../hooks/useSmoothValue";
import { ApiService } from "../services/ApiService";
import { useState, useEffect, useRef } from "react";
import { MapView } from "../components/MapView";
import { ControlPanel } from "../components/ControlPanel";
import { HistoryView } from "../components/HistoryView";
import { NotificationToast } from "../components/NotificationToast";
import { EventAlertPanel } from "../components/EventAlertPanel";
import { TimelineSlider } from "../components/TimelineSlider";
import { LogSelectionModal } from "../components/LogSelectionModal";
import type { Event } from "./types";
import {
  ALTITUDE_CONFIG,
  BATTERY_CONFIG,
  HOME_COORDS,
  LATENCY_THRESHOLDS,
  MINI_MAP_CONFIG,
  RISK_CLASSES,
  RISK_LABELS,
  RISK_SEVERITY_THRESHOLDS,
  RISK_THRESHOLDS,
  SPEED_CONFIG,
  TELEMETRY_INTERVALS,
  TIME_UNITS,
  TRAIL_CONFIG,
  UI_COPY_INTERVALS,
} from "../config/config";

type SystemStats = {
  tick: number;
  uptime: number;
  connected_clients: number;
};

const formatUptime = (ms: number) => {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / TIME_UNITS.msPerSecond);
  const hours = Math.floor(totalSeconds / TIME_UNITS.secondsPerHour);
  const minutes = Math.floor(
    (totalSeconds % TIME_UNITS.secondsPerHour) / TIME_UNITS.secondsPerMinute
  );
  const seconds = totalSeconds % TIME_UNITS.secondsPerMinute;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
};

function App() {
  // === THEME ===
  const savedTheme = localStorage.getItem("theme") || "dark";
  const loadBool = (key: string, fallback: boolean) => {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return val === "true";
  };
  const [theme, setTheme] = useState<"dark" | "light">(
    savedTheme as "dark" | "light"
  );

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // === UI STATE ===
  const [gpsDrift, setGpsDrift] = useState(loadBool("gpsDrift", false));
  const [follow, setFollow] = useState(loadBool("follow", true));
  const [mapVisible, setMapVisible] = useState(loadBool("mapVisible", true));

  const [showHistory, setShowHistory] = useState(false);
  const [showLogs, setShowLogs] = useState(loadBool("showLogs", false));
  const [freeze, setFreeze] = useState(loadBool("freeze", false));
  const [sidebarOpen, setSidebarOpen] = useState(loadBool("sidebarOpen", true));
  const [metrics, setMetrics] = useState<any | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [frozenData, setFrozenData] = useState<any | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);

  // Log selection state
  const [showLogModal, setShowLogModal] = useState(false);
  const [loadedLog, setLoadedLog] = useState<any[] | null>(null);



  const {
    data,
    connected,
    latencyMs,
    packetLoss,
    log,
    mps,
    unstableConnection,
    lastEvent,
  } = useTelemetry(freeze);

  // Test event state
  const [testEvent, setTestEvent] = useState<Event | null>(null);

  // Sound state
  const [muted, setMuted] = useState(loadBool("muted", false));
  const lastAlertTime = useRef<number>(0);

  // Combine real and test events
  const activeEvent = testEvent || lastEvent;

  const handleSimulateAlert = () => {
    setTestEvent({
      type: "Anomaly",
      message: "Simulated severe system anomaly detected!",
      severity: 95,
      tick: systemStats?.tick || 0,
    });
    // Clear test event after a delay so it doesn't stick forever if we want to re-trigger
    setTimeout(() => setTestEvent(null), 6000);
  };


  // === PERSIST UI STATE ===
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("follow", String(follow));
  }, [follow]);

  useEffect(() => {
    localStorage.setItem("mapVisible", String(mapVisible));
  }, [mapVisible]);



  useEffect(() => {
    localStorage.setItem("gpsDrift", String(gpsDrift));
  }, [gpsDrift]);

  useEffect(() => {
    localStorage.setItem("showLogs", String(showLogs));
  }, [showLogs]);

  useEffect(() => {
    localStorage.setItem("freeze", String(freeze));
  }, [freeze]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);



  const [historyFrame, setHistoryFrame] = useState<any | null>(null);

  // Determine which data to show
  // If historyFrame is selected (via slider), show it.
  // Else if replayMode is ON and we have replayData, use that.
  // Otherwise use frozenData (if freeze is manual) or live data.
  const currentData = historyFrame || (frozenData || data);

  // === FREEZE DATA ===
  useEffect(() => {
    if (freeze) {
      if (!frozenData && data) setFrozenData(data);
    } else {
      setFrozenData(null);
    }
  }, [freeze, data, frozenData]);

  // FINAL UI DATA
  const ui = currentData;

  // === SOUND ALERTS ===
  useEffect(() => {
    localStorage.setItem("muted", String(muted));
  }, [muted]);

  useEffect(() => {
    if (muted) return;

    const battery = ui?.battery ?? 100;
    const now = Date.now();

    // Play sound if battery is critical (below threshold) and we haven't played it recently (every 5s)
    if (battery <= BATTERY_CONFIG.soundAlertThreshold && battery > 0) {
      if (now - lastAlertTime.current > 5000) {
        import("./utils/SoundManager").then(({ SoundManager }) => {
          SoundManager.playAlert();
        });
        lastAlertTime.current = now;
      }
    }
  }, [ui?.battery, muted]);

  // === DRONE TRAIL ===
  useEffect(() => {
    if (!ui) return;
    if (ui.battery <= BATTERY_CONFIG.statusThresholds.offline) return;
    if (ui.latitude == null || ui.longitude == null) return;

    const point: [number, number] = [ui.latitude, ui.longitude];

    setTrail((prev) => {
      const updated = [...prev, point];
      if (updated.length > TRAIL_CONFIG.maxPoints) updated.shift();
      return updated;
    });
  }, [ui?.latitude, ui?.longitude, ui?.battery]);

  // === SMOOTH VALUES ===
  const smoothAltitude = useSmoothValue(ui?.altitude ?? 0);
  const smoothSpeed = useSmoothValue(ui?.speed ?? 0);
  const smoothBattery = useSmoothValue(ui?.battery ?? 0);

  // === BATTERY ===
  const batteryPercent = Math.max(
    BATTERY_CONFIG.clampMin,
    Math.min(BATTERY_CONFIG.clampMax, smoothBattery)
  );
  const batteryStrokeDashoffset =
    BATTERY_CONFIG.gaugeCircumference -
    (BATTERY_CONFIG.gaugeCircumference * batteryPercent) / 100;
  const batteryCritical = smoothBattery < BATTERY_CONFIG.criticalPercent;

  const batteryColor =
    smoothBattery > BATTERY_CONFIG.colorThresholds.healthy
      ? "#22c55e"
      : smoothBattery > BATTERY_CONFIG.colorThresholds.warning
        ? "#eab308"
        : "#f97373";

  const batteryStatus =
    smoothBattery <= BATTERY_CONFIG.statusThresholds.offline
      ? "Drone offline"
      : smoothBattery < BATTERY_CONFIG.statusThresholds.critical
        ? "CRITICAL battery"
        : smoothBattery < BATTERY_CONFIG.statusThresholds.low
          ? "Low battery"
          : smoothBattery < BATTERY_CONFIG.statusThresholds.caution
            ? "Battery getting low"
            : "Nominal";

  // === LATENCY ===
  const latencyText =
    latencyMs != null && Number.isFinite(latencyMs)
      ? `${Math.round(latencyMs)} ms`
      : "measuring…";

  const latencyLevel =
    latencyMs == null || !Number.isFinite(latencyMs)
      ? "neutral"
      : latencyMs < LATENCY_THRESHOLDS.goodMs
        ? "good"
        : latencyMs < LATENCY_THRESHOLDS.warnMs
          ? "warn"
          : "bad";

  // === RISK ===
  const riskSeverity = ui?.risk_level ?? 0;
  const riskIndex =
    riskSeverity >= RISK_SEVERITY_THRESHOLDS.high
      ? 3
      : riskSeverity >= RISK_SEVERITY_THRESHOLDS.medium
        ? 2
        : riskSeverity >= RISK_SEVERITY_THRESHOLDS.low
          ? 1
          : 0;
  const riskText = `${RISK_LABELS[riskIndex]} (${Math.round(riskSeverity)})`;
  const riskClass = RISK_CLASSES[riskIndex];
  const stabilityScore = Math.max(0, Math.min(100, 100 - riskSeverity));
  const stabilityHue = (stabilityScore / 100) * 120; // 120=green, 0=red
  const stabilityColor = `hsl(${stabilityHue}, 80%, 50%)`;

  const systemIntegrity = ui?.system_integrity ?? "Ok";
  const integrityClass =
    systemIntegrity === "Ok"
      ? "good"
      : systemIntegrity === "BatteryWarning"
        ? "bad"
        : "warn";

  const aiSignals = ui?.ai?.signals ?? [];
  const rawSpeed = ui?.speed ?? 0;
  const turbulenceLevel = Math.max(
    0,
    Math.min(1, Math.abs(rawSpeed - smoothSpeed) / SPEED_CONFIG.warning)
  );
  const speedColorHue = 180 - Math.min(1, turbulenceLevel * 1.4) * 160; // teal -> red
  const speedColor = `hsl(${speedColorHue}, 80%, 55%)`;
  const speedGlow = `hsla(${speedColorHue}, 85%, 60%, 0.35)`;

  const speedPercentNormalized = Math.max(
    0,
    Math.min(1, smoothSpeed / SPEED_CONFIG.maxDisplay)
  );
  const speedStrokeDashoffset =
    SPEED_CONFIG.gaugeCircumference -
    SPEED_CONFIG.gaugeCircumference * speedPercentNormalized;
  const speedNeedleRotation =
    speedPercentNormalized * SPEED_CONFIG.needleRangeDeg;
  const altitudeNormalized = Math.max(
    0,
    Math.min(1, smoothAltitude / ALTITUDE_CONFIG.barCeiling)
  );
  const altitudeFillPercent = altitudeNormalized * 100;
  const altitudeHue = 120 - altitudeNormalized * 120; // green to red
  const altitudeColor = `hsl(${altitudeHue}, 85%, 55%)`;
  const altitudeGlow = `hsla(${altitudeHue}, 90%, 60%, 0.45)`;

  const tickDisplay = systemStats ? `#${systemStats.tick}` : "—";
  const uptimeDisplay = systemStats ? formatUptime(systemStats.uptime) : "—";
  const clientsDisplay = systemStats
    ? `${systemStats.connected_clients}`
    : "—";

  // === BACKEND ACTIONS ===
  async function handleReset() {
    try {
      await ApiService.resetDrone();
    } catch (e) {
      console.error("Reset failed", e);
    }
  }

  async function handleShutdown() {
    if (!confirm("Are you sure you want to stop the backend server?")) return;
    try {
      await ApiService.shutdownServer();
      alert("Shutdown signal sent.");
    } catch (e) {
      console.error("Shutdown failed", e);
    }
  }

  async function fetchMetrics() {
    try {
      const json = await ApiService.getMetrics();
      setMetrics(json);
    } catch (e) {
      console.error("Metrics failed", e);
    }
  }

  const handleLoadLog = async (filename: string) => {
    try {
      const data = await ApiService.getLog(filename);
      setLoadedLog(data);
      setShowLogModal(false);
      // Automatically enter replay mode at start
      if (data.length > 0) {
        setHistoryFrame(data[0]);
      }
    } catch (e) {
      console.error("Failed to load log", e);
      alert("Failed to load log file");
    }
  };

  // LOG AUTOSCROLL
  const logRef = useRef<HTMLDivElement | null>(null);
  const sidebarLogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (showLogs && logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, showLogs]);
  useEffect(() => {
    if (sidebarLogRef.current) {
      sidebarLogRef.current.scrollTop = sidebarLogRef.current.scrollHeight;
    }
  }, [log]);

  // DRONE POSITION
  const droneLat = ui?.latitude ?? HOME_COORDS.lat;
  const droneLng = ui?.longitude ?? HOME_COORDS.lng;

  const latDiff = (ui?.latitude ?? HOME_COORDS.lat) - HOME_COORDS.lat;
  const lngDiff = (ui?.longitude ?? HOME_COORDS.lng) - HOME_COORDS.lng;
  const miniMapHalf = MINI_MAP_CONFIG.halfSize;
  const miniMapScale = MINI_MAP_CONFIG.scale;
  const miniMapPadding = MINI_MAP_CONFIG.innerPadding;
  const miniMapX = Math.max(
    -miniMapHalf + miniMapPadding,
    Math.min(miniMapHalf - miniMapPadding, lngDiff * miniMapScale)
  );
  const miniMapY = Math.max(
    -miniMapHalf + miniMapPadding,
    Math.min(miniMapHalf - miniMapPadding, latDiff * miniMapScale)
  );
  const miniMapDotStyle = {
    left: `${miniMapHalf + miniMapX}px`,
    top: `${miniMapHalf - miniMapY}px`,
  };

  // === LAST COMMAND ===
  const [lastCommand, setLastCommand] = useState<string>("--");

  // === ERROR STATE ===
  const [lastError, setLastError] = useState<string | null>(null);

  // === AUTOPILOT STATE ===
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState<string>("Offline");

  useEffect(() => {
    let cancelled = false;

    const fetchState = async () => {
      try {
        const json = await ApiService.getState();
        if (!cancelled) {
          setSystemStats({
            tick: json.metrics?.tick ?? 0,
            uptime: json.metrics?.uptime ?? 0,
            connected_clients: json.metrics?.connected_clients ?? 0,
          });
          // Check deeper structure based on backend response: json.status.autopilot_state.active
          if (json.status?.autopilot_state) {
            setAutopilotActive(json.status.autopilot_state.active);
            setAutopilotMode(json.status.autopilot_state.mode);
          }
          if (json.status?.last_command) {
            setLastCommand(json.status.last_command);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("State fetch failed", error);
        }
      }
    };

    fetchState();
    const interval = window.setInterval(
      fetchState,
      TELEMETRY_INTERVALS.statePollMs
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const toggleAutopilot = async () => {
    try {
      if (autopilotActive) {
        await ApiService.stopAutopilot();
      } else {
        await ApiService.startAutopilot();
      }
      // Optimistic update, real state comes from polling
      setAutopilotActive(!autopilotActive);
    } catch (e) {
      console.error("Failed to toggle autopilot", e);
    }
  };

  return (
    <div className={`app-root ${theme}`}>
      {ui?.safe_mode && <div className="safe-mode-border" />}
      {/* Toast moved to bottom for global context */}
      {showHistory && <HistoryView onClose={() => setShowHistory(false)} />}
      <LogSelectionModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSelectLog={handleLoadLog}
      />
      <div className="app-shell">
        {!connected && (
          <div className="connection-overlay">
            <div className="connection-overlay-card">
              <div className="overlay-title">Link lost</div>
              <p className="overlay-message">
                WebSocket disconnected. Reconnecting to telemetry stream…
              </p>
              <div className="overlay-actions">
                <button className="overlay-btn" onClick={() => window.location.reload()}>
                  Retry now
                </button>
              </div>
            </div>
          </div>
        )}
        {connected && ((ui?.battery ?? 100) < 10 || riskSeverity > 80) ? (
          <div className="critical-overlay">
            <div className="critical-card">
              <div className="critical-title">CRITICAL WARNING</div>
              <div className="critical-body">
                Battery {ui?.battery ?? "?"}% | Severity {Math.round(riskSeverity)}
              </div>
              <div className="critical-footer">Reduce load and land immediately</div>
            </div>
          </div>
        ) : null}
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "⟨" : "⟩"}
          </button>

          {/* LOGO */}
          <div className="sidebar-logo">
            <div className="logo-mark">FI</div>
            <div className="logo-text">
              <span className="logo-title">Fire Inspector OS</span>
              <span className="logo-subtitle">Command Center</span>
            </div>
          </div>


          {/* LINK STATUS */}
          <div className="sidebar-section">
            <div className="sidebar-label">Link status</div>
            <div
              className={
                connected ? "connection-pill connected" : "connection-pill down"
              }
            >
              <span className="dot" />
              <span>
                {connected ? "Connected to backend" : "Disconnected / retry"}
              </span>
            </div>
          </div>

          {/* SYSTEM STATUS PANEL */}
          <div className="sidebar-section">
            <div className="sidebar-label">System status</div>
            <div className="status-panel">
              <div className="status-card">
                <span className="status-card-value">{tickDisplay}</span>
                <span className="status-card-label">Live Tick</span>
              </div>
              {historyFrame && (
                <div className="status-card" style={{ borderColor: '#eab308' }}>
                  <span className="status-card-value" style={{ color: '#eab308' }}>
                    #{historyFrame.timestamp}
                  </span>
                  <span className="status-card-label">Replay Tick</span>
                </div>
              )}
              <div className="status-card">
                <span className="status-card-value">{uptimeDisplay}</span>
                <span className="status-card-label">Uptime</span>
              </div>
              <div className="status-card">
                <span className="status-card-value">{clientsDisplay}</span>
                <span className="status-card-label">Clients</span>
              </div>
              <div className="status-card">
                <span className={`status-card-value ${integrityClass}`}>{systemIntegrity.replace("Warning", "")}</span>
                <span className="status-card-label">Integrity</span>
              </div>
            </div>
          </div>

          {/* LIVE METRICS */}
          <div className="sidebar-section">
            <div className="sidebar-label">Live link</div>

            <div className="sidebar-metrics">
              <div className={`pill pill-${latencyLevel}`}>
                <span className="pill-label">Latency</span>
                <span className="pill-value">{latencyText}</span>
              </div>

              <div className="pill pill-neutral">
                <span className="pill-label">MPS</span>
                <span className="pill-value">{mps.toFixed(1)}</span>
              </div>

              {packetLoss && (
                <div className="pill pill-bad">
                  <span className="pill-label">Stream</span>
                  <span className="pill-value">Packet loss</span>
                </div>
              )}

              {unstableConnection && (
                <div className="pill pill-warn">
                  <span className="pill-label">Link</span>
                  <span className="pill-value">Unstable</span>
                </div>
              )}
            </div>
          </div>

          {/* STATUS LOGS PANEL */}
          <div className="sidebar-section">
            <div className="sidebar-label">Status logs</div>
            <div className="status-log-panel">
              <div className="status-log-window" ref={sidebarLogRef}>
                {log.length === 0 ? (
                  <div className="status-log-empty">Awaiting events…</div>
                ) : (
                  log.map((entry, idx) => (
                    <div key={idx} className="status-log-entry">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* EXTRA BUTTONS */}
          <div className="sidebar-section">
            <div className="sidebar-label">Controls</div>

            <div className="sidebar-actions">

              <button className="ctrl-btn primary" onClick={handleReset}>
                ⟳ Reset drone
              </button>

              <button className="ctrl-btn secondary" style={{ borderColor: '#eab308', color: '#eab308' }} onClick={handleSimulateAlert}>
                ⚠️ Test Alert
              </button>

              <button className="ctrl-btn primary" onClick={fetchMetrics}>
                📊 Refresh metrics
              </button>

              <button className="ctrl-btn secondary" onClick={() => setShowLogModal(true)}>
                📂 Load Log
              </button>

              <button
                className="ctrl-btn secondary"
                onClick={() => setFreeze((f) => !f)}
              >
                {freeze ? "▶ Resume live" : "⏸ Freeze telemetry"}
              </button>

              <button
                className="ctrl-btn ghost"
                onClick={() => setShowLogs((s) => !s)}
              >
                {showLogs ? "Hide logs" : "Show logs"}
              </button>

              <button className="ctrl-btn ghost" onClick={toggleTheme}>
                {theme === "dark" ? "🔆 Light HUD" : "🌑 Dark HUD"}
              </button>

            </div>
          </div>

        </aside>

        {/* MAIN */}
        <div className="main">

          {/* TOPBAR */}
          <header className="topbar">
            <div>
              <h1 className="topbar-title">Mission dashboard</h1>
              <p className="topbar-subtitle">
                Yerevan sector · Telemetry & Risk Intelligence
              </p>
            </div>

            <div className="topbar-badges">
              <div className="topbar-badge">
                <span className="badge-label">Mode</span>
                <span className="badge-value">{freeze ? "Paused" : "Live"}</span>
              </div>

              <div className={`topbar-badge ${riskClass}`}>
                <span className="badge-label">Risk</span>
                <span className="badge-value">{riskText}</span>
                <span className={`risk-led risk-led-${riskClass}`} />
              </div>
            </div>
          </header>

          {/* EMPTY STATE */}
          {!ui ? (
            <div className="empty-state">
              <div className="empty-orbit">
                <div className="empty-dot" />
              </div>
              <p>Waiting for telemetry…</p>
            </div>
          ) : (
            <main className="main-grid">

              {/* HERO CARD */}
              <section className="card card-hero">
                <div className="hero-left">
                  <div className="hero-label">Power envelope</div>

                  <div className={`hero-battery ${batteryCritical ? "battery-critical" : ""}`}>

                    <svg viewBox="0 0 160 160" className="battery-gauge">
                      <circle className="battery-track" cx="80" cy="80" r="70" />
                      <circle
                        className="battery-progress"
                        cx="80"
                        cy="80"
                        r="70"
                        style={{
                          strokeDasharray: BATTERY_CONFIG.gaugeCircumference,
                          strokeDashoffset: batteryStrokeDashoffset,
                          stroke: batteryColor,
                        }}
                      />
                      <text
                        x="50%"
                        y="50%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        className="battery-text"
                      >
                        {batteryPercent.toFixed(0)}%
                      </text>
                    </svg>

                    <div className="hero-battery-info">
                      <div className="hero-status-label">
                        Battery status — {batteryStatus}
                      </div>
                      <p className="hero-status-desc">
                        Updated every {UI_COPY_INTERVALS.telemetryRefreshMs}ms · Linked to risk model
                      </p>

                      <div className="hero-tags">
                        <span className="tag">
                          Alt {smoothAltitude.toFixed(1)} m
                        </span>
                        <span className="tag">
                          Spd {smoothSpeed.toFixed(1)} m/s
                        </span>
                        <span className="tag">
                          Tick #{ui.timestamp ?? "—"}
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="altitude-bar-block">
                    <div className="altitude-bar-header">
                      <span className="hero-label">Altitude channel</span>
                      <span className="altitude-bar-reading">
                        {smoothAltitude.toFixed(1)} m
                      </span>
                    </div>
                    <div className="altitude-bar-wrapper">
                      <div className="altitude-bar-track">
                        <div
                          className="altitude-bar-fill"
                          style={{
                            height: `${altitudeFillPercent}%`,
                            background: `linear-gradient(180deg, ${altitudeColor}, var(--altitude-fade))`,
                            boxShadow: `0 0 24px ${altitudeGlow}`,
                          }}
                        />
                        <div
                          className="altitude-indicator-dot"
                          style={{
                            top: `${Math.min(
                              altitudeFillPercent,
                              ALTITUDE_CONFIG.indicatorMaxPercent
                            )}%`,
                          }}
                        >
                          <span />
                        </div>
                      </div>
                      <div className="altitude-bar-scale">
                        <span>{ALTITUDE_CONFIG.barCeiling} m ceiling</span>
                        <span>Ground</span>
                      </div>
                    </div>
                  </div>

                  <div className="mini-map">
                    <div className="mini-map-header">
                      <span>Mini map</span>
                      <span className={`mini-map-status ${gpsDrift ? "on" : "off"}`}>
                        {gpsDrift ? "Drift mode" : "Stable"}
                      </span>
                    </div>
                    <div className="mini-map-grid">
                      <div className="mini-map-dot" style={miniMapDotStyle} />
                    </div>
                    <div className="mini-map-legend">
                      Visual tracker for simulated GPS drift
                    </div>
                  </div>

                </div>

                <div className="hero-speed">
                  <div className="hero-label">Velocity gauge</div>
                  <div
                    className="speed-gauge-wrapper"
                    style={{ filter: `drop-shadow(0 8px 20px ${speedGlow})` }}
                  >
                    <svg viewBox="0 0 160 160" className="speed-gauge">
                      <circle className="speed-track" cx="80" cy="80" r="70" />
                      <circle
                        className="speed-progress"
                        cx="80"
                        cy="80"
                        r="70"
                        style={{
                          strokeDasharray: SPEED_CONFIG.gaugeCircumference,
                          strokeDashoffset: speedStrokeDashoffset,
                          stroke: speedColor,
                          filter: `drop-shadow(0 0 16px ${speedGlow})`,
                        }}
                      />
                      <circle className="speed-orbit" cx="80" cy="80" r="58" />
                    </svg>
                    <div
                      className="speed-needle"
                      style={{
                        transform: `rotate(${speedNeedleRotation}deg)`,
                        background: `linear-gradient(180deg, ${speedColor}, rgba(59, 130, 246, 0))`,
                        filter: `drop-shadow(0 0 8px ${speedGlow})`,
                      }}
                    />
                    <div className="speed-gauge-center">
                      <div className="speed-value">{smoothSpeed.toFixed(1)}</div>
                      <div className="speed-unit">m/s</div>
                    </div>
                  </div>
                  <p className="hero-status-desc">
                    Animated wind-coupled gauge following live speed telemetry
                  </p>
                </div>


                <div className="hero-right">

                  <div className="stat-block">
                    <span className="stat-label">Altitude</span>
                    <span className="stat-value">
                      {smoothAltitude.toFixed(1)} m
                    </span>
                    <span className="stat-footnote">
                      Ceiling {ALTITUDE_CONFIG.statCeiling} m · Low &lt; {ALTITUDE_CONFIG.lowBand}
                    </span>

                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill alt"
                        style={{
                          width: `${Math.min(
                            100,
                            (smoothAltitude / ALTITUDE_CONFIG.statCeiling) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="stat-block">
                    <span className="stat-label">Speed</span>
                    <span className="stat-value">
                      {smoothSpeed.toFixed(1)} m/s
                    </span>
                    <span className="stat-footnote">
                      Warning &gt; {SPEED_CONFIG.warning} m/s · Opt &lt; {SPEED_CONFIG.optimal}
                    </span>

                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill spd"
                        style={{
                          width: `${Math.min(
                            100,
                            (smoothSpeed / SPEED_CONFIG.statBarMax) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="stat-block">
                    <span className="stat-label">Stability</span>
                    <span className="stat-value">
                      {stabilityScore.toFixed(0)} / 100
                    </span>
                    <span className="stat-footnote">
                      Green = nominal · Red = critical
                    </span>

                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill stability"
                        style={{
                          width: `${stabilityScore}%`,
                          background: `linear-gradient(90deg, ${stabilityColor}, #ef4444)`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="stat-block">
                    <span className="stat-label">Stream mode</span>
                    <span className="stat-value">
                      {freeze ? "PAUSED" : "LIVE"}
                    </span>
                    <span className="stat-footnote">
                      Freeze to inspect packet state
                    </span>
                  </div>

                </div>
              </section>

              {/* MAP */}
              {mapVisible && (
                <section className="card card-map">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Live positioning</div>
                      <div className="card-subtitle">Yerevan sector</div>
                    </div>

                    <div className="coords-pill">
                      <span>Lat {droneLat.toFixed(4)}</span>
                      <span>Lng {droneLng.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="card-body map-body">
                    <MapView
                      lat={droneLat}
                      lng={droneLng}
                      trail={trail}
                      battery={ui.battery}
                      follow={follow}
                      risk={riskIndex}
                      altitude={smoothAltitude}
                      gpsDrift={gpsDrift}
                    />
                  </div>
                </section>
              )}

              {/* RISK */}
              <section className="card card-risk">
                <div className="card-header">
                  <div>
                    <div className="card-title">Risk analysis</div>
                    <div className="card-subtitle">InspectorAI Engine</div>
                  </div>
                  <div className={`risk-badge ${riskClass}`}>
                    {riskText}
                  </div>
                </div>

                <div className="card-body">
                  <div className="ai-panel">
                    <div className="ai-chip">
                      <span className="ai-chip-label">Battery</span>
                      <span className="ai-chip-value">
                        {ui?.battery ?? "—"}%
                      </span>
                    </div>
                    <div className="ai-chip">
                      <span className="ai-chip-label">Stability</span>
                      <span className="ai-chip-value">
                        {stabilityScore.toFixed(0)} / 100
                      </span>
                    </div>
                    <div className="ai-chip">
                      <span className="ai-chip-label">Severity</span>
                      <span className="ai-chip-value">
                        {riskSeverity.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <p className="risk-text">
                    InspectorAI evaluates altitude, speed, battery and
                    link quality every {UI_COPY_INTERVALS.telemetryRefreshMs}ms.
                  </p>
                  <ul className="risk-list">
                    <li>🟥 HIGH — battery &lt; {RISK_THRESHOLDS.batteryCriticalPercent}% or unstable link</li>
                    <li>🟧 MEDIUM — speed &gt; {RISK_THRESHOLDS.speedMediumMs} m/s</li>
                    <li>🟩 LOW — altitude &gt; {RISK_THRESHOLDS.altitudeLowMeters} m</li>
                    <li>🟦 SAFE — nominal envelope</li>
                  </ul>

                  {aiSignals.length > 0 && (
                    <div className="ai-signal-grid">
                      {aiSignals.slice(0, 4).map((s: any, idx: number) => (
                        <div key={idx} className="ai-signal-card">
                          <div className="ai-signal-header">
                            <span className="ai-signal-source">{s.source}</span>
                            <span className="ai-signal-sev">{s.severity}</span>
                          </div>
                          <div className="ai-signal-detail">{s.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* SYSTEM METRICS */}
              <section className="card card-system">
                <div className="card-header">
                  <div>
                    <div className="card-title">System metrics</div>
                    <div className="card-subtitle">
                      Aggregated from backend
                    </div>
                  </div>
                </div>

                <div className="card-body system-body">
                  {metrics ? (
                    <div className="system-grid">
                      <div className="system-item">
                        <span className="system-label">Tick</span>
                        <span className="system-value">{metrics.tick}</span>
                      </div>

                      <div className="system-item">
                        <span className="system-label">Clients</span>
                        <span className="system-value">{metrics.clients}</span>
                      </div>

                      <div className="system-item">
                        <span className="system-label">Avg speed</span>
                        <span className="system-value">
                          {metrics.avg_speed.toFixed(2)} m/s
                        </span>
                      </div>

                      <div className="system-item">
                        <span className="system-label">Avg altitude</span>
                        <span className="system-value">
                          {metrics.avg_altitude.toFixed(2)} m
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="system-placeholder">
                      No metrics loaded — press Refresh.
                    </div>
                  )}
                </div>
              </section>

              {/* CONTROLS */}
              <section className="card card-controls">
                <div className="card-header">
                  <div>
                    <div className="card-title">Mission Control</div>
                    <div className="card-subtitle">
                      Manual overrides
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <ControlPanel
                    connected={connected}
                    follow={follow}
                    mapVisible={mapVisible}
                    onToggleFollow={() => setFollow((v) => !v)}
                    onToggleMap={() => setMapVisible((v) => !v)}
                    onResetPath={() => setTrail([])}
                    onClearWarnings={() => console.log("CLEAR WARNINGS TODO")}
                    onReconnect={() => window.location.reload()}
                    onViewHistory={() => setShowHistory(true)}
                    gpsDrift={gpsDrift}
                    onToggleGpsDrift={() => setGpsDrift((v) => !v)}
                    muted={muted}
                    onToggleMute={() => setMuted((v) => !v)}
                    onGoLive={() => {
                      setHistoryFrame(null);
                      setLoadedLog(null);
                    }}
                    showGoLive={historyFrame !== null || loadedLog !== null}
                    onShutdown={handleShutdown}
                    gridMode={true}
                    autopilotActive={autopilotActive}
                    onToggleAutopilot={toggleAutopilot}
                    lastCommand={lastCommand}
                    autopilotMode={autopilotMode}
                    onError={(msg) => setLastError(msg)}
                  />
                </div>
              </section>

              {/* LOGS */}
              {showLogs && (
                <section className="card card-logs">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Telemetry log</div>
                      <div className="card-subtitle">
                        Last {log.length} packets
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="log-window" ref={logRef}>
                      {log.map((line, i) => (
                        <div key={i} className="log-line">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </main>
          )}
        </div>

        {/* RIGHT SIDEBAR - EVENT ALERTS */}
        <aside className="sidebar-right">
          <EventAlertPanel />
        </aside>

      </div>
      {/* REPLAY SLIDER */}
      {/* TIMELINE SLIDER */}
      <TimelineSlider
        onFrameSelect={setHistoryFrame}
        externalHistory={loadedLog}
        onGoLive={() => {
          setHistoryFrame(null);
          setLoadedLog(null);
        }}
      />
      <NotificationToast
        event={activeEvent}
        message={lastError}
        onDismiss={() => {
          setTestEvent(null);
          setLastError(null);
        }}
      />
    </div >
  );
}

export default App;
