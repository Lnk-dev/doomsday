/**
 * Direct Messages Routes
 * Issue #58: Implement direct messaging system
 *
 * Handles conversations and messages between users
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { conversations, messages, users } from '../db/schema'
import { eq, and, or, desc, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().uuid().optional(),
})

const createConversationSchema = z.object({
  participantId: z.string().uuid(),
  message: z.string().min(1).max(2000),
})

/**
 * GET /messages/conversations
 * Get all conversations for the current user
 */
app.get('/conversations', requireAuth, async (c) => {
  const userId = c.get('userId')
  const includeArchived = c.req.query('includeArchived') === 'true'

  // Find all conversations where user is a participant
  const userConversations = await db.query.conversations.findMany({
    where: or(
      eq(conversations.participant1Id, userId),
      eq(conversations.participant2Id, userId)
    ),
    orderBy: [desc(conversations.updatedAt)],
    with: {
      participant1: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
      },
      participant2: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
      },
    },
  })

  // Filter archived if needed and format response
  const result = userConversations
    .filter(conv => {
      if (includeArchived) return true
      const isParticipant1 = conv.participant1Id === userId
      return isParticipant1 ? !conv.participant1Archived : !conv.participant2Archived
    })
    .map(conv => {
      const isParticipant1 = conv.participant1Id === userId
      const otherUser = isParticipant1 ? conv.participant2 : conv.participant1
      const unreadCount = isParticipant1 ? conv.participant1Unread : conv.participant2Unread
      const isMuted = isParticipant1 ? conv.participant1Muted : conv.participant2Muted
      const isArchived = isParticipant1 ? conv.participant1Archived : conv.participant2Archived

      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.lastMessageContent ? {
          content: conv.lastMessageContent,
          senderId: conv.lastMessageSenderId,
          createdAt: conv.lastMessageAt?.getTime(),
        } : null,
        unreadCount,
        isMuted,
        isArchived,
        createdAt: conv.createdAt.getTime(),
        updatedAt: conv.updatedAt.getTime(),
      }
    })

  return c.json({ conversations: result })
})

/**
 * GET /messages/conversations/:conversationId
 * Get a specific conversation with messages
 */
app.get('/conversations/:conversationId', requireAuth, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')
  const limit = parseInt(c.req.query('limit') || '50')
  // Note: pagination with 'before' can be added later

  // Get conversation
  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    ),
    with: {
      participant1: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
      },
      participant2: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
      },
    },
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  // Get messages
  const messageQuery = db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [desc(messages.createdAt)],
    limit,
    with: {
      sender: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  })

  const conversationMessages = await messageQuery

  // Fetch reply messages separately to avoid circular type inference
  const replyToIds = conversationMessages
    .map(m => m.replyToId)
    .filter((id): id is string => id !== null)

  const replyMessages = replyToIds.length > 0
    ? await db.query.messages.findMany({
        where: sql`${messages.id} IN ${replyToIds}`,
        columns: { id: true, content: true, senderId: true },
      })
    : []

  const replyMap = new Map(replyMessages.map(m => [m.id, m]))

  // Format response
  const isParticipant1 = conversation.participant1Id === userId
  const otherUser = isParticipant1 ? conversation.participant2 : conversation.participant1

  return c.json({
    conversation: {
      id: conversation.id,
      otherUser,
      isMuted: isParticipant1 ? conversation.participant1Muted : conversation.participant2Muted,
      isArchived: isParticipant1 ? conversation.participant1Archived : conversation.participant2Archived,
      createdAt: conversation.createdAt.getTime(),
    },
    messages: conversationMessages.map(msg => {
      const replyTo = msg.replyToId ? replyMap.get(msg.replyToId) : null
      return {
        id: msg.id,
        senderId: msg.senderId,
        sender: msg.sender,
        content: msg.isDeleted ? '[Message deleted]' : msg.content,
        status: msg.status,
        replyTo: replyTo ? {
          id: replyTo.id,
          content: replyTo.content,
          senderId: replyTo.senderId,
        } : null,
        isDeleted: msg.isDeleted,
        createdAt: msg.createdAt.getTime(),
      }
    }).reverse(), // Reverse to get chronological order
  })
})

/**
 * POST /messages/conversations
 * Create a new conversation or get existing one
 */
app.post(
  '/conversations',
  requireAuth,
  zValidator('json', createConversationSchema),
  async (c) => {
    const userId = c.get('userId')
    const { participantId, message: messageContent } = c.req.valid('json')

    // Can't message yourself
    if (participantId === userId) {
      return c.json({ error: 'Cannot message yourself' }, 400)
    }

    // Verify participant exists
    const participant = await db.query.users.findFirst({
      where: eq(users.id, participantId),
      columns: { id: true, username: true },
    })

    if (!participant) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Check for existing conversation
    const existingConversation = await db.query.conversations.findFirst({
      where: or(
        and(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, participantId)
        ),
        and(
          eq(conversations.participant1Id, participantId),
          eq(conversations.participant2Id, userId)
        )
      ),
    })

    let conversationId: string

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      // Create new conversation
      const [newConversation] = await db.insert(conversations).values({
        participant1Id: userId,
        participant2Id: participantId,
      }).returning()
      conversationId = newConversation.id
    }

    // Create the message
    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: userId,
      content: messageContent,
      status: 'sent',
    }).returning()

    // Update conversation with last message and increment unread
    const isParticipant1 = existingConversation?.participant1Id === userId || !existingConversation
    await db.update(conversations).set({
      lastMessageId: newMessage.id,
      lastMessageContent: messageContent.slice(0, 100),
      lastMessageSenderId: userId,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
      // Increment unread for the other participant
      ...(isParticipant1
        ? { participant2Unread: sql`${conversations.participant2Unread} + 1` }
        : { participant1Unread: sql`${conversations.participant1Unread} + 1` }
      ),
    }).where(eq(conversations.id, conversationId))

    return c.json({
      conversationId,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        status: newMessage.status,
        createdAt: newMessage.createdAt.getTime(),
      },
    }, 201)
  }
)

/**
 * POST /messages/conversations/:conversationId/messages
 * Send a message in an existing conversation
 */
app.post(
  '/conversations/:conversationId/messages',
  requireAuth,
  zValidator('json', sendMessageSchema),
  async (c) => {
    const userId = c.get('userId')
    const conversationId = c.req.param('conversationId')
    const { content, replyToId } = c.req.valid('json')

    // Verify user is part of conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      ),
    })

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404)
    }

    // Verify reply message exists if provided
    if (replyToId) {
      const replyMessage = await db.query.messages.findFirst({
        where: and(
          eq(messages.id, replyToId),
          eq(messages.conversationId, conversationId)
        ),
      })
      if (!replyMessage) {
        return c.json({ error: 'Reply message not found' }, 400)
      }
    }

    // Create the message
    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: userId,
      content,
      replyToId,
      status: 'sent',
    }).returning()

    // Update conversation
    const isParticipant1 = conversation.participant1Id === userId
    await db.update(conversations).set({
      lastMessageId: newMessage.id,
      lastMessageContent: content.slice(0, 100),
      lastMessageSenderId: userId,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
      ...(isParticipant1
        ? { participant2Unread: sql`${conversations.participant2Unread} + 1` }
        : { participant1Unread: sql`${conversations.participant1Unread} + 1` }
      ),
    }).where(eq(conversations.id, conversationId))

    return c.json({
      message: {
        id: newMessage.id,
        content: newMessage.content,
        status: newMessage.status,
        replyToId: newMessage.replyToId,
        createdAt: newMessage.createdAt.getTime(),
      },
    }, 201)
  }
)

/**
 * POST /messages/conversations/:conversationId/read
 * Mark all messages in a conversation as read
 */
app.post('/conversations/:conversationId/read', requireAuth, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')

  // Verify user is part of conversation
  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    ),
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  // Reset unread count for this user
  const isParticipant1 = conversation.participant1Id === userId
  await db.update(conversations).set({
    ...(isParticipant1
      ? { participant1Unread: 0 }
      : { participant2Unread: 0 }
    ),
  }).where(eq(conversations.id, conversationId))

  // Update message statuses to 'read' for messages not sent by this user
  await db.update(messages).set({
    status: 'read',
  }).where(
    and(
      eq(messages.conversationId, conversationId),
      sql`${messages.senderId} != ${userId}`,
      sql`${messages.status} != 'read'`
    )
  )

  return c.json({ success: true })
})

/**
 * POST /messages/conversations/:conversationId/mute
 * Toggle mute status for a conversation
 */
app.post('/conversations/:conversationId/mute', requireAuth, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')

  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    ),
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const isParticipant1 = conversation.participant1Id === userId
  const currentMuted = isParticipant1 ? conversation.participant1Muted : conversation.participant2Muted

  await db.update(conversations).set({
    ...(isParticipant1
      ? { participant1Muted: !currentMuted }
      : { participant2Muted: !currentMuted }
    ),
  }).where(eq(conversations.id, conversationId))

  return c.json({ muted: !currentMuted })
})

/**
 * POST /messages/conversations/:conversationId/archive
 * Toggle archive status for a conversation
 */
app.post('/conversations/:conversationId/archive', requireAuth, async (c) => {
  const userId = c.get('userId')
  const conversationId = c.req.param('conversationId')

  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    ),
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const isParticipant1 = conversation.participant1Id === userId
  const currentArchived = isParticipant1 ? conversation.participant1Archived : conversation.participant2Archived

  await db.update(conversations).set({
    ...(isParticipant1
      ? { participant1Archived: !currentArchived }
      : { participant2Archived: !currentArchived }
    ),
  }).where(eq(conversations.id, conversationId))

  return c.json({ archived: !currentArchived })
})

/**
 * DELETE /messages/messages/:messageId
 * Soft delete a message (only sender can delete)
 */
app.delete('/messages/:messageId', requireAuth, async (c) => {
  const userId = c.get('userId')
  const messageId = c.req.param('messageId')

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  })

  if (!message) {
    return c.json({ error: 'Message not found' }, 404)
  }

  if (message.senderId !== userId) {
    return c.json({ error: 'Cannot delete messages from other users' }, 403)
  }

  await db.update(messages).set({
    isDeleted: true,
    deletedAt: new Date(),
    content: '', // Clear content for privacy
  }).where(eq(messages.id, messageId))

  return c.json({ success: true })
})

/**
 * GET /messages/unread-count
 * Get total unread message count for current user
 */
app.get('/unread-count', requireAuth, async (c) => {
  const userId = c.get('userId')

  const result = await db.select({
    total: sql<number>`
      SUM(
        CASE
          WHEN ${conversations.participant1Id} = ${userId} THEN ${conversations.participant1Unread}
          ELSE ${conversations.participant2Unread}
        END
      )::int
    `,
  })
    .from(conversations)
    .where(
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    )

  return c.json({ unreadCount: result[0]?.total || 0 })
})

export const messagesRouter = app
