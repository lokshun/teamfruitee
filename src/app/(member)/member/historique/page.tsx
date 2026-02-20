import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

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

export default async function HistoriquePage() {
  const session = await auth()
  if (!session) return null

  const orders = await prisma.memberOrder.findMany({
    where: { userId: session.user.id },
    include: {
      groupOrder: {
        include: { producer: { select: { name: true } } },
      },
      deliveryPoint: { select: { name: true, commune: true } },
      orderLines: {
        include: {
          groupOrderProduct: {
            include: { product: { select: { name: true, unitType: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique de mes commandes</h1>

      {orders.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Vous n&apos;avez pas encore passé de commande.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.groupOrder.title}</p>
                <p className="text-sm text-gray-500">
                  {order.groupOrder.producer.name} —{" "}
                  Livraison le {formatDate(order.groupOrder.deliveryDate)} •{" "}
                  {order.deliveryPoint.name} ({order.deliveryPoint.commune})
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  {formatCurrency(Number(order.totalAmount))}
                </p>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[order.paymentStatus]}`}
                >
                  {paymentLabels[order.paymentStatus]}
                </span>
              </div>
            </div>
            <div className="px-4 py-3">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {order.orderLines.map((line) => (
                    <tr key={line.id}>
                      <td className="py-1.5 text-gray-700">
                        {line.groupOrderProduct.product.name}
                      </td>
                      <td className="py-1.5 text-gray-500 text-right">
                        ×{line.quantity}
                      </td>
                      <td className="py-1.5 text-gray-500 text-right">
                        {formatCurrency(Number(line.unitPrice))}
                      </td>
                      <td className="py-1.5 font-medium text-gray-900 text-right">
                        {formatCurrency(Number(line.lineTotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
