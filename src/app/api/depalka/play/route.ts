import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { gameId, result, multiplier } = await request.json()
    
    if (!gameId || !result || !multiplier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use database transaction for atomic operations
    const gameResult = await db.$transaction(async (tx) => {
      const game = await tx.depalkaGame.findUnique({
        where: { id: gameId },
        include: {
          player: true,
          worker: true
        }
      })

      if (!game || game.status !== 'confirmed') {
        throw new Error('Invalid game')
      }

      // Calculate win amount first
      let winAmount = 0
      if (result === 'win') {
        winAmount = Math.floor(game.amount * multiplier)
      }

      // Update player balance in a single operation
      const balanceChange = result === 'win' ? winAmount - game.amount : -game.amount
      const updatedPlayer = await tx.user.update({
        where: { id: game.playerId },
        data: {
          balance: game.player.balance + balanceChange
        }
      })

      // Update game status
      const finishedGame = await tx.depalkaGame.update({
        where: { id: gameId },
        data: {
          status: 'finished',
          result,
          multiplier,
          finishedAt: new Date()
        },
        include: {
          player: {
            select: {
              id: true,
              nickname: true,
              balance: true
            }
          },
          worker: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      })

      // Update associated session
      await tx.depalkaSession.updateMany({
        where: {
          OR: [
            { gameData: { contains: gameId } },
            { targetId: game.playerId, userId: game.workerId }
          ]
        },
        data: {
          status: 'completed'
        }
      })

      return {
        finishedGame,
        updatedPlayer,
        winAmount
      }
    })

    const response = NextResponse.json({
      success: true,
      result,
      winAmount: gameResult.winAmount,
      newBalance: gameResult.updatedPlayer.balance,
      game: gameResult.finishedGame
    })

    // Add performance headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response

  } catch (error: any) {
    console.error('Error playing depalka game:', error)
    
    if (error.message === 'Invalid game') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}