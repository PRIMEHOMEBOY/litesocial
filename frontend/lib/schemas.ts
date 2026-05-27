// lib/schemas.ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1).max(50).optional(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const LinkWalletSchema = z.object({
  ltcAddress: z.string().min(26, 'Invalid LTC address').max(64),
  signature: z.string().min(1, 'Signature required'),
  nonce: z.string().min(1, 'Nonce required'),
})

export const WalletLoginSchema = z.object({
  ltcAddress: z.string().min(26).max(64),
  signature: z.string().min(1),
  nonce: z.string().min(1),
})

export const CreatePostSchema = z.object({
  content: z.string().min(1, 'Content required').max(2800, 'Post too long'),
  isPremium: z.boolean().default(false),
  mediaHashes: z.array(z.string()).max(4).default([]),
})

export const UpdateUserSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  avatarIpfsHash: z.string().optional(),
  bannerIpfsHash: z.string().optional(),
  payoutAddress: z.string().min(26).max(64).optional().or(z.literal('')),
  subscriptionPrice: z.number().min(0.01).max(100).optional(),
  creatorTier: z.enum(['NONE', 'BASIC', 'PRO', 'ELITE']).optional(),
  showEarnings: z.boolean().optional(),
})

export const CommentSchema = z.object({
  content: z.string().min(1).max(500),
})

export const InitiateSubscriptionSchema = z.object({
  creatorUsername: z.string().min(1),
})

export const InitiateTipSchema = z.object({
  postId: z.string().min(1),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/, 'Invalid LTC amount')
    .refine((v) => parseFloat(v) >= 0.001, 'Minimum tip is 0.001 LTC'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
})
