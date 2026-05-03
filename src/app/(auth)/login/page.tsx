import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SignInButton } from "@/components/auth/sign-in-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {reset === "success" && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400">
              Password reset successfully. Please sign in with your new password.
            </p>
          )}
          <SignInButton />

          {/* Access code login for seniors */}
          <div className="w-full border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-400">
              Senior? Use your access code
            </p>
            <Link
              href="/code-login"
              className="flex w-full items-center justify-center rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              Sign in with Access Code
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
