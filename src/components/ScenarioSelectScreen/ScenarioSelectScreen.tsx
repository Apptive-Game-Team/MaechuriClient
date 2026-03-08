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
  const [scenarios, setScenarios] = useState<ScenarioEntry[]>([]);
  const [month, setMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios();
        setMonth(data.month);
        setScenarios(data.scenarios);
      } catch (err) {
        setError(err instanceof Error ? err.message : '시나리오 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  const scenarioByDate = React.useMemo(() => {
    const map = new Map<string, ScenarioEntry>();
    for (const entry of scenarios) {
      map.set(entry.date, entry);
    }
    return map;
  }, [scenarios]);

  const formatDateStr = React.useCallback((day: number): string => {
    if (month === null) return '';
    const year = new Date().getFullYear();
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }, [month]);

  const calendarDays = React.useMemo(() => {
    if (month === null) return [];

    const year = new Date().getFullYear();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete last week row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="scenario-select-screen">
      <h1>매추리</h1>
      <h2>시나리오 선택</h2>

      {isLoading && <p className="scenario-select-status">불러오는 중...</p>}
      {error && <p className="scenario-select-status scenario-select-error">{error}</p>}

      {!isLoading && !error && month !== null && (
        <>
          <div className="calendar">
            <div className="calendar-header">{month}월</div>
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
