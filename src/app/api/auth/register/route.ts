import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { nickname, email, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: 'Никнейм и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const existingUser = await db.user.findUnique({
      where: { nickname }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким никнеймом уже существует' },
        { status: 409 }
      );
    }

    // Проверка email если указан
    if (email) {
      const existingEmail = await db.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        );
      }
    }

    // Хеширование пароля
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const newUser = await db.user.create({
      data: {
        nickname,
        email,
        password: hashedPassword,
        balance: 1000, // Стартовый баланс
        role: 'user',
        isActive: true
      }
    });

    // Возврат данных пользователя без пароля
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: 'Регистрация успешна',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}