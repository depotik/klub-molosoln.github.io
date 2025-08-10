import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, targetId } = await request.json()
    
    if (!userId || !targetId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Get worker and player
    const worker = await db.user.findUnique({
      where: { id: userId }
    })

    const player = await db.user.findUnique({
      where: { id: targetId }
    })

    if (!worker || !player) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify worker is casino employee
    if (worker.job?.title !== 'работник казино') {
      return NextResponse.json({ error: 'Only casino workers can initiate games' }, { status: 403 })
    }

    // Create session without amount (player will choose amount)
    const session = await db.depalkaSession.create({
      data: {
        userId: worker.id,
        targetId: player.id,
        amount: 0, // Player will choose amount
        status: 'pending'
      }
    })

    // Return session with player info
    const sessionWithInfo = {
      ...session,
      player: {
        id: player.id,
        nickname: player.nickname,
        balance: player.balance
      }
    }

    return NextResponse.json(sessionWithInfo)
  } catch (error) {
    console.error('Error initiating game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}