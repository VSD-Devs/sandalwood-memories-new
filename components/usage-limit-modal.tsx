"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Crown } from "lucide-react"
import Link from "next/link"

interface UsageLimitModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  upgradeRequired?: boolean
}

export default function UsageLimitModal({ isOpen, onClose, message, upgradeRequired }: UsageLimitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Usage Limit Reached</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                Free Plan
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base leading-relaxed">{message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {upgradeRequired && (
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Upgrade Benefits:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Unlimited memorial pages</li>
                <li>• Up to 500 photos per memorial</li>
                <li>• Video uploads (2GB per memorial)</li>
                <li>• Unlimited timeline events</li>
                <li>• Premium themes & features</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {upgradeRequired && (
              <Button
                asChild
                className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700"
              >
                <Link href="/pricing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium - £99/year
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Continue with Free Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
