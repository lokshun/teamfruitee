import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProxyOrderForm } from "./proxy-order-form"

export default async function CommanderPourAcheteurPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [groupOrder, activeMembers] = await Promise.all([
    prisma.groupOrder.findUnique({
      where: { id },
      include: {
        producer: { select: { name: true } },
        products: {
          include: { product: true },
        },
        deliveryPoints: { select: { id: true, name: true, commune: true } },
        memberOrders: { select: { userId: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: "MEMBER" },
      select: { id: true, name: true, commune: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!groupOrder) notFound()

  if (groupOrder.status !== "OPEN") {
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
          <h1 className="text-2xl font-bold text-gray-900">Commander pour des acheteurs</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-600">Cette commande groupée n&apos;est pas ouverte.</p>
        </div>
      </div>
    )
  }

  // Membres qui ont déjà commandé
  const alreadyOrderedUserIds = groupOrder.memberOrders
    .map((mo) => mo.userId)
    .filter((uid): uid is string => uid !== null)

  const products = groupOrder.products.map((gop) => ({
    id: gop.id,
    productId: gop.productId,
    name: gop.product.name,
    unitType: gop.product.unitType,
    unitQuantity: gop.product.unitQuantity,
    price: Number(gop.priceOverride ?? gop.product.priceWithTransport),
  }))

  const deliveryPoints = groupOrder.deliveryPoints

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
        <h1 className="text-2xl font-bold text-gray-900">Commander pour des acheteurs</h1>
        <p className="text-gray-500 mt-1">
          {groupOrder.title} — {groupOrder.producer.name}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <ProxyOrderForm
          groupOrderId={id}
          products={products}
          deliveryPoints={deliveryPoints}
          activeMembers={activeMembers}
          alreadyOrderedUserIds={alreadyOrderedUserIds}
        />
      </div>
    </div>
  )
}
