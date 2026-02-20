import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.SEED_COORDINATOR_EMAIL ?? "coordinateur@groupement-achat.fr"
  const password = process.env.SEED_COORDINATOR_PASSWORD ?? "ChangeMe!2024"
  const hashedPassword = await bcrypt.hash(password, 12)

  const coordinator = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Coordinateur Principal",
      role: "COORDINATOR",
      status: "ACTIVE",
      hashedPassword,
    },
  })

  console.log(`✓ Coordinateur créé/existant : ${coordinator.email}`)

  // Points de livraison par défaut
  const deliveryPoints = [
    { name: "Mairie d'Arles", address: "Place de la République", commune: "Arles" },
    { name: "Salle des fêtes Boulbon", address: "Route du village", commune: "Boulbon" },
  ]

  for (const dp of deliveryPoints) {
    await prisma.deliveryPoint.upsert({
      where: { id: dp.name },
      update: {},
      create: dp,
    }).catch(() => prisma.deliveryPoint.create({ data: dp }))
  }

  console.log(`✓ ${deliveryPoints.length} points de livraison créés`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
