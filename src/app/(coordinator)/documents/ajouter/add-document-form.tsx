"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const roleLabels: Record<string, string> = {
  MEMBER: "Membres",
  COORDINATOR: "Coordinateurs",
  PRODUCER: "Producteurs",
}

export function AddDocumentForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [description, setDescription] = useState("")
  const [fileType, setFileType] = useState<"pdf" | "docx">("pdf")
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["MEMBER", "COORDINATOR"])
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleRole(role: string) {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Le titre est obligatoire"); return }
    if (!shareUrl.trim()) { setError("Le lien de partage est obligatoire"); return }
    if (allowedRoles.length === 0) { setError("Sélectionnez au moins un rôle"); return }

    setPublishing(true)
    setError(null)

    try {
      const mimeType =
        fileType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

      const res = await fetch("/api/coordinator/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          shareUrl: shareUrl.trim(),
          fileName: `${title.trim()}.${fileType}`,
          mimeType,
          allowedRoles,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur serveur")
      }

      router.push("/documents")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la publication")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Compte rendu réunion janvier 2026"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lien de partage kDrive *
        </label>
        <input
          type="url"
          value={shareUrl}
          onChange={(e) => setShareUrl(e.target.value)}
          placeholder="https://kdrive.infomaniak.com/..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Dans kDrive : clic droit sur le fichier → Partager → Copier le lien public
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de fichier *</label>
        <div className="flex gap-4">
          {(["pdf", "docx"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="fileType"
                value={t}
                checked={fileType === t}
                onChange={() => setFileType(t)}
              />
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  t === "pdf" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {t.toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optionnel"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visible par *</label>
        <div className="flex gap-5">
          {["MEMBER", "COORDINATOR", "PRODUCER"].map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowedRoles.includes(role)}
                onChange={() => toggleRole(role)}
                className="rounded"
              />
              {roleLabels[role]}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={publishing}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {publishing ? "Publication…" : "Publier"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/documents")}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
