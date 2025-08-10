import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()
    
    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        balance: user.balance + amount
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error adding money:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}