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

export function DeliveryPointForm({ point }: { point?: DeliveryPoint }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  return (
    <>
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
    </>
  )
}
