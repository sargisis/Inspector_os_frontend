import { useEffect, useState } from "react";
import type { Event } from "../src/types";
import "./NotificationToast.css";

interface NotificationToastProps {
    event: Event | null;
    onDismiss: () => void;
}

export function NotificationToast({ event, onDismiss }: NotificationToastProps) {
    const [visible, setVisible] = useState(false);
    const [hasShown, setHasShown] = useState(false); // 🔥 NEW: prevent re-trigger

    useEffect(() => {
        if (!event) return;

        // Already shown → do NOT show again
        if (hasShown) return;

        // Only show if severe
        if (event.severity > 80) {
            setVisible(true);
            setHasShown(true); // mark as shown

            const timer = setTimeout(() => {
                setVisible(false);

                // Call parent dismiss AFTER animation
                setTimeout(onDismiss, 300);
            }, 3000); // show 3 sec

            return () => clearTimeout(timer);
        }
    }, [event, hasShown, onDismiss]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onDismiss, 300);
    };

    if (!event || !visible) return null;

    return (
        <div className="notification-toast">
            <div className="toast-icon">⚠️</div>
            <div className="toast-content">
                <div className="toast-title">SEVERE ALERT: {event.type}</div>
                <div className="toast-message">{event.message}</div>
            </div>
            <button className="toast-close" onClick={handleClose}>
                ✖
            </button>
        </div>
    );
}
