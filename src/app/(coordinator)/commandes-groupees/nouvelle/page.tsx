import { prisma } from "@/lib/prisma"
import { NewGroupOrderForm } from "./new-group-order-form"

export default async function NouvelleCommandeGroupeePage() {
  const rawProducers = await prisma.producer.findMany({
    where: { isActive: true },
    include: {
      products: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  })

  const [deliveryPoints, users] = await Promise.all([
    prisma.deliveryPoint.findMany({
      where: { isActive: true },
      orderBy: { commune: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, commune: true, role: true },
      orderBy: { name: "asc" },
    }),
  ])

  const producers = rawProducers.map((p) => ({
    ...p,
    products: p.products.map((prod) => ({
      ...prod,
      priceProducer: Number(prod.priceProducer),
      priceWithTransport: Number(prod.priceWithTransport),
    })),
  }))

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/commandes-groupees" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nouvelle commande groupée</h1>
      </div>
      <NewGroupOrderForm producers={producers} deliveryPoints={deliveryPoints} users={users} />
    </div>
  )
}
