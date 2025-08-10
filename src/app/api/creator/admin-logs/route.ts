import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Простое кэширование в памяти
const cache = new Map();
const CACHE_TTL = 5000; // 5 секунд

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
    const cacheKey = 'creator:admin-logs';
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Получаем все логи админов с информацией о пользователях
    const adminLogs = await db.adminLog.findMany({
      include: {
        user: {
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
      take: 100 // Ограничиваем количество записей
    });

    setCache(cacheKey, adminLogs);
    return NextResponse.json(adminLogs);
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}