"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type SaleMode = "container" | "measure"
type ContainerType = "CRATE" | "UNIT"
type MeasureType = "KG" | "LITER"

const UNIT_LABEL: Record<string, string> = {
  CRATE: "caisse",
  UNIT: "unité",
  KG: "kg",
  LITER: "litre",
}

export function ProductForm({ producerId }: { producerId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const [saleMode, setSaleMode] = useState<SaleMode>("container")
  const [containerType, setContainerType] = useState<ContainerType>("CRATE")
  const [measureType, setMeasureType] = useState<MeasureType>("KG")
  const [unitQuantity, setUnitQuantity] = useState("1")

  const [priceProducer, setPriceProducer] = useState("")
  const [transportCost, setTransportCost] = useState("")
  const [priceWithTransport, setPriceWithTransport] = useState("")
  const [priceManual, setPriceManual] = useState(false)

  const unitType = saleMode === "container" ? containerType : measureType
  const unitLabel = UNIT_LABEL[unitType]

  // Auto-calcul prix acheteur
  useEffect(() => {
    if (priceManual) return
    const prod = parseFloat(priceProducer) || 0
    const transport = parseFloat(transportCost) || 0
    if (prod > 0) {
      setPriceWithTransport((prod + transport).toFixed(2))
    } else {
      setPriceWithTransport("")
    }
  }, [priceProducer, transportCost, priceManual])

  function resetForm() {
    setName("")
    setDescription("")
    setSaleMode("container")
    setContainerType("CRATE")
    setMeasureType("KG")
    setUnitQuantity("1")
    setPriceProducer("")
    setTransportCost("")
    setPriceWithTransport("")
    setPriceManual(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseFloat(unitQuantity)
    const prod = parseFloat(priceProducer)
    const transport = parseFloat(priceWithTransport)

    if (!name.trim() || isNaN(qty) || qty <= 0 || isNaN(prod) || prod <= 0 || isNaN(transport) || transport <= 0) {
      setError("Veuillez remplir tous les champs obligatoires.")
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
        unitType,
        unitQuantity: qty,
        priceProducer: prod,
        priceWithTransport: transport,
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
      active
        ? "bg-green-600 text-white border-green-600"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`

  const typeBtn = (active: boolean) =>
    `flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-blue-700 border-blue-400"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
      )}

      {/* Nom */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Tomates cerises"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Mode de vente */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Mode de vente <span className="text-red-500">*</span></p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSaleMode("container")} className={modeBtn(saleMode === "container")}>
            📦 Par contenant
          </button>
          <button type="button" onClick={() => setSaleMode("measure")} className={modeBtn(saleMode === "measure")}>
            ⚖️ Au poids / volume
          </button>
        </div>
      </div>

      {/* Par contenant */}
      {saleMode === "container" && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Type de contenant <span className="text-red-500">*</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setContainerType("CRATE")} className={typeBtn(containerType === "CRATE")}>
                🧺 Caisse
              </button>
              <button type="button" onClick={() => setContainerType("UNIT")} className={typeBtn(containerType === "UNIT")}>
                📋 Unité / Lot
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nombre d&apos;éléments par {containerType === "CRATE" ? "caisse" : "lot"} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitQuantity}
                onChange={(e) => setUnitQuantity(e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="5"
              />
              <span className="text-sm text-gray-500">éléments / {containerType === "CRATE" ? "caisse" : "lot"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Au poids / volume */}
      {saleMode === "measure" && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Unité de mesure <span className="text-red-500">*</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMeasureType("KG")} className={typeBtn(measureType === "KG")}>
                Kilogramme (kg)
              </button>
              <button type="button" onClick={() => setMeasureType("LITER")} className={typeBtn(measureType === "LITER")}>
                Litre (L)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quantité minimale par commande <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitQuantity}
                onChange={(e) => setUnitQuantity(e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1"
              />
              <span className="text-sm text-gray-500">{measureType === "KG" ? "kg" : "litre(s)"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tarification */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">Tarification <span className="text-gray-400 font-normal">(par {unitLabel})</span></p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prix producteur (€) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceProducer}
                onChange={(e) => { setPriceProducer(e.target.value); setPriceManual(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="8.00"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Coût transport (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={transportCost}
                onChange={(e) => { setTransportCost(e.target.value); setPriceManual(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="1.50"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prix acheteur (€ / {unitLabel}) <span className="text-red-500">*</span>
            {!priceManual && <span className="text-gray-400 font-normal ml-1">— calculé automatiquement</span>}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceWithTransport}
              onChange={(e) => { setPriceWithTransport(e.target.value); setPriceManual(true) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-medium"
              placeholder="9.50"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
          </div>
          {priceManual && (
            <button
              type="button"
              onClick={() => setPriceManual(false)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Recalculer automatiquement
            </button>
          )}
        </div>

        {/* Récapitulatif */}
        {priceProducer && priceWithTransport && unitQuantity && (
          <div className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-amber-200">
            {saleMode === "container"
              ? `1 ${unitLabel} (${unitQuantity} éléments) → ${parseFloat(priceProducer).toFixed(2)} € prod. / ${parseFloat(priceWithTransport).toFixed(2)} € acheteur`
              : `1 ${unitLabel} → ${parseFloat(priceProducer).toFixed(2)} € prod. / ${parseFloat(priceWithTransport).toFixed(2)} € acheteur`
            }
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Ajout en cours..." : "Ajouter le produit"}
      </button>
    </form>
  )
}
