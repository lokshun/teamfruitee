import { describe, it, expect } from "vitest"
import { computeLineTotal, computeOrderTotal } from "../price-utils"

describe("computeLineTotal", () => {
  it("calcule le total d'une ligne correctement", () => {
    expect(computeLineTotal(2, 15.5)).toBe(31)
  })

  it("arrondit à 2 décimales", () => {
    expect(computeLineTotal(3, 1.0 / 3)).toBe(1)
  })

  it("gère les quantités fractionnaires (kg)", () => {
    expect(computeLineTotal(0.5, 10)).toBe(5)
  })

  it("gère une quantité de 0", () => {
    expect(computeLineTotal(0, 10)).toBe(0)
  })
})

describe("computeOrderTotal", () => {
  it("somme plusieurs lignes", () => {
    const lines = [
      { quantity: 2, unitPrice: 15.5 },
      { quantity: 1, unitPrice: 8 },
    ]
    expect(computeOrderTotal(lines)).toBe(39)
  })

  it("retourne 0 pour un tableau vide", () => {
    expect(computeOrderTotal([])).toBe(0)
  })

  it("gère les quantités au kg avec précision", () => {
    const lines = [
      { quantity: 0.5, unitPrice: 10 },
      { quantity: 1.5, unitPrice: 4 },
    ]
    expect(computeOrderTotal(lines)).toBe(11)
  })
})
