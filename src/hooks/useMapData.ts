import { useState, useEffect } from 'react';
import { getTodayMap, getScenarioMap } from '../services/api';
import type { ScenarioData } from '../types/map';
import { mockScenarioData } from '../data/mockData';

interface UseMapDataOptions {
  scenarioId?: number; // If provided, fetch specific scenario. Otherwise fetch today's map
  useMockData?: boolean; // If true, use mock data instead of API
}

interface UseMapDataResult {
  data: ScenarioData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch map data from API
 * Falls back to mock data if useMockData is true or if API call fails
 */
export function useMapData(options: UseMapDataOptions = {}): UseMapDataResult {
  const { scenarioId, useMockData = false } = options;
  const [data, setData] = useState<ScenarioData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!useMockData);
  const [error, setError] = useState<string | null>(null);

  const fetchMapData = async () => {
    // Use mock data if requested
    if (useMockData) {
      setData(mockScenarioData);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mapData = scenarioId !== undefined 
        ? await getScenarioMap(scenarioId)
        : await getTodayMap();
      
      setData(mapData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch map data';
      console.error('Error fetching map data:', errorMessage);
      setError(errorMessage);
      
      // Fallback to mock data on error
      console.log('Falling back to mock data');
      setData(mockScenarioData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [scenarioId, useMockData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMapData,
  };
}
