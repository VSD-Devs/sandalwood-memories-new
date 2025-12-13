"use client"

import { Calendar, Camera, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface MemorialBottomNavProps {
  activeTab: string
  setActiveTab: (tab: "timeline" | "gallery" | "tributes") => void
}

const navItems = [
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "gallery", label: "Gallery", icon: Camera },
  { id: "tributes", label: "Tributes", icon: Heart },
] as const

export default function MemorialBottomNav({ activeTab, setActiveTab }: MemorialBottomNavProps) {
  const handleTabClick = (tabId: "timeline" | "gallery" | "tributes") => {
    setActiveTab(tabId)

    // Smooth scroll to section for gallery and tributes
    if (tabId === "gallery" || tabId === "tributes") {
      const sectionId = `${tabId}-section`
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
          })
        }
      }, 100) // Small delay to allow state update
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border">
      <div className="mx-auto max-w-6xl">
        <nav
          aria-label="Memorial navigation"
          role="tablist"
          className="grid grid-cols-3 h-16"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id as "timeline" | "gallery" | "tributes")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                activeTab === item.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={activeTab === item.id ? "page" : undefined}
              aria-label={item.label}
              aria-controls={`${item.id}-section`}
              role="tab"
              aria-selected={activeTab === item.id}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-all",
                activeTab === item.id ? "scale-110" : ""
              )} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
