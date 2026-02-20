import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

const unitTypeLabels: Record<string, string> = {
  CRATE: "Caisse",
  KG: "kg",
  UNIT: "Unité",
  LITER: "Litre",
}

export default async function CataloguePage() {
  const producers = await prisma.producer.findMany({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  // Commandes groupées ouvertes
  const openGroupOrders = await prisma.groupOrder.findMany({
    where: { status: "OPEN" },
    include: { producer: { select: { id: true, name: true } } },
    orderBy: { closeDate: "asc" },
  })

  const openProducerIds = new Set(openGroupOrders.map((go) => go.producer.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des producteurs</h1>
        {openGroupOrders.length > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {openGroupOrders.length} commande{openGroupOrders.length > 1 ? "s" : ""} ouverte{openGroupOrders.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {producers.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          Aucun producteur disponible pour le moment.
        </p>
      )}

      {producers.map((producer) => {
        const hasOpenOrder = openProducerIds.has(producer.id)
        const openOrder = openGroupOrders.find((go) => go.producer.id === producer.id)

        return (
          <div key={producer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{producer.name}</h2>
                  {producer.location && (
                    <p className="text-sm text-gray-500">📍 {producer.location}</p>
                  )}
                  {producer.description && (
                    <p className="text-sm text-gray-600 mt-1">{producer.description}</p>
                  )}
                </div>
                {hasOpenOrder && openOrder && (
                  <a
                    href={`/member/commandes/nouvelle?groupOrderId=${openOrder.id}`}
                    className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    Commander →
                  </a>
                )}
              </div>
            </div>

            {producer.products.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {producer.products.map((product) => (
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
                        {formatCurrency(Number(product.priceWithTransport))}
                      </p>
                      <p className="text-xs text-gray-400">avec transport</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 py-4 text-sm text-gray-400">Aucun produit disponible.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
