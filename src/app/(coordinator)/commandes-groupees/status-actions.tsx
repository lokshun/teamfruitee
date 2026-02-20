"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

const transitions: Record<string, { label: string; next: string }[]> = {
  DRAFT: [{ label: "Ouvrir", next: "OPEN" }],
  OPEN: [{ label: "Clôturer", next: "CLOSED" }],
  CLOSED: [{ label: "Livré", next: "DELIVERED" }],
  DELIVERED: [],
}

export function GroupOrderStatusActions({
  groupOrderId,
  currentStatus,
  canDelete = false,
}: {
  groupOrderId: string
  currentStatus: string
  canDelete?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const actions = transitions[currentStatus] ?? []
  const canEdit = currentStatus === "DRAFT" || currentStatus === "OPEN"

  async function changeStatus(next: string) {
    setLoading(true)
    await fetch(`/api/coordinator/group-orders/${groupOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/coordinator/group-orders/${groupOrderId}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      setConfirmDelete(false)
      setLoading(false)
    }
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Confirmer ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Non
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link
          href={`/commandes-groupees/${groupOrderId}/modifier`}
          className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}
      {canDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
          className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      {actions.map((action) => (
        <button
          key={action.next}
          onClick={() => changeStatus(action.next)}
          disabled={loading}
          className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
