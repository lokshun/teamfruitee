import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/calendar-utils"
import { GroupOrderStatus } from "@/generated/prisma/client"

export default async function ProducerOrdersPage() {
  const session = await auth()
  if (!session) return null

  // Trouver le producteur lié au compte
  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
  })

  if (!producer) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucun producteur lié à votre compte. Contactez un coordinateur.
      </div>
    )
  }

  const groupOrders = await prisma.groupOrder.findMany({
    where: { producerId: producer.id },
    include: {
      memberOrders: {
        include: {
          user: { select: { name: true, commune: true } },
          deliveryPoint: { select: { name: true } },
          orderLines: {
            include: {
              groupOrderProduct: { include: { product: { select: { name: true } } } },
            },
          },
        },
      },
    },
    orderBy: { deliveryDate: "desc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Commandes — {producer.name}
      </h1>

      {groupOrders.length === 0 && (
        <p className="text-gray-500 text-center py-12">Aucune commande pour le moment.</p>
      )}

      {groupOrders.map((go) => {
        const total = go.memberOrders.reduce((sum, mo) => sum + Number(mo.totalAmount), 0)

        // Agrégat par produit
        const productTotals = new Map<string, { name: string; qty: number }>()
        for (const mo of go.memberOrders) {
          for (const line of mo.orderLines) {
            const key = line.groupOrderProduct.product.name
            const existing = productTotals.get(key)
            if (existing) {
              existing.qty += line.quantity
            } else {
              productTotals.set(key, { name: key, qty: line.quantity })
            }
          }
        }

        return (
          <div key={go.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">{go.title}</h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: STATUS_COLORS[go.status as GroupOrderStatus] + "20",
                      color: STATUS_COLORS[go.status as GroupOrderStatus],
                    }}
                  >
                    {STATUS_LABELS[go.status as GroupOrderStatus]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Livraison : {formatDate(go.deliveryDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-gray-900">{formatCurrency(total)}</p>
                {go.status !== "DRAFT" && (
                  <>
                    <a
                      href={`/api/coordinator/export/pdf/${go.id}`}
                      target="_blank"
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      PDF
                    </a>
                    <a
                      href={`/api/coordinator/export/excel/${go.id}`}
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                    >
                      Excel
                    </a>
                  </>
                )}
              </div>
            </div>

            {productTotals.size > 0 && (
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">RÉCAP PRODUITS</p>
                <div className="flex flex-wrap gap-3">
                  {[...productTotals.values()].map((pt) => (
                    <span key={pt.name} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                      {pt.name} <strong>×{pt.qty}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {go.memberOrders.map((mo) => (
                <div key={mo.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{mo.user?.name ?? mo.proxyBuyerName ?? "Acheteur"} {mo.user?.commune ? `(${mo.user.commune})` : ""}</p>
                    <p className="text-xs text-gray-400">📦 {mo.deliveryPoint.name}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(Number(mo.totalAmount))}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
