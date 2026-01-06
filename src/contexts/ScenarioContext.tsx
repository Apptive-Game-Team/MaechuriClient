import React, { createContext, useContext } from 'react';
import type { ScenarioData } from '../types/map';

interface ScenarioContextValue {
  scenarioData: ScenarioData;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export const ScenarioProvider: React.FC<{
  scenarioData: ScenarioData;
  children: React.ReactNode;
}> = ({ scenarioData, children }) => {
  return (
    <ScenarioContext.Provider value={{ scenarioData }}>
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = (): ScenarioContextValue => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};
