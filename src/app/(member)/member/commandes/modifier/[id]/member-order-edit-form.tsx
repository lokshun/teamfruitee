"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { computeLineTotal, computeOrderTotal } from "@/lib/price-utils"

interface GroupOrderProduct {
  id: string
  priceOverride: number | null | { toString(): string }
  product: {
    name: string
    description: string | null
    unitType: string
    unitQuantity: number
    priceWithTransport: number | { toString(): string }
  }
}

interface GroupOrder {
  id: string
  products: GroupOrderProduct[]
}

interface DeliveryPoint {
  id: string
  name: string
  commune: string
}

const unitLabels: Record<string, string> = {
  CRATE: "caisse",
  KG: "kg",
  UNIT: "unité",
  LITER: "litre",
}

export function MemberOrderEditForm({
  memberOrderId,
  groupOrder,
  deliveryPoints,
  initialQuantities,
  initialDeliveryPointId,
  initialNotes,
}: {
  memberOrderId: string
  groupOrder: GroupOrder
  deliveryPoints: DeliveryPoint[]
  initialQuantities: Record<string, number>
  initialDeliveryPointId: string
  initialNotes: string
}) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities)
  const [deliveryPointId, setDeliveryPointId] = useState(initialDeliveryPointId)
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getPrice(gop: GroupOrderProduct): number {
    return Number(gop.priceOverride ?? gop.product.priceWithTransport)
  }

  const lines = groupOrder.products
    .filter((gop) => (quantities[gop.id] ?? 0) > 0)
    .map((gop) => ({
      groupOrderProductId: gop.id,
      quantity: quantities[gop.id],
      unitPrice: getPrice(gop),
    }))

  const total = computeOrderTotal(lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })))

  async function submit() {
    if (lines.length === 0) {
      setError("Ajoutez au moins un produit.")
      return
    }
    if (!deliveryPointId) {
      setError("Choisissez un point de livraison.")
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/member/orders/${memberOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryPointId,
        notes,
        lines: lines.map((l) => ({ groupOrderProductId: l.groupOrderProductId, quantity: l.quantity })),
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "Erreur lors de la modification")
      setLoading(false)
      return
    }

    router.push("/member/historique")
    router.refresh()
  }

  async function cancelOrder() {
    if (!confirm("Annuler définitivement cette commande ?")) return

    const res = await fetch(`/api/member/orders/${memberOrderId}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/member/commandes")
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Produits</h2>
        {groupOrder.products.map((gop) => {
          const price = getPrice(gop)
          const qty = quantities[gop.id] ?? 0
          const lineTotal = computeLineTotal(qty, price)

          return (
            <div key={gop.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{gop.product.name}</p>
                {gop.product.description && (
                  <p className="text-xs text-gray-500">{gop.product.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  {gop.product.unitQuantity} {unitLabels[gop.product.unitType]} — {formatCurrency(price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantities({ ...quantities, [gop.id]: Math.max(0, qty - 1) })}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-lg leading-none"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQuantities({ ...quantities, [gop.id]: qty + 1 })}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-lg leading-none"
                >
                  +
                </button>
                {qty > 0 && (
                  <span className="w-20 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(lineTotal)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Point de livraison *</label>
        <select
          value={deliveryPointId}
          onChange={(e) => setDeliveryPointId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Choisir un point…</option>
          {deliveryPoints.map((dp) => (
            <option key={dp.id} value={dp.id}>{dp.name} ({dp.commune})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (facultatif)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {total > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total à payer :</span>
            <span className="text-xl font-bold text-green-700">{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Paiement par espèces ou virement.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading || lines.length === 0}
          className="flex-1 bg-green-600 text-white rounded-lg py-2.5 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={cancelOrder}
          className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Annuler la commande
        </button>
      </div>
    </div>
  )
}
