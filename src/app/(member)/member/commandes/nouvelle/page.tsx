import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { MemberOrderForm } from "./member-order-form"

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ groupOrderId?: string }>
}) {
  const { groupOrderId } = await searchParams

  if (!groupOrderId) notFound()

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id: groupOrderId, status: "OPEN" },
    include: {
      producer: { select: { name: true } },
      products: {
        include: { product: true },
      },
      deliveryPoints: { select: { id: true } },
    },
  })

  if (!groupOrder) notFound()

  // Si la commande a des points de livraison définis, on restreint à ceux-ci
  const linkedIds = groupOrder.deliveryPoints.map((dp) => dp.id)
  const deliveryPoints = await prisma.deliveryPoint.findMany({
    where: {
      isActive: true,
      ...(linkedIds.length > 0 ? { id: { in: linkedIds } } : {}),
    },
    orderBy: { commune: "asc" },
  })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/member/commandes" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{groupOrder.title}</h1>
        <p className="text-gray-500">{groupOrder.producer.name}</p>
      </div>
      <MemberOrderForm
        groupOrder={{
          ...groupOrder,
          products: groupOrder.products.map((gop) => ({
            ...gop,
            priceOverride: gop.priceOverride !== null ? Number(gop.priceOverride) : null,
            product: {
              ...gop.product,
              priceWithTransport: Number(gop.product.priceWithTransport),
              priceProducer: Number(gop.product.priceProducer),
            },
          })),
        }}
        deliveryPoints={deliveryPoints}
      />
    </div>
  )
}
