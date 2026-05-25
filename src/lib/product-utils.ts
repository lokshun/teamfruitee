export interface ProductUnitInfo {
  packagingType: string | null
  measureUnit: string
  unitQuantity: number
  unitsPerPackage: number | null
}

const PACKAGING_LABELS: Record<string, string> = {
  CAISSE: "Caisse",
  COLIS: "Colis",
  CARTON: "Carton",
  BIDON: "Bidon",
}

const PACKAGING_LABELS_LOWER: Record<string, string> = {
  CAISSE: "caisse",
  COLIS: "colis",
  CARTON: "carton",
  BIDON: "bidon",
}

export function formatProductUnit(p: ProductUnitInfo): string {
  const unit = p.measureUnit === "LITER" ? "L" : "kg"

  if (!p.packagingType) {
    return p.unitQuantity === 1
      ? `Au ${unit}`
      : `Par ${p.unitQuantity} ${unit}`
  }

  const label = PACKAGING_LABELS[p.packagingType] ?? p.packagingType

  if (p.unitsPerPackage) {
    const total = p.unitsPerPackage * p.unitQuantity
    return `${label} · ${p.unitsPerPackage} × ${p.unitQuantity} ${unit} (${total} ${unit})`
  }

  return `${label} de ${p.unitQuantity} ${unit}`
}

export function formatOrderUnit(p: ProductUnitInfo): string {
  const unit = p.measureUnit === "LITER" ? "L" : "kg"

  if (!p.packagingType) {
    return p.unitQuantity === 1 ? unit : `${p.unitQuantity} ${unit}`
  }

  return PACKAGING_LABELS_LOWER[p.packagingType] ?? p.packagingType
}
