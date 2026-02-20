import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { MemberOrderEditForm } from "./member-order-edit-form"

export default async function ModifierCommandePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  const memberOrder = await prisma.memberOrder.findUnique({
    where: { id, userId: session.user.id },
    include: {
      deliveryPoint: true,
      orderLines: {
        include: {
          groupOrderProduct: { include: { product: true } },
        },
      },
      groupOrder: {
        include: {
          producer: { select: { name: true } },
          products: {
            include: { product: true },
          },
        },
      },
    },
  })

  if (!memberOrder) notFound()

  // Vérifier que la commande est encore modifiable
  const isModifiable =
    memberOrder.groupOrder.status === "OPEN" &&
    new Date() < memberOrder.groupOrder.closeDate

  const deliveryPoints = await prisma.deliveryPoint.findMany({
    where: { isActive: true },
    orderBy: { commune: "asc" },
  })

  // Construire le map des quantités initiales { groupOrderProductId → quantity }
  const initialQuantities: Record<string, number> = {}
  for (const line of memberOrder.orderLines) {
    initialQuantities[line.groupOrderProductId] = line.quantity
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/member/commandes" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Modifier ma commande
        </h1>
        <p className="text-gray-500">{memberOrder.groupOrder.title} — {memberOrder.groupOrder.producer.name}</p>
      </div>

      {!isModifiable ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-orange-800">Cette commande ne peut plus être modifiée.</p>
          <p className="text-sm text-orange-600 mt-1">La période de commande est clôturée.</p>
        </div>
      ) : (
        <MemberOrderEditForm
          memberOrderId={id}
          groupOrder={memberOrder.groupOrder}
          deliveryPoints={deliveryPoints}
          initialQuantities={initialQuantities}
          initialDeliveryPointId={memberOrder.deliveryPointId}
          initialNotes={memberOrder.notes ?? ""}
        />
      )}
    </div>
  )
}
