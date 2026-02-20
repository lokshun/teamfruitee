import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const [
    pendingMembers,
    openGroupOrders,
    unpaidOrders,
    upcomingDeliveries,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER", status: "PENDING" } }),
    prisma.groupOrder.findMany({
      where: { status: "OPEN" },
      include: {
        producer: { select: { name: true } },
        _count: { select: { memberOrders: true } },
      },
      orderBy: { closeDate: "asc" },
    }),
    prisma.memberOrder.count({ where: { paymentStatus: "NOT_PAID" } }),
    prisma.groupOrder.findMany({
      where: {
        status: { in: ["CLOSED"] },
        deliveryDate: { gte: new Date() },
      },
      include: { producer: { select: { name: true } } },
      orderBy: { deliveryDate: "asc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Statistiques clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Inscriptions en attente"
          value={pendingMembers}
          href="/coordinator/membres?filter=pending"
          color="yellow"
        />
        <StatCard
          label="Commandes groupées ouvertes"
          value={openGroupOrders.length}
          href="/commandes-groupees?filter=open"
          color="green"
        />
        <StatCard
          label="Paiements en attente"
          value={unpaidOrders}
          href="/coordinator/paiements"
          color="red"
        />
      </div>

      {/* Commandes groupées en cours */}
      {openGroupOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commandes groupées ouvertes</h2>
          <div className="space-y-3">
            {openGroupOrders.map((go) => (
              <div key={go.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{go.title}</p>
                  <p className="text-sm text-gray-500">
                    {go.producer.name} — Clôture le {formatDate(go.closeDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {go._count.memberOrders} commande{go._count.memberOrders > 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/commandes-groupees/${go.id}`}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Livraisons à venir */}
      {upcomingDeliveries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Prochaines livraisons</h2>
          <div className="space-y-2">
            {upcomingDeliveries.map((go) => (
              <div key={go.id} className="flex items-center justify-between">
                <span className="text-gray-700">{go.title} ({go.producer.name})</span>
                <span className="text-sm font-medium text-blue-600">{formatDate(go.deliveryDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string
  value: number
  href: string
  color: "green" | "yellow" | "red"
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 hover:shadow-md transition-shadow ${colorClasses[color]}`}
    >
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </Link>
  )
}
