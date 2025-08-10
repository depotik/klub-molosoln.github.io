import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: 'Никнейм и пароль обязательны' },
        { status: 400 }
      );
    }

    // Поиск пользователя по никнейму
    const user = await db.user.findUnique({
      where: { nickname }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный никнейм или пароль' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Для этого пользователя не установлен пароль' },
        { status: 401 }
      );
    }

    // Проверка активности аккаунта
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Аккаунт деактивирован' },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный никнейм или пароль' },
        { status: 401 }
      );
    }

    // Обновление времени последнего входа
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Возврат данных пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Вход успешен',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}