import { useEffect, useState } from "react";
import { TELEMETRY_INTERVALS, TELEMETRY_LIMITS } from "../config/config";
import type { Event } from "../src/types";

export type SystemIntegrity =
  "Ok" | "BatteryWarning" | "SpeedWarning" | "AltitudeWarning";

export interface Telemetry {
  altitude: number;
  speed: number;
  battery: number;
  timestamp: number;
  risk_level: number;
  system_integrity: SystemIntegrity;
  ai?: {
    severity: number;
    summary: string;
    signals?: Array<{
      severity: number;
      score: number;
      source: string;
      detail: string;
    }>;
    battery_risk?: number;
    stability?: number;
    anomaly?: string;
  };
  latitude: number;
  longitude: number;
  safe_mode: boolean;
}

export function useTelemetry(paused = false) {
  const [data, setData] = useState<Telemetry | null>(null);
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [packetLoss, setPacketLoss] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [mps, setMps] = useState(0);
  const [lastEvent, setLastEvent] = useState<Event | null>(null);

  // NEW: detect unstable reconnection loops
  const [unstableConnection, setUnstableConnection] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let pingInterval: number | null = null;
    let lastTick: number | null = null;

    // message-per-second counter
    let msgCount = 0;
    const msgRateTimer = setInterval(() => {
      setMps(msgCount);
      msgCount = 0;
    }, TELEMETRY_INTERVALS.messageRateWindowMs);

    // reconnection attempts counter
    let reconnectAttempts = 0;

    // Build WS URL
    const wsUrl =
      (import.meta as any).env.VITE_BACKEND_WS_URL ??
      (() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.hostname || "127.0.0.1";

        const port =
          (import.meta as any).env.VITE_BACKEND_WS_PORT ??
          (window.location.port && window.location.port !== "5173"
            ? window.location.port
            : "8080");

        return `${protocol}://${host}:${port}/api/v0.0.5/ws`;
      })();

    // CONNECT FUNCTION
    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setConnected(true);

        reconnectAttempts = 0;
        setUnstableConnection(false);

        // start ping loop
        pingInterval = window.setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            const now = performance.now();
            socket.send(JSON.stringify({ type: "ping", t: now }));
          }
        }, TELEMETRY_INTERVALS.pingMs);
      };

      socket.onclose = () => {
        setConnected(false);

        if (pingInterval) clearInterval(pingInterval);

        reconnectAttempts++;

        // If multiple reconnects in a row → unstable
        if (reconnectAttempts >= TELEMETRY_INTERVALS.unstableAfterAttempts) {
          setUnstableConnection(true);
        }

        if (!reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, TELEMETRY_INTERVALS.reconnectDelayMs);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);

          // PONG — latency measurement
          if (json.type === "pong") {
            const now = performance.now();
            const delta = typeof json.t === "number" ? now - json.t : NaN;
            setLatencyMs(Number.isFinite(delta) ? delta : null);
            return;
          }

          // PING — server heartbeat check
          if (json.type === "ping") {
            socket?.send(JSON.stringify({ type: "pong", t: json.t }));
            return;
          }

          // EVENT STREAM
          if (json.event) {
            setLastEvent(json.event);
            return;
          }

          // TELEMETRY STREAM
          if (json.telemetry) {
            msgCount++;

            const tick = json.telemetry.timestamp;

            // detect packet loss
            if (
              lastTick !== null &&
              tick !== lastTick + TELEMETRY_LIMITS.expectedTickStep
            ) {
              setPacketLoss(true);
            } else {
              setPacketLoss(false);
            }
            lastTick = tick;

            // [ANTIGRAVITY] Fix: Handle potential object structure for battery
            let batteryVal = json.telemetry.battery;

            // Fallback: Check for root-level voltage if battery is 0/missing
            let voltage = (typeof batteryVal === 'object' && batteryVal !== null) ? batteryVal.voltage : json.telemetry.voltage; // Check root voltage too

            if (voltage !== undefined) {
              // Assume 4S LiPo: 12.0V (0%) to 16.8V (100%)
              // Lowered minV to 12.0V to account for voltage sag/reserve capacity
              const minV = 12.0;
              const maxV = 16.8;

              const pct = ((voltage - minV) / (maxV - minV)) * 100;
              batteryVal = Math.round(Math.max(0, Math.min(100, pct)));
            } else if (typeof batteryVal === 'object') {
              batteryVal = 0; // Object but no voltage?
            }

            if (!paused) {
              setData({
                ...json.telemetry,
                battery: batteryVal,
                risk_level: json.risk_level,
                system_integrity: json.system_integrity ?? "Ok",
              });

              setLog((prev) => {
                const entry =
                  `[${new Date().toLocaleTimeString()}] tick=${tick} ` +
                  `alt=${json.telemetry.altitude.toFixed(1)} ` +
                  `speed=${json.telemetry.speed.toFixed(1)} ` +
                  `batt=${batteryVal}%`;

                const updated = [...prev, entry];
                return updated.slice(-TELEMETRY_LIMITS.logRetention);
              });
            }
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      };
    };

    connect();

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(msgRateTimer);
      socket?.close();
    };
  }, []);

  return {
    data,
    connected,
    latencyMs,
    packetLoss,
    log,
    mps,
    unstableConnection,
    lastEvent,
  };
}
