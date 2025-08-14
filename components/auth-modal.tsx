"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
        // Redirect to create memorial page after successful login
        router.push("/create")
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
    <Button variant={variant} className={variant === "outline" ? "border-2 hover:bg-memorial-card" : ""}>
      {mode === "signin" ? "Sign In" : "Get Started"}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {currentMode === "signin" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
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
                className="w-full border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 bg-transparent"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Quick Test Login (No credentials needed)
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-1">
                For testing - creates account as "Test User"
              </p>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with form</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name (optional for testing)"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 border-2 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email (optional for testing)"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 border-2 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (optional for testing)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 border-2 focus:border-primary"
                  />
                </div>
              </div>

              {currentMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 border-2 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
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
                className="text-sm text-primary hover:text-primary/80 transition-colors"
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
