import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Простое кэширование в памяти
const cache = new Map();
const CACHE_TTL = 15000; // 15 секунд

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
    const cacheKey = 'creator:users';
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Получаем всех пользователей
    const users = await db.user.findMany({
      select: {
        id: true,
        nickname: true,
        email: true,
        balance: true,
        role: true,
        isAdmin: true,
        theme: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    setCache(cacheKey, users);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}