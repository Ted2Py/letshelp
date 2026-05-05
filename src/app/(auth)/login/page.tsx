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
          <CardTitle className="text-2xl">Welcome to LetsHelp</CardTitle>
          <CardDescription className="text-base">
            Sign in to your account.{" "}
            <Link href="/register" className="font-semibold text-[#1E5A8D] hover:underline">
              New here? Create an account →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {reset === "success" && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400">
              Password reset successfully. Please sign in with your new password.
            </p>
          )}

          {/* Access code login for seniors - promoted to top */}
          <div className="w-full">
            <p className="mb-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              Are you a senior with an access code?
            </p>
            <Link
              href="/code-login"
              className="flex w-full items-center justify-center rounded-xl border-2 border-[#1E5A8D] bg-[#EEF4FB] px-4 py-4 text-lg font-bold text-[#1E5A8D] transition-colors hover:bg-[#DDEAF7] dark:bg-blue-900/20 dark:text-blue-300"
            >
              Sign in with Access Code
            </Link>
          </div>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or sign in another way</span>
            </div>
          </div>

          <SignInButton />
        </CardContent>
      </Card>
    </div>
  )
}
