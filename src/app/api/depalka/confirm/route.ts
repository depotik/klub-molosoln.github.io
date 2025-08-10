import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, playerId, amount } = await request.json();

    if (!sessionId || !playerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Находим сессию
    const session = await db.depalkaSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true, // worker
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Проверяем, что сессия ожидает подтверждения
    if (session.status !== 'pending') {
      return NextResponse.json(
        { error: 'Session is not pending confirmation' },
        { status: 400 }
      );
    }

    // Проверяем, что подтверждает правильный игрок
    if (session.targetId !== playerId) {
      return NextResponse.json(
        { error: 'Unauthorized player' },
        { status: 403 }
      );
    }

    // Use transaction for atomic operations
    const result = await db.$transaction(async (tx) => {
      // Проверяем баланс игрока еще раз
      const player = await tx.user.findUnique({
        where: { id: playerId }
      });

      if (!player || player.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Списываем деньги сразу при подтверждении
      const updatedPlayer = await tx.user.update({
        where: { id: playerId },
        data: { balance: player.balance - amount }
      });

      // Создаем игру на основе сессии
      const game = await tx.depalkaGame.create({
        data: {
          playerId: session.targetId,
          workerId: session.userId,
          amount: amount,
          gameAmount: amount,
          status: 'confirmed',
          confirmedAt: new Date()
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
      });

      // Обновляем статус сессии
      await tx.depalkaSession.update({
        where: { id: sessionId },
        data: {
          status: 'confirmed',
          amount: amount,
          gameData: JSON.stringify({ gameId: game.id })
        }
      });

      return { game, updatedPlayer };
    });

    return NextResponse.json({
      game: result.game,
      newBalance: result.updatedPlayer.balance
    });
  } catch (error: any) {
    console.error('Error confirming game:', error);
    
    if (error.message === 'Insufficient balance') {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}