'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GlobeLoginProps {
  onLogin: (nickname: string) => void
  currentNickname: string
  onNicknameChange: (nickname: string) => void
  isLoading?: boolean
}

export default function GlobeLogin({ onLogin, currentNickname, onNicknameChange, isLoading = false }: GlobeLoginProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [dots, setDots] = useState<Array<{x: number, y: number, size: number, opacity: number, pulse: number}>>([])
  const [hoveredDot, setHoveredDot] = useState<number | null>(null)
  const [deviceInfo, setDeviceInfo] = useState('')
  const [savedUsers, setSavedUsers] = useState<Array<{id: string, nickname: string, lastLogin: string}>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Generate random dots for the globe effect
  useEffect(() => {
    const generateDots = () => {
      const newDots = []
      const centerX = 200
      const centerY = 200
      const radius = 150
      
      // Create continent patterns
      const continents = [
        { centerX: 0.3, centerY: 0.4, width: 0.4, height: 0.3 }, // Africa/Europe
        { centerX: 0.7, centerY: 0.3, width: 0.25, height: 0.4 }, // Asia
        { centerX: 0.2, centerY: 0.7, width: 0.3, height: 0.2 }, // South America
        { centerX: 0.8, centerY: 0.8, width: 0.15, height: 0.15 }, // Australia
      ]
      
      for (let i = 0; i < 300; i++) {
        let x, y
        
        // 70% chance to place dots in continents, 30% random
        if (Math.random() < 0.7) {
          const continent = continents[Math.floor(Math.random() * continents.length)]
          const continentX = centerX + (continent.centerX - 0.5) * radius * 1.5
          const continentY = centerY + (continent.centerY - 0.5) * radius * 1.2
          
          x = continentX + (Math.random() - 0.5) * radius * continent.width
          y = continentY + (Math.random() - 0.5) * radius * continent.height
        } else {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * radius
          x = centerX + Math.cos(angle) * distance
          y = centerY + Math.sin(angle) * distance * 0.7
        }
        
        // Check if dot is within globe
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        if (distanceFromCenter <= radius) {
          newDots.push({
            x,
            y,
            size: Math.random() * 4 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            pulse: Math.random() * Math.PI * 2
          })
        }
      }
      
      setDots(newDots)
    }

    generateDots()
  }, [])

  // Get device info and saved users
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get device info
      const userAgent = navigator.userAgent
      let deviceType = 'Unknown'
      
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        deviceType = 'Tablet'
      } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        deviceType = 'Mobile'
      } else if (/mac|win|linux/i.test(userAgent)) {
        deviceType = 'Desktop'
      }
      
      setDeviceInfo(`${deviceType} • ${new Date().toLocaleDateString()}`)
      
      // Load saved users
      const saved = localStorage.getItem('savedUsers')
      if (saved) {
        try {
          const users = JSON.parse(saved)
          setSavedUsers(users.slice(0, 5)) // Show last 5 users
        } catch (error) {
          console.error('Error loading saved users:', error)
        }
      }
    }
  }, [])

  // Save user to localStorage
  const saveUser = (userId: string, nickname: string) => {
    if (typeof window === 'undefined') return
    
    const saved = localStorage.getItem('savedUsers')
    let users = []
    
    if (saved) {
      try {
        users = JSON.parse(saved)
      } catch (error) {
        console.error('Error parsing saved users:', error)
      }
    }
    
    // Remove if already exists
    users = users.filter((u: any) => u.id !== userId)
    
    // Add new user
    users.unshift({
      id: userId,
      nickname,
      lastLogin: new Date().toISOString()
    })
    
    // Keep only last 10 users
    users = users.slice(0, 10)
    
    localStorage.setItem('savedUsers', JSON.stringify(users))
    setSavedUsers(users.slice(0, 5))
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = 200
      const centerY = 200
      const radius = 150
      
      // Draw globe shadow
      ctx.beginPath()
      ctx.arc(centerX + 5, centerY + 5, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fill()
      
      // Draw globe outline with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Draw animated dots
      const time = Date.now() * 0.001
      dots.forEach((dot, index) => {
        const pulseOpacity = Math.sin(time * 2 + dot.pulse) * 0.3 + 0.7
        const isHovered = hoveredDot === index
        const size = isHovered ? dot.size * 1.5 : dot.size
        
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity * pulseOpacity})`
        ctx.fill()
        
        if (isHovered) {
          // Draw glow effect for hovered dot
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, size * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
          ctx.fill()
        }
      })
      
      // Draw meridian lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(centerX, centerY - radius)
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
        ctx.stroke()
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dots, hoveredDot])

  // Handle mouse movement for interactive dots
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find closest dot
    let closestDot = null
    let minDistance = 20 // Maximum distance for hover effect

    dots.forEach((dot, index) => {
      const distance = Math.sqrt(Math.pow(x - dot.x, 2) + Math.pow(y - dot.y, 2))
      if (distance < minDistance) {
        minDistance = distance
        closestDot = index
      }
    })

    setHoveredDot(closestDot)
  }

  const handleMouseLeave = () => {
    setHoveredDot(null)
  }

  const handleLogin = () => {
    if (!currentNickname.trim()) return
    
    setIsAnimating(true)
    setTimeout(() => {
      onLogin(currentNickname.trim())
      // Save user info after successful login
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (savedUserId) {
        saveUser(savedUserId, currentNickname.trim())
      }
      setIsAnimating(false)
    }, 1500)
  }

  const handleQuickLogin = (userId: string, nickname: string) => {
    setIsAnimating(true)
    setTimeout(() => {
      // Set the user ID in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', userId)
      }
      onNicknameChange(nickname)
      saveUser(userId, nickname)
      setIsAnimating(false)
      // Trigger login after a short delay
      setTimeout(() => {
        onLogin(nickname)
      }, 500)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Globe container */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-6xl">
        {/* Left side - Globe visualization */}
        <div className="flex-shrink-0 relative">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width="400"
              height="400"
              className={`transition-all duration-1500 ${isAnimating ? 'scale-125 rotate-360 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            
            {/* Animated rings around globe */}
            <div className={`absolute inset-0 border-2 border-white/20 rounded-full transition-all duration-1000 ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
              <div className="absolute inset-0 border border-white/10 rounded-full animate-pulse"></div>
            </div>
            
            <div className={`absolute inset-0 border border-white/10 rounded-full transition-all duration-1000 delay-100 ${isAnimating ? 'scale-175 opacity-0' : 'scale-110 opacity-50'}`}>
            </div>
            
            {/* Connecting lines animation */}
            {!isAnimating && (
              <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{
                      top: `${20 + i * 15}%`,
                      animation: `scanLine ${3 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 max-w-md w-full">
          <Card className="bg-black/80 backdrop-blur-sm border-white/20 shadow-2xl transform transition-all duration-500 hover:scale-105">
            <CardHeader className="text-center">
              <CardTitle className={`text-3xl font-bold text-white mb-2 transition-all duration-500 ${isAnimating ? 'scale-110 text-green-400' : 'scale-100'}`}>
                🌍 Добро пожаловать
              </CardTitle>
              <p className="text-gray-300 text-lg">
                Клуб молосольных огурчиков
              </p>
              <Badge variant="outline" className="mx-auto bg-blue-500/20 text-blue-300 border-blue-500/50">
                {deviceInfo}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick login for saved users */}
              {savedUsers.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Быстрый вход:
                  </label>
                  <div className="space-y-2">
                    {savedUsers.map((user) => (
                      <Button
                        key={user.id}
                        onClick={() => handleQuickLogin(user.id, user.nickname)}
                        variant="outline"
                        className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <span className="truncate">👤 {user.nickname}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* New user registration */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  {savedUsers.length > 0 ? 'Или войдите как новый игрок:' : 'Ваш никнейм:'}
                </label>
                <Input
                  placeholder="Введите никнейм"
                  value={currentNickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 text-lg py-3 px-4 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin()
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleLogin}
                disabled={!currentNickname.trim() || isLoading}
                className={`w-full py-3 text-lg font-semibold transition-all duration-500 transform ${
                  isAnimating 
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 scale-110 shadow-2xl' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg'
                } text-white`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Загрузка...
                  </div>
                ) : isAnimating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-bounce">🚀</div>
                    Вход в систему...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">🌟</span>
                    {savedUsers.length > 0 ? 'Войти как новый игрок' : 'Войти в клуб'}
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-gray-400">
                <p>Введите уникальный никнейм чтобы присоединиться к нашему клубу</p>
                <p className="text-xs mt-1">Ваши данные будут сохранены на этом устройстве</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-1 h-1 bg-white rounded-full animate-ping opacity-30"></div>

      {/* Geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 border border-white/20 rounded-lg animate-spin-slow"></div>
      <div className="absolute top-3/4 right-1/4 w-6 h-6 border border-white/20 rounded-full animate-pulse"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes scanLine {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 1; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}