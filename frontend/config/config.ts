export const HOME_COORDS = { lat: 40.1833, lng: 44.5126 };

export const API_HTTP_URL = "http://127.0.0.1:8080";

export const TRAIL_CONFIG = {
  maxPoints: 100,
  minPointsToRender: 2,
};

export const SMOOTH_VALUE_CONFIG = {
  easingSpeed: 0.15,
  settleThreshold: 0.01,
};

export const TELEMETRY_INTERVALS = {
  messageRateWindowMs: 1000,
  pingMs: 3000,
  reconnectDelayMs: 3000,
  unstableAfterAttempts: 3,
  statePollMs: 5000,
};

export const TELEMETRY_LIMITS = {
  logRetention: 20,
  expectedTickStep: 1,
};

export const BATTERY_CONFIG = {
  clampMin: 0,
  clampMax: 100,
  gaugeCircumference: 440,
  criticalPercent: 15,
  colorThresholds: {
    healthy: 60,
    warning: 30,
  },
  statusThresholds: {
    offline: 0,
    critical: 10,
    low: 25,
    caution: 40,
  },
  soundAlertThreshold: 5,
};

export const LATENCY_THRESHOLDS = {
  goodMs: 40,
  warnMs: 100,
};

export const SPEED_CONFIG = {
  maxDisplay: 70,
  gaugeCircumference: 440,
  needleRangeDeg: 360,
  statBarMax: 60,
  warning: 45,
  optimal: 35,
};

export const ALTITUDE_CONFIG = {
  barCeiling: 150,
  statCeiling: 120,
  lowBand: 10,
  indicatorMaxPercent: 99,
  riskLowBand: 90,
};

export const MINI_MAP_CONFIG = {
  halfSize: 45,
  innerPadding: 6,
  scale: 90000,
};

export const MAP_VIEW_CONFIG = {
  flyToDurationSec: 0.6,
  driftMagnitude: 0.0001,
  zoomByAltitude: [
    { maxAltitude: 20, zoom: 17 },
    { maxAltitude: 50, zoom: 16 },
    { maxAltitude: 100, zoom: 15 },
    { maxAltitude: Number.POSITIVE_INFINITY, zoom: 14 },
  ],
  trailStyle: {
    weight: 4,
    opacity: 0.85,
    colors: ["#38bdf8", "#32ff7e", "#ffb347", "#ff4d4d"],
  },
};

export const RISK_LABELS = ["SAFE", "LOW", "MEDIUM", "HIGH"] as const;
export const RISK_CLASSES = ["safe", "low", "medium", "high"] as const;
export const RISK_SEVERITY_THRESHOLDS = {
  low: 25,
  medium: 60,
  high: 85,
};

export const RISK_THRESHOLDS = {
  batteryCriticalPercent: 10,
  speedMediumMs: 45,
  altitudeLowMeters: 90,
};

export const DRONE_MARKER_CONFIG = {
  scaleDivisor: 100,
  iconSize: 32,
  anchor: 16,
  transformDurationMs: 200,
};

export const UI_COPY_INTERVALS = {
  telemetryRefreshMs: 500,
};

export const TIME_UNITS = {
  msPerSecond: 1000,
  secondsPerHour: 3600,
  secondsPerMinute: 60,
};
