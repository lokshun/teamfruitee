import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
        <p className="text-gray-500 mb-6">
          Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <Link
          href="/"
          className="inline-block bg-green-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-green-700 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
