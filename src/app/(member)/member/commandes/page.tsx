import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

export default async function CommandesPage() {
  const session = await auth()
  if (!session) return null

  // Commandes groupées ouvertes sans commande membre existante
  const openGroupOrders = await prisma.groupOrder.findMany({
    where: {
      status: "OPEN",
      closeDate: { gte: new Date() },
    },
    include: {
      producer: { select: { name: true } },
      memberOrders: {
        where: { userId: session.user.id },
        select: { id: true, totalAmount: true },
      },
    },
    orderBy: { closeDate: "asc" },
  })

  const orderable = openGroupOrders.filter((go) => go.memberOrders.length === 0)
  const alreadyOrdered = openGroupOrders.filter((go) => go.memberOrders.length > 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Commandes en cours</h1>

      {orderable.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700">Commandes ouvertes</h2>
          {orderable.map((go) => (
            <div
              key={go.id}
              className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{go.title}</p>
                <p className="text-sm text-gray-500">
                  {go.producer.name} — Clôture le {formatDate(go.closeDate)}
                </p>
              </div>
              <Link
                href={`/member/commandes/nouvelle?groupOrderId=${go.id}`}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Commander
              </Link>
            </div>
          ))}
        </div>
      )}

      {alreadyOrdered.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700">Mes commandes passées (modifiables)</h2>
          {alreadyOrdered.map((go) => (
            <div
              key={go.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{go.title}</p>
                <p className="text-sm text-gray-500">
                  {go.producer.name} — Clôture le {formatDate(go.closeDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(Number(go.memberOrders[0].totalAmount))}
                </span>
                <Link
                  href={`/member/commandes/modifier/${go.memberOrders[0].id}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {orderable.length === 0 && alreadyOrdered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune commande groupée ouverte pour le moment.</p>
          <Link href="/member/calendrier" className="text-green-600 hover:underline text-sm mt-2 inline-block">
            Voir le calendrier →
          </Link>
        </div>
      )}
    </div>
  )
}
