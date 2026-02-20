import { GroupOrderStatus } from "@/generated/prisma/client"

export const STATUS_COLORS: Record<GroupOrderStatus, string> = {
  DRAFT: "#9E9E9E",
  OPEN: "#4CAF50",
  CLOSED: "#FF9800",
  DELIVERED: "#2196F3",
}

export const STATUS_LABELS: Record<GroupOrderStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  CLOSED: "Fermé",
  DELIVERED: "Livré",
}

export interface CalendarGroupOrder {
  id: string
  title: string
  openDate: Date
  closeDate: Date
  deliveryDate: Date
  status: GroupOrderStatus
  producerName: string
}

export function groupOrderToCalendarEvent(go: CalendarGroupOrder) {
  return {
    id: go.id,
    title: `${go.producerName} — ${go.title}`,
    start: new Date(go.openDate),
    end: new Date(go.deliveryDate),
    resource: {
      status: go.status,
      closeDate: go.closeDate,
      producerName: go.producerName,
      color: STATUS_COLORS[go.status],
    },
  }
}
