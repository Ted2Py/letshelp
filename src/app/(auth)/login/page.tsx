import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SignInButton } from "@/components/auth/sign-in-button"
import { auth } from "@/lib/auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/dashboard")
  }

  const { reset } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEF9F3] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-3xl">💬</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            Welcome to LetsHelp
          </h1>
          <p className="text-lg text-[#5A6B7F] mt-2 text-center">
            Patient tech help and scam protection.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-5">
          {reset === "success" && (
            <p className="text-center text-base text-teal-700 bg-teal-50 rounded-xl py-3 px-4">
              Password reset successfully. Please sign in with your new password.
            </p>
          )}

          {/* Access code login for seniors — promoted to top */}
          <div>
            <p className="mb-3 text-center text-lg font-medium text-[#1E3A5F]">
              Have an access code?
            </p>
            <Link
              href="/code-login"
              className="flex w-full items-center justify-center rounded-2xl bg-[#1E5A8D] hover:bg-[#1E4A6D] px-4 py-4 text-xl font-bold text-white transition-colors btn-press"
            >
              Sign in with Access Code
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#F0E9DF]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm uppercase tracking-wide text-[#9AA8BC]">
                Or sign in another way
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <SignInButton />
          </div>
        </div>

        <p className="text-center text-lg text-[#5A6B7F] mt-6">
          New here?{" "}
          <Link href="/register" className="font-bold text-[#1E5A8D] hover:underline">
            Create an account →
          </Link>
        </p>
      </div>
    </div>
  )
}
