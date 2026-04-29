"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface MemberActionsProps {
  userId: string
  currentStatus: string
}

export function MemberActions({ userId, currentStatus }: MemberActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  if (currentStatus === "PENDING") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateUser("ACTIVE", "MEMBER")}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Valider — Acheteur
        </button>
        <button
          onClick={() => updateUser("ACTIVE", "COORDINATOR")}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Valider — Coordinateur
        </button>
        <button
          onClick={() => updateUser("INACTIVE")}
          disabled={loading}
          className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
    )
  }

  if (currentStatus === "ACTIVE") {
    return (
      <button
        onClick={() => updateUser("INACTIVE")}
        disabled={loading}
        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        Désactiver
      </button>
    )
  }

  return (
    <button
      onClick={() => updateUser("ACTIVE")}
      disabled={loading}
      className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 disabled:opacity-50"
    >
      Réactiver
    </button>
  )
}
