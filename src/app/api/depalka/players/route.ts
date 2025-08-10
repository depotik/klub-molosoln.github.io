import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Простое кэширование в памяти
const cache = new Map();
const CACHE_TTL = 30000; // 30 секунд

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

export async function GET() {
  try {
    const cacheKey = 'depalka:players';
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Получаем всех пользователей с балансом больше 0
    const players = await db.user.findMany({
      where: {
        balance: {
          gt: 0
        },
        isActive: true
      },
      select: {
        id: true,
        nickname: true,
        balance: true,
        role: true,
        job: {
          select: {
            title: true,
            salary: true
          }
        }
      },
      orderBy: {
        balance: 'desc'
      },
      take: 50 // Ограничиваем количество игроков
    });

    setCache(cacheKey, players);
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}