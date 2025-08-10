import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TransferOptions {
  amount: number
  receiverNickname: string
  message?: string
  isAnonymous?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { amount, receiverNickname, message, isAnonymous, userId }: TransferOptions & { userId?: string } = await request.json()
    
    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Неверная сумма перевода' }, { status: 400 })
    }

    if (!receiverNickname || typeof receiverNickname !== 'string' || receiverNickname.trim() === '') {
      return NextResponse.json({ error: 'Никнейм получателя не указан' }, { status: 400 })
    }

    // Transfer limits
    if (amount < 1) {
      return NextResponse.json({ error: 'Минимальная сумма перевода: 1 🍃' }, { status: 400 })
    }

    if (amount > 100000) {
      return NextResponse.json({ error: 'Максимальная сумма перевода: 100,000 🍃' }, { status: 400 })
    }

    // Get sender from authentication
    const authHeader = request.headers.get('authorization')
    let senderId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      senderId = authHeader.substring(7)
    } else if (userId) {
      senderId = userId
    }
    
    if (!senderId) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Use database transaction for atomic operations
    const result = await db.$transaction(async (tx) => {
      // Get sender with proper authentication
      const sender = await tx.user.findUnique({
        where: { id: senderId }
      })
      
      if (!sender) {
        throw new Error('Отправитель не найден')
      }

      // Check sender balance
      if (sender.balance < amount) {
        throw new Error(`Недостаточно средств. Ваш баланс: ${sender.balance} 🍃, требуется: ${amount} 🍃`)
      }

      // Find receiver
      const receiver = await tx.user.findFirst({
        where: { nickname: receiverNickname.trim() }
      })

      if (!receiver) {
        throw new Error('Получатель с таким никнеймом не найден')
      }

      // Prevent self-transfer
      if (sender.id === receiver.id) {
        throw new Error('Нельзя переводить деньги себе')
      }

      // Calculate small transfer fee (0.5% for transfers over 1000)
      const transferFee = amount > 1000 ? Math.max(1, Math.round(amount * 0.005)) : 0
      const totalDeduction = amount + transferFee

      // Check balance with fee
      if (sender.balance < totalDeduction) {
        throw new Error(`Недостаточно средств с учетом комиссии. Ваш баланс: ${sender.balance} 🍃, требуется: ${totalDeduction} 🍃 (включая комиссию ${transferFee} 🍃)`)
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          amount: amount,
        }
      })

      // Update balances atomically
      const [updatedSender, updatedReceiver] = await Promise.all([
        tx.user.update({
          where: { id: sender.id },
          data: { balance: sender.balance - totalDeduction }
        }),
        tx.user.update({
          where: { id: receiver.id },
          data: { balance: receiver.balance + amount }
        })
      ])

      return {
        transaction,
        updatedSender,
        updatedReceiver,
        transferFee,
        totalDeduction
      }
    })

    // Return success response with details
    const response = NextResponse.json({ 
      success: true,
      transaction: {
        id: result.transaction.id,
        amount: amount,
        transferFee: result.transferFee,
        totalDeducted: result.totalDeduction,
        senderBalance: result.updatedSender.balance,
        receiverBalance: result.updatedReceiver.balance,
        senderNickname: result.updatedSender.nickname,
        receiverNickname: result.updatedReceiver.nickname,
        timestamp: result.transaction.createdAt,
        message: message || null,
        isAnonymous: isAnonymous || false
      }
    })

    // Add caching headers for instant operations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response

  } catch (error: any) {
    console.error('Error transferring money:', error)
    
    if (error.message.includes('не найден') || error.message.includes('Недостаточно средств') || error.message.includes('Нельзя переводить')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

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

    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Use Promise.all for parallel database queries
    const [sentTransactions, receivedTransactions] = await Promise.all([
      db.transaction.findMany({
        where: { senderId: user.id },
        include: {
          receiver: {
            select: {
              id: true,
              nickname: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit to last 20 transactions for performance
      }),
      db.transaction.findMany({
        where: { receiverId: user.id },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit to last 20 transactions for performance
      })
    ])

    // Calculate statistics efficiently
    const totalSent = sentTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalReceived = receivedTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalFees = sentTransactions.reduce((sum, t) => sum + (t.amount > 1000 ? Math.max(1, Math.round(t.amount * 0.005)) : 0), 0)

    const response = NextResponse.json({
      sentTransactions: sentTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        receiverNickname: t.receiver.nickname,
        createdAt: t.createdAt,
        fee: t.amount > 1000 ? Math.max(1, Math.round(t.amount * 0.005)) : 0
      })),
      receivedTransactions: receivedTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        senderNickname: t.sender.nickname,
        createdAt: t.createdAt
      })),
      statistics: {
        totalSent,
        totalReceived,
        totalFees,
        netTransfer: totalReceived - totalSent,
        totalTransactions: sentTransactions.length + receivedTransactions.length
      }
    })

    // Add enhanced caching headers for instant operations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error) {
    console.error('Error fetching transfer history:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}