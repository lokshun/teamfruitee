"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { groupOrderSchema, GroupOrderInput } from "@/lib/validations/order"

interface Product {
  id: string
  name: string
  unitQuantity: number
  unitType: string
  priceWithTransport: number | { toString(): string }
}

interface Producer {
  id: string
  name: string
  products: Product[]
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

export function NewGroupOrderForm({ producers, deliveryPoints, users }: { producers: Producer[], deliveryPoints: DeliveryPoint[], users: User[] }) {
  const router = useRouter()
  const [selectedProducerId, setSelectedProducerId] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedDeliveryPoints, setSelectedDeliveryPoints] = useState<string[]>([])
  const [minOrderAmount, setMinOrderAmount] = useState("")
  const [transportUserId, setTransportUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<GroupOrderInput>({
    resolver: zodResolver(groupOrderSchema),
  })

  const selectedProducer = producers.find((p) => p.id === selectedProducerId)

  function toggleProduct(id: string) {
    const next = selectedProducts.includes(id)
      ? selectedProducts.filter((p) => p !== id)
      : [...selectedProducts, id]
    setSelectedProducts(next)
    setValue("productIds", next)
  }

  async function onSubmit(data: GroupOrderInput) {
    setLoading(true)
    setError(null)
    const res = await fetch("/api/coordinator/group-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        deliveryPointIds: selectedDeliveryPoints,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        transportUserId: transportUserId || undefined,
      }),
    })
    if (!res.ok) {
      try {
        const json = await res.json()
        setError(json.error ?? "Erreur lors de la création")
      } catch {
        setError(`Erreur lors de la création (HTTP ${res.status})`)
      }
      setLoading(false)
      return
    }
    router.push("/commandes-groupees")
    router.refresh()
  }

  const unitLabels: Record<string, string> = { CRATE: "Caisse", KG: "kg", UNIT: "Unité", LITER: "Litre" }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input {...register("title")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Légumes de printemps — Avril 2026" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Producteur *</label>
        <select
          {...register("producerId")}
          onChange={(e) => { setSelectedProducerId(e.target.value); setSelectedProducts([]); setValue("productIds", []) }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Choisir un producteur…</option>
          {producers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.producerId && <p className="text-red-500 text-xs mt-1">{errors.producerId.message}</p>}
      </div>

      {selectedProducer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produits inclus *</label>
          <div className="space-y-2">
            {selectedProducer.products.map((product) => (
              <label key={product.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="rounded text-green-600"
                />
                <span className="flex-1 text-sm font-medium text-gray-900">{product.name}</span>
                <span className="text-sm text-gray-500">
                  {product.unitQuantity} {unitLabels[product.unitType]} — {Number(product.priceWithTransport).toFixed(2)} €
                </span>
              </label>
            ))}
          </div>
          {errors.productIds && <p className="text-red-500 text-xs mt-1">{errors.productIds.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;ouverture *</label>
          <input type="datetime-local" {...register("openDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          {errors.openDate && <p className="text-red-500 text-xs mt-1">{errors.openDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture *</label>
          <input type="datetime-local" {...register("closeDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          {errors.closeDate && <p className="text-red-500 text-xs mt-1">{errors.closeDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison *</label>
          <input type="datetime-local" {...register("deliveryDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          {errors.deliveryDate && <p className="text-red-500 text-xs mt-1">{errors.deliveryDate.message}</p>}
        </div>
      </div>

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
                onChange={() => {
                  setSelectedDeliveryPoints((prev) =>
                    prev.includes(dp.id) ? prev.filter((id) => id !== dp.id) : [...prev, dp.id]
                  )
                }}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-900">{dp.name} <span className="text-gray-400">({dp.commune})</span></span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant minimum de commande
            <span className="text-gray-400 font-normal ml-1">(optionnel, en €)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            placeholder="0.00"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register("notes")} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded-lg py-2.5 font-medium hover:bg-green-700 disabled:opacity-50">
        {loading ? "Création en cours..." : "Créer la commande groupée"}
      </button>
    </form>
  )
}
