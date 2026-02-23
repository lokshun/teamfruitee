import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MemberDocumentsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const documents = await prisma.document.findMany({
    where: { allowedRoles: { has: "MEMBER" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
      addedByUser: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Comptes rendus et documents mis à disposition par le coordinateur
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Aucun document disponible pour l&apos;instant.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {documents.map((doc) => {
            const isPdf = doc.mimeType === "application/pdf"
            const viewUrl = `/api/documents/${doc.id}/view`

            return (
              <div key={doc.id} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5">
                  <span className="text-2xl">{isPdf ? "📄" : "📝"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isPdf ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {isPdf ? "PDF" : "DOCX"}
                    </span>
                    <p className="font-medium text-gray-900">{doc.title}</p>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    {doc.fileSize ? ` — ${Math.round(doc.fileSize / 1024)} Ko` : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  {isPdf ? (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 inline-block"
                    >
                      Consulter
                    </a>
                  ) : (
                    <a
                      href={viewUrl}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 inline-block"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
