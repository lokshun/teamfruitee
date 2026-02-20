import { z } from "zod"

export const producerSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal("")),
})

export const productSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  description: z.string().optional(),
  producerId: z.string().min(1, "Le producteur est requis"),
  unitType: z.enum(["CRATE", "KG", "UNIT", "LITER"]),
  unitQuantity: z.number().positive("La quantité doit être positive"),
  priceProducer: z.number().positive("Le prix producteur doit être positif"),
  priceWithTransport: z.number().positive("Le prix avec transport doit être positif"),
})

export type ProducerInput = z.infer<typeof producerSchema>
export type ProductInput = z.infer<typeof productSchema>
