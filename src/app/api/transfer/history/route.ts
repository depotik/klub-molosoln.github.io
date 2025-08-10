import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from authentication
    const authHeader = request.headers.get('authorization')
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7)
    } else {
      // Fallback to query parameter for backward compatibility
      const { searchParams } = new URL(request.url)
      userId = searchParams.get('userId')
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Get current user and verify permissions
    const user = await db.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Only creators and mayors can view all transactions
    if (!['creator', 'mayor'].includes(user.role)) {
      return NextResponse.json({ error: 'Недостаточно прав доступа' }, { status: 403 })
    }

    // Get all transactions with full details
    const transactions = await db.transaction.findMany({
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 transactions
    })

    // Calculate statistics
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalFees = transactions.reduce((sum, t) => sum + (t.amount > 1000 ? Math.max(1, Math.round(t.amount * 0.005)) : 0), 0)
    
    const transactionsByRole = {
      creatorToCreator: 0,
      creatorToMayor: 0,
      creatorToUser: 0,
      mayorToCreator: 0,
      mayorToMayor: 0,
      mayorToUser: 0,
      userToCreator: 0,
      userToMayor: 0,
      userToUser: 0
    }

    transactions.forEach(t => {
      const senderRole = t.sender.role
      const receiverRole = t.receiver.role
      const key = `${senderRole}To${receiverRole.charAt(0).toUpperCase() + receiverRole.slice(1)}` as keyof typeof transactionsByRole
      if (transactionsByRole[key] !== undefined) {
        transactionsByRole[key] += t.amount
      }
    })

    const response = NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        sender: t.sender,
        receiver: t.receiver,
        createdAt: t.createdAt,
        fee: t.amount > 1000 ? Math.max(1, Math.round(t.amount * 0.005)) : 0
      })),
      statistics: {
        totalVolume,
        totalFees,
        totalTransactions: transactions.length,
        averageAmount: totalVolume / transactions.length,
        transactionsByRole
      }
    })

    // Add caching headers for instant operations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching all transactions:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}