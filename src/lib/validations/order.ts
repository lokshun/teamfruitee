import { z } from "zod"

export const groupOrderSchema = z.object({
  producerId: z.string().min(1, "Le producteur est requis"),
  title: z.string().min(2, "Le titre est requis"),
  openDate: z.string().min(1, "La date d'ouverture est requise"),
  closeDate: z.string().min(1, "La date de clôture est requise"),
  deliveryDate: z.string().min(1, "La date de livraison est requise"),
  notes: z.string().optional(),
  productIds: z.array(z.string()).min(1, "Au moins un produit est requis"),
  deliveryPointIds: z.array(z.string()).optional(),
  minOrderQuantity: z.number().int().min(1).optional(),
  transportUserId: z.string().optional(),
  paymentReferentIds: z.array(z.string()).optional(),
}).refine(
  (data) => new Date(data.closeDate) > new Date(data.openDate),
  { message: "La date de clôture doit être après l'ouverture", path: ["closeDate"] }
).refine(
  (data) => new Date(data.deliveryDate) >= new Date(data.closeDate),
  { message: "La date de livraison doit être après la clôture", path: ["deliveryDate"] }
)

export const memberOrderSchema = z.object({
  groupOrderId: z.string().min(1),
  deliveryPointId: z.string().min(1, "Le point de livraison est requis"),
  notes: z.string().optional(),
  lines: z.array(z.object({
    groupOrderProductId: z.string().min(1),
    quantity: z.number().positive("La quantité doit être positive"),
  })).min(1, "Au moins une ligne de commande est requise"),
})

export const proxyOrderSchema = z.object({
  userId: z.string().optional(),
  proxyBuyerName: z.string().min(1).optional(),
  deliveryPointId: z.string().min(1, "Le point de livraison est requis"),
  notes: z.string().optional(),
  lines: z.array(z.object({
    groupOrderProductId: z.string().min(1),
    quantity: z.number().positive("La quantité doit être positive"),
  })).min(1, "Au moins une ligne de commande est requise"),
}).refine(
  (data) => data.userId || data.proxyBuyerName,
  { message: "Un membre ou un nom d'acheteur est requis", path: ["userId"] }
)

export type GroupOrderInput = z.infer<typeof groupOrderSchema>
export type MemberOrderInput = z.infer<typeof memberOrderSchema>
export type ProxyOrderInput = z.infer<typeof proxyOrderSchema>
