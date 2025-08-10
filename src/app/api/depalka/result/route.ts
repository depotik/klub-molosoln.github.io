import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { gameId, result, multiplier } = await request.json()
    
    if (!gameId || !result || multiplier === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const game = await db.depalkaGame.findUnique({
      where: { id: gameId },
      include: {
        player: true
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Calculate final amount and update player balance
    const finalAmount = result === 'win' ? game.gameAmount * multiplier : 0
    const balanceChange = finalAmount - game.amount

    // Update game
    const updatedGame = await db.depalkaGame.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        result,
        multiplier
      }
    })

    // Update player balance
    await db.user.update({
      where: { id: game.playerId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    })

    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('Error saving game result:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}