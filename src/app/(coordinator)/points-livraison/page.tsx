import { prisma } from "@/lib/prisma"
import { DeliveryPointForm } from "./delivery-point-form"

export default async function PointsLivraisonPage() {
  const points = await prisma.deliveryPoint.findMany({
    orderBy: { commune: "asc" },
    include: { _count: { select: { memberOrders: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Points de livraison</h1>
        <DeliveryPointForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Adresse</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Commune</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Utilisations</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {points.map((point) => (
              <tr key={point.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{point.name}</td>
                <td className="px-4 py-3 text-gray-600">{point.address}</td>
                <td className="px-4 py-3 text-gray-600">{point.commune}</td>
                <td className="px-4 py-3 text-center text-gray-600">{point._count.memberOrders}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${point.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {point.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DeliveryPointForm point={point} />
                </td>
              </tr>
            ))}
            {points.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun point de livraison.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
