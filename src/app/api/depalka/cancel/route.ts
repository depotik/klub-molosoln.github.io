import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing game ID' },
        { status: 400 }
      );
    }

    // Находим игру
    const game = await db.depalkaGame.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Проверяем, что игру можно отменить
    if (game.status !== 'pending' && game.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Game cannot be cancelled' },
        { status: 400 }
      );
    }

    // Обновляем статус игры
    const updatedGame = await db.depalkaGame.update({
      where: { id: gameId },
      data: {
        status: 'cancelled',
        finishedAt: new Date()
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error cancelling game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}