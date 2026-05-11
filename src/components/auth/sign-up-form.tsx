"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/lib/auth-client"

type AccountType = "facility" | "senior"

export function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("facility")
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsPending(true)

    try {
      const callbackURL = accountType === "facility" ? "/onboarding" : "/senior"

      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL,
      })

      if (result.error) {
        setError(result.error.message || "Failed to create account")
      } else {
        router.push(callbackURL)
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label>Account Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("facility")}
            className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 gap-1.5 transition-colors min-h-[80px] ${
              accountType === "facility"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
            }`}
          >
            <Building2 className="h-6 w-6 shrink-0" />
            <span className="font-semibold text-sm leading-tight">Facility Manager</span>
            <span className="text-[11px] text-gray-500 leading-tight">Manage residents</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("senior")}
            className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 gap-1.5 transition-colors min-h-[80px] ${
              accountType === "senior"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
            }`}
          >
            <User className="h-6 w-6 shrink-0" />
            <span className="font-semibold text-sm leading-tight">Senior</span>
            <span className="text-[11px] text-gray-500 leading-tight">Get tech support</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : `Create ${accountType === "facility" ? "facility" : "senior"} account`}
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}
