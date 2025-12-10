export type EventType = "LowBattery" | "HighAltitude" | "Instability" | "Anomaly";

export interface Event {
    type: EventType;
    message: string;
    severity: number;
    tick: number;
}
