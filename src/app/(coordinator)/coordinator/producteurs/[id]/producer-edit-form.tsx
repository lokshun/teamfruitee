"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { producerSchema, ProducerInput } from "@/lib/validations/producer"
import type { Producer } from "@/generated/prisma/client"

export function ProducerEditForm({ producer }: { producer: Producer }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProducerInput>({
    resolver: zodResolver(producerSchema),
    defaultValues: {
      name: producer.name,
      description: producer.description ?? "",
      location: producer.location ?? "",
      contactEmail: producer.contactEmail ?? "",
    },
  })

  async function onSubmit(data: ProducerInput) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/coordinator/producers/${producer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "Une erreur est survenue")
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive() {
    await fetch(`/api/coordinator/producers/${producer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !producer.isActive }),
    })
    router.refresh()
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          Modifications enregistrées.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
          <input
            {...register("location")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
          <input
            type="email"
            {...register("contactEmail")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.contactEmail && (
            <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <button
            type="button"
            onClick={toggleActive}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              producer.isActive
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : "border-green-300 text-green-600 hover:bg-green-50"
            }`}
          >
            {producer.isActive ? "Désactiver" : "Réactiver"}
          </button>
        </div>
      </form>
    </>
  )
}
