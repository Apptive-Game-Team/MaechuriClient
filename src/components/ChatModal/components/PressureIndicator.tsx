import { useState, useEffect } from 'react';

interface PressureIndicatorProps {
  pressure?: number | null;
}

const PRESSURE_TENSE_MIN_INCLUSIVE = 30;
const PRESSURE_STUTTER_MIN_INCLUSIVE = 60;
const PRESSURE_FEAR_MIN_INCLUSIVE = 90;

function getPressureBaseText(pressure?: number | null): string {
  if (pressure == null || pressure < PRESSURE_TENSE_MIN_INCLUSIVE) return '생각하는 중';
  if (pressure < PRESSURE_STUTTER_MIN_INCLUSIVE) return '긴장하며 고민하는 중';
  if (pressure < PRESSURE_FEAR_MIN_INCLUSIVE) return '당황해서 말을 더듬는 중';
  return '공포에 질려 떨고 있는 중';
}

export function PressureIndicator({ pressure }: PressureIndicatorProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const baseText = getPressureBaseText(pressure);
  const dots = '.'.repeat(dotCount);

  return (
    <div className="pressure-indicator">
      {baseText}{dots}
    </div>
  );
}
