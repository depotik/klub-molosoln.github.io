import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface CreditWithDetails {
  id: string
  amount: number
  interestRate: number
  isPaid: boolean
  paidAmount: number
  createdAt: string
  updatedAt: string
  totalOwed: number
  daysActive: number
  remainingAmount: number
}

// Helper function to calculate credit details
function calculateCreditDetails(credit: any): CreditWithDetails {
  const createdAt = new Date(credit.createdAt)
  const now = new Date()
  const daysActive = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Calculate total owed with compound interest: amount * (1 + rate)^days
  const totalOwed = credit.amount * Math.pow(1 + credit.interestRate, daysActive)
  const remainingAmount = Math.max(0, totalOwed - credit.paidAmount)
  
  return {
    id: credit.id,
    amount: credit.amount,
    interestRate: credit.interestRate,
    isPaid: credit.isPaid,
    paidAmount: credit.paidAmount,
    createdAt: credit.createdAt,
    updatedAt: credit.updatedAt,
    totalOwed: Math.round(totalOwed * 100) / 100,
    daysActive,
    remainingAmount: Math.round(remainingAmount * 100) / 100
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, action, creditId, userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    // Handle taking a new credit
    if (action === 'take') {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      // Use database transaction for atomic operations
      const result = await db.$transaction(async (tx) => {
        // Get current user
        let user = await tx.user.findUnique({
          where: { id: userId }
        })
        
        if (!user) {
          throw new Error('User not found')
        }

        // Create credit with 3% daily interest
        const credit = await tx.credit.create({
          data: {
            userId: user.id,
            amount: amount,
            interestRate: 0.03 // 3% daily interest
          }
        })

        // Update user balance
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            balance: user.balance + amount
          }
        })

        return { credit, user }
      })

      const response = NextResponse.json({ 
        success: true, 
        credit: calculateCreditDetails(result.credit),
        newBalance: result.user.balance
      })

      // Add performance headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('Surrogate-Control', 'no-store')
      
      return response
    }
    
    // Handle repaying a credit
    if (action === 'repay' && creditId) {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Invalid repayment amount' }, { status: 400 })
      }

      // Use database transaction for atomic operations
      const result = await db.$transaction(async (tx) => {
        // Get the credit
        const credit = await tx.credit.findUnique({
          where: { id: creditId },
          include: { user: true }
        })

        if (!credit) {
          throw new Error('Credit not found')
        }

        if (credit.isPaid) {
          throw new Error('Credit already paid')
        }

        const creditDetails = calculateCreditDetails(credit)
        
        if (amount > credit.user.balance) {
          throw new Error('Insufficient balance')
        }

        if (amount > creditDetails.remainingAmount) {
          throw new Error(`Amount exceeds remaining debt. Remaining: ${creditDetails.remainingAmount} 🍃`)
        }

        // Update credit payment
        const newPaidAmount = credit.paidAmount + amount
        const isFullyPaid = newPaidAmount >= creditDetails.totalOwed

        const updatedCredit = await tx.credit.update({
          where: { id: creditId },
          data: {
            paidAmount: newPaidAmount,
            isPaid: isFullyPaid
          }
        })

        // Update user balance
        const updatedUser = await tx.user.update({
          where: { id: credit.userId },
          data: {
            balance: credit.user.balance - amount
          }
        })

        return { updatedCredit, updatedUser, isFullyPaid }
      })

      const response = NextResponse.json({ 
        success: true, 
        credit: calculateCreditDetails(result.updatedCredit),
        newBalance: result.updatedUser.balance,
        paymentAmount: amount,
        fullyPaid: result.isFullyPaid
      })

      // Add performance headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('Surrogate-Control', 'no-store')
      
      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in credits API:', error)
    
    if (error.message.includes('not found') || error.message.includes('already paid') || 
        error.message.includes('Insufficient balance') || error.message.includes('Amount exceeds')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all credits for the user with optimized query
    const credits = await db.credit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      // Limit to prevent performance issues with users having many credits
      take: 50
    })

    // Calculate details for each credit
    const creditsWithDetails = credits.map(calculateCreditDetails)
    
    // Calculate totals efficiently
    const totals = creditsWithDetails.reduce((acc, credit) => {
      acc.totalOriginal += credit.amount
      acc.totalOwed += credit.remainingAmount
      acc.totalPaid += credit.paidAmount
      if (!credit.isPaid) acc.activeCredits++
      return acc
    }, { totalOriginal: 0, totalOwed: 0, totalPaid: 0, activeCredits: 0 })

    const response = NextResponse.json({
      credits: creditsWithDetails,
      summary: {
        totalCredits: credits.length,
        totalOriginal: Math.round(totals.totalOriginal * 100) / 100,
        totalOwed: Math.round(totals.totalOwed * 100) / 100,
        totalPaid: Math.round(totals.totalPaid * 100) / 100,
        activeCredits: totals.activeCredits
      }
    })

    // Add performance headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}