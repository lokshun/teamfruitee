import Link from "next/link"
import { AddDocumentForm } from "./add-document-form"

export default function AjouterDocumentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour aux documents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Ajouter un document</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Collez le lien de partage kDrive du fichier à publier.
        </p>
      </div>

      <AddDocumentForm />
    </div>
  )
}
