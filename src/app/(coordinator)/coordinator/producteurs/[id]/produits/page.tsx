import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductForm } from "./product-form"
import { ProductList } from "./product-list"

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const producer = await prisma.producer.findUnique({
    where: { id },
    include: {
      products: { orderBy: { name: "asc" } },
    },
  })

  if (!producer) notFound()

  // Sérialiser les Decimal en number pour les Client Components
  const products = producer.products.map((p) => ({
    ...p,
    priceProducer: Number(p.priceProducer),
    priceWithTransport: Number(p.priceWithTransport),
  }))

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/coordinator/producteurs"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux producteurs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Produits — {producer.name}
        </h1>
        <p className="text-gray-500 mt-1">{producer.products.length} produit(s)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des produits */}
        <div className="lg:col-span-2">
          <ProductList products={products} />
        </div>

        {/* Formulaire ajout produit */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ajouter un produit</h2>
            <ProductForm producerId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}
