import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.adminLog.findMany({
      include: {
        user: {
          select: {
            nickname: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Последние 100 записей
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching admin logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}