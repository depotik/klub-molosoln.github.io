import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id
    
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const credits = await db.credit.findMany({
      where: { userId: user.id }
    })

    const job = await db.job.findFirst({
      where: { userId: user.id }
    })

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      balance: user.balance,
      isAdmin: user.isAdmin,
      theme: user.theme,
      role: user.role,
      job: job ? { title: job.title, salary: job.salary } : undefined,
      credits: credits.map(credit => ({
        id: credit.id,
        amount: credit.amount
      }))
    })
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}