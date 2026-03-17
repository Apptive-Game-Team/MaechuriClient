import { useState, useEffect } from 'react';

interface PressureIndicatorProps {
  pressure?: number | null;
  texts?: Partial<PressureIndicatorTexts>;
}

const PRESSURE_TENSE_MIN_INCLUSIVE = 30;
const PRESSURE_STUTTER_MIN_INCLUSIVE = 60;
const PRESSURE_FEAR_MIN_INCLUSIVE = 90;

interface PressureIndicatorTexts {
  thinking: string;
  tense: string;
  stutter: string;
  fear: string;
}

const DEFAULT_TEXTS: PressureIndicatorTexts = {
  thinking: '생각하는 중',
  tense: '긴장하며 고민하는 중',
  stutter: '당황해서 말을 더듬는 중',
  fear: '공포에 질려 떨고 있는 중',
};

const resolveTexts = (texts?: Partial<PressureIndicatorTexts>): PressureIndicatorTexts => ({
  ...DEFAULT_TEXTS,
  ...texts,
});

function getPressureBaseText(pressure: number | null | undefined, texts: PressureIndicatorTexts): string {
  if (pressure == null || pressure < PRESSURE_TENSE_MIN_INCLUSIVE) return texts.thinking;
  if (pressure < PRESSURE_STUTTER_MIN_INCLUSIVE) return texts.tense;
  if (pressure < PRESSURE_FEAR_MIN_INCLUSIVE) return texts.stutter;
  return texts.fear;
}

export function PressureIndicator({ pressure, texts }: PressureIndicatorProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const resolvedTexts = resolveTexts(texts);
  const baseText = getPressureBaseText(pressure, resolvedTexts);
  const dots = '.'.repeat(dotCount);

  return (
    <div className="pressure-indicator">
      {baseText}{dots}
    </div>
  );
}
