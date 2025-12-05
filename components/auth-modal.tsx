"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Heart, Mail, Lock, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  mode: "signin" | "signup"
  variant?: "default" | "link" | "secondary" | "destructive" | "outline" | "ghost"
  children?: React.ReactNode
}

export default function AuthModal({ mode, variant = "outline", children }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState(mode)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")

  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (currentMode === "signup" && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    try {
      const success = await login(
        formData.email,
        formData.password,
        currentMode === "signup" ? formData.name : undefined,
      )

      if (success) {
        setIsOpen(false)
        // Redirect: sign in → My memorials, sign up → Create memorial
        router.push(currentMode === "signin" ? "/memorial" : "/create")
      }
    } catch (err) {
      setError("Authentication failed. Please try again.")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("") // Clear error when user types
  }

  const handleQuickLogin = async () => {
    setError("")
    try {
      // Disabled test login now that real auth is implemented
      setError("Quick login is disabled")
    } catch (err) {
      setError("Quick login failed")
    }
  }

  const triggerButton = children || (
    <Button variant={variant} className={variant === "outline" ? "border-2 border-[#1B3B5F] !text-[#1B3B5F] hover:!bg-[#1B3B5F] hover:!text-white rounded-full" : ""}>
      {mode === "signin" ? "Sign In" : "Get Started"}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl">
        <VisuallyHidden>
          <DialogTitle>
            {currentMode === "signin" ? "Sign In" : "Create Your Account"}
          </DialogTitle>
        </VisuallyHidden>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-[#E8F0F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-[#4A90A4]" />
            </div>
            <CardTitle className="font-serif text-2xl text-[#1B3B5F]">
              {currentMode === "signin" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {currentMode === "signin"
                ? "Sign in to manage your memorial pages"
                : "Start creating beautiful memorial pages for your loved ones"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                onClick={handleQuickLogin}
                variant="outline"
                className="w-full border-2 border-dashed border-[#4A90A4]/30 text-[#4A90A4] hover:bg-[#E8F0F5] bg-transparent rounded-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Quick Test Login (No credentials needed)
              </Button>
              <p className="text-xs text-slate-600 text-center mt-1">
                For testing - creates account as "Test User"
              </p>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-600">Or continue with form</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {currentMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name (optional for testing)"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 border-2 focus:border-[#4A90A4] rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email (optional for testing)"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 border-2 focus:border-[#4A90A4] rounded-lg"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password (optional for testing)"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 border-2 focus:border-[#4A90A4] rounded-lg"
                    />
                </div>
              </div>

              {currentMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 border-2 focus:border-[#4A90A4] rounded-lg"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full !bg-[#1B3B5F] hover:!bg-[#16304d] !text-white transition-all duration-300 rounded-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {currentMode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setCurrentMode(currentMode === "signin" ? "signup" : "signin")}
                className="text-sm text-[#4A90A4] hover:text-[#3a7a8a] transition-colors"
              >
                {currentMode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
