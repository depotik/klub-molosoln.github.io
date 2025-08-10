import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, targetId, amount } = await request.json()
    
    if (!userId || !targetId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем, что пользователь работает в казино
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'mayor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем баланс цели
    const target = await db.user.findUnique({
      where: { id: targetId }
    })

    if (!target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    if (target.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Создаем сессию депалки
    const session = await db.depalkaSession.create({
      data: {
        userId,
        targetId,
        amount,
        status: 'pending'
      }
    })

    return NextResponse.json({ 
      sessionId: session.id,
      status: session.status 
    })
  } catch (error) {
    console.error('Error creating depalka session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const targetId = searchParams.get('targetId')
    const userId = searchParams.get('userId')

    if (sessionId) {
      // Получаем конкретную сессию
      const session = await db.depalkaSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: { nickname: true }
          },
          target: {
            select: { nickname: true, balance: true }
          }
        }
      })

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({ session })
    } else if (targetId) {
      // Получаем активные сессии для цели
      const sessions = await db.depalkaSession.findMany({
        where: { 
          targetId,
          status: 'pending'
        },
        include: {
          user: {
            select: { nickname: true }
          }
        }
      })

      return NextResponse.json({ sessions })
    } else if (userId) {
      // Получаем активные сессии для работника
      const sessions = await db.depalkaSession.findMany({
        where: { 
          userId,
          status: 'pending'
        },
        include: {
          target: {
            select: { id: true, nickname: true, balance: true }
          }
        }
      })

      return NextResponse.json(sessions)
    }

    return NextResponse.json({ error: 'Missing sessionId, targetId, or userId' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching depalka session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}