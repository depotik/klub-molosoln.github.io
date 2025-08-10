import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { gameId, result, multiplier } = await request.json();

    if (!gameId || !result || !multiplier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Находим игру
    const game = await db.depalkaGame.findUnique({
      where: { id: gameId },
      include: {
        player: true,
        worker: true
      }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Проверяем, что игра подтверждена
    if (game.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Game is not confirmed' },
        { status: 400 }
      );
    }

    // Обновляем баланс игрока в случае победы
    if (result === 'win') {
      const winAmount = game.gameAmount * multiplier;
      
      await db.user.update({
        where: { id: game.playerId },
        data: {
          balance: {
            increment: winAmount
          }
        }
      });

      // Создаем транзакцию
      await db.transaction.create({
        data: {
          amount: winAmount,
          senderId: game.workerId,
          receiverId: game.playerId
        }
      });
    }

    // Обновляем статус игры
    const updatedGame = await db.depalkaGame.update({
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
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error finishing game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}