import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Простое кэширование в памяти
const cache = new Map();
const CACHE_TTL = 5000; // 5 секунд

function getCache(key: string) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      // Проверяем кэш
      const cacheKey = `user:${userId}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
      
      // Загружаем конкретного пользователя по ID
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Параллельно загружаем связанные данные
      const [credits, job] = await Promise.all([
        db.credit.findMany({
          where: { userId: user.id }
        }),
        db.job.findFirst({
          where: { userId: user.id }
        })
      ])

      const userData = {
        id: user.id,
        nickname: user.nickname,
        balance: user.balance,
        isAdmin: user.isAdmin,
        theme: user.theme,
        role: user.role,
        job: job ? { title: job.title, salary: job.salary } : undefined,
        credits: credits.map(credit => ({
          id: credit.id,
          amount: credit.amount
        }))
      }

      setCache(cacheKey, userData);
      
      const response = NextResponse.json(userData);
      // Add caching headers for instant operations
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response;
    } else {
      // Для демо создаем пользователя если его нет (старое поведение)
      let user = await db.user.findFirst()
      
      if (!user) {
        user = await db.user.create({
          data: {
            nickname: 'Аноним',
            balance: 1000,
            isAdmin: false,
            theme: 'space',
            role: 'user'
          }
        })
      }

      const [credits, job] = await Promise.all([
        db.credit.findMany({
          where: { userId: user.id }
        }),
        db.job.findFirst({
          where: { userId: user.id }
        })
      ])

      const response = NextResponse.json({
        id: user.id,
        nickname: user.nickname,
        balance: user.balance,
        isAdmin: user.isAdmin,
        theme: user.theme,
        role: user.role,
        job: job ? { title: job.title, salary: job.salary } : undefined,
        credits: credits.map(credit => ({
          id: credit.id,
          amount: credit.amount
        }))
      })

      // Add caching headers for instant operations
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nickname, userId } = await request.json()
    
    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Invalid nickname' }, { status: 400 })
    }

    let user

    if (userId) {
      // Если передан userId, пытаемся найти пользователя
      user = await db.user.findUnique({
        where: { id: userId }
      })
      
      if (user) {
        // Обновляем никнейм, если он еще не установлен
        if (user.nickname === 'Аноним') {
          user = await db.user.update({
            where: { id: userId },
            data: { nickname }
          })
          
          // Очищаем кэш после обновления
          cache.delete(`user:${userId}`);
        }
      } else {
        // Если пользователь не найден, создаем нового с указанным ID
        user = await db.user.create({
          data: {
            id: userId,
            nickname,
            balance: 1000,
            isAdmin: false,
            theme: 'space',
            role: 'user'
          }
        })
      }
    } else {
      // Если userId не передан, используем старую логику
      user = await db.user.findFirst()
      
      if (!user) {
        user = await db.user.create({
          data: {
            nickname,
            balance: 1000,
            isAdmin: false,
            theme: 'space',
            role: 'user'
          }
        })
      } else {
        // Позволяем изменить никнейм только если он еще не установлен
        if (user.nickname === 'Аноним') {
          user = await db.user.update({
            where: { id: user.id },
            data: { nickname }
          })
          
          // Очищаем кэш после обновления
          cache.delete(`user:${user.id}`);
        }
      }
    }

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      balance: user.balance,
      isAdmin: user.isAdmin,
      theme: user.theme,
      role: user.role
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}