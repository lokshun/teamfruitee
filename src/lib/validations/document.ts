import { z } from "zod"

const roleEnum = z.enum(["MEMBER", "COORDINATOR", "PRODUCER"])

export const addDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  shareUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  allowedRoles: z.array(roleEnum).min(1),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  shareUrl: z.string().url().optional(),
  allowedRoles: z.array(roleEnum).optional(),
})

export type AddDocumentInput = z.infer<typeof addDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
