import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { auth } from "@/lib/auth"

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEF9F3] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-3xl">💬</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            Create your account
          </h1>
          <p className="text-lg text-[#5A6B7F] mt-2">
            Free to start — no credit card required.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col items-center">
          <SignUpForm />
        </div>

        <p className="text-center text-lg text-[#5A6B7F] mt-6">
          Already have an account or a senior access code?{" "}
          <Link href="/login" className="font-bold text-[#1E5A8D] hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
