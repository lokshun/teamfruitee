"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface KDriveFile {
  id: string        // chemin WebDAV décodé
  name: string
  type: "file" | "dir"
  mime_type: string
  size: number
}

interface BreadcrumbItem {
  id: string
  name: string
}

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]

const roleLabels: Record<string, string> = {
  MEMBER: "Membres",
  COORDINATOR: "Coordinateurs",
  PRODUCER: "Producteurs",
}

export function KDriveBrowser({ rootPath }: { rootPath: string }) {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState(rootPath)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: rootPath, name: "Racine" },
  ])
  const [files, setFiles] = useState<KDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Formulaire de publication
  const [selected, setSelected] = useState<KDriveFile | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["MEMBER", "COORDINATOR"])
  const [publishing, setPublishing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchFiles = useCallback(async (folderPath: string) => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/coordinator/kdrive/browse?folderId=${encodeURIComponent(folderPath)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur serveur")
      }
      const data: KDriveFile[] = await res.json()
      setFiles(data)
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  function enterFolder(folder: KDriveFile) {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }])
    setCurrentPath(folder.id)
    setSelected(null)
  }

  function navigateTo(index: number) {
    const item = breadcrumb[index]
    setBreadcrumb((prev) => prev.slice(0, index + 1))
    setCurrentPath(item.id)
    setSelected(null)
  }

  function selectFile(file: KDriveFile) {
    setSelected(file)
    setTitle(file.name.replace(/\.[^.]+$/, ""))
    setDescription("")
    setAllowedRoles(["MEMBER", "COORDINATOR"])
    setFormError(null)
  }

  function toggleRole(role: string) {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function publish() {
    if (!selected) return
    if (!title.trim()) {
      setFormError("Le titre est obligatoire")
      return
    }
    if (allowedRoles.length === 0) {
      setFormError("Sélectionnez au moins un rôle")
      return
    }
    setPublishing(true)
    setFormError(null)
    try {
      const res = await fetch("/api/coordinator/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          kDriveFileId: selected.id,
          fileName: selected.name,
          mimeType: selected.mime_type,
          fileSize: selected.size,
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
      setFormError(e instanceof Error ? e.message : "Erreur lors de la publication")
    } finally {
      setPublishing(false)
    }
  }

  const dirs = files.filter((f) => f.type === "dir")
  const allowedFiles = files.filter(
    (f) => f.type === "file" && ALLOWED_MIME.includes(f.mime_type)
  )
  const ignoredFiles = files.filter(
    (f) => f.type === "file" && !ALLOWED_MIME.includes(f.mime_type)
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm flex-wrap">
        {breadcrumb.map((item, idx) => (
          <span key={item.id} className="flex items-center gap-1">
            {idx > 0 && <span className="text-gray-300">/</span>}
            <button
              onClick={() => navigateTo(idx)}
              className={`hover:underline ${
                idx === breadcrumb.length - 1
                  ? "text-gray-900 font-medium"
                  : "text-blue-600"
              }`}
            >
              {item.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Liste fichiers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && (
          <p className="text-center text-gray-400 py-8 text-sm">Chargement…</p>
        )}
        {fetchError && (
          <p className="text-center text-red-600 py-8 text-sm">{fetchError}</p>
        )}
        {!loading && !fetchError && files.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            Ce dossier est vide.
          </p>
        )}
        {!loading && !fetchError && (dirs.length > 0 || allowedFiles.length > 0) && (
          <ul className="divide-y divide-gray-100">
            {dirs.map((dir) => (
              <li key={dir.id}>
                <button
                  onClick={() => enterFolder(dir)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <span className="text-xl">📁</span>
                  <span className="text-sm font-medium text-gray-900">{dir.name}</span>
                </button>
              </li>
            ))}
            {allowedFiles.map((file) => {
              const isPdf = file.mime_type === "application/pdf"
              return (
                <li key={file.id}>
                  <button
                    onClick={() => selectFile(file)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selected?.id === file.id
                        ? "bg-blue-50 border-l-2 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{isPdf ? "📄" : "📝"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {isPdf ? "PDF" : "DOCX"} —{" "}
                        {file.size ? `${Math.round(file.size / 1024)} Ko` : "—"}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {!loading && !fetchError && ignoredFiles.length > 0 && (
          <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            {ignoredFiles.length} fichier(s) masqué(s) (format non supporté)
          </p>
        )}
      </div>

      {/* Formulaire de publication */}
      {selected && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Publier &ldquo;{selected.name}&rdquo;
          </h2>

          <div>
            <label className="text-xs font-medium text-gray-500">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optionnel"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Visible par</label>
            <div className="flex gap-4 mt-2">
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

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-3">
            <button
              onClick={publish}
              disabled={publishing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {publishing ? "Publication…" : "Publier"}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
