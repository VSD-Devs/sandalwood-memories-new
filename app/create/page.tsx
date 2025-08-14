"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Heart, ArrowLeft, CalendarIcon, Upload, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { checkUsageLimits } from "@/lib/usage-limits"
import UsageLimitModal from "@/components/usage-limit-modal"
import { useRouter } from "next/navigation"
import { MediaProcessor } from "@/lib/media-processing"

interface MemorialData {
  name: string
  subtitle: string
  birthDate: Date | undefined
  passedDate: Date | undefined
  biography: string
  relationship: string
  profileImage: string
  coverImage: string
  theme: string
  isAlive: boolean
}

export default function CreateMemorialPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const profileInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const [limitModal, setLimitModal] = useState<{
    isOpen: boolean
    message: string
    upgradeRequired: boolean
  }>({
    isOpen: false,
    message: "",
    upgradeRequired: false,
  })
  const [memorialData, setMemorialData] = useState<MemorialData>({
    name: "",
    subtitle: "",
    birthDate: undefined,
    passedDate: undefined,
    biography: "",
    relationship: "",
    profileImage: "",
    coverImage: "",
    theme: "classic",
    isAlive: false,
  })

  const handleInputChange = (field: keyof MemorialData, value: any) => {
    setMemorialData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      const limitCheck = await checkUsageLimits(user.id, "create_memorial")

      if (!limitCheck.allowed) {
        setLimitModal({
          isOpen: true,
          message: limitCheck.message || "Usage limit reached",
          upgradeRequired: limitCheck.upgradeRequired || false,
        })
        return
      }

      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: memorialData.name,
          title: memorialData.subtitle || memorialData.name,
          birth_date: memorialData.birthDate?.toISOString().slice(0, 10) || null,
          death_date: memorialData.isAlive ? null : memorialData.passedDate?.toISOString().slice(0, 10) || null,
          biography: memorialData.biography || null,
          theme: memorialData.theme,
          profile_image_url: memorialData.profileImage || null,
          cover_image_url: memorialData.coverImage || null,
          created_by: user.id || "anonymous",
          is_alive: memorialData.isAlive,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create memorial")
      }

      const data = await response.json()
      try {
        const raw = localStorage.getItem("my-memorial-ids") || "[]"
        const savedIds: string[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
        if (!savedIds.includes(data.id)) {
          localStorage.setItem("my-memorial-ids", JSON.stringify([data.id, ...savedIds]))
        }
      } catch {}
      router.push(`/memorial/${data.id}`)
    } catch (error) {
      console.error("Error creating memorial:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-memorial-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/memorial" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              <Heart className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-foreground">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">Step {step} of 3</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Creating Memorial</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl">Tell Us About Your Loved One</CardTitle>
              <CardDescription className="text-lg">
                Let's start with the basic information to create their memorial page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Page type */}
              <div>
                <Label className="text-sm font-medium">Page type</Label>
                <RadioGroup
                  value={memorialData.isAlive ? "alive" : "in_memory"}
                  onValueChange={(v) => handleInputChange("isAlive", v === "alive")}
                  className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer bg-white">
                    <RadioGroupItem value="in_memory" id="in_memory" />
                    <div>
                      <div className="font-medium">In memory</div>
                      <div className="text-xs text-muted-foreground">For someone who has passed away</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer bg-white">
                    <RadioGroupItem value="alive" id="alive" />
                    <div>
                      <div className="font-medium">Living tribute</div>
                      <div className="text-xs text-muted-foreground">Celebrate someone who is alive</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter their full name"
                    value={memorialData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-2 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-sm font-medium">
                    Subtitle
                  </Label>
                  <Input
                    id="subtitle"
                    placeholder="e.g., Beloved Mother, Father, Friend"
                    value={memorialData.subtitle}
                    onChange={(e) => handleInputChange("subtitle", e.target.value)}
                    className="border-2 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Birth Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-2",
                          !memorialData.birthDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {memorialData.birthDate ? format(memorialData.birthDate, "PPP") : "Select birth date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={memorialData.birthDate}
                        onSelect={(date) => handleInputChange("birthDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {!memorialData.isAlive && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date of Passing</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-2",
                            !memorialData.passedDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {memorialData.passedDate ? format(memorialData.passedDate, "PPP") : "Select date of passing"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={memorialData.passedDate}
                          onSelect={(date) => handleInputChange("passedDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship" className="text-sm font-medium">
                  Your Relationship
                </Label>
                <Select
                  value={memorialData.relationship}
                  onValueChange={(value) => handleInputChange("relationship", value)}
                >
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue placeholder="Select your relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="text-xs text-muted-foreground">
                  You can change anything later.
                </div>
                <Button
                  onClick={handleNext}
                  disabled={!memorialData.name}
                  className="bg-primary hover:bg-primary/90 px-8"
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Biography & Story */}
        {step === 2 && (
          <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl">Share Their Story</CardTitle>
              <CardDescription className="text-lg">
                Tell us about their life, personality, and what made them special.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="biography" className="text-sm font-medium">
                  Life Story & Biography
                </Label>
                <Textarea
                  id="biography"
                  placeholder="Share their life story, achievements, personality, hobbies, and what made them special. This will be the heart of their memorial page."
                  value={memorialData.biography}
                  onChange={(e) => handleInputChange("biography", e.target.value)}
                  className="min-h-[200px] border-2 focus:border-primary resize-none"
                  rows={8}
                />
                <p className="text-sm text-muted-foreground">
                  Take your time to capture their essence. You can always edit this later.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Style</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "classic", name: "Classic", description: "Timeless and elegant" },
                    { id: "modern", name: "Modern", description: "Clean and contemporary" },
                    { id: "warm", name: "Warm", description: "Cozy and inviting" },
                  ].map((theme) => (
                    <Card
                      key={theme.id}
                      className={cn(
                        "cursor-pointer border-2 transition-none",
                        memorialData.theme === theme.id ? "border-primary bg-primary/5" : "border-border",
                      )}
                      onClick={() => handleInputChange("theme", theme.id)}
                      role="button"
                      aria-pressed={memorialData.theme === theme.id}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleInputChange("theme", theme.id)
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium">{theme.name}</h4>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button onClick={handlePrevious} variant="outline" size="lg">
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!memorialData.biography.trim()}
                  className="bg-primary hover:bg-primary/90 px-8"
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images & Final Review */}
        {step === 3 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl">Add Photos & Review</CardTitle>
              <CardDescription className="text-lg">
                Upload photos and review your memorial page before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Profile Photo</Label>
                <div
                  className="relative border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer overflow-hidden"
                  onClick={() => profileInputRef.current?.click()}
                >
                  {memorialData.profileImage ? (
                    <img
                      src={memorialData.profileImage}
                      alt="Profile preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload profile photo</p>
                    </>
                  )}
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const processed = await MediaProcessor.processImage(file)
                        const blob = await fetch(processed.url).then((r) => r.blob())
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const dataUrl = reader.result as string
                          handleInputChange("profileImage", dataUrl)
                        }
                        reader.readAsDataURL(blob)
                      } catch (err) {
                        console.error("Failed to process profile image", err)
                      } finally {
                        if (profileInputRef.current) profileInputRef.current.value = ""
                      }
                    }}
                  />
                </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cover Photo</Label>
                <div
                  className="relative border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer overflow-hidden"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {memorialData.coverImage ? (
                    <img
                      src={memorialData.coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload cover photo</p>
                    </>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const processed = await MediaProcessor.processImage(file)
                        const blob = await fetch(processed.url).then((r) => r.blob())
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const dataUrl = reader.result as string
                          handleInputChange("coverImage", dataUrl)
                        }
                        reader.readAsDataURL(blob)
                      } catch (err) {
                        console.error("Failed to process cover image", err)
                      } finally {
                        if (coverInputRef.current) coverInputRef.current.value = ""
                      }
                    }}
                  />
                </div>
                </div>
              </div>

              {/* Preview Summary */}
              <div className="bg-memorial-bg rounded-lg p-6 space-y-4">
                <h3 className="font-serif text-xl font-semibold">Memorial Preview</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {memorialData.name || "Not specified"}
                  </p>
                  <p>
                    <strong>Subtitle:</strong> {memorialData.subtitle || "Not specified"}
                  </p>
                  <p>
                    <strong>Dates:</strong>{" "}
                    {memorialData.birthDate && memorialData.passedDate
                      ? `${format(memorialData.birthDate, "MMM d, yyyy")} - ${format(memorialData.passedDate, "MMM d, yyyy")}`
                      : "Not specified"}
                  </p>
                  <p>
                    <strong>Theme:</strong> {memorialData.theme}
                  </p>
                  <p>
                    <strong>Biography:</strong> {memorialData.biography.substring(0, 150)}
                    {memorialData.biography.length > 150 ? "..." : ""}
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button onClick={handlePrevious} variant="outline" size="lg">
                  Previous
                </Button>
                <div className="flex space-x-4">
                  <Button variant="outline" size="lg" className="flex items-center space-x-2 bg-transparent" disabled>
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 px-8"
                    size="lg"
                  >
                    {loading ? "Creating..." : memorialData.isAlive ? "Create Tribute Page" : "Create Memorial"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <UsageLimitModal
        isOpen={limitModal.isOpen}
        onClose={() => setLimitModal({ isOpen: false, message: "", upgradeRequired: false })}
        message={limitModal.message}
        upgradeRequired={limitModal.upgradeRequired}
      />
    </div>
  )
}
