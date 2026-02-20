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

  async function updateStatus(status: "ACTIVE" | "INACTIVE" | "PENDING") {
    setLoading(true)
    try {
      await fetch(`/api/coordinator/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === "PENDING") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Valider
        </button>
        <button
          onClick={() => updateStatus("INACTIVE")}
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
        onClick={() => updateStatus("INACTIVE")}
        disabled={loading}
        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        Désactiver
      </button>
    )
  }

  return (
    <button
      onClick={() => updateStatus("ACTIVE")}
      disabled={loading}
      className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 disabled:opacity-50"
    >
      Réactiver
    </button>
  )
}
