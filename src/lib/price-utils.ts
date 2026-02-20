export interface OrderLineInput {
  quantity: number
  unitPrice: number
}

export function computeLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function computeOrderTotal(lines: OrderLineInput[]): number {
  const total = lines.reduce((sum, line) => sum + computeLineTotal(line.quantity, line.unitPrice), 0)
  return Math.round(total * 100) / 100
}
