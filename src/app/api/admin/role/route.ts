import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSecureToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { action, userId, targetUserId, role, secretKey, requesterId } = await request.json()
    
    // If this is a simple role update (backward compatibility)
    if (role && userId && !action) {
      if (!['user', 'mayor', 'creator'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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
          role,
          isAdmin: role !== 'user' // Update isAdmin for backward compatibility
        }
      })

      return NextResponse.json(updatedUser)
    }

    // Handle advanced role management actions
    if (!action || !requesterId) {
      return NextResponse.json({ error: 'Missing action or requesterId' }, { status: 400 })
    }

    // Verify the requester has permission
    const requester = await db.user.findUnique({
      where: { id: requesterId }
    })

    if (!requester) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 404 })
    }

    switch (action) {
      case 'promote_to_mayor':
        // Only creators can promote to mayor
        if (requester.role !== 'creator') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        if (!targetUserId) {
          return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
        }

        const targetUser = await db.user.findUnique({
          where: { id: targetUserId }
        })

        if (!targetUser) {
          return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Log the promotion
        await db.adminLog.create({
          data: {
            userId: requester.id,
            action: 'promote_to_mayor',
            targetId: targetUserId,
            details: JSON.stringify({
              from: targetUser.role,
              to: 'mayor'
            })
          }
        })

        // Update user role
        const updatedUser = await db.user.update({
          where: { id: targetUserId },
          data: {
            role: 'mayor',
            isAdmin: true
          }
        })

        return NextResponse.json({
          message: 'User promoted to mayor successfully',
          user: {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            role: updatedUser.role
          }
        })

      case 'demote_from_mayor':
        // Only creators can demote mayors
        if (requester.role !== 'creator') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        if (!targetUserId) {
          return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
        }

        const demoteTarget = await db.user.findUnique({
          where: { id: targetUserId }
        })

        if (!demoteTarget) {
          return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Log the demotion
        await db.adminLog.create({
          data: {
            userId: requester.id,
            action: 'demote_from_mayor',
            targetId: targetUserId,
            details: JSON.stringify({
              from: demoteTarget.role,
              to: 'user'
            })
          }
        })

        // Update user role
        const demotedUser = await db.user.update({
          where: { id: targetUserId },
          data: {
            role: 'user',
            isAdmin: false
          }
        })

        return NextResponse.json({
          message: 'User demoted from mayor successfully',
          user: {
            id: demotedUser.id,
            nickname: demotedUser.nickname,
            role: demotedUser.role
          }
        })

      case 'become_creator':
        // Verify secret key
        if (!secretKey) {
          return NextResponse.json({ error: 'Secret key required' }, { status: 400 })
        }

        const creatorSettings = await db.creatorSettings.findFirst({
          where: {
            secretKey,
            isActive: true
          }
        })

        if (!creatorSettings) {
          return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 })
        }

        // Log the promotion
        await db.adminLog.create({
          data: {
            userId: requester.id,
            action: 'become_creator',
            details: JSON.stringify({
              from: requester.role,
              to: 'creator'
            })
          }
        })

        // Update user role
        const creatorUser = await db.user.update({
          where: { id: userId },
          data: {
            role: 'creator',
            isAdmin: true
          }
        })

        return NextResponse.json({
          message: 'User promoted to creator successfully',
          user: {
            id: creatorUser.id,
            nickname: creatorUser.nickname,
            role: creatorUser.role
          }
        })

      case 'create_creator_key':
        // Only existing creators can create new keys
        if (requester.role !== 'creator') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const newSecretKey = generateSecureToken(16)
        
        await db.creatorSettings.create({
          data: {
            secretKey: newSecretKey,
            isActive: true
          }
        })

        return NextResponse.json({
          message: 'Creator key created successfully',
          secretKey: newSecretKey
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in role management:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}