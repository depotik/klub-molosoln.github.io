import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const jobs = await db.job.findMany({
      include: {
        user: true
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, salary } = await request.json()
    
    if (!userId || !title || !salary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Удаляем существующую работу пользователя если есть
    await db.job.deleteMany({
      where: { userId }
    })

    // Создаем новую работу
    const job = await db.job.create({
      data: {
        userId,
        title,
        salary
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}