'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Briefcase, CreditCard, Send, Moon, Sun, Users, DollarSign as MoneyIcon, Clock, GamepadIcon, Info, Crown } from 'lucide-react'
import GlobeLogin from '@/components/GlobeLogin'
import { firebaseHelpers } from '@/lib/firebase'
import Depalka from '@/components/Depalka'
import AuthModal from '@/components/AuthModal'

interface UserData {
  id: string
  nickname: string
  email?: string
  balance: number
  isAdmin: boolean
  role: string // user, mayor, creator
  theme: string
  job?: {
    title: string
    salary: number
  }
  credits: Array<{
    id: string
    amount: number
    isPaid?: boolean
    paidAmount?: number
    createdAt?: string
  }>
}

interface GameSettings {
  isDay: boolean
  lastDayChange: string
}

const themes = {
  space: {
    name: '🌌 Космос',
    bg: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-950',
    text: 'text-white font-bold drop-shadow-lg tracking-wide',
    card: 'bg-gray-900/95 backdrop-blur-sm border-purple-400/50 shadow-2xl',
    button: 'bg-purple-700 hover:bg-purple-800 text-white shadow-lg font-bold tracking-wide',
    accent: 'purple',
    glow: 'shadow-purple-500/50',
    input: 'bg-gray-800/90 border-gray-400 text-white placeholder-gray-200 font-medium tracking-wide'
  },
  neon: {
    name: '💫 Неон',
    bg: 'bg-gradient-to-br from-pink-700 via-purple-700 to-indigo-800',
    text: 'text-white font-bold drop-shadow-lg tracking-wide',
    card: 'bg-black/95 backdrop-blur-sm border-pink-400/50 shadow-2xl',
    button: 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold tracking-wide',
    accent: 'pink',
    glow: 'shadow-pink-500/50',
    input: 'bg-gray-900/90 border-pink-400/60 text-white placeholder-pink-100 font-medium tracking-wide'
  },
  sunset: {
    name: '🌅 Закат',
    bg: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-600',
    text: 'text-gray-900 font-bold tracking-wide drop-shadow-sm',
    card: 'bg-white/95 backdrop-blur-sm border-orange-300/50 shadow-2xl',
    button: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg font-bold tracking-wide',
    accent: 'orange',
    glow: 'shadow-orange-500/25',
    input: 'bg-white/80 border-orange-300 text-gray-900 placeholder-orange-600 font-medium tracking-wide'
  },
  ice: {
    name: '❄️ Лёд',
    bg: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600',
    text: 'text-gray-900 font-bold tracking-wide drop-shadow-sm',
    card: 'bg-white/95 backdrop-blur-sm border-cyan-300/50 shadow-2xl',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg font-bold tracking-wide',
    accent: 'cyan',
    glow: 'shadow-cyan-500/25',
    input: 'bg-white/80 border-cyan-300 text-gray-900 placeholder-cyan-600 font-medium tracking-wide'
  },
  matrix: {
    name: '💻 Матрица',
    bg: 'bg-gradient-to-br from-green-800 via-green-900 to-black',
    text: 'text-green-200 font-bold drop-shadow-lg tracking-wide font-mono',
    card: 'bg-black/95 backdrop-blur-sm border-green-400/50 shadow-2xl',
    button: 'bg-green-700 hover:bg-green-800 text-white shadow-lg font-bold tracking-wide',
    accent: 'green',
    glow: 'shadow-green-500/50',
    input: 'bg-green-900/90 border-green-400 text-green-50 placeholder-green-200 font-medium tracking-wide font-mono'
  },
  dark: {
    name: '🌑 Тьма',
    bg: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
    text: 'text-gray-100 font-bold drop-shadow-lg tracking-wide',
    card: 'bg-gray-800/95 backdrop-blur-sm border-gray-400/50 shadow-2xl',
    button: 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg font-bold tracking-wide',
    accent: 'gray',
    glow: 'shadow-gray-500/50',
    input: 'bg-gray-700/90 border-gray-300 text-gray-100 placeholder-gray-200 font-medium tracking-wide'
  },
  ocean: {
    name: '🌊 Океанская',
    bg: 'bg-gradient-to-br from-blue-700 via-teal-600 to-cyan-600',
    text: 'text-gray-900 font-bold tracking-wide drop-shadow-sm',
    card: 'bg-white/95 backdrop-blur-sm border-blue-300/50 shadow-2xl',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg font-bold tracking-wide',
    accent: 'blue',
    glow: 'shadow-blue-500/25',
    input: 'bg-white/80 border-blue-300 text-gray-900 placeholder-blue-600 font-medium tracking-wide'
  }
}

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showMayorLogin, setShowMayorLogin] = useState(false)
  const [mayorCode, setMayorCode] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isMayor, setIsMayor] = useState(false)
  
  // Состояния для системы входа/регистрации
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loginNickname, setLoginNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerNickname, setRegisterNickname] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  
  // Состояния для депалки
  const [showDepalka, setShowDepalka] = useState(false)
  const [depalkaSecretPassword, setDepalkaSecretPassword] = useState('')
  const [showDepalkaSecretModal, setShowDepalkaSecretModal] = useState(false)
  
  const [creditAmount, setCreditAmount] = useState(0)
  const [transferAmount, setTransferAmount] = useState(0)
  const [transferReceiver, setTransferReceiver] = useState('')
  const [mayorPlayers, setMayorPlayers] = useState([])
  const [mayorJobs, setMayorJobs] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobSalary, setJobSalary] = useState('')
  const [deductAmount, setDeductAmount] = useState('')
  const [showNightMessage, setShowNightMessage] = useState(false)
  const [creditReminder, setCreditReminder] = useState(false)
  const [showAdminButton, setShowAdminButton] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showTransferHistory, setShowTransferHistory] = useState(false)
  const [transferHistoryData, setTransferHistoryData] = useState<any>(null)
  const [showMayorNightControl, setShowMayorNightControl] = useState(false)
  const [mayorNightPassword, setMayorNightPassword] = useState('')
  const [showNightControlModal, setShowNightControlModal] = useState(false)
  const [nightControlPassword, setNightControlPassword] = useState('')
  const [authError, setAuthError] = useState('')
  
  // Состояния для входа создателя
  const [showCreatorLogin, setShowCreatorLogin] = useState(false)
  const [creatorPassword, setCreatorPassword] = useState('')
  


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
    if (isMayor) {
      loadMayorData()
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
    
    // Periodic data synchronization for real-time updates across devices
    const syncInterval = setInterval(() => {
      if (userData && userData.nickname !== 'Аноним') {
        loadUserData() // Refresh user data every 30 seconds
      }
    }, 30000)
    
    return () => {
      clearInterval(creditInterval)
      clearInterval(syncInterval)
    }
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

  const loadMayorData = async () => {
    try {
      const [playersResponse, jobsResponse] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/admin/jobs')
      ])
      
      if (playersResponse.ok) {
        const players = await playersResponse.json()
        setMayorPlayers(players)
      }
      
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json()
        setMayorJobs(jobs)
      }
    } catch (error) {
      console.error('Error loading mayor data:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const url = savedUserId ? `/api/user?userId=${savedUserId}` : '/api/user'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        
        // Try to load additional data from Firebase
        if (savedUserId) {
          try {
            const firebaseData = await firebaseHelpers.loadUserData(savedUserId)
            if (firebaseData) {
              // Merge Firebase data with local data, prioritizing local data
              data.balance = firebaseData.balance || data.balance
              data.theme = firebaseData.theme || data.theme
              data.role = firebaseData.role || data.role
              console.log('Loaded additional data from Firebase')
            }
          } catch (error) {
            console.error('Error loading from Firebase:', error)
          }
          
          try {
            const creditsResponse = await fetch(`/api/credits?userId=${savedUserId}`)
            if (creditsResponse.ok) {
              const creditsData = await creditsResponse.json()
              data.credits = creditsData.credits
            }
          } catch (error) {
            console.error('Error loading credits:', error)
          }
        }
        
        setUserData(data)
        setNickname(data.nickname)
        setIsAdmin(data.isAdmin)
        setIsCreator(data.role === 'creator')
        setIsMayor(data.role === 'mayor')
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

  // Функции для входа и регистрации
  const handleLogin = async () => {
    if (!loginNickname || !loginPassword) {
      setAuthError('Введите никнейм и пароль')
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickname: loginNickname,
          password: loginPassword
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setNickname(data.nickname)
        setIsAdmin(data.isAdmin)
        setIsCreator(data.role === 'creator')
        setIsMayor(data.role === 'mayor')
        setAuthError('')
        setShowAuthModal(false)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', data.id)
          localStorage.setItem('userNickname', data.nickname)
        }
      } else {
        const error = await response.json()
        setAuthError(error.error || 'Ошибка входа')
      }
    } catch (error) {
      console.error('Error during login:', error)
      setAuthError('Ошибка сети')
    }
  }

  const handleRegister = async () => {
    if (!registerNickname || !registerPassword) {
      setAuthError('Введите никнейм и пароль')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setAuthError('Пароли не совпадают')
      return
    }

    if (registerPassword.length < 6) {
      setAuthError('Пароль должен быть не менее 6 символов')
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickname: registerNickname,
          email: registerEmail || undefined,
          password: registerPassword
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setNickname(data.nickname)
        setIsAdmin(data.isAdmin)
        setIsCreator(data.role === 'creator')
        setIsMayor(data.role === 'mayor')
        setAuthError('')
        setShowAuthModal(false)
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', data.id)
          localStorage.setItem('userNickname', data.nickname)
        }
      } else {
        const error = await response.json()
        setAuthError(error.error || 'Ошибка регистрации')
      }
    } catch (error) {
      console.error('Error during registration:', error)
      setAuthError('Ошибка сети')
    }
  }

  const handleLogout = () => {
    setUserData(null)
    setNickname('')
    setIsAdmin(false)
    setIsCreator(false)
    setIsMayor(false)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId')
      localStorage.removeItem('userNickname')
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
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickname: nickname.trim(),
          userId: savedUserId || undefined
        })
      })
      
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Saved user data:', data)
        setUserData(data)
        setNickname(data.nickname) // Обновляем состояние nickname
        setIsAdmin(data.isAdmin)
        setIsCreator(data.role === 'creator')
        setIsMayor(data.role === 'mayor')
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', data.id) // Сохраняем ID в localStorage
          localStorage.setItem('userNickname', data.nickname) // Сохраняем никнейм для быстрого входа
          
          // Сохраняем информацию об устройстве
          const deviceInfo = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo))
          
          // Сохраняем данные в Firebase для синхронизации между устройствами
          firebaseHelpers.saveUserData(data.id, {
            nickname: data.nickname,
            balance: data.balance,
            isAdmin: data.isAdmin,
            theme: data.theme,
            role: data.role,
            deviceInfo
          }).then(success => {
            if (success) {
              console.log('User data saved to Firebase successfully')
            } else {
              console.log('Failed to save user data to Firebase')
            }
          })
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

  const handleMayorLogin = async () => {
    if (mayorCode === 'cucumber') {
      try {
        // Сохраняем статус Мэра в базу данных
        const response = await fetch('/api/admin/toggle-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin: true })
        })
        
        if (response.ok) {
          setIsAdmin(true)
          setShowMayorLogin(false)
          setMayorCode('')
          setShowAdminButton(true) // Показываем кнопку панели Мэра
          loadUserData() // Перезагружаем данные пользователя
        }
      } catch (error) {
        console.error('Error saving admin status:', error)
        // Если не удалось сохранить в базу, все равно разрешаем вход
        setIsAdmin(true)
        setShowMayorLogin(false)
        setMayorCode('')
        setShowAdminButton(true)
      }
    }
  }

  const handleAdminLogout = async () => {
    try {
      // Сохраняем статус Мэра в базу данных
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

  const handleTakeCredit = async (amount?: number) => {
    const creditAmountToTake = amount || creditAmount
    
    if (!creditAmountToTake || creditAmountToTake <= 0) return
    
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) {
        alert('❌ Ошибка: пользователь не найден')
        return
      }
      
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUserId}`
        },
        body: JSON.stringify({ 
          action: 'take',
          amount: creditAmountToTake,
          userId: savedUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCreditAmount(0)
        loadUserData()
        
        // Show success message
        if (data.success) {
          alert(`✅ Кредит успешно взят! +${creditAmountToTake} 🍃 добавлено на ваш счет.`)
        }
      } else {
        const error = await response.json()
        alert(`❌ Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error taking credit:', error)
      alert('❌ Ошибка сети при взятии кредита')
    }
  }

  const handleRepayCredit = async (creditId: string, amount: number) => {
    if (!creditId || amount <= 0) return
    
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) {
        alert('❌ Ошибка: пользователь не найден')
        return
      }
      
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUserId}`
        },
        body: JSON.stringify({ 
          action: 'repay',
          creditId,
          amount,
          userId: savedUserId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        loadUserData()
        
        // Show success message
        if (data.success) {
          if (data.fullyPaid) {
            alert(`🎉 Кредит полностью погашен! -${amount} 🍃 списано с вашего счета.`)
          } else {
            alert(`✅ Успешный платеж! -${amount} 🍃 списано с вашего счета.`)
          }
        }
      } else {
        const error = await response.json()
        alert(`❌ Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error repaying credit:', error)
      alert('❌ Ошибка сети при погашении кредита')
    }
  }

  const handleTransfer = async () => {
    if (transferAmount <= 0 || !transferReceiver.trim()) return
    
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) {
        alert('❌ Ошибка: пользователь не найден')
        return
      }

      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUserId}`
        },
        body: JSON.stringify({ 
          amount: transferAmount, 
          receiverNickname: transferReceiver.trim(),
          message: '', // Optional message feature
          isAnonymous: false // Optional anonymous feature
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransferAmount(0)
        setTransferReceiver('')
        loadUserData()
        
        // Show success message with details
        if (data.success) {
          const { transaction } = data
          let message = `✅ Перевод успешно выполнен!\n\n`
          message += `📤 Отправлено: ${transaction.amount} 🍃\n`
          message += `📁 Получатель: ${transaction.receiverNickname}\n`
          if (transaction.transferFee > 0) {
            message += `💰 Комиссия: ${transaction.transferFee} 🍃\n`
            message += `💸 Всего списано: ${transaction.totalDeducted} 🍃\n`
          }
          message += `🏦 Ваш баланс: ${transaction.senderBalance} 🍃`
          
          alert(message)
        }
      } else {
        const error = await response.json()
        alert(`❌ Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error transferring money:', error)
      alert('❌ Ошибка сети при выполнении перевода')
    }
  }

  const loadTransferHistory = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (!savedUserId) {
        alert('❌ Ошибка: пользователь не найден')
        return
      }

      const response = await fetch('/api/transfer', {
        headers: {
          'Authorization': `Bearer ${savedUserId}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransferHistoryData(data)
        setShowTransferHistory(true)
      } else {
        const error = await response.json()
        alert(`❌ Ошибка загрузки истории: ${error.error}`)
      }
    } catch (error) {
      console.error('Error loading transfer history:', error)
      alert('❌ Ошибка сети при загрузке истории переводов')
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
        loadMayorData()
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
        loadMayorData()
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
        loadMayorData()
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
        loadMayorData()
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
        loadMayorData()
        const input = document.querySelector('input[placeholder="Введите сумму"]') as HTMLInputElement
        if (input) input.value = ''
      }
    } catch (error) {
      console.error('Error adding money:', error)
    }
  }

  const handleMayorNightControl = async () => {
    if (mayorNightPassword === 'cucumber') {
      try {
        // Устанавливаем день в настройках игры
        const response = await fetch('/api/game-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDay: true })
        })
        
        if (response.ok) {
          setShowNightMessage(false)
          setShowMayorNightControl(false)
          setMayorNightPassword('')
          loadGameSettings() // Перезагружаем настройки игры
        }
      } catch (error) {
        console.error('Error setting day mode:', error)
        // Если не удалось сохранить в базу, все равно скрываем сообщение
        setShowNightMessage(false)
        setShowMayorNightControl(false)
        setMayorNightPassword('')
      }
    } else {
      alert('❌ Неверный пароль')
    }
  }

  const handleDepalkaSecretAccess = async () => {
    if (depalkaSecretPassword === 'cucumber2024') {
      setShowDepalkaSecretModal(false)
      window.location.href = '/depalka'
      setDepalkaSecretPassword('')
    } else {
      alert('❌ Неверный секретный пароль')
    }
  }

  const handleNightControl = async () => {
    if (nightControlPassword === 'cucumber') {
      try {
        const response = await fetch('/api/admin/day-night', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end-night' })
        })
        
        if (response.ok) {
          setShowNightControlModal(false)
          setNightControlPassword('')
          loadGameSettings() // Перезагружаем настройки игры
        }
      } catch (error) {
        console.error('Error ending night:', error)
        setShowNightControlModal(false)
        setNightControlPassword('')
      }
    } else {
      alert('❌ Неверный пароль. Только Мэры могут управлять ночью.')
    }
  }

  const handleCreatorLogin = async () => {
    // Сложный пароль для создателя
    const creatorSecretPassword = 'Cr3@t0r_2024_Cucumb3r_M@st3r!'
    
    if (creatorPassword === creatorSecretPassword) {
      setIsCreator(true)
      setShowCreatorLogin(false)
      setCreatorPassword('')
      alert('🎉 Добро пожаловать, Создатель! Теперь у вас есть доступ к панели управления.')
      
      // Обновляем роль пользователя в базе данных
      try {
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (savedUserId) {
          const response = await fetch('/api/admin/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: savedUserId, role: 'creator' })
          })
          if (response.ok) {
            loadUserData() // Обновляем данные пользователя
          }
        }
      } catch (error) {
        console.error('Error updating user role:', error)
      }
    } else {
      alert('❌ Неверный пароль Создателя. Доступ запрещен.')
    }
  }

  

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        setSelectedPlayer('')
        loadMayorData()
        // If we deleted the current user, log them out
        if (userData?.id === userId) {
          setUserData(null)
          setNickname('')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userId')
          }
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error)
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
      {/* Анимированный фон с шаром - изменяется в зависимости от темы */}
      <div className={`absolute inset-0 overflow-hidden ${currentTheme.bg}`}>
        {/* Анимированные шары */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full opacity-20 animate-pulse blur-xl"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full opacity-30 animate-pulse blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-green-400 to-emerald-300 rounded-full opacity-25 animate-pulse blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-36 h-36 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full opacity-20 animate-pulse blur-xl"></div>
        
        {/* Главный анимированный шар */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-64 h-64 bg-gradient-to-br from-white via-blue-200 to-purple-300 rounded-full animate-pulse shadow-2xl"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-blue-100 to-purple-200 rounded-full animate-ping opacity-30"></div>
            <div className="absolute inset-8 bg-gradient-to-br from-white to-blue-100 rounded-full animate-pulse"></div>
            {/* Внутренний блеск */}
            <div className="absolute top-8 left-8 w-8 h-8 bg-white/80 rounded-full blur-sm"></div>
          </div>
        </div>
        
        {/* Движущиеся частицы */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Ночной режим для всех кроме Мэра */}
      {gameSettings && !gameSettings.isDay && !isAdmin && userData && userData.nickname !== 'Аноним' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center text-white p-8 relative">
            {/* Информационная кнопка для Мэра */}
            <button
              onClick={() => setShowNightControlModal(true)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all duration-300"
              title="Информация для Мэра"
            >
              <Info className="h-5 w-5" />
            </button>
            
            <div className="text-6xl mb-4">🌙</div>
            <h2 className="text-3xl font-bold mb-4">Пора спать!</h2>
            <p className="text-lg opacity-80 mb-6">Ночь настала, все игроки должны отдохнуть.</p>
            <p className="text-sm opacity-60">Приходите утром, когда наступит день.</p>
            <div className="mt-8 text-sm opacity-50">
              💡 Только Мэры могут играть ночью
            </div>
          </div>
        </div>
      )}
      
      {/* Верхняя панель - улучшенная */}
      <div className="relative z-10 p-4">
        {/* Кнопка инфо в левом верхнем углу */}
        <div className="absolute top-4 left-4 z-20">
          <Button 
            onClick={() => setShowInfo(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-4 rounded-full flex items-center gap-2 font-bold"
          >
            <Info className="h-6 w-6" />
            <span className="hidden sm:inline">Инфо</span>
          </Button>
        </div>

        {/* Кнопки в правом верхнем углу */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {/* Кнопка креатора */}
          {isCreator && (
            <Button 
              onClick={() => window.open('/kreate', '_blank')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-3 rounded-full"
              title="Панель Креатора"
            >
              <Crown className="h-5 w-5" />
            </Button>
          )}
          
          {/* Кнопка входа/регистрации или выхода */}
          {userData ? (
            <Button 
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-3 rounded-full"
              title="Выйти"
            >
              <User className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-3 rounded-full"
              title="Войти или зарегистрироваться"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Левая часть - Только баланс */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
            {/* Улучшенное отображение баланса с анимациями */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-600/40 via-emerald-500/40 to-emerald-400/40 backdrop-blur-md px-8 py-2 rounded-2xl border-2 border-emerald-400/50 shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 hover:rotate-1 w-full max-w-4xl mx-auto">
              <div className="relative">
                <span className="font-bold text-2xl animate-pulse">🍃</span>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-xs text-emerald-200 font-medium">Баланс</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-2xl text-emerald-300 drop-shadow-lg tracking-wide">
                    {userData?.balance?.toLocaleString() || '0'}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-emerald-400/0 mx-4"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Центральная часть - День/Ночь - супер улучшенная */}
          <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-amber-600/40 via-amber-500/40 to-amber-400/40 backdrop-blur-md px-8 py-5 rounded-2xl border-2 border-amber-400/50 shadow-2xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105">
            <div className="relative">
              {gameSettings?.isDay ? (
                <div className="relative">
                  <Sun className="h-10 w-10 text-yellow-400 drop-shadow-lg animate-pulse" />
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <Moon className="h-10 w-10 text-indigo-300 drop-shadow-lg animate-pulse" />
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full animate-pulse"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-amber-200 font-medium">Время суток</span>
              <span className="font-bold text-2xl drop-shadow-lg tracking-wide">
                {gameSettings?.isDay ? '☀️ День' : '🌙 Ночь'}
              </span>
              <span className="text-xs text-amber-300/80">
                {gameSettings?.isDay ? 'Время работать' : 'Время отдыхать'}
              </span>
            </div>
          </div>
          
          {/* Настройки */}
          <div className="absolute top-4 right-4 z-20 lg:relative lg:top-auto lg:right-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button className={`${currentTheme.button} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-4 rounded-full hover:rotate-90`}>
                  <Settings className="h-7 w-7" />
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
                      {isAdmin ? '🚪 Выйти из панели Мэра' : '🔑 Вход в панель Мэра'}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-600">
                    <Button 
                      onClick={() => {
                        if (!isCreator) {
                          setShowCreatorLogin(true)
                        } else {
                          setIsCreator(false)
                          // Обновляем роль пользователя в базе данных
                          try {
                            const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
                            if (savedUserId) {
                              fetch('/api/admin/role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: savedUserId, role: 'user' })
                              })
                            }
                          } catch (error) {
                            console.error('Error updating user role:', error)
                          }
                        }
                      }}
                      className={`w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-4 ${
                        isCreator 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'
                      } text-white font-bold text-lg`}
                    >
                      {isCreator ? '👑 Выйти из панели Создателя' : '🌟 Вход в панель Создателя'}
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
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">🎮 Клуб молосольных огурчиков🥒</h1>
                <p className="text-xl text-white/80">Добро пожаловать в игровой мир!</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 max-w-md mx-auto">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Начните играть</h2>
                    <p className="text-white/70">Войдите или зарегистрируйтесь, чтобы присоединиться к игре</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setShowAuthModal(true)
                        setAuthMode('login')
                        setAuthError('')
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        Войти в аккаунт
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        setShowAuthModal(true)
                        setAuthMode('register')
                        setAuthError('')
                      }}
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10 py-4 font-bold text-lg"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        Создать аккаунт
                      </div>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-white/50">
                    Или войдите как гость:
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Введите никнейм"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Button 
                      onClick={handleSaveNickname}
                      disabled={!nickname || !nickname.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 font-bold"
                    >
                      Войти как гость
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="work" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <TabsTrigger value="work" className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-white/10 py-3 px-4 rounded-lg border border-transparent hover:border-white/30 font-medium text-sm text-white">
                  <Briefcase className="h-4 w-4" />
                  Работа
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex items-center justify-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-white/10 py-3 px-4 rounded-lg border border-transparent hover:border-white/30 font-medium text-sm text-white">
                  <CreditCard className="h-4 w-4" />
                  Кредиты
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex items-center justify-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-white/10 py-3 px-4 rounded-lg border border-transparent hover:border-white/30 font-medium text-sm text-white">
                  <Send className="h-4 w-4" />
                  Переводы
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center justify-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-white/10 py-3 px-4 rounded-lg border border-transparent hover:border-white/30 font-medium text-sm text-white">
                  <Info className="h-4 w-4" />
                  Инфо
                </TabsTrigger>
              </TabsList>
              
              {/* Дополнительные кнопки */}
              <div className="flex flex-wrap gap-2 justify-center">
                {/* Кнопка Депалки для работников казино */}
                {userData?.job?.title === 'работник казино' && (
                  <Button 
                    onClick={() => setShowDepalka(true)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-2 px-4 rounded-lg flex items-center gap-2 font-medium text-sm"
                  >
                    <GamepadIcon className="h-4 w-4" />
                    Депалка
                  </Button>
                )}
                
                {/* Кнопка панели Создателя */}
                {isCreator && (
                  <Button 
                    onClick={() => window.open('/kreate', '_blank')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-2 px-4 rounded-lg flex items-center gap-2 font-medium text-sm"
                  >
                    <Crown className="h-4 w-4" />
                    Панель Создателя
                  </Button>
                )}
                
                {/* Кнопка входа в панель создателя */}
                {!isCreator && (
                  <Button 
                    onClick={() => setShowCreatorLogin(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-2 px-4 rounded-lg flex items-center gap-2 font-medium text-sm"
                  >
                    <Crown className="h-4 w-4" />
                    Вход в панель Создателя
                  </Button>
                )}
              </div>
              
              <TabsContent value="work" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Briefcase className="h-6 w-6" />
                      Работа
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="font-medium">Текущая работа:</span>
                        <Badge variant="outline" className="text-sm px-3 py-1">{userData?.job?.title || 'Безработный'}</Badge>
                      </div>
                      {userData?.job && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="font-medium">Зарплата:</span>
                          <Badge variant="outline" className="text-sm px-3 py-1">{userData?.job?.salary} 🍃/день</Badge>
                        </div>
                      )}
                      <p className="text-sm opacity-75 p-3 bg-white/5 rounded-lg">
                        {userData?.job 
                          ? 'Вы работаете! Зарплата будет начисляться в конце каждого дня.'
                          : 'У вас нет работы. Обратитесь к Мэру, чтобы получить работу.'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CreditCard className="h-6 w-6" />
                      Кредиты
                      <Badge variant="outline" className="ml-2 text-xs bg-red-500/20 text-red-300 border-red-500/50">
                        3% в день
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Сводка по кредитам */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 p-4 rounded-xl border border-blue-400/30">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-300">
                              {userData?.credits?.length || 0}
                            </div>
                            <div className="text-sm text-blue-200">Всего кредитов</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 p-4 rounded-xl border border-red-400/30">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-300">
                              {userData?.credits?.reduce((sum, credit) => sum + (credit.amount || 0), 0) || 0}
                            </div>
                            <div className="text-sm text-red-200">Общая сумма</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 p-4 rounded-xl border border-green-400/30">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-300">
                              {userData?.credits?.filter(c => !c.isPaid)?.length || 0}
                            </div>
                            <div className="text-sm text-green-200">Активных</div>
                          </div>
                        </div>
                      </div>

                      {/* Список кредитов */}
                      {userData?.credits && userData.credits.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold mb-2 text-white">Ваши кредиты:</h3>
                          {userData.credits.map((credit) => {
                            // Calculate credit details
                            const createdAt = new Date(credit.createdAt);
                            const now = new Date();
                            const daysActive = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                            const totalOwed = credit.amount * Math.pow(1 + 0.03, daysActive);
                            const remainingAmount = Math.max(0, totalOwed - (credit.paidAmount || 0));
                            const isPaid = credit.isPaid || remainingAmount <= 0;

                            return (
                              <div key={credit.id} className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                isPaid 
                                  ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 border-green-400/30' 
                                  : 'bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-400/30 hover:from-red-600/30 hover:to-red-500/30'
                              }`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  {/* Основная информация */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-lg">Кредит #{credit.id.slice(-4)}</span>
                                      {isPaid ? (
                                        <Badge className="bg-green-600 text-green-100">Оплачен</Badge>
                                      ) : (
                                        <Badge className="bg-red-600 text-red-100 animate-pulse">Активен</Badge>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-400">Исходная сумма:</span>
                                        <span className="ml-2 font-medium">{credit.amount} 🍃</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Дней:</span>
                                        <span className="ml-2 font-medium">{daysActive}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Ставка:</span>
                                        <span className="ml-2 font-medium text-red-300">3%/день</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Оплачено:</span>
                                        <span className="ml-2 font-medium text-green-300">{credit.paidAmount || 0} 🍃</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Финансовая информация */}
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                      <div className="text-sm text-gray-400">К выплате:</div>
                                      <div className={`text-xl font-bold ${isPaid ? 'text-green-300 line-through' : 'text-red-300'}`}>
                                        {Math.round(remainingAmount * 100) / 100} 🍃
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ({Math.round(totalOwed * 100) / 100} всего)
                                      </div>
                                    </div>

                                    {/* Кнопка погашения */}
                                    {!isPaid && remainingAmount > 0 && (
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleRepayCredit(credit.id, Math.min(100, remainingAmount))}
                                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 h-auto"
                                          disabled={(userData?.balance || 0) < Math.min(100, remainingAmount)}
                                        >
                                          +100 🍃
                                        </Button>
                                        <Button
                                          onClick={() => handleRepayCredit(credit.id, Math.min(1000, remainingAmount))}
                                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 h-auto"
                                          disabled={(userData?.balance || 0) < Math.min(1000, remainingAmount)}
                                        >
                                          +1000 🍃
                                        </Button>
                                        <Button
                                          onClick={() => handleRepayCredit(credit.id, remainingAmount)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 h-auto"
                                          disabled={(userData?.balance || 0) < remainingAmount}
                                        >
                                          Полностью
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Прогресс бар погашения */}
                                {!isPaid && totalOwed > 0 && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Прогресс погашения:</span>
                                      <span>{Math.round((credit.paidAmount || 0) / totalOwed * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, Math.round((credit.paidAmount || 0) / totalOwed * 100))}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Форма взятия нового кредита */}
                      <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-6 rounded-xl border-2 border-purple-400/30">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                          <span>💰 Взять новый кредит</span>
                          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
                            3% в день
                          </Badge>
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button
                              onClick={() => handleTakeCredit(1000)}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-purple-500/50"
                              disabled={creditAmount !== 0}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xl font-black text-white drop-shadow-lg">1000 🍃</span>
                                <span className="text-sm font-semibold text-purple-100">Маленький</span>
                              </div>
                            </Button>
                            <Button
                              onClick={() => handleTakeCredit(5000)}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-purple-500/50"
                              disabled={creditAmount !== 0}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xl font-black text-white drop-shadow-lg">5000 🍃</span>
                                <span className="text-sm font-semibold text-purple-100">Средний</span>
                              </div>
                            </Button>
                            <Button
                              onClick={() => handleTakeCredit(10000)}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-purple-500/50"
                              disabled={creditAmount !== 0}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xl font-black text-white drop-shadow-lg">10000 🍃</span>
                                <span className="text-sm font-semibold text-purple-100">Большой</span>
                              </div>
                            </Button>
                          </div>
                          <div className="flex gap-3">
                            <Input
                              type="number"
                              placeholder="Свою сумму"
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(Number(e.target.value))}
                              className={`${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'} flex-1`}
                            />
                            <Button 
                              onClick={() => handleTakeCredit(creditAmount)}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 font-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-green-500/50"
                              disabled={!creditAmount || creditAmount <= 0}
                            >
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-6 w-6" />
                                <span className="text-lg font-bold">Взять кредит</span>
                              </div>
                            </Button>
                          </div>
                          <div className="text-xs text-purple-300/80 text-center p-3 bg-purple-500/10 rounded-lg font-medium">
                            ⚠️ Внимание: Кредиты начисляют 3% в день сложными процентами. 
                            Чем дольше вы не погашаете кредит, тем больше становится сумма к выплате.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <Card className={`${currentTheme.card} border-2 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Send className="h-6 w-6" />
                      Переводы
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
                        0.5% комиссия
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Статистика переводов */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 p-3 rounded-xl border border-green-400/30 text-center">
                          <div className="text-lg font-bold text-green-300">
                            {userData?.balance || 0}
                          </div>
                          <div className="text-xs text-green-200">Ваш баланс</div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 p-3 rounded-xl border border-blue-400/30 text-center">
                          <div className="text-lg font-bold text-blue-300">
                            {transferAmount || 0}
                          </div>
                          <div className="text-xs text-blue-200">Сумма перевода</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-3 rounded-xl border border-purple-400/30 text-center">
                          <div className="text-lg font-bold text-purple-300">
                            {transferAmount > 1000 ? Math.max(1, Math.round(transferAmount * 0.005)) : 0}
                          </div>
                          <div className="text-xs text-purple-200">Комиссия</div>
                        </div>
                        <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-3 rounded-xl border border-amber-400/30 text-center">
                          <div className="text-lg font-bold text-amber-300">
                            {transferAmount ? Math.max(0, (userData?.balance || 0) - transferAmount - (transferAmount > 1000 ? Math.max(1, Math.round(transferAmount * 0.005)) : 0)) : (userData?.balance || 0)}
                          </div>
                          <div className="text-xs text-amber-200">Останется</div>
                        </div>
                      </div>

                      {/* Быстрые переводы */}
                      <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 p-6 rounded-xl border-2 border-blue-400/30">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                          <span>💸 Быстрые переводы</span>
                          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
                            Популярные суммы
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Button
                            onClick={() => {
                              setTransferAmount(10)
                              setTransferReceiver('')
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-500/50"
                            disabled={(userData?.balance || 0) < 10}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-white drop-shadow-lg">10 🍃</span>
                              <span className="text-sm font-semibold text-blue-100">Минимум</span>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              setTransferAmount(50)
                              setTransferReceiver('')
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-500/50"
                            disabled={(userData?.balance || 0) < 50}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-white drop-shadow-lg">50 🍃</span>
                              <span className="text-sm font-semibold text-blue-100">Малый</span>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              setTransferAmount(100)
                              setTransferReceiver('')
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-500/50"
                            disabled={(userData?.balance || 0) < 100}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-white drop-shadow-lg">100 🍃</span>
                              <span className="text-sm font-semibold text-blue-100">Средний</span>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              setTransferAmount(500)
                              setTransferReceiver('')
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-500/50"
                            disabled={(userData?.balance || 0) < 500}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-white drop-shadow-lg">500 🍃</span>
                              <span className="text-sm font-semibold text-blue-100">Большой</span>
                            </div>
                          </Button>
                        </div>
                      </div>

                      {/* Форма перевода */}
                      <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-6 rounded-xl border-2 border-purple-400/30">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                          <span>📧 Новый перевод</span>
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-purple-200 font-bold">Сумма перевода:</label>
                              <Input
                                type="number"
                                placeholder="Введите сумму"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(Number(e.target.value))}
                                min="1"
                                max="100000"
                                className={`${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
                              />
                              <div className="text-xs text-purple-300/80 font-medium">
                                Мин: 1 🍃, Макс: 100,000 🍃
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-purple-200 font-bold">Никнейм получателя:</label>
                              <Input
                                placeholder="Введите никнейм"
                                value={transferReceiver}
                                onChange={(e) => setTransferReceiver(e.target.value)}
                                className={`${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
                              />
                              <div className="text-xs text-purple-300/80 font-medium">
                                Убедитесь, что никнейм введен правильно
                              </div>
                            </div>
                          </div>
                          
                          {/* Информация о комиссии */}
                          {transferAmount > 1000 && (
                            <div className="bg-amber-600/20 p-3 rounded-lg border border-amber-400/30">
                              <div className="text-sm text-amber-200 font-medium">
                                💡 Комиссия за перевод: <span className="font-bold">{Math.max(1, Math.round(transferAmount * 0.005))} 🍃</span>
                              </div>
                              <div className="text-xs text-amber-300/80 font-medium">
                                Комиссия 0.5% взимается с переводов свыше 1000 🍃
                              </div>
                            </div>
                          )}

                          {/* Кнопка отправки */}
                          <Button 
                            onClick={handleTransfer}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full py-5 text-xl font-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-green-500/50"
                            disabled={!transferAmount || !transferReceiver.trim() || transferAmount <= 0 || transferAmount > (userData?.balance || 0)}
                          >
                            <div className="flex items-center justify-center gap-3">
                              <Send className="h-7 w-7" />
                              <span className="text-xl font-bold">Отправить перевод</span>
                              <span className="text-xl">💸</span>
                            </div>
                          </Button>

                          {/* Предупреждение */}
                          <div className="text-sm text-purple-300/80 text-center p-4 bg-purple-500/20 rounded-lg font-semibold border border-purple-400/30">
                            ⚠️ Убедитесь в правильности никнейма получателя. Переводы необратимы.
                            Комиссия: 0.5% для сумм свыше 1000 🍃.
                          </div>
                        </div>
                      </div>

                      {/* История переводов (кнопка для загрузки) */}
                      <div className="text-center">
                        <Button
                          onClick={loadTransferHistory}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <span>Загрузить историю переводов</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {userData?.job?.title === 'работник казино' && (
                <TabsContent value="depalka" className="space-y-4">
                  <Card className={`${currentTheme.card} border-2 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        🎰 Депалка
                        <Badge variant="outline" className="ml-2 text-xs bg-red-500/20 text-red-300 border-red-500/50">
                          Только для работников казино
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center space-y-4">
                        <div className="text-6xl">🎰</div>
                        <p className="text-lg">Добро пожаловать в Депалку!</p>
                        <Button 
                          onClick={() => window.location.href = '/depalka'}
                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-3 px-8 rounded-xl font-bold"
                        >
                          🎰 Открыть Депалку
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>

      {/* Кнопка панели Мэра (если пользователь - Мэр) - улучшенная */}
      {(isMayor || isAdmin) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <Dialog>
            <DialogTrigger asChild>
              <Button className={`${currentTheme.button} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 font-bold`}>
                <Settings className="h-5 w-5" />
                <span>Панель Мэра</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`bg-gray-900/95 backdrop-blur-sm border-blue-500/30 shadow-2xl text-white max-w-4xl max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  🏛️ Панель Мэра
                </DialogTitle>
              </DialogHeader>
              {/* Здесь будет контент панели Мэра */}
              <div className="space-y-6">
                <p className="text-gray-300">Панель управления городом. Здесь вы можете управлять игроками, экономикой и другими параметрами.</p>
                {isCreator && (
                  <Button 
                    onClick={() => window.open('/kreate', '_blank')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Открыть панель Креатора
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Кнопка входа в панель Мэра (если пользователь не Мэр) - улучшенная */}
      {!isMayor && !isAdmin && userData && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <Button 
            onClick={() => setShowAdminLogin(true)}
            className={`${currentTheme.button} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 font-bold`}
          >
            <Settings className="h-5 w-5" />
            <span>Вход в панель Мэра</span>
          </Button>
        </div>
      )}

      {/* Кнопка Депалки (для работников казино) */}
      {userData?.job?.title === 'работник казино' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <Button 
            onClick={() => window.location.href = '/depalka'}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 font-bold">
            <GamepadIcon className="h-5 w-5" />
            <span>Депалка</span>
          </Button>
        </div>
      )}

      {/* Кнопка Депалки (для Креатора с секретным паролем) */}
      {isCreator && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <Button 
            onClick={() => setShowDepalkaSecretModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 font-bold">
            <Crown className="h-5 w-5" />
            <span>Секретная Депалка</span>
          </Button>
        </div>
      )}

      {/* Уведомления */}
      {/* Уведомления */}
      {showNightMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span>🌙 Наступила ночь! Все игроки получили зарплату.</span>
          <button 
            onClick={() => setShowAdminNightControl(true)}
            className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors duration-200"
            title="Информация для Мэра"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      )}

      {creditReminder && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          ⚠️ У вас есть неоплаченные кредиты! Не забудьте их погасить.
        </div>
      )}

  

      {/* Модальное окно управления ночью через кнопку i */}
      {showNightControlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🌙 Управление ночью</h3>
            <p className="text-sm mb-4 opacity-80">
              Если вы Мэр, вы можете ввести пароль и отключить ночной режим, 
              чтобы продолжить игру.
            </p>
            <Input
              type="password"
              placeholder="Введите пароль Мэра"
              value={nightControlPassword}
              onChange={(e) => setNightControlPassword(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleNightControl} className={currentTheme.button}>
                Отключить ночь
              </Button>
              <Button 
                onClick={() => {
                  setShowNightControlModal(false)
                  setNightControlPassword('')
                }} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления ночным режимом */}
      {showMayorNightControl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🔑 Управление ночным режимом</h3>
            <p className="text-sm mb-4 opacity-80">
              Если вы Мэр, вы можете отключить ночной режим и продолжить игру.
            </p>
            <Input
              type="password"
              placeholder="Введите пароль Мэра"
              value={mayorNightPassword}
              onChange={(e) => setMayorNightPassword(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleMayorNightControl} className={currentTheme.button}>
                Отключить ночь
              </Button>
              <Button 
                onClick={() => {
                  setShowMayorNightControl(false)
                  setMayorNightPassword('')
                }} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно входа/регистрации */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setAuthMode('login')}
                className={`flex-1 ${authMode === 'login' ? currentTheme.button : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                Вход
              </Button>
              <Button
                onClick={() => setAuthMode('register')}
                className={`flex-1 ${authMode === 'register' ? currentTheme.button : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                Регистрация
              </Button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">🔐 Вход в систему</h3>
                <Input
                  type="text"
                  placeholder="Никнейм"
                  value={loginNickname}
                  onChange={(e) => setLoginNickname(e.target.value)}
                  className={currentTheme.input}
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={currentTheme.input}
                />
                {authError && (
                  <div className="text-red-400 text-sm text-center">{authError}</div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleLogin} className={`${currentTheme.button} flex-1`}>
                    Войти
                  </Button>
                  <Button 
                    onClick={() => setShowAuthModal(false)} 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">📝 Регистрация</h3>
                <Input
                  type="text"
                  placeholder="Никнейм"
                  value={registerNickname}
                  onChange={(e) => setRegisterNickname(e.target.value)}
                  className={currentTheme.input}
                />
                <Input
                  type="email"
                  placeholder="Email (необязательно)"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={currentTheme.input}
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className={currentTheme.input}
                />
                <Input
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className={currentTheme.input}
                />
                {authError && (
                  <div className="text-red-400 text-sm text-center">{authError}</div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleRegister} className={`${currentTheme.button} flex-1`}>
                    Зарегистрироваться
                  </Button>
                  <Button 
                    onClick={() => setShowAuthModal(false)} 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно входа в панель Мэра */}
      {showMayorLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🏛️ Вход в панель Мэра</h3>
            <p className="text-sm mb-4 opacity-80">
              Если вы Мэр, вы можете ввести пароль и получить доступ к управлению городом, 
              включая возможность отключить ночной режим.
            </p>
            <Input
              type="password"
              placeholder="Введите код"
              value={mayorCode}
              onChange={(e) => setMayorCode(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleMayorLogin} className={currentTheme.button}>
                Войти
              </Button>
              <Button 
                onClick={() => setShowMayorLogin(false)} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Улучшенное информационное окно */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-sm border-2 border-purple-500/40 shadow-2xl text-white max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
              <Info className="h-6 w-6" />
              Информация о игроке
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Основная информация */}
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-4 rounded-xl border border-purple-400/30">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-300 text-lg">👤 Никнейм:</span>
                <span className="font-bold text-white text-lg">{userData?.nickname || 'Аноним'}</span>
              </div>
            </div>

            {/* Информация о работе */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 p-4 rounded-xl border border-blue-400/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-300 text-lg">💼 Работа:</span>
                <span className="font-bold text-white text-lg">{userData?.job?.title || 'Безработный'}</span>
              </div>
              {userData?.job && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-200">Зарплата:</span>
                  <span className="font-bold text-green-300">{userData?.job?.salary} 🍃/день</span>
                </div>
              )}
            </div>

            {/* Финансовая информация */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 p-4 rounded-xl border border-emerald-400/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-emerald-300 text-lg">🍃 Баланс:</span>
                <span className="font-bold text-white text-xl">{userData?.balance || 0} 🍃</span>
              </div>
              
              {/* Информация о кредитах */}
              {userData?.credits && userData.credits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-400/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-300">💰 Кредиты:</span>
                    <span className="font-bold text-red-300">
                      {userData.credits.length} активных
                    </span>
                  </div>
                  <div className="text-sm text-red-200">
                    Общая задолженность: {userData.credits.reduce((sum, credit) => sum + (credit.amount || 0), 0)} 🍃
                  </div>
                </div>
              )}
            </div>

            {/* Статус и роль */}
            <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-4 rounded-xl border border-amber-400/30">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 text-lg">🎭 Роль:</span>
                <span className="font-bold text-white">{userData?.role || 'Пользователь'}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-medium text-amber-200">Статус:</span>
                <span className={`font-bold ${userData?.isAdmin ? 'text-green-300' : 'text-gray-300'}`}>
                  {userData?.isAdmin ? '🔑 Администратор' : '👤 Игрок'}
                </span>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="text-center text-sm text-gray-400 pt-2 border-t border-gray-600">
              📱 Данные синхронизируются между всеми вашими устройствами
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Красивое окно истории переводов */}
      <Dialog open={showTransferHistory} onOpenChange={setShowTransferHistory}>
        <DialogContent className="bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-sm border-2 border-blue-500/40 shadow-2xl text-white max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
              📋 История переводов
            </DialogTitle>
          </DialogHeader>
          
          {transferHistoryData && (
            <div className="space-y-6">
              {/* Статистика */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 rounded-xl border border-purple-400/30">
                <h3 className="text-lg font-semibold mb-3 text-purple-300">📊 Статистика</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300">
                      {transferHistoryData.statistics.totalSent} 🍃
                    </div>
                    <div className="text-sm text-gray-400">Отправлено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">
                      {transferHistoryData.statistics.totalReceived} 🍃
                    </div>
                    <div className="text-sm text-gray-400">Получено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-300">
                      {transferHistoryData.statistics.totalFees} 🍃
                    </div>
                    <div className="text-sm text-gray-400">Комиссии</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-300">
                      {transferHistoryData.statistics.totalTransactions}
                    </div>
                    <div className="text-sm text-gray-400">Транзакций</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className={`text-lg font-bold ${
                    transferHistoryData.statistics.netTransfer > 0 
                      ? 'text-green-300' 
                      : transferHistoryData.statistics.netTransfer < 0 
                        ? 'text-red-300' 
                        : 'text-gray-300'
                  }`}>
                    Чистый результат: {transferHistoryData.statistics.netTransfer > 0 ? '+' : ''}{transferHistoryData.statistics.netTransfer} 🍃
                  </div>
                </div>
              </div>

              {/* Отправленные переводы */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-300">📤 Отправленные</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transferHistoryData.sentTransactions.length > 0 ? (
                    transferHistoryData.sentTransactions.map((t: any, index: number) => (
                      <div key={index} className="bg-red-600/20 p-3 rounded-lg border border-red-400/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{t.amount} 🍃</div>
                            <div className="text-sm text-gray-400">
                              → {t.receiverNickname} • {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                          {t.fee > 0 && (
                            <div className="text-xs text-red-300">
                              комиссия {t.fee} 🍃
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      Нет отправленных переводов
                    </div>
                  )}
                </div>
              </div>

              {/* Полученные переводы */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-300">📥 Полученные</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transferHistoryData.receivedTransactions.length > 0 ? (
                    transferHistoryData.receivedTransactions.map((t: any, index: number) => (
                      <div key={index} className="bg-green-600/20 p-3 rounded-lg border border-green-400/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{t.amount} 🍃</div>
                            <div className="text-sm text-gray-400">
                              ← {t.senderNickname} • {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      Нет полученных переводов
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно аутентификации */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">
              {authMode === 'login' ? '🔑 Вход в аккаунт' : '📝 Регистрация'}
            </h3>
            
            {authError && (
              <div className="bg-red-600/20 border border-red-400/30 text-red-300 p-3 rounded-lg mb-4">
                {authError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Никнейм</label>
                <Input
                  placeholder="Введите никнейм"
                  value={authMode === 'login' ? loginNickname : registerNickname}
                  onChange={(e) => {
                    if (authMode === 'login') {
                      setLoginNickname(e.target.value)
                    } else {
                      setRegisterNickname(e.target.value)
                    }
                  }}
                  className={currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}
                />
              </div>
              
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Email (опционально)</label>
                  <Input
                    type="email"
                    placeholder="Введите email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className={currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Пароль</label>
                <Input
                  type="password"
                  placeholder="Введите пароль"
                  value={authMode === 'login' ? loginPassword : registerPassword}
                  onChange={(e) => {
                    if (authMode === 'login') {
                      setLoginPassword(e.target.value)
                    } else {
                      setRegisterPassword(e.target.value)
                    }
                  }}
                  className={currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}
                />
              </div>
              
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
                  <Input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className={currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={authMode === 'login' ? handleLogin : handleRegister}
                  className={currentTheme.button}
                >
                  {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
                </Button>
                <Button 
                  onClick={() => {
                    setShowAuthModal(false)
                    setAuthError('')
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Отмена
                </Button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                    setAuthError('')
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  {authMode === 'login' 
                    ? 'Нет аккаунта? Зарегистрируйтесь' 
                    : 'Есть аккаунт? Войдите'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно секретного пароля депалки */}
      {showDepalkaSecretModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🎰 Доступ к Депалке</h3>
            <p className="text-sm mb-4 opacity-80">
              Для доступа к Депалке требуется секретный пароль. 
              Эта функция доступна только для избранных.
            </p>
            <Input
              type="password"
              placeholder="Введите секретный пароль"
              value={depalkaSecretPassword}
              onChange={(e) => setDepalkaSecretPassword(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleDepalkaSecretAccess} className={currentTheme.button}>
                Войти
              </Button>
              <Button 
                onClick={() => setShowDepalkaSecretModal(false)} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Компонент Депалки */}
      {showDepalka && userData && (
        <Depalka 
          userData={userData} 
          onClose={() => setShowDepalka(false)} 
        />
      )}

      {/* Модальное окно управления ночью для Мэра */}
      {showNightControlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🌙 Управление ночью</h3>
            <p className="text-sm mb-4 opacity-80">
              Если вы Мэр, вы можете ввести пароль и отключить ночной режим, 
              чтобы все игроки могли продолжить играть.
            </p>
            <Input
              type="password"
              placeholder="Введите пароль Мэра"
              value={nightControlPassword}
              onChange={(e) => setNightControlPassword(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleNightControl} className={currentTheme.button}>
                Отключить ночь
              </Button>
              <Button 
                onClick={() => {
                  setShowNightControlModal(false)
                  setNightControlPassword('')
                }} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно входа Создателя */}
      {showCreatorLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${currentTheme.card} p-6 rounded-lg max-w-md w-full mx-4`}>
            <h3 className="text-xl font-bold mb-4">🌟 Вход в панель Создателя</h3>
            <p className="text-sm mb-4 opacity-80">
              Для доступа к панели Создателя требуется специальный пароль. 
              Эта функция доступна только для создателя системы.
            </p>
            <Input
              type="password"
              placeholder="Введите пароль Создателя"
              value={creatorPassword}
              onChange={(e) => setCreatorPassword(e.target.value)}
              className={`mb-4 ${currentTheme.input || 'bg-white/10 border-white/20 text-white placeholder-white/50'}`}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreatorLogin} className={currentTheme.button}>
                Войти
              </Button>
              <Button 
                onClick={() => {
                  setShowCreatorLogin(false)
                  setCreatorPassword('')
                }} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

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