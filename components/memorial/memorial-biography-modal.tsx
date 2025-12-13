"use client"

import { useState, useEffect } from "react"
import { Edit } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MemorialBiographyModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  memorialId?: string
  initialBiography?: string
  onSave: (biography: string) => Promise<void>
}

export default function MemorialBiographyModal({
  isOpen,
  onOpenChange,
  memorialId,
  initialBiography = '',
  onSave
}: MemorialBiographyModalProps) {
  const [biographyForm, setBiographyForm] = useState({
    biography: initialBiography
  })

  useEffect(() => {
    if (isOpen) {
      setBiographyForm({ biography: initialBiography })
    }
  }, [isOpen, initialBiography])

  const saveBiography = async () => {
    if (!memorialId) return

    try {
      await onSave(biographyForm.biography)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update biography:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto top-0 md:top-[52%] rounded-none md:rounded-lg p-4 md:p-6">
        <DialogTitle className="font-serif text-2xl md:text-3xl font-semibold pb-4 md:pb-6">
          Edit life story
        </DialogTitle>
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2 md:space-y-3">
            <Label htmlFor="biography-edit" className="text-sm md:text-base font-semibold">Biography</Label>
            <Textarea
              id="biography-edit"
              value={biographyForm.biography}
              onChange={(e) => setBiographyForm(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="Share their life story, achievements, personality, and what made them special..."
              rows={12}
              className="min-h-[300px] md:min-h-[400px] text-base resize-none"
            />
            <p className="text-sm md:text-base text-slate-600">
              Take your time to capture their essence and unique story.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-200">
            <Button size="lg" variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-6 md:px-8 text-base touch-manipulation w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="lg" onClick={saveBiography} className="h-12 px-6 md:px-8 text-base bg-[#1B3B5F] hover:bg-[#16304d] text-white touch-manipulation w-full sm:w-auto">
              <Edit className="h-5 w-5 mr-2" />
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}