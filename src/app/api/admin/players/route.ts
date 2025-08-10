import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const players = await db.user.findMany({
      include: {
        credits: true,
        job: true,
        sentTransactions: true,
        receivedTransactions: true
      }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}