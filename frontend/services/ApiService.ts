import { API_HTTP_URL } from "../config/config";


export const ApiService = {
    // === LOGS ===
    async listLogs(): Promise<string[]> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/logs`);
        if (!res.ok) throw new Error(`Failed to list logs: ${res.statusText}`);
        return res.json();
    },

    async getLog(filename: string): Promise<any[]> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/logs/${filename}`);
        if (!res.ok) throw new Error(`Failed to fetch log: ${res.statusText}`);
        return res.json();
    },

    // === REPLAY ===
    // Note: WebSocket upgrade routes usually handled by creating a new WebSocket(), not fetch
    getReplayWsUrl(): string {
        return `${API_HTTP_URL.replace("http", "ws")}/api/v0.0.5/replay`;
    },

    async startReplay(): Promise<void> {
        // Some implementations might use a GET to trigger start if not purely WS driven from client side
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/replay/start`);
        if (!res.ok) throw new Error(`Failed to start replay: ${res.statusText}`);
    },

    async stopReplay(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/replay/stop`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to stop replay: ${res.statusText}`);
    },

    // === AUTOPILOT & CONTROL ===
    async startAutopilot(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/autopilot/start`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to start autopilot: ${res.statusText}`);
    },

    async stopAutopilot(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/autopilot/stop`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to stop autopilot: ${res.statusText}`);
    },

    async resetDrone(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/reset`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to reset drone: ${res.statusText}`);
    },

    async sendCommand(command: any): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
        });
        if (!res.ok) throw new Error(`Failed to send command: ${res.statusText}`);
    },

    async getLastCommand(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/command/last`);
        if (!res.ok) throw new Error(`Failed to fetch last command: ${res.statusText}`);
        return res.json();
    },

    // === FLIGHT CONTROLS ===
    async takeoff(): Promise<void> {
        await this.sendCommand("takeoff");
    },

    async land(): Promise<void> {
        await this.sendCommand("land");
    },

    async hold(): Promise<void> {
        await this.sendCommand("hold");
    },

    async returnToHome(): Promise<void> {
        await this.sendCommand("returnHome");
    },

    async setAltitude(target: number): Promise<void> {
        await this.sendCommand({ setAltitude: target });
    },

    // === SYSTEM & STATE ===
    async shutdownServer(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/shutdown`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to shutdown server: ${res.statusText}`);
    },

    async getState(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/state`);
        if (!res.ok) throw new Error(`Failed to fetch state: ${res.statusText}`);
        return res.json();
    },

    async getRawState(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/state/raw`);
        if (!res.ok) throw new Error(`Failed to fetch raw state: ${res.statusText}`);
        return res.json();
    },

    async getAiState(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/ai/state`);
        if (!res.ok) throw new Error(`Failed to fetch AI state: ${res.statusText}`);
        return res.json();
    },

    async getMetrics(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/metrics`);
        if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
        return res.json();
    },

    async getQueueSizes(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/debug/queues`);
        if (!res.ok) throw new Error(`Failed to fetch queue sizes: ${res.statusText}`);
        return res.json();
    },

    async checkHealth(): Promise<string> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/health`);
        if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
        return res.text();
    },

    // === EVENTS & ANALYSIS ===
    async triggerEvent(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/events/trigger`, { method: "POST" });
        if (!res.ok) throw new Error(`Failed to trigger event: ${res.statusText}`);
    },

    async getRecentEvents(): Promise<any[]> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/events/recent`);
        if (!res.ok) throw new Error(`Failed to fetch recent events: ${res.statusText}`);
        return res.json();
    },

    async getHistory(limit: number): Promise<any[]> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/history?limit=${limit}`);
        if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
        return res.json();
    },

    async getHistoryJson(): Promise<any[]> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/history/json`);
        if (!res.ok) throw new Error(`Failed to fetch history JSON: ${res.statusText}`);
        return res.json();
    },

    async getHistoryCsv(): Promise<string> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/history/csv`);
        if (!res.ok) throw new Error(`Failed to fetch history CSV: ${res.statusText}`);
        return res.text();
    },

    async getHistoryStats(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/history/stats`);
        if (!res.ok) throw new Error(`Failed to fetch history stats: ${res.statusText}`);
        return res.json();
    },

    async getRiskProfile(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/risk`);
        if (!res.ok) throw new Error(`Failed to fetch risk profile: ${res.statusText}`);
        return res.json();
    },

    async getSystemIntegrity(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/integrity`);
        if (!res.ok) throw new Error(`Failed to fetch system integrity: ${res.statusText}`);
        return res.json();
    }
};
