import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { GroupOrderEditForm } from "./group-order-edit-form"

export default async function ModifierCommandeGroupeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [groupOrder, deliveryPoints, users] = await Promise.all([
    prisma.groupOrder.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        openDate: true,
        closeDate: true,
        deliveryDate: true,
        notes: true,
        minOrderAmount: true,
        transportUserId: true,
        producer: {
          select: {
            name: true,
            products: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                unitQuantity: true,
                unitType: true,
                priceWithTransport: true,
              },
              orderBy: { name: "asc" },
            },
          },
        },
        deliveryPoints: { select: { id: true } },
        products: {
          select: {
            id: true,
            productId: true,
            _count: { select: { orderLines: true } },
          },
        },
        _count: { select: { memberOrders: true } },
      },
    }),
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

  if (!groupOrder) notFound()

  const canEdit = groupOrder.status === "DRAFT" || groupOrder.status === "OPEN"
  const canDelete = groupOrder._count.memberOrders === 0

  // Produits actuels avec flag "commandé"
  const currentProducts = groupOrder.products.map((p) => ({
    productId: p.productId,
    isOrdered: p._count.orderLines > 0,
  }))
  const currentProductIds = currentProducts.map((p) => p.productId)
  const orderedProductIds = currentProducts.filter((p) => p.isOrdered).map((p) => p.productId)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/commandes-groupees/${id}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la commande
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier la commande</h1>
        <p className="text-gray-500 mt-1">{groupOrder.producer.name}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {!canEdit ? (
          <div className="text-center py-4">
            <p className="text-gray-600 font-medium">
              Impossible de modifier une commande {groupOrder.status === "CLOSED" ? "clôturée" : "livrée"}.
            </p>
          </div>
        ) : (
          <GroupOrderEditForm
            groupOrder={{
              id: groupOrder.id,
              title: groupOrder.title,
              openDate: groupOrder.openDate,
              closeDate: groupOrder.closeDate,
              deliveryDate: groupOrder.deliveryDate,
              notes: groupOrder.notes,
              minOrderAmount: groupOrder.minOrderAmount ? Number(groupOrder.minOrderAmount) : null,
              transportUserId: groupOrder.transportUserId ?? null,
              deliveryPointIds: groupOrder.deliveryPoints.map((dp) => dp.id),
              currentProductIds,
              orderedProductIds,
            }}
            deliveryPoints={deliveryPoints}
            allProducts={groupOrder.producer.products.map((p) => ({
              ...p,
              priceWithTransport: Number(p.priceWithTransport),
            }))}
            users={users}
            canDelete={canDelete}
          />
        )}
      </div>
    </div>
  )
}
