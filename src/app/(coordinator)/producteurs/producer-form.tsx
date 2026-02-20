"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { producerSchema, ProducerInput } from "@/lib/validations/producer"

interface Producer {
  id: string
  name: string
  description: string | null
  location: string | null
  contactEmail: string | null
  isActive: boolean
}

interface ProducerFormProps {
  producer?: Producer
}

export function ProducerForm({ producer }: ProducerFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProducerInput>({
    resolver: zodResolver(producerSchema),
    defaultValues: producer
      ? {
          name: producer.name,
          description: producer.description ?? undefined,
          location: producer.location ?? undefined,
          contactEmail: producer.contactEmail ?? undefined,
        }
      : {},
  })

  const onSubmit: SubmitHandler<ProducerInput> = async (data) => {
    setLoading(true)
    const url = producer
      ? `/api/coordinator/producers/${producer.id}`
      : "/api/coordinator/producers"
    const method = producer ? "PATCH" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    setLoading(false)
    setOpen(false)
    reset()
    router.refresh()
  }

  async function toggleActive() {
    if (!producer) return
    await fetch(`/api/coordinator/producers/${producer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !producer.isActive }),
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        {producer && (
          <button
            onClick={toggleActive}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            {producer.isActive ? "Désactiver" : "Activer"}
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {producer ? "Modifier" : "+ Nouveau producteur"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {producer ? "Modifier le producteur" : "Nouveau producteur"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input {...register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register("description")} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                <input {...register("location")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Boulbon, 13" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                <input type="email" {...register("contactEmail")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setOpen(false); reset() }} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
