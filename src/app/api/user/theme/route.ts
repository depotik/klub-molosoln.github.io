import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { theme } = await request.json()
    
    if (!theme || typeof theme !== 'string') {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    const validThemes = ['space', 'neon', 'sunset', 'ice', 'matrix', 'dark', 'ocean']
    if (!validThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    let user = await db.user.findFirst()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    user = await db.user.update({
      where: { id: user.id },
      data: { theme }
    })

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      balance: user.balance,
      isAdmin: user.isAdmin,
      theme: user.theme
    })
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}