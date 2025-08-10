import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { playerId, amount, workerId } = await request.json();

    if (!playerId || !amount || !workerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем существование игрока и работника
    const player = await db.user.findUnique({
      where: { id: playerId }
    });

    const worker = await db.user.findUnique({
      where: { id: workerId }
    });

    if (!player || !worker) {
      return NextResponse.json(
        { error: 'Player or worker not found' },
        { status: 404 }
      );
    }

    // Проверяем баланс игрока
    if (player.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient player balance' },
        { status: 400 }
      );
    }

    // Проверяем, что работник работает в казино
    if (worker.job?.title !== 'Казино') {
      return NextResponse.json(
        { error: 'Worker is not a casino employee' },
        { status: 403 }
      );
    }

    // Создаем игру
    const game = await db.depalkaGame.create({
      data: {
        playerId,
        workerId,
        amount,
        gameAmount: amount,
        status: 'pending'
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

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}