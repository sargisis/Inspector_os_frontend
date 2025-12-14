import { useEffect, useRef, useState } from "react";
import { SMOOTH_VALUE_CONFIG } from "../config/config";

export function useSmoothValue(
  target: number,
  speed = SMOOTH_VALUE_CONFIG.easingSpeed
) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const animate = () => {
      setValue((current) => {
        const diff = target - current;
        if (Math.abs(diff) < SMOOTH_VALUE_CONFIG.settleThreshold) return target;
        return current + diff * speed;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, speed]);

  return value;
}
