import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProducerEditForm } from "./producer-edit-form"

export default async function ProducteurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const producer = await prisma.producer.findUnique({ where: { id } })

  if (!producer) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/coordinator/producteurs"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux producteurs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{producer.name}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <ProducerEditForm producer={producer} />
      </div>

      <div className="mt-4">
        <Link
          href={`/coordinator/producteurs/${id}/produits`}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Gérer les produits de ce producteur →
        </Link>
      </div>
    </div>
  )
}
