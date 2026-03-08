import React, { useState, useEffect } from 'react';
import { getScenarios } from '../../services/api';
import type { ScenarioEntry } from '../../types/scenarioList';
import './ScenarioSelectScreen.css';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const STATE_LABEL: Record<ScenarioEntry['state'], string> = {
  Inactive: '비활성',
  Ready: '시작 가능',
  Visited: '진행 중',
  Finished: '완료',
};

interface ScenarioSelectScreenProps {
  onSelectScenario: (scenarioId: number) => void;
  onBack: () => void;
}

const ScenarioSelectScreen: React.FC<ScenarioSelectScreenProps> = ({
  onSelectScenario,
  onBack,
}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [scenarios, setScenarios] = useState<ScenarioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios(viewYear, viewMonth);
        setScenarios(data.scenarios);
      } catch (err) {
        setError(err instanceof Error ? err.message : '시나리오 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(y => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(y => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const scenarioByDate = React.useMemo(() => {
    const map = new Map<string, ScenarioEntry>();
    for (const entry of scenarios) {
      map.set(entry.date, entry);
    }
    return map;
  }, [scenarios]);

  const formatDateStr = React.useCallback((day: number): string => {
    const mm = String(viewMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  }, [viewYear, viewMonth]);

  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete last week row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const todayStr = React.useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <div className="scenario-select-screen">
      <h1>매추리</h1>
      <h2>시나리오 선택</h2>

      {isLoading && <p className="scenario-select-status">불러오는 중...</p>}
      {error && <p className="scenario-select-status scenario-select-error">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="calendar">
            <div className="calendar-header">
              <button className="month-nav-button" onClick={handlePrevMonth} aria-label="이전 달">‹</button>
              <span>{viewYear}년 {viewMonth}월</span>
              <button className="month-nav-button" onClick={handleNextMonth} aria-label="다음 달">›</button>
            </div>
            <div className="calendar-grid">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className={`calendar-day-label${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>
                  {label}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="calendar-cell empty" />;
                }
                const dateStr = formatDateStr(day);
                const entry = scenarioByDate.get(dateStr);
                const isToday = dateStr === todayStr;
                const state = entry?.state;
                const isPlayable = state === 'Ready' || state === 'Visited' || state === 'Finished';

                return (
                  <button
                    key={dateStr}
                    className={[
                      'calendar-cell',
                      entry ? `state-${state?.toLowerCase() ?? 'inactive'}` : 'no-scenario',
                      isToday ? 'today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={!isPlayable}
                    onClick={() => isPlayable && entry && onSelectScenario(entry.scenarioId)}
                    title={entry ? `${dateStr} — ${STATE_LABEL[entry.state]}` : undefined}
                  >
                    <span className="calendar-day-number">{day}</span>
                    {entry && (
                      <span className="calendar-state-dot" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot state-inactive" />비활성</span>
            <span className="legend-item"><span className="legend-dot state-ready" />시작 가능</span>
            <span className="legend-item"><span className="legend-dot state-visited" />진행 중</span>
            <span className="legend-item"><span className="legend-dot state-finished" />완료</span>
          </div>
        </>
      )}

      <button className="back-button" onClick={onBack}>
        돌아가기
      </button>
    </div>
  );
};

export default ScenarioSelectScreen;
