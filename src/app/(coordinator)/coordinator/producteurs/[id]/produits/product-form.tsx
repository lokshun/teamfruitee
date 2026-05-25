"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type SaleMode = "vrac" | "contenant-global" | "contenant-unites"
type PackagingType = "CAISSE" | "COLIS" | "CARTON" | "BIDON"
type MeasureUnit = "KG" | "LITER"

const PACKAGING_OPTIONS: { value: PackagingType; label: string; icon: string }[] = [
  { value: "CAISSE", label: "Caisse", icon: "🧺" },
  { value: "COLIS", label: "Colis", icon: "📦" },
  { value: "CARTON", label: "Carton", icon: "🗃️" },
  { value: "BIDON", label: "Bidon", icon: "🛢️" },
]

export function ProductForm({ producerId }: { producerId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saleMode, setSaleMode] = useState<SaleMode>("vrac")
  const [packagingType, setPackagingType] = useState<PackagingType>("CAISSE")
  const [measureUnit, setMeasureUnit] = useState<MeasureUnit>("KG")
  const [unitQuantity, setUnitQuantity] = useState("1")
  const [unitsPerPackage, setUnitsPerPackage] = useState("6")
  const [priceProducer, setPriceProducer] = useState("")
  const [transportCost, setTransportCost] = useState("")
  const [priceWithTransport, setPriceWithTransport] = useState("")
  const [priceManual, setPriceManual] = useState(false)

  const unitLabel = measureUnit === "KG" ? "kg" : "L"

  useEffect(() => {
    if (priceManual) return
    const prod = parseFloat(priceProducer) || 0
    const transport = parseFloat(transportCost) || 0
    if (prod > 0) setPriceWithTransport((prod + transport).toFixed(2))
    else setPriceWithTransport("")
  }, [priceProducer, transportCost, priceManual])

  function preview(): string {
    const qty = parseFloat(unitQuantity) || 0
    const units = parseInt(unitsPerPackage) || 0
    if (saleMode === "vrac") return qty === 1 ? `Au ${unitLabel}` : `Par ${qty} ${unitLabel}`
    const pack = PACKAGING_OPTIONS.find((o) => o.value === packagingType)?.label ?? packagingType
    if (saleMode === "contenant-global") return `${pack} de ${qty} ${unitLabel}`
    if (units > 0 && qty > 0) return `${pack} · ${units} × ${qty} ${unitLabel} (${units * qty} ${unitLabel})`
    return `${pack} avec sous-unités`
  }

  function resetForm() {
    setName(""); setDescription(""); setSaleMode("vrac"); setPackagingType("CAISSE")
    setMeasureUnit("KG"); setUnitQuantity("1"); setUnitsPerPackage("6")
    setPriceProducer(""); setTransportCost(""); setPriceWithTransport(""); setPriceManual(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseFloat(unitQuantity)
    const prod = parseFloat(priceProducer)
    const buyerPrice = parseFloat(priceWithTransport)
    const units = parseInt(unitsPerPackage)

    if (!name.trim() || isNaN(qty) || qty <= 0 || isNaN(prod) || prod <= 0 || isNaN(buyerPrice) || buyerPrice <= 0) {
      setError("Veuillez remplir tous les champs obligatoires.")
      return
    }
    if (saleMode === "contenant-unites" && (isNaN(units) || units < 1)) {
      setError("Le nombre de sous-unités doit être un entier positif.")
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/coordinator/producers/${producerId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        producerId,
        packagingType: saleMode === "vrac" ? null : packagingType,
        measureUnit,
        unitQuantity: qty,
        unitsPerPackage: saleMode === "contenant-unites" ? units : null,
        priceProducer: prod,
        priceWithTransport: buyerPrice,
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "Une erreur est survenue")
      setLoading(false)
      return
    }

    resetForm()
    router.refresh()
    setLoading(false)
  }

  const modeBtn = (active: boolean) =>
    `flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
      active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`

  const selectBtn = (active: boolean) =>
    `flex-1 py-2 px-2 rounded-lg border text-sm font-medium transition-colors ${
      active ? "bg-blue-50 text-blue-700 border-blue-400" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Huile d'olive, Tomates cerises…" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Mode de vente */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Mode de vente <span className="text-red-500">*</span></p>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setSaleMode("vrac")} className={modeBtn(saleMode === "vrac")}>
            ⚖️ Vrac (kg / L)
          </button>
          <button type="button" onClick={() => setSaleMode("contenant-global")} className={modeBtn(saleMode === "contenant-global")}>
            🛢️ Contenant (bidon 5L…)
          </button>
          <button type="button" onClick={() => setSaleMode("contenant-unites")} className={modeBtn(saleMode === "contenant-unites")}>
            📦 Contenant + sous-unités
          </button>
        </div>
      </div>

      {/* Unité de mesure (toujours visible) */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Unité de mesure</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMeasureUnit("KG")} className={selectBtn(measureUnit === "KG")}>
              Kilogramme (kg)
            </button>
            <button type="button" onClick={() => setMeasureUnit("LITER")} className={selectBtn(measureUnit === "LITER")}>
              Litre (L)
            </button>
          </div>
        </div>

        {/* Vrac */}
        {saleMode === "vrac" && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Vendu par <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min="0.01" value={unitQuantity}
                onChange={(e) => setUnitQuantity(e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <span className="text-sm text-gray-500">{unitLabel} par unité commandée</span>
            </div>
          </div>
        )}

        {/* Contenant global (bidon de 5L) */}
        {saleMode === "contenant-global" && (
          <>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Type de contenant <span className="text-red-500">*</span></p>
              <div className="flex gap-2 flex-wrap">
                {PACKAGING_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setPackagingType(o.value)}
                    className={selectBtn(packagingType === o.value)}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contenu total <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.01" min="0.01" value={unitQuantity}
                  onChange={(e) => setUnitQuantity(e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5" />
                <span className="text-sm text-gray-500">{unitLabel} par contenant</span>
              </div>
            </div>
          </>
        )}

        {/* Contenant avec sous-unités (carton de 6 × 1L) */}
        {saleMode === "contenant-unites" && (
          <>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Type de contenant <span className="text-red-500">*</span></p>
              <div className="flex gap-2 flex-wrap">
                {PACKAGING_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setPackagingType(o.value)}
                    className={selectBtn(packagingType === o.value)}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre de sous-unités <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" step="1" min="1" value={unitsPerPackage}
                    onChange={(e) => setUnitsPerPackage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="6" />
                </div>
                <p className="text-xs text-gray-400 mt-1">ex: 6 bouteilles</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quantité par sous-unité <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" min="0.01" value={unitQuantity}
                    onChange={(e) => setUnitQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="1" />
                  <span className="text-sm text-gray-500 shrink-0">{unitLabel}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">ex: 1 L par bouteille</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Aperçu */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        Aperçu : <span className="font-medium text-gray-800">{preview()}</span>
      </div>

      {/* Prix */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">
          Tarification <span className="text-gray-400 font-normal">(par unité commandée)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prix producteur (€) <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="number" step="0.01" min="0" value={priceProducer}
                onChange={(e) => { setPriceProducer(e.target.value); setPriceManual(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="8.00" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Coût transport (€)</label>
            <div className="relative">
              <input type="number" step="0.01" min="0" value={transportCost}
                onChange={(e) => { setTransportCost(e.target.value); setPriceManual(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="1.50" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prix acheteur (€) <span className="text-red-500">*</span>
            {!priceManual && <span className="text-gray-400 font-normal ml-1">— calculé automatiquement</span>}
          </label>
          <div className="relative">
            <input type="number" step="0.01" min="0" value={priceWithTransport}
              onChange={(e) => { setPriceWithTransport(e.target.value); setPriceManual(true) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-medium"
              placeholder="9.50" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
          </div>
          {priceManual && (
            <button type="button" onClick={() => setPriceManual(false)} className="text-xs text-blue-600 hover:underline mt-1">
              Recalculer automatiquement
            </button>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
        {loading ? "Ajout en cours..." : "Ajouter le produit"}
      </button>
    </form>
  )
}
