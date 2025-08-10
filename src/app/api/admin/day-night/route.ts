import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (!action || (action !== 'end-day' && action !== 'end-night')) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    let settings = await db.gameSettings.findFirst()
    
    if (!settings) {
      settings = await db.gameSettings.create({
        data: {
          isDay: true,
          lastDayChange: new Date().toISOString()
        }
      })
    }

    const newIsDay = action === 'end-night'
    
    // Если заканчивается день, выплачиваем зарплаты
    if (action === 'end-day') {
      const jobs = await db.job.findMany({
        include: {
          user: true
        }
      })

      for (const job of jobs) {
        if (job.userId && job.user) {
          await db.user.update({
            where: { id: job.userId },
            data: {
              balance: job.user.balance + job.salary
            }
          })
        }
      }
    }

    settings = await db.gameSettings.update({
      where: { id: settings.id },
      data: {
        isDay: newIsDay,
        lastDayChange: new Date().toISOString()
      }
    })

    return NextResponse.json({
      isDay: settings.isDay,
      lastDayChange: settings.lastDayChange
    })
  } catch (error) {
    console.error('Error changing day/night:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}