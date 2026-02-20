import { signOut } from "@/lib/auth"

export default function PendingValidationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte en attente</h1>
        <p className="text-gray-500 mb-6">
          Votre inscription est en cours de validation par un coordinateur. Vous recevrez un
          email dès que votre compte sera activé.
        </p>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
