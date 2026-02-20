"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Product } from "@/generated/prisma/client"
import { Package, Pencil, Trash2, X, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type SerializedProduct = Omit<Product, "priceProducer" | "priceWithTransport"> & {
  priceProducer: number
  priceWithTransport: number
}

const UNIT_LABELS: Record<string, string> = {
  CRATE: "Caisse",
  KG: "Kg",
  UNIT: "Unité",
  LITER: "L",
}

const UNIT_OPTIONS = ["CRATE", "KG", "UNIT", "LITER"] as const

interface EditState {
  name: string
  description: string
  unitType: string
  unitQuantity: string
  priceProducer: string
  priceWithTransport: string
}

interface ProductListProps {
  products: SerializedProduct[]
}

export function ProductList({ products }: ProductListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({
    name: "",
    description: "",
    unitType: "KG",
    unitQuantity: "",
    priceProducer: "",
    priceWithTransport: "",
  })
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startEdit(product: SerializedProduct) {
    setEditingId(product.id)
    setEditState({
      name: product.name,
      description: product.description ?? "",
      unitType: product.unitType,
      unitQuantity: String(product.unitQuantity),
      priceProducer: String(product.priceProducer),
      priceWithTransport: String(product.priceWithTransport),
    })
    setDeleteError(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setLoadingId(id)
    await fetch(`/api/coordinator/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editState.name,
        description: editState.description || undefined,
        unitType: editState.unitType,
        unitQuantity: parseFloat(editState.unitQuantity),
        priceProducer: parseFloat(editState.priceProducer),
        priceWithTransport: parseFloat(editState.priceWithTransport),
      }),
    })
    setEditingId(null)
    setLoadingId(null)
    router.refresh()
  }

  async function toggleActive(product: SerializedProduct) {
    setLoadingId(product.id)
    await fetch(`/api/coordinator/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    router.refresh()
    setLoadingId(null)
  }

  async function deleteProduct(id: string) {
    setDeletingId(null)
    setDeleteError(null)
    setLoadingId(id)
    const res = await fetch(`/api/coordinator/products/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? "Erreur lors de la suppression")
    } else {
      router.refresh()
    }
    setLoadingId(null)
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun produit pour ce producteur</p>
        <p className="text-gray-400 text-sm mt-1">Ajoutez le premier produit via le formulaire.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {deleteError}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                Produit
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                Unité
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                Prix prod.
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                Prix + transp.
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                Statut
              </th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) =>
              editingId === product.id ? (
                <tr key={product.id} className="bg-blue-50">
                  <td className="px-3 py-2" colSpan={6}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nom</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.name}
                          onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.description}
                          onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Type d'unité</label>
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.unitType}
                          onChange={(e) => setEditState((s) => ({ ...s, unitType: e.target.value }))}
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Quantité/unité</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.unitQuantity}
                          onChange={(e) => setEditState((s) => ({ ...s, unitQuantity: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Prix producteur (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.priceProducer}
                          onChange={(e) => setEditState((s) => ({ ...s, priceProducer: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Prix + transport (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                          value={editState.priceWithTransport}
                          onChange={(e) => setEditState((s) => ({ ...s, priceWithTransport: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => saveEdit(product.id)}
                        disabled={loadingId === product.id}
                        className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Enregistrer
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium"
                      >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {product.unitQuantity} {UNIT_LABELS[product.unitType]}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(product.priceProducer)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(product.priceWithTransport)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(product)}
                      disabled={loadingId === product.id}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        product.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {product.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => startEdit(product)}
                        disabled={loadingId === product.id}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deletingId === product.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteProduct(product.id)}
                            disabled={loadingId === product.id}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-medium disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setDeletingId(product.id); setDeleteError(null) }}
                          disabled={loadingId === product.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
