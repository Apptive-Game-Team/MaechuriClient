import { useState } from 'react'
import './App.css'
import MainScreen from './components/MainScreen/MainScreen'
import GameScreen from './components/GameScreen/GameScreen'
import { RecordsProvider } from './contexts/RecordsContext'

function App() {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'game'>('main')

  const handleStartGame = () => {
    setCurrentScreen('game')
  }

  return (
    <RecordsProvider>
      {currentScreen === 'main' && <MainScreen onStartGame={handleStartGame} />}
      {currentScreen === 'game' && <GameScreen />}
    </RecordsProvider>
  )
}

export default App
