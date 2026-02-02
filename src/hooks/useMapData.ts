import { useState, useEffect } from 'react';
import { getTodayMap, getScenarioMap } from '../services/api';
import type { ScenarioData } from '../types/map';

interface UseMapDataOptions {
  scenarioId?: number; // If provided, fetch specific scenario. Otherwise fetch today's map
}

interface UseMapDataResult {
  data: ScenarioData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch map data from API
 */
export function useMapData(options: UseMapDataOptions = {}): UseMapDataResult {
  const { scenarioId } = options;
  const [data, setData] = useState<ScenarioData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const mapData = scenarioId !== undefined 
          ? await getScenarioMap(scenarioId)
          : await getTodayMap();
        
        setData(mapData);
      } catch (err) {
        console.error('Error fetching map data:', err);
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Failed to fetch map data'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();
  }, [scenarioId, refetchTrigger]);

  const refetch = () => {
    // Trigger re-fetch by updating the trigger state
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
