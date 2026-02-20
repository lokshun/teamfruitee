import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { MemberActions } from "./member-actions"

export default async function MembresPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams

  const users = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      ...(filter === "pending" ? { status: "PENDING" } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      commune: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  const statusLabel: Record<string, string> = {
    PENDING: "En attente",
    ACTIVE: "Actif",
    INACTIVE: "Inactif",
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
        <div className="flex gap-2">
          <a
            href="/coordinator/membres"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Tous
          </a>
          <a
            href="/coordinator/membres?filter=pending"
            className="px-3 py-1.5 text-sm border border-yellow-300 text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100"
          >
            En attente
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Commune</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.commune ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status]}`}
                  >
                    {statusLabel[user.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MemberActions userId={user.id} currentStatus={user.status} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun membre trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
