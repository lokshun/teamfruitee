import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/calendar-utils"
import { GroupOrderStatus } from "@/generated/prisma/client"
import Link from "next/link"
import { GroupOrderStatusActions } from "./status-actions"

export default async function CommandesGroupeesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams

  const where = filter === "open"
    ? { status: "OPEN" as GroupOrderStatus }
    : {}

  const groupOrders = await prisma.groupOrder.findMany({
    where,
    include: {
      producer: { select: { name: true } },
      _count: { select: { memberOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes groupées</h1>
        <Link
          href="/commandes-groupees/nouvelle"
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
        >
          + Nouvelle commande
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Mobile : cartes */}
        <div className="md:hidden divide-y divide-gray-100">
          {groupOrders.map((go) => (
            <div key={go.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/commandes-groupees/${go.id}`} className="font-semibold text-gray-900 hover:text-green-600 leading-tight block">
                    {go.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{go.producer.name}</p>
                </div>
                <span
                  className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: STATUS_COLORS[go.status] + "20",
                    color: STATUS_COLORS[go.status],
                  }}
                >
                  {STATUS_LABELS[go.status as GroupOrderStatus]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Clôture : <strong className="text-gray-700">{formatDate(go.closeDate)}</strong></span>
                <span>Livraison : <strong className="text-gray-700">{formatDate(go.deliveryDate)}</strong></span>
                <span><strong className="text-gray-700">{go._count.memberOrders}</strong> commande(s)</span>
              </div>
              <GroupOrderStatusActions
                groupOrderId={go.id}
                currentStatus={go.status}
                canDelete={go._count.memberOrders === 0}
              />
            </div>
          ))}
          {groupOrders.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-400">Aucune commande groupée.</p>
          )}
        </div>

        {/* Desktop : tableau */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producteur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Clôture</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Livraison</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Commandes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupOrders.map((go) => (
                <tr key={go.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/commandes-groupees/${go.id}`} className="font-medium text-gray-900 hover:text-green-600">
                      {go.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{go.producer.name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(go.closeDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(go.deliveryDate)}</td>
                  <td className="px-4 py-3 text-center font-medium">{go._count.memberOrders}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: STATUS_COLORS[go.status] + "20",
                        color: STATUS_COLORS[go.status],
                      }}
                    >
                      {STATUS_LABELS[go.status as GroupOrderStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <GroupOrderStatusActions
                      groupOrderId={go.id}
                      currentStatus={go.status}
                      canDelete={go._count.memberOrders === 0}
                    />
                  </td>
                </tr>
              ))}
              {groupOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Aucune commande groupée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
