import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let settings = await db.gameSettings.findFirst()
    
    if (!settings) {
      settings = await db.gameSettings.create({
        data: {
          isDay: true,
          lastDayChange: new Date().toISOString()
        }
      })
    }

    const response = NextResponse.json({
      isDay: settings.isDay,
      lastDayChange: settings.lastDayChange
    })
    
    // Add caching headers for instant operations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching game settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { isDay } = await request.json()
    
    if (typeof isDay !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isDay value' }, { status: 400 })
    }
    
    let settings = await db.gameSettings.findFirst()
    
    if (!settings) {
      settings = await db.gameSettings.create({
        data: {
          isDay,
          lastDayChange: new Date().toISOString()
        }
      })
    } else {
      settings = await db.gameSettings.update({
        where: { id: settings.id },
        data: {
          isDay,
          lastDayChange: new Date().toISOString()
        }
      })
    }

    const response = NextResponse.json({
      isDay: settings.isDay,
      lastDayChange: settings.lastDayChange
    })
    
    // Add caching headers for instant operations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error updating game settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}