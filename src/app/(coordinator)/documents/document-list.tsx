"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DocumentItem {
  id: string
  title: string
  description: string | null
  fileName: string
  mimeType: string
  fileSize: number | null
  allowedRoles: string[]
  createdAt: string
  addedByUser: { name: string }
}

const roleLabels: Record<string, string> = {
  MEMBER: "Membres",
  COORDINATOR: "Coordinateurs",
  PRODUCER: "Producteurs",
}

const roleColors: Record<string, string> = {
  MEMBER: "bg-blue-100 text-blue-700",
  COORDINATOR: "bg-purple-100 text-purple-700",
  PRODUCER: "bg-green-100 text-green-700",
}

export function DocumentList({ documents }: { documents: DocumentItem[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function startEdit(doc: DocumentItem) {
    setEditingId(doc.id)
    setEditTitle(doc.title)
    setEditDescription(doc.description ?? "")
    setEditRoles([...doc.allowedRoles])
    setError(null)
  }

  function toggleRole(role: string) {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) {
      setError("Le titre est obligatoire")
      return
    }
    if (editRoles.length === 0) {
      setError("Sélectionnez au moins un rôle")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/coordinator/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || undefined,
          allowedRoles: editRoles,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur serveur")
      }
      setEditingId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm("Supprimer ce document de la plateforme ?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/coordinator/documents/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur serveur")
      }
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">Aucun document publié pour l&apos;instant.</p>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {documents.map((doc) => (
        <div key={doc.id} className="py-4">
          {editingId === doc.id ? (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Titre</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Visibilité</label>
                <div className="flex gap-3 mt-1">
                  {["MEMBER", "COORDINATOR", "PRODUCER"].map((role) => (
                    <label key={role} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="rounded"
                      />
                      {roleLabels[role]}
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(doc.id)}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      doc.mimeType === "application/pdf"
                        ? "bg-red-100 text-red-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {doc.mimeType === "application/pdf" ? "PDF" : "DOCX"}
                  </span>
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {doc.allowedRoles.map((role) => (
                    <span
                      key={role}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[role] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {roleLabels[role] ?? role}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")} — {doc.addedByUser.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(doc)}
                  className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  disabled={deletingId === doc.id}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
