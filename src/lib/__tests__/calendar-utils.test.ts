import { describe, it, expect } from "vitest"
import { STATUS_COLORS, STATUS_LABELS, groupOrderToCalendarEvent } from "../calendar-utils"
import { GroupOrderStatus } from "@/generated/prisma/client"

describe("STATUS_COLORS", () => {
  it("définit une couleur pour chaque statut", () => {
    const statuses: GroupOrderStatus[] = ["DRAFT", "OPEN", "CLOSED", "DELIVERED"]
    statuses.forEach((s) => {
      expect(STATUS_COLORS[s]).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })
})

describe("groupOrderToCalendarEvent", () => {
  const base = {
    id: "test-id",
    title: "Légumes",
    openDate: new Date("2026-03-01"),
    closeDate: new Date("2026-03-15"),
    deliveryDate: new Date("2026-03-20"),
    status: "OPEN" as GroupOrderStatus,
    producerName: "La ferme de Boulbon",
  }

  it("mappe les champs correctement", () => {
    const event = groupOrderToCalendarEvent(base)
    expect(event.id).toBe("test-id")
    expect(event.start).toEqual(base.openDate)
    expect(event.end).toEqual(base.deliveryDate)
    expect(event.resource.status).toBe("OPEN")
    expect(event.resource.color).toBe(STATUS_COLORS.OPEN)
  })

  it("inclut le nom du producteur dans le titre", () => {
    const event = groupOrderToCalendarEvent(base)
    expect(event.title).toContain("La ferme de Boulbon")
  })
})
