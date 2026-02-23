import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DocumentList } from "./document-list"

export default async function DocumentsPage() {
  const rawDocuments = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { addedByUser: { select: { name: true } } },
  })

  const documents = rawDocuments.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Comptes rendus et documents publiés depuis kDrive
          </p>
        </div>
        <Link
          href="/documents/ajouter"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Ajouter depuis kDrive
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5">
        <DocumentList documents={documents} />
      </div>
    </div>
  )
}
