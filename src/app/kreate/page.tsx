'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Eye,
  LogOut,
  Copy,
  RefreshCw,
  UserPlus,
  UserMinus,
  Activity
} from 'lucide-react'

interface UserData {
  id: string
  nickname: string
  balance: number
  role: string
  isAdmin: boolean
  theme: string
}

interface AdminLog {
  id: string
  userId: string
  user: {
    nickname: string
  }
  action: string
  targetId?: string
  amount?: number
  details?: string
  createdAt: string
}

interface Transaction {
  id: string
  amount: number
  sender: {
    nickname: string
  }
  receiver: {
    nickname: string
  }
  createdAt: string
}

interface DepalkaGame {
  id: string
  player: {
    nickname: string
  }
  amount: number
  status: string
  result?: string
  multiplier?: number
  createdAt: string
}

export default function KreatePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depalkaGames, setDepalkaGames] = useState<DepalkaGame[]>([])
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [newSecretKey, setNewSecretKey] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [hieroglyphs, setHieroglyphs] = useState<Array<{id: number, char: string, x: number, y: number, speed: number, color: string}>>([])

  // Иероглифы для фона
  const hieroglyphChars = ['𓀀', '𓀁', '𓀂', '𓀃', '𓀄', '𓀅', '𓀆', '𓀇', '𓀈', '𓀉', '𓀊', '𓀋', '𓀌', '𓀍', '𓀎', '𓀏', '𓀐', '𓀑', '𓀒', '𓀓']
  const colors = ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5', '#ff4365', '#00f5ff']

  useEffect(() => {
    loadUserData()
    loadData()
    initHieroglyphs()
    
    const interval = setInterval(() => {
      updateHieroglyphs()
    }, 50)
    
    return () => clearInterval(interval)
  }, [])

  const initHieroglyphs = () => {
    const initialHieroglyphs = []
    for (let i = 0; i < 50; i++) {
      initialHieroglyphs.push({
        id: i,
        char: hieroglyphChars[Math.floor(Math.random() * hieroglyphChars.length)],
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
    setHieroglyphs(initialHieroglyphs)
  }

  const updateHieroglyphs = () => {
    setHieroglyphs(prev => 
      prev.map(h => ({
        ...h,
        y: h.y + h.speed,
        x: h.x + Math.sin(h.y * 0.01) * 0.5,
        char: Math.random() < 0.01 ? hieroglyphChars[Math.floor(Math.random() * hieroglyphChars.length)] : h.char
      })).filter(h => h.y < window.innerHeight + 50)
    )
    
    // Add new hieroglyphs
    if (hieroglyphs.length < 50) {
      setHieroglyphs(prev => [
        ...prev,
        {
          id: Date.now(),
          char: hieroglyphChars[Math.floor(Math.random() * hieroglyphChars.length)],
          x: Math.random() * window.innerWidth,
          y: -50,
          speed: 0.5 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)]
        }
      ])
    }
  }

  const loadUserData = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) return

      const response = await fetch(`/api/user?userId=${savedUserId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        
        // Check if user is creator
        if (data.role !== 'creator') {
          window.location.href = '/'
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [logsResponse, transactionsResponse, gamesResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/logs'),
        fetch('/api/transfer/history'),
        fetch('/api/depalka/games'),
        fetch('/api/admin/users')
      ])

      if (logsResponse.ok) {
        const logs = await logsResponse.json()
        setAdminLogs(logs)
      }

      if (transactionsResponse.ok) {
        const tx = await transactionsResponse.json()
        setTransactions(tx)
      }

      if (gamesResponse.ok) {
        const games = await gamesResponse.json()
        setDepalkaGames(games)
      }

      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setAllUsers(users)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSecretKey = async () => {
    if (!userData) return

    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_creator_key',
          requesterId: userData.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setNewSecretKey(data.secretKey)
        setShowSecretModal(true)
      }
    } catch (error) {
      console.error('Error creating secret key:', error)
    }
  }

  const handlePromoteToMayor = async (targetUserId: string) => {
    if (!userData) return

    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'promote_to_mayor',
          requesterId: userData.id,
          targetUserId
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error promoting user:', error)
    }
  }

  const handleDemoteFromMayor = async (targetUserId: string) => {
    if (!userData) return

    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'demote_from_mayor',
          requesterId: userData.id,
          targetUserId
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error demoting user:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getActionDescription = (action: string) => {
    const actions = {
      'add_money': 'Начисление денег',
      'deduct_money': 'Списание денег',
      'set_job': 'Установка работы',
      'promote_to_mayor': 'Повышение до Мэра',
      'demote_from_mayor': 'Понижение с Мэра',
      'become_creator': 'Становление Креатором',
      'create_creator_key': 'Создание ключа Креатора'
    }
    return actions[action as keyof typeof actions] || action
  }

  if (!userData || userData.role !== 'creator') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">Доступ запрещен</h1>
          <p className="text-gray-400">Эта страница доступна только Креаторам</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Фон с падающими иероглифами */}
      <div className="fixed inset-0 pointer-events-none">
        {hieroglyphs.map(h => (
          <div
            key={h.id}
            className="absolute text-2xl opacity-20 font-mono"
            style={{
              left: h.x,
              top: h.y,
              color: h.color,
              transform: `rotate(${Math.sin(h.y * 0.01) * 10}deg)`,
              transition: 'all 0.1s linear'
            }}
          >
            {h.char}
          </div>
        ))}
      </div>

      {/* Основной контент */}
      <div className="relative z-10 p-4">
        {/* Верхняя панель */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Панель Креатора
              </h1>
              <p className="text-gray-400">Полный контроль над системой</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCreateSecretKey}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Создать ключ
            </Button>
            
            <Button
              onClick={loadData}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/80 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Всего пользователей</p>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Мэров</p>
                  <p className="text-2xl font-bold">{allUsers.filter(u => u.role === 'mayor').length}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Активных игр</p>
                  <p className="text-2xl font-bold">{depalkaGames.filter(g => g.status === 'playing').length}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Всего транзакций</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основные вкладки */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Логи действий */}
          <Card className="bg-black/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Логи действий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.user.nickname}</span>
                      <Badge variant="outline" className="text-xs">
                        {getActionDescription(log.action)}
                      </Badge>
                    </div>
                    {log.amount && (
                      <p className="text-sm text-gray-400">Сумма: {log.amount} 🍃</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Управление пользователями */}
          <Card className="bg-black/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Управление пользователями
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allUsers.map(user => (
                  <div key={user.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{user.nickname}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={user.role === 'creator' ? 'destructive' : user.role === 'mayor' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.role === 'creator' ? 'Креатор' : user.role === 'mayor' ? 'Мэр' : 'Пользователь'}
                        </Badge>
                        <span className="text-sm text-gray-400">{user.balance} 🍃</span>
                      </div>
                    </div>
                    
                    {userData.role === 'creator' && user.role !== 'creator' && (
                      <div className="flex gap-2">
                        {user.role === 'mayor' ? (
                          <Button
                            onClick={() => handleDemoteFromMayor(user.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <UserMinus className="h-3 w-3 mr-1" />
                            Разжаловать
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePromoteToMayor(user.id)}
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            В Мэры
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Транзакции */}
          <Card className="bg-black/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Финансовые транзакции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.slice(0, 15).map(tx => (
                  <div key={tx.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.sender.nickname} → {tx.receiver.nickname}</p>
                        <p className="text-lg font-bold text-green-400">{tx.amount} 🍃</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Игры в Депалку */}
          <Card className="bg-black/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Игры в Депалку
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {depalkaGames.slice(0, 15).map(game => (
                  <div key={game.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{game.player.nickname}</span>
                      <Badge 
                        variant={game.status === 'finished' ? (game.result === 'win' ? 'default' : 'destructive') : 'secondary'}
                        className="text-xs"
                      >
                        {game.status === 'finished' ? (game.result === 'win' ? 'Победа' : 'Поражение') : game.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Ставка: {game.amount} 🍃</span>
                      {game.multiplier && (
                        <span className="text-green-400">x{game.multiplier}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(game.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модальное окно с секретным ключом */}
      <Dialog open={showSecretModal} onOpenChange={setShowSecretModal}>
        <DialogContent className="bg-black border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-purple-400">Новый секретный ключ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Этот ключ может быть использован для получения прав Креатора. 
              Сохраните его в безопасном месте.
            </p>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <code className="text-purple-300 font-mono text-sm break-all">
                {newSecretKey}
              </code>
            </div>
            <Button
              onClick={() => copyToClipboard(newSecretKey)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Копировать ключ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}