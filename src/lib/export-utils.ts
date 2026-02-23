import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"

export interface GroupOrderExportData {
  title: string
  producerName: string
  deliveryDate: Date
  memberOrders: Array<{
    memberName: string
    commune: string | null
    deliveryPoint: string
    lines: Array<{
      productName: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }>
    total: number
  }>
}

export async function getGroupOrderExportData(groupOrderId: string): Promise<GroupOrderExportData | null> {
  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id: groupOrderId },
    include: {
      producer: { select: { name: true } },
      memberOrders: {
        include: {
          user: { select: { name: true, commune: true } },
          deliveryPoint: { select: { name: true } },
          orderLines: {
            include: {
              groupOrderProduct: {
                include: { product: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (!groupOrder) return null

  return {
    title: groupOrder.title,
    producerName: groupOrder.producer.name,
    deliveryDate: groupOrder.deliveryDate,
    memberOrders: groupOrder.memberOrders.map((mo) => ({
      memberName: mo.user?.name ?? mo.proxyBuyerName ?? "Acheteur",
      commune: mo.user?.commune ?? null,
      deliveryPoint: mo.deliveryPoint.name,
      lines: mo.orderLines.map((ol) => ({
        productName: ol.groupOrderProduct.product.name,
        quantity: ol.quantity,
        unitPrice: Number(ol.unitPrice),
        lineTotal: Number(ol.lineTotal),
      })),
      total: Number(mo.totalAmount),
    })),
  }
}

export async function generateOrderExcel(groupOrderId: string): Promise<Buffer> {
  const data = await getGroupOrderExportData(groupOrderId)
  if (!data) throw new Error("Commande groupée introuvable")

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Team Fruitée"
  workbook.created = new Date()

  // Feuille récapitulatif global
  const sheet = workbook.addWorksheet("Récapitulatif")

  sheet.columns = [
    { header: "Membre", key: "member", width: 22 },
    { header: "Commune", key: "commune", width: 15 },
    { header: "Point de livraison", key: "delivery", width: 22 },
    { header: "Produit", key: "product", width: 28 },
    { header: "Quantité", key: "qty", width: 10 },
    { header: "Prix unit. (€)", key: "unitPrice", width: 14 },
    { header: "Total ligne (€)", key: "lineTotal", width: 14 },
  ]

  // Style en-tête
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }
  headerRow.height = 20

  let grandTotal = 0

  for (const mo of data.memberOrders) {
    for (const line of mo.lines) {
      sheet.addRow({
        member: mo.memberName,
        commune: mo.commune ?? "",
        delivery: mo.deliveryPoint,
        product: line.productName,
        qty: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })
      grandTotal += line.lineTotal
    }

    // Ligne de sous-total par membre
    const subtotalRow = sheet.addRow({
      member: "",
      commune: "",
      delivery: "",
      product: `SOUS-TOTAL ${mo.memberName}`,
      qty: "",
      unitPrice: "",
      lineTotal: mo.total,
    })
    subtotalRow.font = { bold: true }
    subtotalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } }
  }

  // Total global
  const totalRow = sheet.addRow({
    product: "TOTAL GÉNÉRAL",
    lineTotal: grandTotal,
  })
  totalRow.font = { bold: true, size: 12 }
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } }
  totalRow.getCell("lineTotal").font = { bold: true, color: { argb: "FFFFFFFF" } }

  // Feuille par point de livraison
  const deliveryPoints = [...new Set(data.memberOrders.map((mo) => mo.deliveryPoint))]
  for (const dp of deliveryPoints) {
    const dpSheet = workbook.addWorksheet(`Livraison - ${dp}`)
    dpSheet.columns = sheet.columns

    const dpHeaderRow = dpSheet.getRow(1)
    dpHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    dpHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565C0" } }

    const dpOrders = data.memberOrders.filter((mo) => mo.deliveryPoint === dp)
    for (const mo of dpOrders) {
      for (const line of mo.lines) {
        dpSheet.addRow({
          member: mo.memberName,
          commune: mo.commune ?? "",
          delivery: mo.deliveryPoint,
          product: line.productName,
          qty: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })
      }
    }
  }

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>
}
