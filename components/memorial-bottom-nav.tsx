"use client"

import { Calendar, Camera, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MemorialBottomNavProps {
  activeTab: string
  setActiveTab: (tab: "timeline" | "gallery" | "tributes") => void
}

const navItems = [
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "gallery", label: "Photos", icon: Camera },
  { id: "tributes", label: "Tributes", icon: Heart },
]

export default function MemorialBottomNav({ activeTab, setActiveTab }: MemorialBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-1px_4px_rgba(0,0,0,0.03)]">
        <nav className="grid grid-cols-3 h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as "timeline" | "gallery" | "tributes")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                activeTab === item.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
