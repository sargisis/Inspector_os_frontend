import React, { useMemo } from 'react';
import type { Telemetry } from '../hooks/useTelemetry';

interface GraphPreviewProps {
    history: Telemetry[];
    centerIndex: number;
    windowSize?: number;
}

export const GraphPreview: React.FC<GraphPreviewProps> = ({ history, centerIndex, windowSize = 50 }) => {
    const data = useMemo(() => {
        const start = Math.max(0, centerIndex - windowSize);
        const end = Math.min(history.length, centerIndex + windowSize);
        return history.slice(start, end).map((frame, i) => ({
            val: frame.risk_level ?? 0,
            isCenter: (start + i) === centerIndex
        }));
    }, [history, centerIndex, windowSize]);

    if (data.length === 0) return null;

    const width = 150;
    const height = 60;
    const maxVal = 100; // Risk is 0-100

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d.val / maxVal) * height;
        return `${x},${y}`;
    }).join(' ');

    const centerPoint = data.find(d => d.isCenter);
    const centerX = centerPoint ? (data.indexOf(centerPoint) / (data.length - 1)) * width : width / 2;
    const centerY = centerPoint ? height - (centerPoint.val / maxVal) * height : height / 2;

    return (
        <div className="graph-preview-tooltip">
            <div className="graph-header">
                Risk: {centerPoint?.val.toFixed(0)}%
            </div>
            <svg width={width} height={height} className="sparkline">
                {/* Background area */}
                <polygon points={`0,${height} ${points} ${width},${height}`} fill="rgba(0, 255, 136, 0.1)" />
                {/* Line */}
                <polyline points={points} fill="none" stroke="#00ff88" strokeWidth="2" />
                {/* Center marker */}
                <circle cx={centerX} cy={centerY} r="3" fill="#fff" stroke="#00ff88" strokeWidth="2" />
            </svg>
        </div>
    );
};
