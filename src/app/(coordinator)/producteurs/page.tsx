import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ProducerForm } from "./producer-form"

const unitTypeLabels: Record<string, string> = {
  CRATE: "Caisse", KG: "kg", UNIT: "Unité", LITER: "Litre",
}

export default async function ProducteursPage() {
  const producers = await prisma.producer.findMany({
    include: {
      products: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Producteurs & Produits</h1>
        <ProducerForm />
      </div>

      {producers.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Aucun producteur. Créez le premier avec le bouton ci-dessus.
        </p>
      )}

      <div className="space-y-6">
        {producers.map((producer) => (
          <div key={producer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{producer.name}</h2>
                  {!producer.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactif</span>
                  )}
                </div>
                {producer.location && (
                  <p className="text-sm text-gray-500">📍 {producer.location}</p>
                )}
                {producer.contactEmail && (
                  <p className="text-sm text-gray-500">✉️ {producer.contactEmail}</p>
                )}
              </div>
              <div className="flex gap-2">
                <ProducerForm producer={producer} />
              </div>
            </div>

            {/* Produits */}
            <div>
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Produits ({producer.products.filter((p) => p.isActive).length} actifs)
                </span>
                <Link
                  href={`/coordinator/producteurs/${producer.id}/nouveau-produit`}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Ajouter un produit
                </Link>
              </div>

              {producer.products.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">Aucun produit.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-2 text-left">Produit</th>
                      <th className="px-5 py-2 text-left">Unité</th>
                      <th className="px-5 py-2 text-right">Prix producteur</th>
                      <th className="px-5 py-2 text-right">Prix + transport</th>
                      <th className="px-5 py-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {producer.products.map((product) => (
                      <tr key={product.id} className={!product.isActive ? "opacity-50" : ""}>
                        <td className="px-5 py-3 font-medium text-gray-900">{product.name}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {product.unitQuantity} {unitTypeLabels[product.unitType]}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {Number(product.priceProducer).toFixed(2)} €
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-900">
                          {Number(product.priceWithTransport).toFixed(2)} €
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {product.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
