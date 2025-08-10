import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Простое кэширование в памяти
const cache = new Map();
const CACHE_TTL = 10000; // 10 секунд

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
    const cacheKey = 'creator:transactions';
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Получаем все транзакции с информацией о пользователях
    const transactions = await db.transaction.findMany({
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Ограничиваем количество записей
    });

    setCache(cacheKey, transactions);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}