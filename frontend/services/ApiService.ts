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
    getReplayWsUrl(): string {
        return `${API_HTTP_URL.replace("http", "ws")}/api/v0.0.5/replay`;
    },
    async startReplay(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/replay/start`);
        if (!res.ok) await ApiService.handleError(res, "Failed to start replay");
    },
    async stopReplay(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/replay/stop`, { method: "POST" });
        if (!res.ok) await ApiService.handleError(res, "Failed to stop replay");
    },
    // === AUTOPILOT & CONTROL ===
    async startAutopilot(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/autopilot/start`, { method: "POST" });
        if (!res.ok) await ApiService.handleError(res, "Failed to start autopilot");
    },
    async stopAutopilot(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/autopilot/stop`, { method: "POST" });
        if (!res.ok) await ApiService.handleError(res, "Failed to stop autopilot");
    },
    async resetDrone(): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/reset`, { method: "POST" });
        if (!res.ok) await ApiService.handleError(res, "Failed to reset drone");
    },
    async sendCommand(command: any): Promise<void> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
        });
        // Smart Error Handling: Parse JSON error from backend if available
        if (!res.ok) {
            await ApiService.handleError(res, "Failed to send command");
        }
        // Also check for application-level error even if 200 OK (if backend uses { status: "error" })
        // The backend returns 200 OK with { "status": "ok" } or { "status": "error" } depending on logic,
        // OR it might return 400.
        // Looking at control_router.rs: 
        // return Json(json!({ "status": "error", "message": e })).into_response(); -> This is 200 OK by default unless status code set!
        // Wait, IntoResponse for Json implies 200 usually.
        // But let's check parse.
        const data = await res.json();
        if (data.status === "error") {
            throw new Error(data.message || "Unknown error from system");
        }
    },
    async getLastCommand(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/command/last`);
        if (!res.ok) throw new Error(`Failed to fetch last command: ${res.statusText}`);
        return res.json();
    },
    // === FLIGHT CONTROLS (CLEVER WRAPPERS) ===
    async takeoff(): Promise<void> {
        // Send command directly. The backend performs the battery/mode checks.
        // We rely on sendCommand to parse and throw the backend's specific error message (e.g., "Battery too low").
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
        // Pre-validate to save a round-trip
        if (target < 0.5 || target > 120) {
            throw new Error("Altitude must be between 0.5m and 120m");
        }
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
    async getOverrideStatus(): Promise<boolean> {
        // Placeholder or actual endpoint if it exists
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/override`);
        if (!res.ok) throw new Error("Failed to fetch override status");
        return res.json();
    },
    async getSystemIntegrity(): Promise<any> {
        const res = await fetch(`${API_HTTP_URL}/api/v0.0.5/integrity`);
        if (!res.ok) throw new Error(`Failed to fetch system integrity: ${res.statusText}`);
        return res.json();
    },
    // Helper to extract JSON error message from response
    async handleError(res: Response, defaultMsg: string): Promise<never> {
        try {
            const errorData = await res.json();
            throw new Error(errorData.message || errorData.error || defaultMsg);
        } catch (e) {
            // If json parse fails or no message field
            throw new Error(`${defaultMsg}: ${res.statusText}`);
        }
    }
};