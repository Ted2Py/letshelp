import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SignUpForm } from "@/components/auth/sign-up-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your LetsHelp account</CardTitle>
          <CardDescription className="text-base">
            Free to start — no credit card required.{" "}
            <Link href="/login" className="font-semibold text-[#1E5A8D] hover:underline">
              Already have an account? Sign in →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
