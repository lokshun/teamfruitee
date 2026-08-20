import { prisma } from "@/lib/prisma"
import { fullName } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CoordinatorOrderEditForm } from "./coordinator-order-edit-form"

export default async function ModifierCommandeMembrePage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>
}) {
  const { id, orderId } = await params

  const memberOrder = await prisma.memberOrder.findUnique({
    where: { id: orderId, groupOrderId: id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      orderLines: true,
      groupOrder: {
        include: {
          producer: { select: { name: true } },
          products: { include: { product: true } },
          paymentReferents: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!memberOrder) notFound()

  const deliveryPoints = await prisma.deliveryPoint.findMany({
    where: { isActive: true },
    orderBy: { commune: "asc" },
  })

  const initialQuantities: Record<string, number> = {}
  for (const line of memberOrder.orderLines) {
    initialQuantities[line.groupOrderProductId] = line.quantity
  }

  const buyerName = memberOrder.userId
    ? (memberOrder.user ? fullName(memberOrder.user) : "Membre inconnu")
    : (memberOrder.proxyBuyerName ?? "Acheteur sans compte")

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
        <h1 className="text-2xl font-bold text-gray-900">Modifier la commande de {buyerName}</h1>
        <p className="text-gray-500 mt-1">{memberOrder.groupOrder.title} — {memberOrder.groupOrder.producer.name}</p>
      </div>

      <CoordinatorOrderEditForm
        groupOrderId={id}
        memberOrderId={orderId}
        products={memberOrder.groupOrder.products.map((gop) => ({
          id: gop.id,
          priceOverride: gop.priceOverride !== null ? Number(gop.priceOverride) : null,
          product: {
            name: gop.product.name,
            description: gop.product.description,
            packagingType: gop.product.packagingType,
            measureUnit: gop.product.measureUnit,
            unitQuantity: gop.product.unitQuantity,
            unitsPerPackage: gop.product.unitsPerPackage,
            priceWithTransport: Number(gop.product.priceWithTransport),
          },
        }))}
        deliveryPoints={deliveryPoints}
        paymentReferents={memberOrder.groupOrder.paymentReferents}
        initialQuantities={initialQuantities}
        initialDeliveryPointId={memberOrder.deliveryPointId}
        initialPaymentReferentId={memberOrder.paymentReferentId ?? ""}
        initialPaymentMethod={memberOrder.paymentMethod ?? ""}
        initialNotes={memberOrder.notes ?? ""}
      />
    </div>
  )
}
