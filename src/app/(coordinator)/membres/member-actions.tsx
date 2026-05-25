"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface MemberActionsProps {
  userId: string
  currentStatus: string
  currentRole: string
  currentFirstName: string
  currentLastName: string
  currentEmail: string
  currentCommune: string | null
}

export function MemberActions({
  userId,
  currentStatus,
  currentRole,
  currentFirstName,
  currentLastName,
  currentEmail,
  currentCommune,
}: MemberActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editError, setEditError] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [form, setForm] = useState({
    firstName: currentFirstName,
    lastName: currentLastName,
    email: currentEmail,
    commune: currentCommune ?? "",
    role: currentRole,
    status: currentStatus,
  })

  const displayName = [currentFirstName, currentLastName].filter(Boolean).join(" ").trim()

  async function updateUser(status: "ACTIVE" | "INACTIVE" | "PENDING", role?: "MEMBER" | "COORDINATOR") {
    setLoading(true)
    try {
      await fetch(`/api/coordinator/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(role ? { role } : {}) }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.lastName.trim()) {
      setEditError("Le nom est requis")
      return
    }
    setLoading(true)
    setEditError("")
    try {
      const res = await fetch(`/api/coordinator/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commune: form.commune.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error ?? "Erreur lors de la modification")
        return
      }
      setShowEdit(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/coordinator/users/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        setDeleteError(data.error ?? "Erreur lors de la suppression")
        return
      }
      setShowDelete(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function openEdit() {
    setForm({
      firstName: currentFirstName,
      lastName: currentLastName,
      email: currentEmail,
      commune: currentCommune ?? "",
      role: currentRole,
      status: currentStatus,
    })
    setEditError("")
    setShowEdit(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {currentStatus === "PENDING" && (
          <>
            <button onClick={() => updateUser("ACTIVE", "MEMBER")} disabled={loading}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
              Valider — Acheteur
            </button>
            <button onClick={() => updateUser("ACTIVE", "COORDINATOR")} disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Valider — Coordinateur
            </button>
            <button onClick={() => updateUser("INACTIVE")} disabled={loading}
              className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50">
              Refuser
            </button>
          </>
        )}
        {currentStatus === "ACTIVE" && (
          <button onClick={() => updateUser("INACTIVE")} disabled={loading}
            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50">
            Désactiver
          </button>
        )}
        {currentStatus === "INACTIVE" && (
          <button onClick={() => updateUser("ACTIVE")} disabled={loading}
            className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 disabled:opacity-50">
            Réactiver
          </button>
        )}

        <button onClick={openEdit} disabled={loading}
          className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg hover:bg-indigo-100 disabled:opacity-50">
          Éditer
        </button>
        <button onClick={() => { setDeleteError(""); setShowDelete(true) }} disabled={loading}
          className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50">
          Supprimer
        </button>
      </div>

      {/* Modale édition */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Modifier le membre</h2>
              <button onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input type="text" value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
                <input type="text" value={form.commune}
                  onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="MEMBER">Acheteur</option>
                    <option value="COORDINATOR">Coordinateur</option>
                    <option value="PRODUCER">Producteur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="PENDING">En attente</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Supprimer le compte</h2>
              <p className="text-sm text-gray-600">
                Voulez-vous vraiment supprimer le compte de{" "}
                <strong>{displayName}</strong> ? Cette action est irréversible.
              </p>
              {deleteError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={handleDelete} disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                {loading ? "Suppression…" : "Supprimer"}
              </button>
              <button onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
