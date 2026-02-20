"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, ProductInput } from "@/lib/validations/producer"

const UNIT_LABELS: Record<string, string> = {
  CRATE: "Caisse",
  KG: "Kilogramme",
  UNIT: "Unité",
  LITER: "Litre",
}

export function ProductForm({ producerId }: { producerId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { producerId },
  })

  async function onSubmit(data: ProductInput) {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/coordinator/producers/${producerId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "Une erreur est survenue")
      setLoading(false)
      return
    }

    reset({ producerId })
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Tomates cerises"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Unité <span className="text-red-500">*</span>
          </label>
          <select
            {...register("unitType")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Qté par unité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register("unitQuantity", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prix producteur (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register("priceProducer", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="8.00"
          />
          {errors.priceProducer && (
            <p className="text-red-500 text-xs mt-1">{errors.priceProducer.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prix + transport (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register("priceWithTransport", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="9.50"
          />
          {errors.priceWithTransport && (
            <p className="text-red-500 text-xs mt-1">{errors.priceWithTransport.message}</p>
          )}
        </div>
      </div>

      <input type="hidden" {...register("producerId")} />

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
