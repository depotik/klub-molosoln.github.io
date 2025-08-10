import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, isAdmin } = await request.json()
    
    // Если передан userId, переключаем статус для конкретного пользователя
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { isAdmin: !user.isAdmin }
      })

      return NextResponse.json(updatedUser)
    }
    
    // Если передан isAdmin, устанавливаем статус для текущего пользователя
    if (isAdmin !== undefined) {
      // Находим текущего пользователя (первого в базе для простоты)
      const currentUser = await db.user.findFirst()
      
      if (!currentUser) {
        return NextResponse.json({ error: 'No user found' }, { status: 404 })
      }

      const updatedUser = await db.user.update({
        where: { id: currentUser.id },
        data: { isAdmin }
      })

      return NextResponse.json(updatedUser)
    }

    return NextResponse.json({ error: 'Missing userId or isAdmin' }, { status: 400 })
  } catch (error) {
    console.error('Error toggling admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}