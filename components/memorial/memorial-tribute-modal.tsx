"use client"

import { useState } from "react"
import { Heart, Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface MemorialTributeModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  memorialId?: string
}

export default function MemorialTributeModal({
  isOpen,
  onOpenChange,
  memorialId
}: MemorialTributeModalProps) {
  const [tributeForm, setTributeForm] = useState({
    author_name: '',
    author_email: '',
    message: ''
  })
  const [tributeErrors, setTributeErrors] = useState<Record<string, string>>({})
  const [isSubmittingTribute, setIsSubmittingTribute] = useState(false)
  const { toast } = useToast()

  const submitTribute = async () => {
    if (!memorialId) return

    setIsSubmittingTribute(true)
    setTributeErrors({})

    try {
      const response = await fetch(`/api/memorials/${memorialId}/tributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tributeForm)
      })

      const data = await response.json()

      if (response.ok) {
        setTributeForm({ author_name: '', author_email: '', message: '' })
        onOpenChange(false)

        toast({
          title: "Tribute shared",
          description: "Your words are now part of this memorial.",
        })

        // Trigger tribute refresh
        window.dispatchEvent(new CustomEvent('tributeSubmitted'))
      } else {
        if (data.details) {
          setTributeErrors(data.details)
        } else {
          toast({
            title: "Failed to submit tribute",
            description: data.error || "Please try again later.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Failed to create tribute:', error)
      toast({
        title: "Failed to submit tribute",
        description: "Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingTribute(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) {
        setTributeErrors({})
      }
    }}>
      <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto top-0 md:top-[52%] rounded-none md:rounded-lg p-4 md:p-6">
        <DialogTitle className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3 pb-4 md:pb-6">
          <Heart className="h-5 w-5 md:h-6 md:w-6 text-[#1B3B5F]" />
          Leave a tribute
        </DialogTitle>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="tribute-name" className="text-sm md:text-base font-semibold">Your name <span className="text-red-600">*</span></Label>
              <Input
                id="tribute-name"
                value={tributeForm.author_name}
                onChange={(e) => {
                  setTributeForm(prev => ({ ...prev, author_name: e.target.value }))
                  if (tributeErrors.author_name) {
                    setTributeErrors(prev => ({ ...prev, author_name: '' }))
                  }
                }}
                placeholder="Enter your full name"
                className={`h-12 md:h-12 text-base ${tributeErrors.author_name ? "border-red-500" : ""}`}
              />
              {tributeErrors.author_name && (
                <p className="text-sm md:text-base text-red-600">{tributeErrors.author_name}</p>
              )}
            </div>

            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="tribute-email" className="text-sm md:text-base font-semibold">Email <span className="text-slate-500 font-normal">(optional)</span></Label>
              <Input
                id="tribute-email"
                type="email"
                value={tributeForm.author_email}
                onChange={(e) => {
                  setTributeForm(prev => ({ ...prev, author_email: e.target.value }))
                  if (tributeErrors.author_email) {
                    setTributeErrors(prev => ({ ...prev, author_email: '' }))
                  }
                }}
                placeholder="your@email.com"
                className={`h-12 md:h-12 text-base ${tributeErrors.author_email ? "border-red-500" : ""}`}
              />
              {tributeErrors.author_email && (
                <p className="text-sm md:text-base text-red-600">{tributeErrors.author_email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <Label htmlFor="tribute-message" className="text-sm md:text-base font-semibold">Your message <span className="text-red-600">*</span></Label>
            <Textarea
              id="tribute-message"
              value={tributeForm.message}
              onChange={(e) => {
                setTributeForm(prev => ({ ...prev, message: e.target.value }))
                if (tributeErrors.message) {
                  setTributeErrors(prev => ({ ...prev, message: '' }))
                }
              }}
              placeholder="Share memories, stories, or kind words…"
              rows={6}
              maxLength={2000}
              className={`text-base resize-none ${tributeErrors.message ? "border-red-500" : ""}`}
            />
            <div className="flex justify-between items-center">
              {tributeErrors.message && (
                <p className="text-sm md:text-base text-red-600">{tributeErrors.message}</p>
              )}
              <p className="text-sm md:text-base text-slate-600 ml-auto">
                {tributeForm.message.length}/2000 characters
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-200">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmittingTribute}
              className="h-12 px-6 md:px-8 text-base touch-manipulation w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={submitTribute}
              disabled={isSubmittingTribute}
              className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-12 px-6 md:px-8 text-base touch-manipulation w-full sm:w-auto"
            >
              {isSubmittingTribute ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  Share tribute
                </>
              )}
            </Button>
          </div>

          <p className="text-sm md:text-base text-slate-600 text-center">
            Your tribute will appear immediately on the memorial page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
