import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().optional(),
  lastName: z.string().min(1, "Le nom est requis"),
  commune: z.string().min(2, "La commune est requise"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
