"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Heart, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TributeFormProps {
  memorialId: string
  onSuccess?: () => void
}

interface FormData {
  author_name: string
  author_email: string
  message: string
}

interface FormErrors {
  author_name?: string
  author_email?: string
  message?: string
}

export default function TributeForm({ memorialId, onSuccess }: TributeFormProps) {
  const [formData, setFormData] = useState<FormData>({
    author_name: "",
    author_email: "",
    message: ""
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.author_name.trim() || formData.author_name.length < 2) {
      newErrors.author_name = "Please enter your name (at least 2 characters)"
    }

    if (formData.author_email && !/^\S+@\S+\.\S+$/.test(formData.author_email)) {
      newErrors.author_email = "Please enter a valid email address"
    }

    if (!formData.message.trim() || formData.message.length < 5) {
      newErrors.message = "Please write a message (at least 5 characters)"
    }

    if (formData.message.length > 2000) {
      newErrors.message = "Message is too long (maximum 2000 characters)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/memorials/${memorialId}/tributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          // Handle validation errors from server
          setErrors(data.details)
        }
        throw new Error(data.error || "Failed to submit tribute")
      }

      // Success
          toast({
            title: "Tribute shared successfully",
            description: "Your tribute is now visible on the memorial page.",
          })

      // Reset form
      setFormData({
        author_name: "",
        author_email: "",
        message: ""
      })

      onSuccess?.()

    } catch (error) {
      console.error("Submit tribute error:", error)
      toast({
        title: "Failed to submit tribute",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 font-serif text-lg md:text-xl">
          <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
          Leave a Tribute
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="author_name" className="text-sm md:text-base">Your Name *</Label>
              <Input
                id="author_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.author_name}
                onChange={(e) => handleInputChange("author_name", e.target.value)}
                className={`h-12 text-base ${errors.author_name ? "border-red-500" : ""}`}
              />
              {errors.author_name && (
                <p className="text-xs md:text-sm text-red-600">{errors.author_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_email" className="text-sm md:text-base">Email (optional)</Label>
              <Input
                id="author_email"
                type="email"
                placeholder="your@email.com"
                value={formData.author_email}
                onChange={(e) => handleInputChange("author_email", e.target.value)}
                className={`h-12 text-base ${errors.author_email ? "border-red-500" : ""}`}
              />
              {errors.author_email && (
                <p className="text-xs md:text-sm text-red-600">{errors.author_email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm md:text-base">Your Message *</Label>
            <Textarea
              id="message"
              placeholder="Share your memories, thoughts, or condolences..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              className={`min-h-[120px] text-base ${errors.message ? "border-red-500" : ""}`}
              maxLength={2000}
            />
            <div className="flex justify-between items-center flex-wrap gap-1">
              {errors.message && (
                <p className="text-xs md:text-sm text-red-600">{errors.message}</p>
              )}
              <p className="text-xs md:text-sm text-muted-foreground ml-auto">
                {formData.message.length}/2000 characters
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-600 hover:bg-rose-700 h-12 md:h-11 text-base touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Tribute"
            )}
          </Button>

          <p className="text-xs md:text-sm text-muted-foreground text-center">
            Your tribute will appear immediately on the memorial page.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
