import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getGroupOrderExportData } from "@/lib/export-utils"
import { formatDate, formatCurrency } from "@/lib/utils"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || !["COORDINATOR", "PRODUCER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  try {
    const data = await getGroupOrderExportData(id)
    if (!data) {
      return NextResponse.json({ error: "Commande groupée introuvable" }, { status: 404 })
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    // En-tête
    doc.setFontSize(18)
    doc.setTextColor(46, 125, 50)
    doc.text("Team Fruitée", 14, 18)

    doc.setFontSize(13)
    doc.setTextColor(0, 0, 0)
    doc.text(`Récapitulatif : ${data.title}`, 14, 28)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Producteur : ${data.producerName}`, 14, 36)
    doc.text(`Livraison : ${formatDate(data.deliveryDate)}`, 14, 42)
    doc.text(`Généré le : ${formatDate(new Date())}`, 14, 48)

    let yOffset = 56

    // Tableau par membre
    const allRows: (string | number)[][] = []
    for (const mo of data.memberOrders) {
      for (const line of mo.lines) {
        allRows.push([
          mo.memberName,
          mo.commune ?? "",
          mo.deliveryPoint,
          line.productName,
          line.quantity,
          formatCurrency(line.unitPrice),
          formatCurrency(line.lineTotal),
        ])
      }
    }

    autoTable(doc, {
      head: [["Membre", "Commune", "Point livraison", "Produit", "Qté", "Prix unit.", "Total"]],
      body: allRows,
      startY: yOffset,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 248, 240] },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
      },
    })

    // Récapitulatif financier
    let finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`TOTAL GÉNÉRAL : ${formatCurrency(data.totalMembers)}`, 14, finalY)

    finalY += 7
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total producteur : ${formatCurrency(data.totalProducerGoods)}`, 14, finalY)

    finalY += 6
    doc.text(`Total transport : ${formatCurrency(data.transportCompensation)}`, 14, finalY)

    finalY += 6
    doc.text(`Dont encaissé (statut "Payé") : ${formatCurrency(data.totalCollected)}`, 14, finalY)

    finalY += 7
    doc.setFont("helvetica", "bold")
    const balanceLabel = data.balance >= 0 ? "Solde restant" : "Solde manquant"
    if (data.balance < 0) doc.setTextColor(200, 0, 0)
    doc.text(`${balanceLabel} : ${formatCurrency(Math.abs(data.balance))}`, 14, finalY)
    doc.setTextColor(0, 0, 0)

    const buffer = Buffer.from(doc.output("arraybuffer"))

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="commande-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[EXPORT_PDF]", error)
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 })
  }
}
