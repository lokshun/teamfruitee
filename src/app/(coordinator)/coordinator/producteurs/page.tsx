import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Store, Package } from "lucide-react"

export default async function ProducteursPage() {
  const producers = await prisma.producer.findMany({
    include: {
      _count: { select: { products: true, groupOrders: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Producteurs</h1>
          <p className="text-gray-500 mt-1">{producers.length} producteur(s) enregistré(s)</p>
        </div>
        <Link
          href="/coordinator/producteurs/nouveau"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau producteur
        </Link>
      </div>

      {producers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun producteur enregistré</p>
          <p className="text-gray-400 text-sm mt-1">Commencez par ajouter votre premier producteur.</p>
          <Link
            href="/coordinator/producteurs/nouveau"
            className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un producteur
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Producteur
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Localisation
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Produits
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Statut
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {producers.map((producer) => (
                <tr key={producer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{producer.name}</div>
                    {producer.description && (
                      <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {producer.description}
                      </div>
                    )}
                    {producer.contactEmail && (
                      <div className="text-xs text-gray-400 mt-0.5">{producer.contactEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {producer.location ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Package className="h-4 w-4 text-gray-400" />
                      {producer._count.products}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        producer.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {producer.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/coordinator/producteurs/${producer.id}/produits`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Produits
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/coordinator/producteurs/${producer.id}`}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
