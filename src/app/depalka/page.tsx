'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Settings, 
  DollarSign, 
  Users,
  GamepadIcon,
  Check,
  X,
  RefreshCw,
  Target,
  AlertTriangle
} from 'lucide-react'

interface UserData {
  id: string
  nickname: string
  balance: number
  role: string
  job?: {
    title: string
    salary: number
  }
}

interface DepalkaSession {
  id: string
  userId: string
  targetId: string
  amount: number
  status: string
  gameData?: string
  createdAt: string
}

interface DepalkaGame {
  id: string
  playerId: string
  player: {
    nickname: string
    balance: number
  }
  amount: number
  gameAmount: number
  status: string
  result?: string
  multiplier?: number
  confirmedAt?: string
  finishedAt?: string
  createdAt: string
}

const themes = {
  ocean: {
    name: '🌊 Океанская',
    bg: 'bg-gradient-to-br from-blue-600 via-teal-500 to-cyan-500',
    card: 'bg-white/95 backdrop-blur-sm border-blue-300/50',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    accent: 'blue',
    text: 'text-gray-900'
  },
  space: {
    name: '🌌 Космос',
    bg: 'bg-gradient-to-br from-purple-800 via-blue-800 to-indigo-900',
    card: 'bg-gray-800/95 backdrop-blur-sm border-purple-400/50',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    accent: 'purple',
    text: 'text-white'
  },
  neon: {
    name: '💫 Неон',
    bg: 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700',
    card: 'bg-black/95 backdrop-blur-sm border-pink-400/50',
    button: 'bg-pink-500 hover:bg-pink-600 text-white',
    accent: 'pink',
    text: 'text-white'
  }
}

const symbols = ['🍒', '🍓', '🍋', '🍊', '🍇', '🍉', '🍎', '🥝', '🍏', '🍌']
const winningCombo = ['🍒', '🍒', '🍒']

export default function DepalkaPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<DepalkaSession[]>([])
  const [games, setGames] = useState<DepalkaGame[]>([])
  const [allPlayers, setAllPlayers] = useState<UserData[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [currentGame, setCurrentGame] = useState<DepalkaGame | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [chance, setChance] = useState(18)
  const [multiplier, setMultiplier] = useState(2)
  const [theme, setTheme] = useState('ocean')
  const [isLoading, setIsLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState(['🍋', '🍓', '🍊'])
  const [result, setResult] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingGame, setPendingGame] = useState<any>(null)
  const [playerBalance, setPlayerBalance] = useState(0)
  const [betAmount, setBetAmount] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadUserData()
    loadSessions()
    loadGames()
    loadAllPlayers()
  }, [])

  const loadUserData = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) return

      const response = await fetch(`/api/user?userId=${savedUserId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) return

      const response = await fetch(`/api/depalka/sessions?userId=${savedUserId}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadGames = async () => {
    try {
      const response = await fetch('/api/depalka/games')
      if (response.ok) {
        const data = await response.json()
        setGames(data)
      }
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      if (response.ok) {
        const data = await response.json()
        setAllPlayers(data)
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleInitiateGame = async () => {
    if (!userData || !selectedPlayer) return

    try {
      const response = await fetch('/api/depalka/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          targetId: selectedPlayer
          // Сумма не указывается - игрок выберет ее позже
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPendingGame(data)
        
        // Получаем баланс выбранного игрока
        const playerData = allPlayers.find(p => p.id === selectedPlayer)
        if (playerData) {
          setPlayerBalance(playerData.balance)
        }
        
        setShowConfirmDialog(true)
        loadSessions()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка инициации игры')
      }
    } catch (error) {
      console.error('Error initiating game:', error)
      alert('Ошибка сети')
    }
  }

  const handleConfirmGame = async (gameId: string, amount: number) => {
    try {
      const response = await fetch('/api/depalka/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId, 
          playerId: userData?.id,
          amount 
        })
      })

      if (response.ok) {
        setShowConfirmDialog(false)
        setPendingGame(null)
        loadSessions()
        loadGames()
        loadUserData() // Обновляем баланс игрока
        
        // Находим созданную игру
        const gamesResponse = await fetch('/api/depalka/games')
        if (gamesResponse.ok) {
          const gamesData = await gamesResponse.json()
          const newGame = gamesData.find((g: DepalkaGame) => 
            g.playerId === userData?.id && g.status === 'confirmed'
          )
          if (newGame) {
            setCurrentGame(newGame)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка подтверждения')
      }
    } catch (error) {
      console.error('Error confirming game:', error)
      alert('Ошибка сети')
    }
  }

  const handlePlayGame = async () => {
    if (!currentGame || isSpinning) return

    setIsSpinning(true)
    setResult('')

    // Анимация вращения
    const spinDuration = 3000
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ])
    }, 100)

    setTimeout(() => {
      clearInterval(spinInterval)
      
      // Определяем результат
      const winChance = 1 / chance
      const isWin = Math.random() < winChance
      
      let finalSymbols
      if (isWin) {
        finalSymbols = ['🍒', '🍒', '🍒']
      } else {
        finalSymbols = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ]
        // Убедимся, что не три вишни
        while (finalSymbols.every(s => s === '🍒')) {
          finalSymbols = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
          ]
        }
      }

      setReels(finalSymbols)
      setIsSpinning(false)

      // Обрабатываем результат
      setTimeout(async () => {
        try {
          const response = await fetch('/api/depalka/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: currentGame.id,
              result: isWin ? 'win' : 'lose',
              multiplier: isWin ? multiplier : 1
            })
          })

          if (response.ok) {
            const data = await response.json()
            setResult(isWin ? `ПОБЕДА! +${data.winAmount} 🍃` : `ПРОИГРЫШ... -${currentGame.amount} 🍃`)
            loadUserData()
            loadGames()
            setCurrentGame(null)
          } else {
            const error = await response.json()
            alert(error.error || 'Ошибка обработки результата')
          }
        } catch (error) {
          console.error('Error processing game result:', error)
          alert('Ошибка сети')
        }
      }, 1000)
    }, spinDuration)
  }

  const drawCrashGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const y = (canvas.height / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  useEffect(() => {
    drawCrashGraph()
  }, [])

  const currentTheme = themes[theme as keyof typeof themes] || themes.ocean

  if (!userData || userData.job?.title !== 'работник казино') {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}>
        <Card className={`${currentTheme.card} max-w-md mx-4`}>
          <CardContent className="p-6 text-center">
            <GamepadIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
            <p className="text-gray-600">Эта страница доступна только работникам казино</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Верхняя панель с выбором игрока */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <DollarSign className="h-5 w-5" />
                <span className="font-bold">{userData.balance.toLocaleString()} 🍃</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Users className="h-5 w-5" />
                <span className="font-medium">{userData.nickname}</span>
                <Badge variant="outline">{userData.job?.title}</Badge>
              </div>
            </div>
            
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </Button>
          </div>

          {/* Выбор игрока */}
          <Card className={`${currentTheme.card}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Выберите игрока</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Выберите игрока</option>
                    {allPlayers
                      .filter(p => p.id !== userData.id)
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.nickname} ({player.balance} 🍃)
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={handleInitiateGame}
                    disabled={!selectedPlayer}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Начать игру
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Основной контент игры */}
      <div className="max-w-4xl mx-auto p-4">
        {currentGame && (
          <Card className={`${currentTheme.card} mb-6`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GamepadIcon className="h-5 w-5" />
                Депалка - Игра с {currentGame.player.nickname}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Баланс игрока</p>
                      <p className="text-2xl font-bold text-blue-600">{currentGame.player.balance} 🍃</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Ставка</p>
                      <p className="text-2xl font-bold text-green-600">{currentGame.amount} 🍃</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Возможный выигрыш</p>
                      <p className="text-2xl font-bold text-purple-600">{currentGame.amount * 2} 🍃</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Барабаны */}
                <div className="flex justify-center gap-4">
                  {reels.map((symbol, index) => (
                    <div
                      key={index}
                      className={`w-24 h-24 flex items-center justify-center text-5xl border-4 rounded-xl ${
                        isSpinning ? 'animate-spin border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                      } shadow-lg transition-all duration-300`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>

                {result && (
                  <div className={`text-2xl font-bold p-4 rounded-lg ${
                    result.includes('ПОБЕДА') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result}
                  </div>
                )}

                <Button
                  onClick={handlePlayGame}
                  disabled={isSpinning}
                  className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSpinning ? (
                    <RefreshCw className="h-6 w-6 mr-2 animate-spin" />
                  ) : (
                    <GamepadIcon className="h-6 w-6 mr-2" />
                  )}
                  {isSpinning ? 'Игра идет...' : 'КРУТИТЬ'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Активные сессии - только для текущего игрока */}
        {sessions.filter(s => s.targetId === userData?.id).length > 0 && (
          <Card className={`${currentTheme.card} mb-6`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Ожидающие подтверждения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions
                  .filter(s => s.targetId === userData?.id)
                  .map(session => (
                  <div key={session.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Запрос на игру от работника казино</p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setPendingGame(session)
                            setShowConfirmDialog(true)
                            setPlayerBalance(userData?.balance || 0)
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Подтвердить
                        </Button>
                        <Button
                          onClick={() => {
                            // Здесь можно добавить API для отмены сессии
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Отменить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* История игр */}
        <Card className={`${currentTheme.card}`}>
          <CardHeader>
            <CardTitle>История игр</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {games.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет сыгранных игр</p>
              ) : (
                games.map(game => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{game.player.nickname}</span>
                      <span className="text-sm text-gray-600 ml-2">{game.amount} 🍃</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={game.result === 'win' ? 'default' : 'secondary'}>
                        {game.result === 'win' ? 'Победа' : 'Поражение'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(game.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Модальное окно подтверждения */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение оплаты в казино</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg">
              Работник казино приглашает вас сыграть в Депалку!
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Детали игры:</p>
              <p>• Ваш баланс: {playerBalance} 🍃</p>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">Введите сумму для игры:</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={playerBalance}
                  className="w-full"
                  placeholder="Введите сумму"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Мин: 1 🍃, Макс: {playerBalance} 🍃
                </p>
              </div>
              {betAmount > 0 && (
                <p className="mt-2">• Возможный выигрыш: {betAmount * 2} 🍃</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => pendingGame && handleConfirmGame(pendingGame.id, betAmount)}
                disabled={!betAmount || betAmount <= 0 || betAmount > playerBalance}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Да, согласен
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false)
                  setPendingGame(null)
                  setBetAmount(0)
                }}
                variant="outline"
                className="flex-1"
              >
                Нет, отказаться
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно настроек */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки Депалки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Шанс выигрыша</label>
              <select
                value={chance}
                onChange={(e) => setChance(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="18">1 к 18 (5.56%)</option>
                <option value="15">1 к 15 (6.67%)</option>
                <option value="12">1 к 12 (8.33%)</option>
                <option value="10">1 к 10 (10%)</option>
                <option value="8">1 к 8 (12.5%)</option>
                <option value="6">1 к 6 (16.67%)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Множитель выигрыша</label>
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="2">x2</option>
                <option value="3">x3</option>
                <option value="4">x4</option>
                <option value="5">x5</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Тема оформления</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="ocean">Океанская</option>
                <option value="space">Космос</option>
                <option value="neon">Неон</option>
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}