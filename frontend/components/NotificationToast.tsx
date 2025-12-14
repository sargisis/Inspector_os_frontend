import { useEffect, useState } from "react";
import type { Event } from "../src/types";
import "./NotificationToast.css";

interface NotificationToastProps {
    event: Event | null;
    message?: string | null; // Generic message override
    onDismiss: () => void;
}

export function NotificationToast({ event, message, onDismiss }: NotificationToastProps) {
    const [visible, setVisible] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    useEffect(() => {
        // Condition to show:
        // 1. New severe event
        // 2. New generic message
        if (!event && !message) return;

        if (hasShown) return;

        if (message || (event && event.severity > 80)) {
            setVisible(true);
            setHasShown(true);

            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [event, message, hasShown, onDismiss]);

    // Reset hasShown when the input prop changes effectively (new event or new message)
    // Actually, parent passes null then new object/string.
    // If we want to support consecutive same messages, parent must clear it first.
    useEffect(() => {
        if (!event && !message) {
            setHasShown(false); // Reset so next one shows
        }
    }, [event, message]);


    const handleClose = () => {
        setVisible(false);
        setTimeout(onDismiss, 300);
    };

    if ((!event && !message) || !visible) return null;

    const isError = !!message;
    const title = isError ? "COMMAND ERROR" : `SEVERE ALERT: ${event?.type}`;
    const desc = isError ? message : event?.message;

    return (
        <div className={`notification-toast ${isError ? "toast-error" : ""}`}>
            <div className="toast-icon">{isError ? "⛔" : "⚠️"}</div>
            <div className="toast-content">
                <div className="toast-title">{title}</div>
                <div className="toast-message">{desc}</div>
            </div>
            <button className="toast-close" onClick={handleClose}>
                ✖
            </button>
        </div>
    );
}
