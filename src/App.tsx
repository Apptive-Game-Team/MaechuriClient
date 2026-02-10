import { useState } from 'react'
import './App.css'
import MainScreen from './components/MainScreen/MainScreen'
import GameScreen from './components/GameScreen/GameScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'
import { RecordsProvider } from './contexts/RecordsContext'
import type { SolveResponse } from './types/solve'

function App() {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'game' | 'result'>('main')
  const [resultData, setResultData] = useState<SolveResponse | null>(null)

  const handleStartGame = () => {
    setCurrentScreen('game')
  }

  const handleShowResult = (result: SolveResponse) => {
    setResultData(result)
    setCurrentScreen('result')
  }

  const handleGoHome = () => {
    setResultData(null)
    setCurrentScreen('main')
  }

  return (
    <RecordsProvider>
      {currentScreen === 'main' && <MainScreen onStartGame={handleStartGame} />}
      {currentScreen === 'game' && <GameScreen onShowResult={handleShowResult} />}
      {currentScreen === 'result' && resultData && <ResultScreen result={resultData} onGoHome={handleGoHome} />}
    </RecordsProvider>
  )
}

export default App
