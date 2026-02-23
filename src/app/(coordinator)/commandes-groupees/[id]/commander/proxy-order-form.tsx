"use client"

import { useState } from "react"

interface Product {
  id: string
  productId: string
  name: string
  unitType: string
  unitQuantity: number
  price: number
}

interface DeliveryPoint {
  id: string
  name: string
  commune: string
}

interface Member {
  id: string
  name: string
  commune: string | null
}

const unitLabels: Record<string, string> = { CRATE: "Caisse", KG: "kg", UNIT: "Unité", LITER: "L" }

export function ProxyOrderForm({
  groupOrderId,
  products,
  deliveryPoints,
  activeMembers,
  alreadyOrderedUserIds,
}: {
  groupOrderId: string
  products: Product[]
  deliveryPoints: DeliveryPoint[]
  activeMembers: Member[]
  alreadyOrderedUserIds: string[]
}) {
  const [buyerType, setBuyerType] = useState<"existing" | "anonymous">("existing")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [proxyBuyerName, setProxyBuyerName] = useState("")
  const [deliveryPointId, setDeliveryPointId] = useState(deliveryPoints[0]?.id ?? "")
  const [notes, setNotes] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)

  function setQty(productId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, value) }))
  }

  function resetForm() {
    setSelectedUserId("")
    setProxyBuyerName("")
    setNotes("")
    setQuantities({})
    setError(null)
  }

  const lines = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([groupOrderProductId, quantity]) => ({ groupOrderProductId, quantity }))

  const totalAmount = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.groupOrderProductId)
    return sum + (product ? product.price * line.quantity : 0)
  }, 0)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (buyerType === "existing" && !selectedUserId) {
      setError("Veuillez sélectionner un membre.")
      return
    }
    if (buyerType === "anonymous" && !proxyBuyerName.trim()) {
      setError("Veuillez saisir le nom de l'acheteur.")
      return
    }
    if (lines.length === 0) {
      setError("Au moins un produit est requis.")
      return
    }
    if (!deliveryPointId) {
      setError("Veuillez sélectionner un point de livraison.")
      return
    }

    setLoading(true)

    const body = {
      userId: buyerType === "existing" ? selectedUserId : undefined,
      proxyBuyerName: buyerType === "anonymous" ? proxyBuyerName.trim() : undefined,
      deliveryPointId,
      notes: notes.trim() || undefined,
      lines,
    }

    try {
      const res = await fetch(`/api/coordinator/group-orders/${groupOrderId}/proxy-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? `Erreur HTTP ${res.status}`)
        setLoading(false)
        return
      }

      setSuccessCount((n) => n + 1)
      resetForm()
    } catch {
      setError("Erreur réseau, veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const availableMembers = activeMembers.filter(
    (m) => !alreadyOrderedUserIds.includes(m.id)
  )

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {successCount > 0 && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {successCount} commande{successCount > 1 ? "s" : ""} ajoutée{successCount > 1 ? "s" : ""} avec succès.
          Vous pouvez en ajouter une autre.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Toggle type d'acheteur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type d&apos;acheteur</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setBuyerType("existing"); setProxyBuyerName("") }}
            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
              buyerType === "existing"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Membre existant
          </button>
          <button
            type="button"
            onClick={() => { setBuyerType("anonymous"); setSelectedUserId("") }}
            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
              buyerType === "anonymous"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Acheteur sans compte
          </button>
        </div>
      </div>

      {/* Sélection acheteur */}
      {buyerType === "existing" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Membre <span className="text-red-500">*</span>
          </label>
          {availableMembers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Tous les membres actifs ont déjà commandé pour cette commande groupée.
            </p>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choisir un membre…</option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.commune ? ` (${m.commune})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l&apos;acheteur <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={proxyBuyerName}
            onChange={(e) => setProxyBuyerName(e.target.value)}
            placeholder="Prénom Nom"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* Point de livraison */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Point de livraison <span className="text-red-500">*</span>
        </label>
        <select
          value={deliveryPointId}
          onChange={(e) => setDeliveryPointId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Choisir un point…</option>
          {deliveryPoints.map((dp) => (
            <option key={dp.id} value={dp.id}>
              {dp.name} ({dp.commune})
            </option>
          ))}
        </select>
      </div>

      {/* Quantités */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Produits <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {products.map((p) => {
            const qty = quantities[p.id] ?? 0
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.unitQuantity}&nbsp;{unitLabels[p.unitType]}&nbsp;—&nbsp;{p.price.toFixed(2)}&nbsp;€
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(p.id, qty - 1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-gray-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(p.id, qty + 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-sm hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                {qty > 0 && (
                  <span className="text-sm font-medium text-gray-700 w-16 text-right">
                    {(p.price * qty).toFixed(2)}&nbsp;€
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      {totalAmount > 0 && (
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">Total estimé</span>
          <span className="text-lg font-bold text-green-700">{totalAmount.toFixed(2)}&nbsp;€</span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || (buyerType === "existing" && availableMembers.length === 0)}
        className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Enregistrement..." : "Ajouter la commande"}
      </button>
    </form>
  )
}
