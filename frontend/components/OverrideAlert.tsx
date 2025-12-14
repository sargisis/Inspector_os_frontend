import { useEffect, useState } from "react";
import "./OverrideAlert.css";

interface OverrideAlertProps {
    visible: boolean;
    message?: string;
    onDismiss: () => void;
}

export function OverrideAlert({ visible, message, onDismiss }: OverrideAlertProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
        }
    }, [visible]);

    if (!show) return null;

    return (
        <div className="hud-override-container">
            <div className="hud-corner tl" />
            <div className="hud-corner tr" />
            <div className="hud-corner bl" />
            <div className="hud-corner br" />

            <div className="hud-override-icon">⚠️</div>
            <div className="hud-override-title">SYSTEM OVERRIDE</div>
            <div className="hud-override-message">
                {message || "Manual override engaged. Automatic fail-safes are disabled. Pilot assumes full control."}
            </div>

            <button className="hud-override-dismiss" onClick={() => {
                setShow(false);
                onDismiss();
            }}>
                ACKNOWLEDGE
            </button>
        </div>
    );
}
