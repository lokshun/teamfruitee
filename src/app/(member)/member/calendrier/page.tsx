import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/calendar-utils"
import { GroupOrderStatus } from "@/generated/prisma/client"

export default async function CalendrierPage() {
  const groupOrders = await prisma.groupOrder.findMany({
    where: {
      status: { not: "DRAFT" },
      deliveryDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    },
    include: { producer: { select: { name: true } } },
    orderBy: { openDate: "asc" },
  })

  const statusOrder: GroupOrderStatus[] = ["OPEN", "CLOSED", "DELIVERED", "DRAFT"]
  const sorted = [...groupOrders].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendrier des commandes</h1>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_LABELS) as [GroupOrderStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Aucune commande groupée prévue pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {sorted.map((go) => (
          <div
            key={go.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
          >
            <div
              className="w-2 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: STATUS_COLORS[go.status] }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{go.title}</p>
              <p className="text-sm text-gray-500">{go.producer.name}</p>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-6 text-sm text-center">
              <div>
                <p className="text-gray-400 text-xs">Ouverture</p>
                <p className="font-medium text-gray-700">{formatDate(go.openDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Clôture</p>
                <p className="font-medium text-gray-700">{formatDate(go.closeDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Livraison</p>
                <p className="font-medium text-gray-700">{formatDate(go.deliveryDate)}</p>
              </div>
            </div>
            <span
              className="flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: STATUS_COLORS[go.status] + "20",
                color: STATUS_COLORS[go.status],
              }}
            >
              {STATUS_LABELS[go.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
