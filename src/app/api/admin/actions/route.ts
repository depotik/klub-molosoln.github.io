import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface AdminAction {
  id: string
  type: string
  adminName: string
  targetName?: string
  amount?: number
  description: string
  timestamp: string
}

// Временные данные для демонстрации
// В реальном приложении это должно храниться в базе данных
const mockAdminActions: AdminAction[] = [
  {
    id: '1',
    type: 'money_add',
    adminName: 'Мэр_Александр',
    targetName: 'Игрок_Мария',
    amount: 5000,
    description: 'Начисление денег игроку',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    type: 'role_change',
    adminName: 'Мэр_Иван',
    targetName: 'Игрок_Петр',
    description: 'Назначение на должность Казино',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '3',
    type: 'admin_action',
    adminName: 'Мэр_Елена',
    description: 'Смена дня на ночь',
    timestamp: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: '4',
    type: 'user_management',
    adminName: 'Мэр_Сергей',
    targetName: 'Игрок_Анна',
    description: 'Удаление пользователя',
    timestamp: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: '5',
    type: 'money_add',
    adminName: 'Мэр_Ольга',
    targetName: 'Игрок_Дмитрий',
    amount: 10000,
    description: 'Крупное начисление денег',
    timestamp: new Date(Date.now() - 18000000).toISOString()
  }
]

export async function GET() {
  try {
    // В реальном приложении здесь должен быть запрос к базе данных
    // для получения реальных действий админов
    
    return NextResponse.json({
      actions: mockAdminActions
    })
  } catch (error) {
    console.error('Error fetching admin actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}