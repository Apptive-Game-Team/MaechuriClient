import { useState } from 'react'
import './App.css'
import MainScreen from './components/MainScreen/MainScreen'
import GameScreen from './components/GameScreen/GameScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'
import ScenarioSelectScreen from './components/ScenarioSelectScreen/ScenarioSelectScreen'
import { RecordsProvider } from './contexts/RecordsContext'
import type { SolveResponse } from './types/solve'

function App() {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'scenario-select' | 'game' | 'result'>('main')
  const [resultData, setResultData] = useState<SolveResponse | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | undefined>(undefined)

  const handleStartGame = () => {
    setSelectedScenarioId(undefined)
    setCurrentScreen('game')
  }

  const handleOpenScenarioSelect = () => {
    setCurrentScreen('scenario-select')
  }

  const handleSelectScenario = (scenarioId: number) => {
    setSelectedScenarioId(scenarioId)
    setCurrentScreen('game')
  }

  const handleShowResult = (result: SolveResponse) => {
    setResultData(result)
    setCurrentScreen('result')
  }

  const handleGoHome = () => {
    setResultData(null)
    setSelectedScenarioId(undefined)
    setCurrentScreen('main')
  }

  return (
    <RecordsProvider>
      {currentScreen === 'main' && (
        <MainScreen
          onStartGame={handleStartGame}
          onOpenScenarioSelect={handleOpenScenarioSelect}
        />
      )}
      {currentScreen === 'scenario-select' && (
        <ScenarioSelectScreen
          onSelectScenario={handleSelectScenario}
          onBack={() => setCurrentScreen('main')}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          scenarioId={selectedScenarioId}
          onShowResult={handleShowResult}
        />
      )}
      {currentScreen === 'result' && resultData && (
        <ResultScreen result={resultData} onGoHome={handleGoHome} />
      )}
    </RecordsProvider>
  )
}

export default App
