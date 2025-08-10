import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const players = await db.user.findMany({
      where: {
        nickname: {
          not: 'Аноним'
        }
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
      }
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}