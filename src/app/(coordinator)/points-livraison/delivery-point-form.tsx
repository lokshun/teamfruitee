"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeliveryPoint {
  id: string
  name: string
  address: string
  commune: string
  isActive: boolean
}

export function DeliveryPointForm({ point, otherPoints = [] }: { point?: DeliveryPoint; otherPoints?: DeliveryPoint[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [reassignOrderCount, setReassignOrderCount] = useState<number | null>(null)
  const [reassignToId, setReassignToId] = useState("")
  const [form, setForm] = useState({
    name: point?.name ?? "",
    address: point?.address ?? "",
    commune: point?.commune ?? "",
  })

  async function save() {
    setLoading(true)
    const url = point ? `/api/delivery-points/${point.id}` : "/api/delivery-points"
    const method = point ? "PATCH" : "POST"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function toggleActive() {
    if (!point) return
    await fetch(`/api/delivery-points/${point.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !point.isActive }),
    })
    router.refresh()
  }

  async function handleDelete(withReassignToId?: string) {
    if (!point) return
    setLoading(true)
    setDeleteError(null)
    const res = await fetch(`/api/delivery-points/${point.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withReassignToId ? { reassignToId: withReassignToId } : {}),
    })
    if (res.ok) {
      router.refresh()
      setConfirmDelete(false)
      setReassignOrderCount(null)
    } else {
      const data = await res.json().catch(() => null)
      if (data?.needsReassign) {
        setReassignOrderCount(data.orderCount)
      } else {
        setDeleteError(data?.error ?? "Suppression impossible.")
        setConfirmDelete(false)
        setReassignOrderCount(null)
      }
    }
    setLoading(false)
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          {point && (
            <button
              onClick={toggleActive}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              {point.isActive ? "Désactiver" : "Activer"}
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {point ? "Modifier" : "+ Nouveau point"}
          </button>
          {point && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
          {point && confirmDelete && (
            <>
              <span className="text-xs text-gray-600 self-center">Confirmer ?</span>
              <button
                onClick={() => handleDelete()}
                disabled={loading}
                className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Non
              </button>
            </>
          )}
        </div>
        {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              {point ? "Modifier le point" : "Nouveau point de livraison"}
            </h2>
            <div className="space-y-3">
              {(["name", "address", "commune"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {field === "name" ? "Nom" : field === "address" ? "Adresse" : "Commune"}
                  </label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Annuler</button>
                <button onClick={save} disabled={loading} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-50">
                  {loading ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reassignOrderCount !== null && point && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Point utilisé</h2>
            <p className="text-sm text-gray-600 mb-4">
              {reassignOrderCount} commande(s) utilisent ce point. Choisir un point de remplacement pour les
              transférer avant suppression.
            </p>
            <select
              value={reassignToId}
              onChange={(e) => setReassignToId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— Choisir un point —</option>
              {otherPoints
                .filter((p) => p.id !== point.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.commune})
                  </option>
                ))}
            </select>
            {deleteError && <p className="text-xs text-red-600 mb-2">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReassignOrderCount(null)
                  setConfirmDelete(false)
                  setReassignToId("")
                }}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(reassignToId)}
                disabled={loading || !reassignToId}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "..." : "Transférer et supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
