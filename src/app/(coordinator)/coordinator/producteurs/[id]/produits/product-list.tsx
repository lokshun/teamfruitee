"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Pencil, Trash2, X, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { formatProductUnit } from "@/lib/product-utils"

type PackagingType = "CAISSE" | "COLIS" | "CARTON" | "BIDON"
type MeasureUnit = "KG" | "LITER"
type SaleMode = "vrac" | "contenant-global" | "contenant-unites"

interface SerializedProduct {
  id: string
  name: string
  description: string | null
  packagingType: string | null
  measureUnit: string
  unitQuantity: number
  unitsPerPackage: number | null
  priceProducer: number
  priceWithTransport: number
  isActive: boolean
}

interface EditState {
  name: string
  description: string
  saleMode: SaleMode
  packagingType: PackagingType
  measureUnit: MeasureUnit
  unitQuantity: string
  unitsPerPackage: string
  priceProducer: string
  transportCost: string
  priceWithTransport: string
  priceManual: boolean
}

const PACKAGING_OPTIONS: { value: PackagingType; label: string }[] = [
  { value: "CAISSE", label: "Caisse" },
  { value: "COLIS", label: "Colis" },
  { value: "CARTON", label: "Carton" },
  { value: "BIDON", label: "Bidon" },
]

function detectSaleMode(p: SerializedProduct): SaleMode {
  if (!p.packagingType) return "vrac"
  if (p.unitsPerPackage) return "contenant-unites"
  return "contenant-global"
}

export function ProductList({ products }: { products: SerializedProduct[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({
    name: "", description: "", saleMode: "vrac", packagingType: "CAISSE",
    measureUnit: "KG", unitQuantity: "1", unitsPerPackage: "6",
    priceProducer: "", transportCost: "", priceWithTransport: "", priceManual: false,
  })
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (editState.priceManual || !editingId) return
    const prod = parseFloat(editState.priceProducer) || 0
    const transport = parseFloat(editState.transportCost) || 0
    if (prod > 0) setEditState((s) => ({ ...s, priceWithTransport: (prod + transport).toFixed(2) }))
  }, [editState.priceProducer, editState.transportCost, editState.priceManual, editingId])

  function startEdit(p: SerializedProduct) {
    setEditingId(p.id)
    setEditState({
      name: p.name,
      description: p.description ?? "",
      saleMode: detectSaleMode(p),
      packagingType: (p.packagingType as PackagingType) ?? "CAISSE",
      measureUnit: (p.measureUnit as MeasureUnit) ?? "KG",
      unitQuantity: String(p.unitQuantity),
      unitsPerPackage: String(p.unitsPerPackage ?? 6),
      priceProducer: String(p.priceProducer),
      transportCost: "",
      priceWithTransport: String(p.priceWithTransport),
      priceManual: true,
    })
    setDeleteError(null)
  }

  async function saveEdit(id: string) {
    const qty = parseFloat(editState.unitQuantity)
    const units = parseInt(editState.unitsPerPackage)
    setLoadingId(id)
    await fetch(`/api/coordinator/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editState.name,
        description: editState.description || undefined,
        packagingType: editState.saleMode === "vrac" ? null : editState.packagingType,
        measureUnit: editState.measureUnit,
        unitQuantity: isNaN(qty) ? 1 : qty,
        unitsPerPackage: editState.saleMode === "contenant-unites" && !isNaN(units) ? units : null,
        priceProducer: parseFloat(editState.priceProducer),
        priceWithTransport: parseFloat(editState.priceWithTransport),
      }),
    })
    setEditingId(null)
    setLoadingId(null)
    router.refresh()
  }

  async function toggleActive(p: SerializedProduct) {
    setLoadingId(p.id)
    await fetch(`/api/coordinator/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
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

  const selectBtn = (active: boolean) =>
    `px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
      active ? "bg-blue-50 text-blue-700 border-blue-400" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun produit pour ce producteur</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{deleteError}</div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Produit</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Conditionnement</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Prix prod.</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Prix + transp.</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Statut</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) =>
              editingId === product.id ? (
                <tr key={product.id} className="bg-blue-50">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nom</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                            value={editState.name}
                            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                            value={editState.description}
                            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))} />
                        </div>
                      </div>

                      {/* Mode de vente */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Mode de vente</label>
                        <div className="flex gap-2 flex-wrap">
                          {(["vrac", "contenant-global", "contenant-unites"] as SaleMode[]).map((m) => (
                            <button key={m} type="button"
                              onClick={() => setEditState((s) => ({ ...s, saleMode: m }))}
                              className={selectBtn(editState.saleMode === m)}>
                              {m === "vrac" ? "Vrac" : m === "contenant-global" ? "Contenant global" : "Contenant + sous-unités"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Unité de mesure */}
                      <div className="flex gap-4 items-start">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Unité de mesure</label>
                          <div className="flex gap-2">
                            {(["KG", "LITER"] as MeasureUnit[]).map((u) => (
                              <button key={u} type="button"
                                onClick={() => setEditState((s) => ({ ...s, measureUnit: u }))}
                                className={selectBtn(editState.measureUnit === u)}>
                                {u === "KG" ? "kg" : "Litre"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Type de contenant si applicable */}
                        {editState.saleMode !== "vrac" && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Type de contenant</label>
                            <div className="flex gap-2 flex-wrap">
                              {PACKAGING_OPTIONS.map((o) => (
                                <button key={o.value} type="button"
                                  onClick={() => setEditState((s) => ({ ...s, packagingType: o.value }))}
                                  className={selectBtn(editState.packagingType === o.value)}>
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quantités */}
                      <div className="flex gap-3 items-end">
                        {editState.saleMode === "contenant-unites" && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Nb sous-unités</label>
                            <input type="number" step="1" min="1"
                              className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                              value={editState.unitsPerPackage}
                              onChange={(e) => setEditState((s) => ({ ...s, unitsPerPackage: e.target.value }))} />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            {editState.saleMode === "vrac" ? "Vendu par" :
                              editState.saleMode === "contenant-global" ? "Contenu total" : "Qté / sous-unité"}
                          </label>
                          <div className="flex items-center gap-1">
                            <input type="number" step="0.01" min="0.01"
                              className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                              value={editState.unitQuantity}
                              onChange={(e) => setEditState((s) => ({ ...s, unitQuantity: e.target.value }))} />
                            <span className="text-xs text-gray-500">{editState.measureUnit === "LITER" ? "L" : "kg"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Prix */}
                      <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Prix par unité commandée</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Prix producteur (€)</label>
                            <input type="number" step="0.01" min="0"
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                              value={editState.priceProducer}
                              onChange={(e) => setEditState((s) => ({ ...s, priceProducer: e.target.value, priceManual: false }))} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Transport (€)</label>
                            <input type="number" step="0.01" min="0"
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white" placeholder="0.00"
                              value={editState.transportCost}
                              onChange={(e) => setEditState((s) => ({ ...s, transportCost: e.target.value, priceManual: false }))} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Prix acheteur (€){!editState.priceManual && <span className="text-gray-400 ml-1">auto</span>}
                            </label>
                            <input type="number" step="0.01" min="0"
                              className="w-full border border-blue-300 rounded px-2 py-1.5 text-sm bg-white font-medium"
                              value={editState.priceWithTransport}
                              onChange={(e) => setEditState((s) => ({ ...s, priceWithTransport: e.target.value, priceManual: true }))} />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(product.id)} disabled={loadingId === product.id}
                          className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">
                          <Check className="h-3.5 w-3.5" /> Enregistrer
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium">
                          <X className="h-3.5 w-3.5" /> Annuler
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {formatProductUnit(product)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">{formatCurrency(product.priceProducer)}</td>
                  <td className="px-5 py-3 text-sm text-gray-900 text-right">{formatCurrency(product.priceWithTransport)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleActive(product)} disabled={loadingId === product.id}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        product.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {product.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(product)} disabled={loadingId === product.id}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deletingId === product.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteProduct(product.id)} disabled={loadingId === product.id}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-medium disabled:opacity-50">
                            Confirmer
                          </button>
                          <button onClick={() => setDeletingId(null)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium">
                            Non
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setDeletingId(product.id); setDeleteError(null) }} disabled={loadingId === product.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Supprimer">
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
