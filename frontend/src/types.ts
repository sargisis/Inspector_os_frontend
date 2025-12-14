export type EventType = "LowBattery" | "HighAltitude" | "Instability" | "Anomaly" | "Override";

export interface Event {
    type: EventType;
    message: string;
    severity: number;
    tick: number;
}
