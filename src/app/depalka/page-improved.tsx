'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Users, DollarSign, GamepadIcon } from 'lucide-react'

interface User {
  id: string
  nickname: string
  balance: number
}

interface DepalkaData {
  slotsResult: {
    won: boolean
    amount: number
    symbols: string[]
  } | null
  crashResult: {
    won: boolean
    amount: number
    multiplier: number
  } | null
}

const themes = {
  ocean: {
    name: '🌊 Океанская',
    bg: 'bg-gradient-to-br from-blue-600 via-teal-500 to-cyan-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-blue-300/50 shadow-2xl',
    button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg',
    accent: 'blue',
  },
  space: {
    name: '🌌 Космос',
    bg: 'bg-gradient-to-br from-purple-900 via-blue-900 to-black',
    text: 'text-white',
    card: 'bg-gray-900/90 backdrop-blur-sm border-purple-500/30 shadow-2xl',
    button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg',
    accent: 'purple',
  },
  neon: {
    name: '💫 Неон',
    bg: 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500',
    text: 'text-white',
    card: 'bg-black/90 backdrop-blur-sm border-pink-400/30 shadow-2xl',
    button: 'bg-pink-500 hover:bg-pink-600 text-white shadow-lg',
    accent: 'pink',
  },
  sunset: {
    name: '🌅 Закат',
    bg: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-orange-300/50 shadow-2xl',
    button: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg',
    accent: 'orange',
  },
  ice: {
    name: '❄️ Лёд',
    bg: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-cyan-300/50 shadow-2xl',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg',
    accent: 'cyan',
  },
  matrix: {
    name: '💻 Матрица',
    bg: 'bg-gradient-to-br from-green-900 via-black to-green-900',
    text: 'text-green-400',
    card: 'bg-black/95 backdrop-blur-sm border-green-500/30 shadow-2xl',
    button: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
    accent: 'green',
  },
  dark: {
    name: '🌑 Тьма',
    bg: 'bg-gradient-to-br from-gray-900 via-black to-gray-900',
    text: 'text-gray-300',
    card: 'bg-gray-800/95 backdrop-blur-sm border-gray-600/30 shadow-2xl',
    button: 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg',
    accent: 'gray',
  }
}

export default function DepalkaPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const [theme, setTheme] = useState('ocean')
  const [slotsBet, setSlotsBet] = useState(0)
  const [crashBet, setCrashBet] = useState(0)
  const [chance, setChance] = useState(18)
  const [multiplier, setMultiplier] = useState(2)
  const [isSpinning, setIsSpinning] = useState(false)
  const [crashActive, setCrashActive] = useState(false)
  const [crashMultiplier, setCrashMultiplier] = useState(1.00)
  const [depalkaData, setDepalkaData] = useState<DepalkaData>({
    slotsResult: null,
    crashResult: null
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/players')
      if (response.ok) {
        const players = await response.json()
        setUsers(players)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    const user = users.find(u => u.id === userId)
    setSelectedUserData(user || null)
  }

  const playSlots = async () => {
    if (!selectedUser || slotsBet <= 0) return

    setIsSpinning(true)
    setDepalkaData(prev => ({ ...prev, slotsResult: null }))

    // Симуляция вращения
    setTimeout(() => {
      const winChance = 1 / chance
      const isWin = Math.random() < winChance
      
      const result = {
        won: isWin,
        amount: isWin ? slotsBet * multiplier : -slotsBet,
        symbols: isWin ? ['🍒', '🍒', '🍒'] : ['🍋', '🍓', '🍊']
      }

      setDepalkaData(prev => ({ ...prev, slotsResult: result }))
      setIsSpinning(false)

      // Обновляем баланс пользователя
      if (selectedUserData) {
        const newBalance = selectedUserData.balance + result.amount
        setSelectedUserData({ ...selectedUserData, balance: newBalance })
      }
    }, 2000)
  }

  const startCrash = async () => {
    if (!selectedUser || crashBet < 8) return

    setCrashActive(true)
    setCrashMultiplier(1.00)
    setDepalkaData(prev => ({ ...prev, crashResult: null }))

    // Симуляция игры Crash
    const interval = setInterval(() => {
      setCrashMultiplier(prev => {
        const newMultiplier = prev + 0.01
        const crashPoint = 1 + Math.random() * 5 // Случайная точка краха
        
        if (newMultiplier >= crashPoint) {
          clearInterval(interval)
          setCrashActive(false)
          
          const result = {
            won: false,
            amount: -crashBet,
            multiplier: crashPoint
          }
          
          setDepalkaData(prev => ({ ...prev, crashResult: result }))
          
          // Обновляем баланс пользователя
          if (selectedUserData) {
            const newBalance = selectedUserData.balance + result.amount
            setSelectedUserData({ ...selectedUserData, balance: newBalance })
          }
        }
        
        return newMultiplier
      })
    }, 100)
  }

  const cashoutCrash = () => {
    if (!crashActive || !selectedUserData) return

    setCrashActive(false)
    
    const result = {
      won: true,
      amount: Math.floor(crashBet * crashMultiplier),
      multiplier: crashMultiplier
    }
    
    setDepalkaData(prev => ({ ...prev, crashResult: result }))
    
    // Обновляем баланс пользователя
    const newBalance = selectedUserData.balance + result.amount
    setSelectedUserData({ ...selectedUserData, balance: newBalance })
  }

  const currentTheme = themes[theme as keyof typeof themes]

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} relative overflow-hidden`}>
      {/* Улучшенный фон - статичный узор */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
              🎰 Депалка
            </h1>
            <p className="text-lg opacity-80">Панель управления для Депальщиков</p>
          </div>

          {/* Выбор пользователя */}
          <Card className={`${currentTheme.card} ${currentTheme.text} border-2 shadow-xl mb-6`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Выбор пользователя
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedUser} onValueChange={handleUserSelect}>
                  <SelectTrigger className={`${currentTheme.card} ${currentTheme.text} border-2`}>
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nickname} (Баланс: {user.balance} 🍃)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedUserData && (
                  <Card className={`${currentTheme.card} ${currentTheme.text} border-2`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{selectedUserData.nickname}</div>
                          <div className="text-sm opacity-70">Баланс: {selectedUserData.balance} 🍃</div>
                        </div>
                        <Badge variant="outline">Игрок</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Игры */}
          {selectedUserData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Слоты */}
              <Card className={`${currentTheme.card} ${currentTheme.text} border-2 shadow-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GamepadIcon className="h-5 w-5" />
                    Слоты
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm opacity-70 mb-2">
                        Шанс: 1 к {chance} ({(100 / chance).toFixed(2)}%)
                      </div>
                      <div className="flex justify-center gap-2 mb-4">
                        {['🍒', '🍓', '🍊'].map((symbol, index) => (
                          <div
                            key={index}
                            className={`w-16 h-16 flex items-center justify-center text-2xl rounded-lg border-2 ${
                              isSpinning ? 'animate-spin' : ''
                            } ${currentTheme.card} ${currentTheme.text}`}
                          >
                            {depalkaData.slotsResult?.symbols[index] || symbol}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={chance.toString()} onValueChange={(v) => setChance(Number(v))}>
                        <SelectTrigger className={`${currentTheme.card} ${currentTheme.text} border-2`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              1 к {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={multiplier.toString()} onValueChange={(v) => setMultiplier(Number(v))}>
                        <SelectTrigger className={`${currentTheme.card} ${currentTheme.text} border-2`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">x2</SelectItem>
                          <SelectItem value="3">x3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Input
                      type="number"
                      placeholder="Ставка"
                      value={slotsBet || ''}
                      onChange={(e) => setSlotsBet(Number(e.target.value))}
                      className={`${currentTheme.card} ${currentTheme.text} border-2`}
                    />
                    
                    <Button
                      onClick={playSlots}
                      disabled={isSpinning || !selectedUser || slotsBet <= 0}
                      className={`${currentTheme.button} w-full`}
                    >
                      {isSpinning ? 'Вращение...' : 'КРУТИТЬ'}
                    </Button>
                    
                    {depalkaData.slotsResult && (
                      <div className={`text-center p-3 rounded-lg ${
                        depalkaData.slotsResult.won ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {depalkaData.slotsResult.won ? (
                          <div className="text-green-400">
                            ПОБЕДА! +{depalkaData.slotsResult.amount} 🍃
                          </div>
                        ) : (
                          <div className="text-red-400">
                            ПРОИГРЫШ... {depalkaData.slotsResult.amount} 🍃
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Crash */}
              <Card className={`${currentTheme.card} ${currentTheme.text} border-2 shadow-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Crash
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {crashMultiplier.toFixed(2)}x
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-100"
                          style={{ width: `${Math.min((crashMultiplier - 1) / 5 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <Input
                      type="number"
                      placeholder="Ставка (мин. 8)"
                      min="8"
                      value={crashBet || ''}
                      onChange={(e) => setCrashBet(Number(e.target.value))}
                      className={`${currentTheme.card} ${currentTheme.text} border-2`}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={startCrash}
                        disabled={crashActive || !selectedUser || crashBet < 8}
                        className={`${currentTheme.button}`}
                      >
                        СТАРТ
                      </Button>
                      <Button
                        onClick={cashoutCrash}
                        disabled={!crashActive}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        ЗАБРАТЬ
                      </Button>
                    </div>
                    
                    {depalkaData.crashResult && (
                      <div className={`text-center p-3 rounded-lg ${
                        depalkaData.crashResult.won ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {depalkaData.crashResult.won ? (
                          <div className="text-green-400">
                            ЗАБРАЛИ {depalkaData.crashResult.amount} 🍃 ({depalkaData.crashResult.multiplier.toFixed(2)}x)
                          </div>
                        ) : (
                          <div className="text-red-400">
                            CRASH на {depalkaData.crashResult.multiplier.toFixed(2)}x! -{Math.abs(depalkaData.crashResult.amount)} 🍃
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Стили для фона */}
      <style jsx>{`
        .bg-repeat {
          mask-image: radial-gradient(circle, transparent 30%, black 30.5%);
          mask-size: 60px 60px;
          -webkit-mask-image: radial-gradient(circle, transparent 30%, black 30.5%);
          -webkit-mask-size: 60px 60px;
        }
      `}</style>
    </div>
  )
}