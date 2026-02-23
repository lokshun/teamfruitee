"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Lock } from "lucide-react"

const unitLabels: Record<string, string> = { CRATE: "Caisse", KG: "kg", UNIT: "Unité", LITER: "L" }

interface GroupOrderData {
  id: string
  title: string
  openDate: Date
  closeDate: Date
  deliveryDate: Date
  notes: string | null
  minOrderQuantity: number | null
  transportUserId: string | null
  deliveryPointIds: string[]
  paymentReferentIds: string[]
  currentProductIds: string[]
  orderedProductIds: string[]
}

interface DeliveryPoint {
  id: string
  name: string
  commune: string
}

interface User {
  id: string
  name: string
  commune: string | null
  role: string
}

interface Product {
  id: string
  name: string
  unitQuantity: number
  unitType: string
  priceWithTransport: number
}

function toDatetimeLocal(date: Date): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function GroupOrderEditForm({
  groupOrder,
  deliveryPoints,
  allProducts,
  users,
  canDelete,
}: {
  groupOrder: GroupOrderData
  deliveryPoints: DeliveryPoint[]
  allProducts: Product[]
  users: User[]
  canDelete: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(groupOrder.title)
  const [openDate, setOpenDate] = useState(toDatetimeLocal(groupOrder.openDate))
  const [closeDate, setCloseDate] = useState(toDatetimeLocal(groupOrder.closeDate))
  const [deliveryDate, setDeliveryDate] = useState(toDatetimeLocal(groupOrder.deliveryDate))
  const [notes, setNotes] = useState(groupOrder.notes ?? "")
  const [minOrderQuantity, setMinOrderQuantity] = useState(
    groupOrder.minOrderQuantity != null ? String(groupOrder.minOrderQuantity) : ""
  )
  const [transportUserId, setTransportUserId] = useState(groupOrder.transportUserId ?? "")
  const [selectedDeliveryPoints, setSelectedDeliveryPoints] = useState<string[]>(groupOrder.deliveryPointIds)
  const [selectedPaymentReferents, setSelectedPaymentReferents] = useState<string[]>(groupOrder.paymentReferentIds)
  const [selectedProducts, setSelectedProducts] = useState<string[]>(groupOrder.currentProductIds)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleDeliveryPoint(id: string) {
    setSelectedDeliveryPoints((prev) =>
      prev.includes(id) ? prev.filter((dp) => dp !== id) : [...prev, id]
    )
  }

  function toggleProduct(id: string) {
    if (groupOrder.orderedProductIds.includes(id)) return
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedProducts.length === 0) {
      setError("Au moins un produit est requis.")
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/coordinator/group-orders/${groupOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        openDate: new Date(openDate).toISOString(),
        closeDate: new Date(closeDate).toISOString(),
        deliveryDate: new Date(deliveryDate).toISOString(),
        notes: notes || undefined,
        deliveryPointIds: selectedDeliveryPoints,
        productIds: selectedProducts,
        minOrderQuantity: minOrderQuantity ? parseInt(minOrderQuantity, 10) : null,
        transportUserId: transportUserId || null,
        paymentReferentIds: selectedPaymentReferents,
      }),
    })

    if (!res.ok) {
      try {
        const json = await res.json()
        setError(json.error ?? "Une erreur est survenue")
      } catch {
        setError(`Erreur HTTP ${res.status}`)
      }
      setLoading(false)
      return
    }

    router.push(`/commandes-groupees/${groupOrder.id}`)
    router.refresh()
  }

  async function onDelete() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/coordinator/group-orders/${groupOrder.id}`, { method: "DELETE" })
    if (!res.ok) {
      try {
        const json = await res.json()
        setError(json.error ?? "Erreur lors de la suppression")
      } catch {
        setError("Erreur lors de la suppression")
      }
      setLoading(false)
      setConfirmDelete(false)
      return
    }
    router.push("/commandes-groupees")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d&apos;ouverture <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de clôture <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de livraison <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Produits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Produits inclus <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {allProducts.map((p) => {
            const isOrdered = groupOrder.orderedProductIds.includes(p.id)
            const isSelected = selectedProducts.includes(p.id)
            return (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-2.5 border rounded-lg ${
                  isOrdered
                    ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-70"
                    : "border-gray-200 cursor-pointer hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProduct(p.id)}
                  disabled={isOrdered}
                  className="rounded text-green-600 disabled:opacity-50"
                />
                <span className="flex-1 text-sm text-gray-900">{p.name}</span>
                {isOrdered && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Lock className="h-3 w-3" /> commandé
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {p.unitQuantity}&nbsp;{unitLabels[p.unitType]}&nbsp;—&nbsp;{p.priceWithTransport.toFixed(2)}&nbsp;€
                </span>
              </label>
            )
          })}
        </div>
        {selectedProducts.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Au moins un produit est requis</p>
        )}
      </div>

      {/* Points de livraison */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points de livraison disponibles
          <span className="text-gray-400 font-normal ml-1">(laisser vide = tous les points actifs)</span>
        </label>
        <div className="space-y-2">
          {deliveryPoints.map((dp) => (
            <label key={dp.id} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedDeliveryPoints.includes(dp.id)}
                onChange={() => toggleDeliveryPoint(dp.id)}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-900">
                {dp.name} <span className="text-gray-400">({dp.commune})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité minimum de commande
            <span className="text-gray-400 font-normal ml-1">(optionnel, en unités)</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={minOrderQuantity}
            onChange={(e) => setMinOrderQuantity(e.target.value)}
            placeholder="10"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable transport
            <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
          </label>
          <select
            value={transportUserId}
            onChange={(e) => setTransportUserId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Aucun</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.commune ? ` (${u.commune})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Référents paiement
          <span className="text-gray-400 font-normal ml-1">(optionnel, responsables de la collecte)</span>
        </label>
        <div className="space-y-2">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedPaymentReferents.includes(u.id)}
                onChange={() => {
                  setSelectedPaymentReferents((prev) =>
                    prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                  )
                }}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-900">
                {u.name}
                {u.commune ? <span className="text-gray-400"> ({u.commune})</span> : null}
                <span className="ml-1 text-xs text-gray-400">[{u.role}]</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>

      {canDelete && (
        <div className="pt-4 border-t border-gray-100">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex-1">Confirmer la suppression ?</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={loading}
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer cette commande groupée
            </button>
          )}
        </div>
      )}
    </form>
  )
}
