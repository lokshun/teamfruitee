import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/calendar-utils"
import { GroupOrderStatus } from "@/generated/prisma/client"
import { notFound } from "next/navigation"
import Link from "next/link"
import { PaymentStatusToggle } from "../../paiements/payment-toggle"

const paymentLabels: Record<string, string> = {
  NOT_PAID: "Non payé",
  PARTIAL: "Partiel",
  PAID: "Payé",
}
const paymentColors: Record<string, string> = {
  NOT_PAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
}

export default async function GroupOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      producer: true,
      products: { include: { product: true } },
      transportUser: { select: { name: true } },
      deliveryPoints: { select: { id: true, name: true, commune: true } },
      paymentReferents: { select: { id: true, name: true } },
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
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!groupOrder) notFound()

  const grandTotal = groupOrder.memberOrders.reduce(
    (sum, mo) => sum + Number(mo.totalAmount),
    0
  )

  const grandTotalQty = groupOrder.memberOrders.reduce(
    (sum, mo) => sum + mo.orderLines.reduce((s, l) => s + l.quantity, 0),
    0
  )

  // Agrégat par produit
  const productTotals = new Map<string, { name: string; qty: number; total: number }>()
  for (const mo of groupOrder.memberOrders) {
    for (const line of mo.orderLines) {
      const key = line.groupOrderProduct.productId
      const existing = productTotals.get(key)
      if (existing) {
        existing.qty += line.quantity
        existing.total += Number(line.lineTotal)
      } else {
        productTotals.set(key, {
          name: line.groupOrderProduct.product.name,
          qty: line.quantity,
          total: Number(line.lineTotal),
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/commandes-groupees" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{groupOrder.title}</h1>
          <p className="text-gray-500">{groupOrder.producer.name}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: STATUS_COLORS[groupOrder.status] + "20",
              color: STATUS_COLORS[groupOrder.status],
            }}
          >
            {STATUS_LABELS[groupOrder.status as GroupOrderStatus]}
          </span>
          {(groupOrder.status === "DRAFT" || groupOrder.status === "OPEN") && (
            <Link
              href={`/commandes-groupees/${id}/modifier`}
              className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              Modifier
            </Link>
          )}
          {groupOrder.status === "OPEN" && (
            <Link
              href={`/commandes-groupees/${id}/commander`}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              Commander pour des acheteurs
            </Link>
          )}
          <a
            href={`/api/coordinator/export/pdf/${id}`}
            target="_blank"
            className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
          >
            PDF
          </a>
          <a
            href={`/api/coordinator/export/excel/${id}`}
            className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
          >
            Excel
          </a>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ouverture", date: groupOrder.openDate },
          { label: "Clôture", date: groupOrder.closeDate },
          { label: "Livraison", date: groupOrder.deliveryDate },
        ].map(({ label, date }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-gray-900">{formatDate(date)}</p>
          </div>
        ))}
      </div>

      {/* Infos : transport + quantité minimum + référents paiement */}
      {(groupOrder.transportUser || groupOrder.minOrderQuantity || groupOrder.paymentReferents.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {groupOrder.transportUser && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Responsable transport :</span>
              <span className="font-medium text-gray-900">{groupOrder.transportUser.name}</span>
            </div>
          )}
          {groupOrder.paymentReferents.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 shrink-0">Référents paiement :</span>
              <div className="flex flex-wrap gap-1">
                {groupOrder.paymentReferents.map((r) => (
                  <span key={r.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {groupOrder.minOrderQuantity && (() => {
            const min = groupOrder.minOrderQuantity as number
            const pct = Math.min(100, Math.round((grandTotalQty / min) * 100))
            const reached = grandTotalQty >= min
            return (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Quantité minimum de commande</span>
                  <span className={reached ? "font-medium text-green-700" : "font-medium text-amber-700"}>
                    {grandTotalQty} / {min} unités
                    {reached ? " ✓ Atteint" : ` (${pct}%)`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${reached ? "bg-green-500" : "bg-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Points de livraison */}
      {groupOrder.deliveryPoints.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-2">Points de livraison disponibles</p>
          <div className="flex flex-wrap gap-2">
            {groupOrder.deliveryPoints.map((dp) => (
              <span key={dp.id} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {dp.name} <span className="text-gray-400">({dp.commune})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Catalogue produits */}
      {groupOrder.products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Produits au catalogue ({groupOrder.products.length})
          </h2>
          <div className="divide-y divide-gray-50">
            {groupOrder.products.map((gop) => {
              const unitLabels: Record<string, string> = { CRATE: "Caisse", KG: "kg", UNIT: "Unité", LITER: "L" }
              const price = Number(gop.priceOverride ?? gop.product.priceWithTransport)
              return (
                <div key={gop.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{gop.product.name}</span>
                  <span className="text-gray-500">
                    {gop.product.unitQuantity}&nbsp;{unitLabels[gop.product.unitType]}
                    &nbsp;—&nbsp;{formatCurrency(price)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Totaux par produit */}
      {productTotals.size > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Récapitulatif produits</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-100">
              <tr>
                <th className="text-left py-2">Produit</th>
                <th className="text-right py-2">Qté totale</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...productTotals.values()].map((pt) => (
                <tr key={pt.name}>
                  <td className="py-2 font-medium text-gray-900">{pt.name}</td>
                  <td className="py-2 text-right text-gray-600">×{pt.qty}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(pt.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-right font-bold text-gray-900">TOTAL GÉNÉRAL</td>
                <td className="pt-3 text-right font-bold text-green-700 text-base">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Commandes membres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Commandes membres ({groupOrder.memberOrders.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {groupOrder.memberOrders.map((mo) => {
            const isProxy = !mo.userId
            const buyerName = isProxy
              ? (mo.proxyBuyerName ?? "Acheteur sans compte")
              : (mo.user?.name ?? "Membre inconnu")
            const buyerCommune = mo.user?.commune

            return (
              <div key={mo.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {buyerName}
                      {buyerCommune ? ` (${buyerCommune})` : ""}
                      {isProxy && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          proxy
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">📦 {mo.deliveryPoint.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-gray-900">{formatCurrency(Number(mo.totalAmount))}</p>
                    <PaymentStatusToggle orderId={mo.id} currentStatus={mo.paymentStatus} />
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {mo.orderLines.map((line) => (
                    <div key={line.id} className="flex justify-between">
                      <span>{line.groupOrderProduct.product.name} ×{line.quantity}</span>
                      <span>{formatCurrency(Number(line.lineTotal))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {groupOrder.memberOrders.length === 0 && (
            <p className="px-5 py-8 text-center text-gray-400">Aucune commande pour l&apos;instant.</p>
          )}
        </div>
      </div>
    </div>
  )
}
