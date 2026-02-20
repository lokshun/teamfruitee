import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PaymentStatusToggle } from "./payment-toggle"

export default async function PaiementsPage() {
  const groupOrders = await prisma.groupOrder.findMany({
    where: { status: { in: ["CLOSED", "DELIVERED"] } },
    include: {
      producer: { select: { name: true } },
      memberOrders: {
        include: {
          user: { select: { name: true, commune: true } },
          deliveryPoint: { select: { name: true } },
        },
        orderBy: { paymentStatus: "asc" },
      },
    },
    orderBy: { deliveryDate: "desc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Suivi des paiements</h1>

      {groupOrders.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Aucune commande clôturée pour le moment.
        </p>
      )}

      {groupOrders.map((go) => {
        const paid = go.memberOrders.filter((mo) => mo.paymentStatus === "PAID").length
        const total = go.memberOrders.length
        const paidAmount = go.memberOrders
          .filter((mo) => mo.paymentStatus === "PAID")
          .reduce((sum, mo) => sum + Number(mo.totalAmount), 0)
        const totalAmount = go.memberOrders.reduce(
          (sum, mo) => sum + Number(mo.totalAmount), 0
        )

        return (
          <div key={go.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{go.title}</h2>
                  <p className="text-sm text-gray-500">
                    {go.producer.name} — Livraison {formatDate(go.deliveryDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {paid}/{total} payé{paid > 1 ? "s" : ""}
                  </p>
                  <p className="font-bold text-green-700">
                    {formatCurrency(paidAmount)} / {formatCurrency(totalAmount)}
                  </p>
                  {/* Barre de progression */}
                  <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 ml-auto">
                    <div
                      className="h-1.5 bg-green-500 rounded-full"
                      style={{ width: total > 0 ? `${(paid / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2">Membre</th>
                  <th className="text-left px-5 py-2">Point de livraison</th>
                  <th className="text-right px-5 py-2">Montant dû</th>
                  <th className="text-center px-5 py-2">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {go.memberOrders.map((mo) => (
                  <tr key={mo.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{mo.user.name}</p>
                      {mo.user.commune && (
                        <p className="text-xs text-gray-400">{mo.user.commune}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{mo.deliveryPoint.name}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatCurrency(Number(mo.totalAmount))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <PaymentStatusToggle
                        orderId={mo.id}
                        currentStatus={mo.paymentStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
