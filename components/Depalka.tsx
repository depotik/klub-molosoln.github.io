'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, DollarSign, GamepadIcon, Users } from 'lucide-react'

interface User {
  id: string
  nickname: string
  balance: number
}

interface DepalkaSession {
  id: string
  amount: number
  status: string
  user: {
    nickname: string
  }
  gameData?: string
}

interface DepalkaProps {
  userData: any
  onClose: () => void
}

export default function Depalka({ userData, onClose }: DepalkaProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<DepalkaSession[]>([])
  const [currentSession, setCurrentSession] = useState<DepalkaSession | null>(null)
  const [gameType, setGameType] = useState<'slots' | 'crash'>('slots')
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; session?: DepalkaSession }>({ open: false })
  const [playerConfirmDialog, setPlayerConfirmDialog] = useState<{ open: boolean; session?: DepalkaSession }>({ open: false })
  const [gameAmount, setGameAmount] = useState(0)
  const [gameResult, setGameResult] = useState<{ won: boolean; amount: number } | null>(null)

  useEffect(() => {
    loadUsers()
    loadSessions()
  }, [])

  useEffect(() => {
    if (userData?.id) {
      const interval = setInterval(loadSessions, 5000) // Обновляем каждые 5 секунд
      return () => clearInterval(interval)
    }
  }, [userData?.id])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users.filter((user: User) => user.id !== userData?.id))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadSessions = async () => {
    if (!userData?.id) return

    try {
      const response = await fetch(`/api/depalka/session?targetId=${userData.id}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const createSession = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const response = await fetch('/api/depalka/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          targetId: selectedUser.id,
          amount: 0 // Сумма будет определена игроком
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSession({ 
          id: data.sessionId, 
          amount: 0, 
          status: 'pending_player_confirmation',
          user: { nickname: userData.nickname }
        })
        loadSessions()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const confirmSession = async (sessionId: string, action: 'confirm' | 'cancel') => {
    try {
      const response = await fetch('/api/depalka/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action })
      })

      if (response.ok) {
        const data = await response.json()
        if (action === 'confirm') {
          setPlayerConfirmDialog({ open: true, session: sessions.find(s => s.id === sessionId) })
        }
        loadSessions()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error confirming session:', error)
      alert('Ошибка сети')
    }
  }

  const playerConfirmSession = async (sessionId: string, action: 'confirm' | 'cancel') => {
    try {
      const response = await fetch('/api/depalka/player-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action })
      })

      if (response.ok) {
        const data = await response.json()
        if (action === 'confirm') {
          setCurrentSession(sessions.find(s => s.id === sessionId) || null)
        }
        setPlayerConfirmDialog({ open: false })
        loadSessions()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error player confirming session:', error)
      alert('Ошибка сети')
    }
  }

  const playGame = async () => {
    if (!currentSession || gameAmount <= 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/depalka/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          betAmount: gameAmount,
          gameType
        })
      })

      if (response.ok) {
        const data = await response.json()
        const winAmount = data.result === 'win' ? gameAmount * 2 : 0
        setGameResult({ won: data.result === 'win', amount: winAmount })
        
        alert(data.result === 'win' 
          ? `🎉 Вы выиграли ${winAmount} 🍃! (x2 множитель)` 
          : `😞 Вы проиграли ${gameAmount} 🍃`
        )
        
        if (data.result === 'win') {
          // Добавляем выигрыш к балансу пользователя
          setTimeout(() => {
            alert(`💰 ${winAmount} 🍃 зачислены на ваш баланс!`)
          }, 1000)
        }
        
        setCurrentSession(null)
        setGameAmount(0)
        setGameResult(null)
        loadSessions()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error playing game:', error)
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableBalance = () => {
    if (!currentSession) return 0
    try {
      const gameData = JSON.parse(currentSession.gameData || '{}')
      return gameData.availableBalance || 0
    } catch {
      return 0
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GamepadIcon className="h-6 w-6 text-red-500" />
              Депалка
            </h2>
            <Button 
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-400 mt-2">Работник казино: {userData?.nickname}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Выбор пользователя */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Выбор игрока
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 h-auto flex flex-col items-center gap-2 ${
                      selectedUser?.id === user.id 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <span className="font-medium">{user.nickname}</span>
                    <span className="text-sm text-gray-300">{user.balance.toLocaleString()} 🍃</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Создание сессии */}
          {selectedUser && !currentSession && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Запрос на подтверждение
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Выбранный игрок:</span>
                  <Badge className="bg-blue-600">{selectedUser.nickname}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Баланс игрока:</span>
                  <Badge className="bg-green-600">{selectedUser.balance.toLocaleString()} 🍃</Badge>
                </div>
                <div className="p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-300 text-center font-medium">
                    ⚠️ Пользователь должен подтвердить оплату
                  </p>
                  <p className="text-yellow-200 text-center text-sm mt-2">
                    После создания сессии игрок получит уведомление о подтверждении оплаты в казино
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={createSession}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1"
                  >
                    {loading ? 'Создание...' : 'Отправить запрос'}
                  </Button>
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Текущая сессия */}
          {currentSession && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Активная сессия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <span className="text-gray-300">Статус:</span>
                    <Badge className={`ml-2 ${
                      currentSession.status === 'pending_player_confirmation' ? 'bg-yellow-600' :
                      currentSession.status === 'confirmed' ? 'bg-green-600' :
                      currentSession.status === 'completed' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {currentSession.status === 'pending_player_confirmation' ? 'Ожидает подтверждения игрока' :
                       currentSession.status === 'confirmed' ? 'Подтверждено' :
                       currentSession.status}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <span className="text-gray-300">Игрок:</span>
                    <span className="ml-2 text-white font-bold">{currentSession.user.nickname}</span>
                  </div>
                </div>

                {currentSession.status === 'confirmed' && (
                  <>
                    <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg">
                      <span className="text-green-300">Игрок подтвердил оплату! Вы можете начать игру.</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setGameType('slots')}
                          className={`flex-1 ${gameType === 'slots' ? 'bg-purple-600' : 'bg-gray-700'}`}
                        >
                          🎰 Слоты
                        </Button>
                        <Button
                          onClick={() => setGameType('crash')}
                          className={`flex-1 ${gameType === 'crash' ? 'bg-purple-600' : 'bg-gray-700'}`}
                        >
                          🚀 Crash
                        </Button>
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          placeholder="Введите сумму для игры"
                          value={gameAmount}
                          onChange={(e) => setGameAmount(Number(e.target.value))}
                          className="bg-gray-700 border-gray-600 text-white"
                          min="1"
                        />
                        <Button
                          onClick={playGame}
                          disabled={!gameAmount || gameAmount <= 0 || loading}
                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                        >
                          {loading ? 'Игра...' : 'Играть (x2)'}
                        </Button>
                      </div>
                      
                      <div className="text-center text-sm text-gray-400">
                        💡 При победе сумма умножится на 2!
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ожидающие подтверждения */}
          {sessions.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Ожидающие подтверждения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">{session.user.nickname}</span>
                          <span className="ml-2 text-gray-300">хочет играть в казино</span>
                        </div>
                        <Badge className="bg-yellow-600">Ожидает</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => confirmSession(session.id, 'confirm')}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          Подтвердить
                        </Button>
                        <Button
                          onClick={() => confirmSession(session.id, 'cancel')}
                          className="bg-red-600 hover:bg-red-700 flex-1"
                        >
                          Отменить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Диалог подтверждения */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open })}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Подтверждение оплаты</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Подтвердите оплату в казино на сумму {confirmDialog.session?.amount} 🍃
            </p>
            <p className="text-sm text-gray-400">
              После подтверждения деньги будут списаны с вашего баланса и станут доступны для игры.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setConfirmDialog({ open: false })}
                className="bg-gray-600 hover:bg-gray-700 flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  setConfirmDialog({ open: false })
                  setCurrentSession(confirmDialog.session)
                }}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}