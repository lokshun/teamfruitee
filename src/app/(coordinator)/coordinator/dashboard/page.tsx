import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Store, ShoppingCart, Clock } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  const [membresActifs, membresPending, producteursActifs, commandesOuvertes] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "MEMBER", status: "PENDING" } }),
      prisma.producer.count({ where: { isActive: true } }),
      prisma.groupOrder.count({ where: { status: "OPEN" } }),
    ])

  const stats = [
    {
      label: "Membres actifs",
      value: membresActifs,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "En attente de validation",
      value: membresPending,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      alert: membresPending > 0,
    },
    {
      label: "Producteurs actifs",
      value: producteursActifs,
      icon: Store,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Commandes ouvertes",
      value: commandesOuvertes,
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {session?.user.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Tableau de bord du groupement d&apos;achat</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, bg, alert }) => (
          <div
            key={label}
            className={`bg-white rounded-xl border p-6 shadow-sm ${alert ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">{label}</span>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${alert ? "text-orange-600" : "text-gray-900"}`}>
              {value}
            </p>
            {alert && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                Action requise
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <a
              href="/coordinator/producteurs/nouveau"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              <Store className="h-4 w-4 text-green-600" />
              Ajouter un producteur
            </a>

            <a
              href="/commandes-groupees/nouvelle"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-purple-600" />
              Créer une commande groupée
            </a>
            <a
              href="/membres"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              <Users className="h-4 w-4 text-blue-600" />
              Gérer les membres
              {membresPending > 0 && (
                <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {membresPending} en attente
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
