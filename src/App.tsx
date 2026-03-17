import { useEffect, useState } from 'react'
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark'
    }
    const storedTheme = localStorage.getItem('maechuri-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches
    return prefersLight ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('maechuri-theme', theme)
  }, [theme])

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
      <div className="theme-toggle">
        <button
          type="button"
          onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          aria-pressed={theme === 'light'}
        >
          {theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드'}
        </button>
      </div>
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
