import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

const unitTypeLabels: Record<string, string> = {
  CRATE: "Caisse",
  KG: "kg",
  UNIT: "Unité",
  LITER: "Litre",
}

export default async function CataloguePage() {
  const openGroupOrders = await prisma.groupOrder.findMany({
    where: { status: "OPEN" },
    include: {
      producer: { select: { name: true, location: true, description: true } },
      products: {
        include: {
          product: true,
        },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { closeDate: "asc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Catalogue des commandes ouvertes</h1>

      {openGroupOrders.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Aucune commande groupée ouverte pour le moment.
        </p>
      )}

      {openGroupOrders.map((go) => (
        <div key={go.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{go.title}</h2>
                <p className="text-sm font-medium text-green-700">{go.producer.name}</p>
                {go.producer.location && (
                  <p className="text-sm text-gray-500">📍 {go.producer.location}</p>
                )}
                {go.producer.description && (
                  <p className="text-sm text-gray-600 mt-1">{go.producer.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Clôture le <span className="font-medium text-gray-600">{formatDate(go.closeDate)}</span>
                </p>
              </div>
              <a
                href={`/member/commandes/nouvelle?groupOrderId=${go.id}`}
                className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Commander →
              </a>
            </div>
          </div>

          {/* Produits */}
          {go.products.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {go.products.map(({ product, priceOverride }) => {
                const price = priceOverride ?? product.priceWithTransport
                return (
                  <div key={product.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500">{product.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {product.unitQuantity} {unitTypeLabels[product.unitType] ?? product.unitType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(Number(price))}
                      </p>
                      <p className="text-xs text-gray-400">avec transport</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-6 py-4 text-sm text-gray-400">Aucun produit dans cette commande.</p>
          )}
        </div>
      ))}
    </div>
  )
}
