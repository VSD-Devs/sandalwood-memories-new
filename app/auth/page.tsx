"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

type AuthMode = "signin" | "signup"
type ResetStep = "none" | "request" | "confirm"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const derivedMode: AuthMode = searchParams?.get("mode") === "signup" ? "signup" : "signin"

  const [mode, setMode] = useState<AuthMode>(derivedMode)
  const [resetStep, setResetStep] = useState<ResetStep>("none")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    resetToken: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isLoading } = useAuth()

  useEffect(() => {
    setMode(derivedMode)
  }, [derivedMode])

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
    setInfo("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (resetStep === "request") {
      if (!formData.email) {
        setError("Please add the email you used with your account.")
        return
      }
      setIsSubmitting(true)
      const res = await fetch("/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await res.json()
      setIsSubmitting(false)

      if (!res.ok) {
        setError(data?.error || "We could not start the reset just now.")
        return
      }

      setInfo(
        data?.token
          ? `Reset started. Use this token to finish: ${data.token}`
          : "Reset started. Please check your email for the token.",
      )
      setResetStep("confirm")
      return
    }

    if (resetStep === "confirm") {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("The passwords do not match.")
        return
      }
      setIsSubmitting(true)
      const res = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: formData.resetToken, newPassword: formData.newPassword }),
      })
      const data = await res.json()
      setIsSubmitting(false)

      if (!res.ok) {
        setError(data?.error || "We could not update the password.")
        return
      }

      setInfo("Password updated. You can now sign in with your new details.")
      setResetStep("none")
      setMode("signin")
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        resetToken: "",
      }))
      return
    }

    if (mode === "signup" && formData.password !== formData.confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    setIsSubmitting(true)
    const { ok, error: loginError } = await login(
      formData.email,
      formData.password,
      mode === "signup" ? formData.name : undefined,
    )
    setIsSubmitting(false)

    if (!ok) {
      setError(loginError || "We could not sign you in just now. Please try again.")
      return
    }

    router.push(mode === "signin" ? "/memorial" : "/create")
  }

  const working = isLoading || isSubmitting
  const showName = resetStep === "none" && mode === "signup"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="grid min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
        <div className="order-2 flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:order-1 lg:px-16 lg:py-16 lg:max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            <Link href="/" className="inline-block text-base font-medium text-slate-600 hover:text-[#0f3c5d] transition-colors">
              ← Back to home
            </Link>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 leading-tight">
                {resetStep === "request"
                  ? "Reset your password"
                  : resetStep === "confirm"
                    ? "Confirm your reset"
                    : mode === "signin"
                      ? "Welcome back"
                      : "Create your account"}
              </h1>
              <p className="text-lg text-slate-600">
                {resetStep === "request"
                  ? "Enter your email and we'll send you a reset token."
                  : resetStep === "confirm"
                    ? "Enter your reset token and choose a new password."
                    : mode === "signin"
                      ? "Please enter your details to continue."
                      : "Get started by creating your account."}
              </p>
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-base text-red-700" role="alert" aria-live="assertive">
                {error}
              </div>
            ) : null}
            {info ? (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-base text-emerald-800" role="status" aria-live="polite">
                {info}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              {showName ? (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium text-slate-700">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="h-12 text-base"
                    autoComplete="name"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="h-12 text-base"
                  autoComplete={mode === "signin" ? "email" : "username"}
                  required
                />
              </div>

              {resetStep === "confirm" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resetToken" className="text-base font-medium text-slate-700">
                      Reset token
                    </Label>
                    <Input
                      id="resetToken"
                      type="text"
                      placeholder="Paste the code from your email"
                      value={formData.resetToken}
                      onChange={(event) => updateField("resetToken", event.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-base font-medium text-slate-700">
                      New password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Choose a fresh password"
                      value={formData.newPassword}
                      onChange={(event) => updateField("newPassword", event.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword" className="text-base font-medium text-slate-700">
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Re-enter the new password"
                      value={formData.confirmNewPassword}
                      onChange={(event) => updateField("confirmNewPassword", event.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-base font-medium text-slate-700">
                      Password
                    </Label>
                    {resetStep === "none" && mode === "signin" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep("request")
                          setError("")
                          setInfo("")
                        }}
                        className="text-sm font-medium text-[#0f3c5d] hover:underline"
                      >
                        Forgot password?
                      </button>
                    ) : null}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
                    value={formData.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className="h-12 text-base"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                  />
                </div>
              )}

              {resetStep === "none" && mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-medium text-slate-700">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    className="h-12 text-base"
                    autoComplete="new-password"
                    required
                  />
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-[#0f3c5d] text-white hover:bg-[#0c304c]"
                disabled={working}
              >
                {resetStep === "request"
                  ? "Send reset token"
                  : resetStep === "confirm"
                    ? "Update password"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
              </Button>
            </form>

            <div className="text-center">
              {resetStep === "none" ? (
                <p className="text-base text-slate-600">
                  {mode === "signin" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup")
                          setResetStep("none")
                        }}
                        className="font-semibold text-[#0f3c5d] hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signin")
                          setResetStep("none")
                        }}
                        className="font-semibold text-[#0f3c5d] hover:underline"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResetStep("none")
                    setInfo("")
                    setError("")
                  }}
                  className="text-base font-medium text-[#0f3c5d] hover:underline"
                >
                  ← Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative order-1 min-h-[320px] bg-slate-100 lg:order-2 lg:h-[calc(100vh-4rem)]">
          <Image
            src="/air-balloons.webp"
            alt="Hot air balloons floating over calm hills"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/60 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12 text-white">
            <div className="max-w-md space-y-4">
              <p className="text-2xl font-semibold leading-tight">
                "A gentle place to gather memories—calm, accessible, and easy to use."
              </p>
              <div className="space-y-1">
                <p className="text-lg font-medium">Sarah Mitchell</p>
                <p className="text-base text-white/80">Memorial Creator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}

