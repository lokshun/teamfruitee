"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const statuses = ["NOT_PAID", "PARTIAL", "PAID"] as const
type PaymentStatus = typeof statuses[number]

const labels: Record<PaymentStatus, string> = {
  NOT_PAID: "Non payé",
  PARTIAL: "Partiel",
  PAID: "Payé",
}
const colors: Record<PaymentStatus, string> = {
  NOT_PAID: "bg-red-100 text-red-700 hover:bg-red-200",
  PARTIAL: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  PAID: "bg-green-100 text-green-700 hover:bg-green-200",
}

export function PaymentStatusToggle({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>(currentStatus as PaymentStatus)
  const [loading, setLoading] = useState(false)

  async function cycle() {
    const idx = statuses.indexOf(status)
    const next = statuses[(idx + 1) % statuses.length]
    setLoading(true)
    setStatus(next)
    await fetch(`/api/coordinator/payments/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={cycle}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${colors[status]}`}
    >
      {labels[status]}
    </button>
  )
}
