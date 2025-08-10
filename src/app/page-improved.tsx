'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Briefcase, CreditCard, Send, Moon, Sun, Users, DollarSign as MoneyIcon, Clock, GamepadIcon, Info } from 'lucide-react'

interface UserData {
  id: string
  nickname: string
  balance: number
  isAdmin: boolean
  theme: string
  role: string
  job?: {
    title: string
    salary: number
  }
  credits: Array<{
    id: string
    amount: number
  }>
}

interface GameSettings {
  isDay: boolean
  lastDayChange: string
}

const themes = {
  space: {
    name: '🌌 Космос',
    bg: 'bg-gradient-to-br from-purple-800 via-blue-800 to-indigo-900',
    text: 'text-white',
    card: 'bg-gray-800/90 backdrop-blur-sm border-purple-400/30 shadow-2xl',
    button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg',
    accent: 'purple',
    glow: 'shadow-purple-500/25'
  },
  neon: {
    name: '💫 Неон',
    bg: 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700',
    text: 'text-white',
    card: 'bg-black/90 backdrop-blur-sm border-pink-400/30 shadow-2xl',
    button: 'bg-pink-500 hover:bg-pink-600 text-white shadow-lg',
    accent: 'pink',
    glow: 'shadow-pink-500/25'
  },
  sunset: {
    name: '🌅 Закат',
    bg: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-orange-300/50 shadow-2xl',
    button: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg',
    accent: 'orange',
    glow: 'shadow-orange-500/25'
  },
  ice: {
    name: '❄️ Лёд',
    bg: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-cyan-300/50 shadow-2xl',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg',
    accent: 'cyan',
    glow: 'shadow-cyan-500/25'
  },
  matrix: {
    name: '💻 Матрица',
    bg: 'bg-gradient-to-br from-green-700 via-green-800 to-black',
    text: 'text-green-300',
    card: 'bg-black/95 backdrop-blur-sm border-green-400/30 shadow-2xl',
    button: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
    accent: 'green',
    glow: 'shadow-green-500/25'
  },
  dark: {
    name: '🌑 Тьма',
    bg: 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900',
    text: 'text-gray-200',
    card: 'bg-gray-700/95 backdrop-blur-sm border-gray-500/30 shadow-2xl',
    button: 'bg-gray-600 hover:bg-gray-500 text-white shadow-lg',
    accent: 'gray',
    glow: 'shadow-gray-500/25'
  },
  ocean: {
    name: '🌊 Океанская',
    bg: 'bg-gradient-to-br from-blue-600 via-teal-500 to-cyan-500',
    text: 'text-gray-900 font-bold',
    card: 'bg-white/95 backdrop-blur-sm border-blue-300/50 shadow-2xl',
    button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg',
    accent: 'blue',
    glow: 'shadow-blue-500/25'
  }
}

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [creditAmount, setCreditAmount] = useState(0)
  const [transferAmount, setTransferAmount] = useState(0)
  const [transferReceiver, setTransferReceiver] = useState('')
  const [adminPlayers, setAdminPlayers] = useState([])
  const [adminJobs, setAdminJobs] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobSalary, setJobSalary] = useState('')
  const [deductAmount, setDeductAmount] = useState('')
  const [showNightMessage, setShowNightMessage] = useState(false)
  const [creditReminder, setCreditReminder] = useState(false)
  const [showAdminButton, setShowAdminButton] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Эффект для отладки
  useEffect(() => {
    console.log('Nickname state changed:', nickname)
    console.log('UserData changed:', userData)
    // Синхронизируем nickname с userData при загрузке
    if (userData && userData.nickname && userData.nickname !== 'Аноним' && userData.nickname !== '') {
      setNickname(userData.nickname)
    }
  }, [nickname, userData])

  useEffect(() => {
    loadUserData()
    loadGameSettings()
    if (isAdmin) {
      loadAdminData()
    }
    
    // Check for credit reminder
    const checkCredits = () => {
      try {
        if (userData && userData.credits && Array.isArray(userData.credits) && userData.credits.length > 0) {
          const totalDebt = userData.credits.reduce((sum, credit) => sum + (credit.amount || 0), 0)
          if (totalDebt > 0) {
            setCreditReminder(true)
            setTimeout(() => setCreditReminder(false), 5000) // Show for 5 seconds
          }
        }
      } catch (error) {
        console.error('Error checking credits:', error)
      }
    }
    
    const creditInterval = setInterval(checkCredits, 30000) // Check every 30 seconds
    checkCredits() // Check immediately
    
    return () => clearInterval(creditInterval)
  }, [isAdmin, userData])

  // Проверяем, есть ли сохраненный ID пользователя в localStorage
  useEffect(() => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (savedUserId && !userData) {
      // Если есть сохраненный ID, загружаем данные этого пользователя
      loadUserDataById(savedUserId)
    }
  }, [])

  const loadUserDataById = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/by-id/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setNickname(data.nickname)
        setIsAdmin(data.isAdmin)
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', userId) // Сохраняем ID в localStorage
        }
      }
    } catch (error) {
      console.error('Error loading user by ID:', error)
    }
  }

  const loadAdminData = async () => {
    try {
      const [playersResponse, jobsResponse] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/admin/jobs')
      ])
      
      if (playersResponse.ok) {
        const players = await playersResponse.json()
        setAdminPlayers(players)
      }
      
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json()
        setAdminJobs(jobs)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setNickname(data.nickname)
        setIsAdmin(data.isAdmin)
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', data.id) // Сохраняем ID в localStorage
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGameSettings = async () => {
    try {
      const response = await fetch('/api/game-settings')
      if (response.ok) {
        const data = await response.json()
        setGameSettings(data)
      }
    } catch (error) {
      console.error('Error loading game settings:', error)
    }
  }

  const handleSaveNickname = async () => {
    console.log('handleSaveNickname called, nickname:', nickname)
    if (!nickname || !nickname.trim()) {
      console.log('Nickname is empty, returning')
      return
    }
    
    try {
      console.log('Sending request to save nickname:', nickname.trim())
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() })
      })
      
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Saved user data:', data)
        setUserData(data)
        setNickname(data.nickname) // Обновляем состояние nickname
        setIsAdmin(data.isAdmin)
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', data.id) // Сохраняем ID в localStorage
        }
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert('Ошибка сохранения никнейма: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('Error saving nickname:', error)
      alert('Ошибка сети при сохранении никнейма')
    }
  }

  const handleAdminLogin = async () => {
    if (adminCode === 'cucumber') {
      try {
        // Сохраняем статус админа в базу данных
        const response = await fetch('/api/admin/toggle-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin: true })
        })
        
        if (response.ok) {
          setIsAdmin(true)
          setShowAdminLogin(false)
          setAdminCode('')
          setShowAdminButton(true) // Показываем кнопку админ-панели
          loadUserData() // Перезагружаем данные пользователя
        }
      } catch (error) {
        console.error('Error saving admin status:', error)
        // Если не удалось сохранить в базу, все равно разрешаем вход
        setIsAdmin(true)
        setShowAdminLogin(false)
        setAdminCode('')
        setShowAdminButton(true)
      }
    }
  }

  const handleAdminLogout = async () => {
    try {
      // Сохраняем статус админа в базу данных
      const response = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: false })
      })
      
      if (response.ok) {
        setIsAdmin(false)
        setShowAdminButton(false)
        loadUserData() // Перезагружаем данные пользователя
      }
    } catch (error) {
      console.error('Error saving admin status:', error)
      // Если не удалось сохранить в базу, все равно выходим
      setIsAdmin(false)
      setShowAdminButton(false)
    }
  }

  const handleTakeCredit = async () => {
    
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: creditAmount })
      })
      
      if (response.ok) {
        setCreditAmount(0)
        loadUserData()
      }
    } catch (error) {
      console.error('Error taking credit:', error)
    }
  }

  const handleTransfer = async () => {
    if (transferAmount <= 0 || !transferReceiver.trim()) return
    
    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: transferAmount, 
          receiverNickname: transferReceiver 
        })
      })
      
      if (response.ok) {
        setTransferAmount(0)
        setTransferReceiver('')
        loadUserData()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка перевода')
      }
    } catch (error) {
      console.error('Error transferring money:', error)
    }
  }

  const handleAssignJob = async () => {
    if (!selectedPlayer || !jobTitle || !jobSalary) return
    
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedPlayer, 
          title: jobTitle, 
          salary: Number(jobSalary) 
        })
      })
      
      if (response.ok) {
        setSelectedPlayer('')
        setJobTitle('')
        setJobSalary('')
        loadAdminData()
      }
    } catch (error) {
      console.error('Error assigning job:', error)
    }
  }

  const handleDeductMoney = async () => {
    if (!selectedPlayer || !deductAmount) return
    
    try {
      const response = await fetch('/api/admin/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedPlayer, 
          amount: Number(deductAmount) 
        })
      })
      
      if (response.ok) {
        setDeductAmount('')
        loadAdminData()
      }
    } catch (error) {
      console.error('Error deducting money:', error)
    }
  }

  const handleDayNightChange = async (action: 'end-day' | 'end-night') => {
    try {
      const response = await fetch('/api/admin/day-night', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        loadGameSettings()
        if (action === 'end-day') {
          setShowNightMessage(true)
          setTimeout(() => setShowNightMessage(false), 3000)
        }
        loadAdminData()
      }
    } catch (error) {
      console.error('Error changing day/night:', error)
    }
  }

  const handleNicknameChange = async (userId: string, newNickname: string) => {
    try {
      const response = await fetch('/api/admin/set-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nickname: newNickname })
      })
      
      if (response.ok) {
        // Если это текущий пользователь, обновляем его данные
        if (userData?.id === userId) {
          setUserData(prev => prev ? { ...prev, nickname: newNickname } : null)
        }
      }
    } catch (error) {
      console.error('Error changing nickname:', error)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })
      
      if (response.ok) {
        loadAdminData()
      }
    } catch (error) {
      console.error('Error changing user role:', error)
    }
  }

  const handleAddMoney = async (userId: string, amount: number) => {
    try {
      const response = await fetch('/api/admin/add-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      })
      
      if (response.ok) {
        loadAdminData()
        const input = document.querySelector('input[placeholder="Введите сумму"]') as HTMLInputElement
        if (input) input.value = ''
      }
    } catch (error) {
      console.error('Error adding money:', error)
    }
  }

  const currentTheme = userData ? themes[userData.theme as keyof typeof themes] : themes.space

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.bg}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} relative overflow-hidden`}>
      {/* Улучшенный фон - статичный узор вместо вращающегося шара */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Верхняя панель - улучшенная */}
      <div className="relative z-10 p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Левая часть - Деньги, Работа, Имя */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
            {/* Улучшенное отображение баланса */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-400/30 shadow-lg">
              <span className="font-bold text-lg">🍃</span>
              <span className="font-bold text-xl text-emerald-300">{userData?.balance || 0}</span>
            </div>
            
            {/* Информация о работе */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-400/30 shadow-lg">
              <span className="font-bold text-lg">💼</span>
              <span className="font-semibold text-blue-200">{userData?.job?.title || 'Безработный'}</span>
            </div>
            
            {/* Никнейм с кнопкой инфо */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-400/30 shadow-lg">
              <span className="font-bold text-lg">👤</span>
              <span className="font-semibold text-purple-200">{userData?.nickname || 'Аноним'}</span>
              <Button 
                onClick={() => setShowInfo(true)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-white/10"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Центральная часть - День/Ночь - улучшенная */}
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600/20 to-amber-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30 shadow-lg">
            {gameSettings?.isDay ? (
              <Sun className="h-6 w-6 text-yellow-400" />
            ) : (
              <Moon className="h-6 w-6 text-indigo-300" />
            )}
            <span className="font-bold text-lg">
              {gameSettings?.isDay ? '☀️ День' : '🌙 Ночь'}
            </span>
          </div>
          
          {/* Настройки */}
          <div className="absolute top-4 right-4 z-20 lg:relative lg:top-auto lg:right-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button className={`${currentTheme.button} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-3 rounded-full`}>
                  <Settings className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className={`bg-gray-900/95 backdrop-blur-sm border-purple-500/30 shadow-2xl text-white max-w-md mx-4`}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    ⚙️ Настройки
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-lg font-bold text-white drop-shadow-lg">🎨 Тема оформления</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(themes).map(([key, theme]) => (
                        <Button
                          key={key}
                          variant={userData?.theme === key ? "default" : "outline"}
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/user/theme', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ theme: key })
                              })
                              if (response.ok) {
                                loadUserData()
                              }
                            } catch (error) {
                              console.error('Error changing theme:', error)
                            }
                          }}
                          className={`text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                            userData?.theme === key 
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' 
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {theme.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-600">
                    <Button 
                      onClick={() => {
                        if (!isAdmin) {
                          setShowAdminLogin(true)
                        } else {
                          handleAdminLogout()
                        }
                      }}
                      className={`w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-4 ${
                        isAdmin 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800' 
                          : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                      } text-white font-bold text-lg`}
                    >
                      {isAdmin ? '🚪 Выйти из админ-панели' : '🔑 Вход в админ-панель'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {!userData || !userData.nickname || userData.nickname === 'Аноним' || userData.nickname === '' ? (
            <Card className={`${currentTheme.card} mb-6 border-2 shadow-2xl`}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  👋 Добро пожаловать в Клуб молосольных огурчиков! 🥒
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-lg text-center">
                    Пожалуйста, введите ваш никнейм, чтобы начать игру:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Ваш никнейм"
                      value={nickname}
                      onChange={(e) => {
                        console.log('Input changed:', e.target.value)
                        setNickname(e.target.value)
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 flex-1"
                    />
                    <Button 
                      onClick={() => {
                        console.log('Save button clicked, current nickname:', nickname)
                        handleSaveNickname()
                      }} 
                      className={currentTheme.button}
                      disabled={!nickname || !nickname.trim()}
                    >
                      Сохранить
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('Reset button clicked')
                        setNickname('')
                        setUserData(null)
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('userId')
                        }
                      }} 
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Сброс
                    </Button>
                  </div>
                  <div className="text-sm opacity-75 text-center">
                    Текущий ник: {userData?.nickname || 'не установлен'}
                  </div>
                  <div className="text-sm opacity-75 text-center">
                    Состояние nickname: "{nickname}"
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="work" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-black/20 p-1 rounded-xl">
                <TabsTrigger value="work" className="flex items-center gap-2 data-[state=active]:bg-white/10">
                  <Briefcase className="h-4 w-4" />
                  Работа
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex items-center gap-2 data-[state=active]:bg-white/10">
                  <CreditCard className="h-4 w-4" />
                  Кредиты
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex items-center gap-2 data-[state=active]:bg-white/10">
                  <Send className="h-4 w-4" />
                  Переводы
                </TabsTrigger>
                {userData?.role === 'Depalker' && (
                  <TabsTrigger value="depalka" className="flex items-center gap-2 data-[state=active]:bg-white/10">
                    <GamepadIcon className="h-4 w-4" />
                    Depalka
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="work" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Работа
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Текущая работа:</span>
                        <Badge variant="outline">{userData?.job?.title || 'Безработный'}</Badge>
                      </div>
                      {userData?.job && (
                        <div className="flex items-center justify-between">
                          <span>Зарплата:</span>
                          <Badge variant="outline">{userData?.job?.salary} 🍃/день</Badge>
                        </div>
                      )}
                      <p className="text-sm opacity-75">
                        {userData?.job 
                          ? 'Вы работаете! Зарплата будет начисляться в конце каждого дня.'
                          : 'У вас нет работы. Обратитесь к администратору, чтобы получить работу.'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Кредиты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Текущие кредиты:</span>
                        <Badge variant="outline">
                          {userData?.credits?.length || 0} активных
                        </Badge>
                      </div>
                      {userData?.credits && userData.credits.length > 0 && (
                        <div className="space-y-2">
                          {userData.credits.map((credit) => (
                            <div key={credit.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                              <span>Кредит #{credit.id}</span>
                              <Badge variant="destructive">{credit.amount} 🍃</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Сумма кредита"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(Number(e.target.value))}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <Button onClick={handleTakeCredit} className={currentTheme.button}>
                          Взять кредит
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Переводы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Сумма"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(Number(e.target.value))}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <Input
                          placeholder="Никнейм получателя"
                          value={transferReceiver}
                          onChange={(e) => setTransferReceiver(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <Button onClick={handleTransfer} className={currentTheme.button}>
                          Отправить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {userData?.role === 'Depalker' && (
                <TabsContent value="depalka" className="space-y-4">
                  <Card className={`${currentTheme.card} border-2 shadow-xl`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GamepadIcon className="h-5 w-5" />
                        Depalka Games
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-lg text-center">Добро пожаловать в эксклюзивный раздел Depalker!</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button className={`${currentTheme.button} h-20 text-lg`}>
                            🎰 Слоты
                          </Button>
                          <Button className={`${currentTheme.button} h-20 text-lg`}>
                            🚀 Crash
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>

      {/* Кнопка админ-панели (если пользователь - админ) - улучшенная */}
      {isAdmin && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <Dialog>
            <DialogTrigger asChild>
              <Button className={`${currentTheme.button} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2`}>
                <Settings className="h-5 w-5" />
                <span>Админ-панель</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`bg-gray-900/95 backdrop-blur-sm border-purple-500/30 shadow-2xl text-white max-w-4xl max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  🎛️ Админ-панель
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Управление игроками */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">👥 Управление игроками</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Выберите игрока</label>
                        <select 
                          value={selectedPlayer} 
                          onChange={(e) => setSelectedPlayer(e.target.value)}
                          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                        >
                          <option value="">Выберите игрока</option>
                          {adminPlayers.map((player: any) => (
                            <option key={player.id} value={player.id}>
                              {player.nickname} ({player.balance} 🍃)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Действие</label>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => handleAddMoney(selectedPlayer, 1000)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            +1000 🍃
                          </Button>
                          <Button 
                            onClick={() => handleAddMoney(selectedPlayer, 5000)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            +5000 🍃
                          </Button>
                          <Button 
                            onClick={() => handleAddMoney(selectedPlayer, 10000)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            +10000 🍃
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Управление работами */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">💼 Управление работами</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Игрок</label>
                        <select 
                          value={selectedPlayer} 
                          onChange={(e) => setSelectedPlayer(e.target.value)}
                          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                        >
                          <option value="">Выберите игрока</option>
                          {adminPlayers.map((player: any) => (
                            <option key={player.id} value={player.id}>
                              {player.nickname}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Должность</label>
                        <Input
                          placeholder="Название работы"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Зарплата</label>
                        <Input
                          type="number"
                          placeholder="Зарплата"
                          value={jobSalary}
                          onChange={(e) => setJobSalary(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAssignJob} className="bg-blue-600 hover:bg-blue-700">
                      Назначить работу
                    </Button>
                  </div>
                </div>

                {/* Управление днем и ночью */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🌅 Управление временем</h3>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => handleDayNightChange('end-day')}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Закончить день
                    </Button>
                    <Button 
                      onClick={() => handleDayNightChange('end-night')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Закончить ночь
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Уведомления */}
      {showNightMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          🌙 Наступила ночь! Все игроки получили зарплату.
        </div>
      )}

      {creditReminder && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          ⚠️ У вас есть неоплаченные кредиты! Не забудьте их погасить.
        </div>
      )}

      {/* Модальное окно входа в админ-панель */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🔑 Вход в админ-панель</h3>
            <Input
              type="password"
              placeholder="Введите код"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="mb-4 bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdminLogin} className={currentTheme.button}>
                Войти
              </Button>
              <Button 
                onClick={() => setShowAdminLogin(false)} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Информационное окно */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-sm border-purple-500/30 shadow-2xl text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Информация о игроке</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-purple-300">Никнейм:</span>
              <span className="ml-2">{userData?.nickname || 'Аноним'}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-300">Работа:</span>
              <span className="ml-2">{userData?.job?.title || 'Безработный'}</span>
            </div>
            <div>
              <span className="font-semibold text-emerald-300">Баланс:</span>
              <span className="ml-2">{userData?.balance || 0} 🍃</span>
            </div>
            <div>
              <span className="font-semibold text-amber-300">Роль:</span>
              <span className="ml-2">{userData?.role || 'Пользователь'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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