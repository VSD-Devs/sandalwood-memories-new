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
import { Heart, ArrowLeft, CalendarIcon, Upload, Eye, Info } from "lucide-react"
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
  relationship: string
  profileImage: string
  coverImage: string
  theme: string
  isAlive: boolean
  burialLocation?: string | null
}

export default function CreateMemorialPage() {
  const { user, isLoading: authLoading } = useAuth()
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
    relationship: "",
    profileImage: "",
    coverImage: "",
    theme: "classic",
    isAlive: false,
    burialLocation: null,
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
        credentials: 'include', // Ensure cookies are sent for authentication
        body: JSON.stringify({
          full_name: memorialData.name,
          title: memorialData.subtitle || memorialData.name,
          birth_date: memorialData.birthDate?.toISOString().slice(0, 10) || null,
          death_date: memorialData.isAlive ? null : memorialData.passedDate?.toISOString().slice(0, 10) || null,
          theme: memorialData.theme,
          profile_image_url: memorialData.profileImage || null,
          cover_image_url: memorialData.coverImage || null,
          is_alive: memorialData.isAlive,
          burial_location: memorialData.burialLocation?.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        
        if (response.status === 401) {
          throw new Error("Please sign in to create a memorial")
        }
        
        throw new Error(errorData.error || "Failed to create memorial")
      }

      const data = await response.json()
      // Use slug for URL if available, otherwise fall back to ID
      const memorialUrl = data.slug ? `/memorial/${data.slug}` : `/memorial/${data.id}`
      router.push(memorialUrl)
    } catch (error) {
      console.error("Error creating memorial:", error)
    } finally {
      setLoading(false)
    }
  }

  // Show authentication prompt for non-logged in users
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Card className="w-full max-w-md border border-slate-100 shadow-lg bg-white rounded-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#E8F0F5] flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-[#4A90A4]" />
            </div>
            <CardTitle className="font-serif text-[#1B3B5F]">Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              Please sign in to create a memorial.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button className="w-full !bg-[#1B3B5F] hover:!bg-[#16304d] !text-white rounded-full">Go to homepage</Button>
              </Link>
              <p className="text-sm text-slate-600">
                You can sign in from the homepage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/memorial" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <Heart className="h-8 w-8 text-[#4A90A4]" />
              <span className="font-serif font-bold text-2xl text-[#1B3B5F]">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">Step {step} of 3</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1B3B5F]">Creating Memorial</span>
            <span className="text-sm text-slate-600">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-[#4A90A4] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl text-[#1B3B5F]">Tell Us About Your Loved One</CardTitle>
              <CardDescription className="text-lg text-slate-600">
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
                  <label className="flex items-center gap-3 border-2 rounded-md p-4 cursor-pointer bg-white hover:border-[#4A90A4] min-h-[60px] touch-none transition-colors">
                    <RadioGroupItem value="in_memory" id="in_memory" />
                    <div>
                      <div className="font-medium text-base text-[#1B3B5F]">In memory</div>
                      <div className="text-sm text-slate-600">For someone who has passed away</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 border-2 rounded-md p-4 cursor-pointer bg-white hover:border-[#4A90A4] min-h-[60px] touch-none transition-colors">
                    <RadioGroupItem value="alive" id="alive" />
                    <div>
                      <div className="font-medium text-base text-[#1B3B5F]">Living tribute</div>
                      <div className="text-sm text-slate-600">Celebrate someone who is alive</div>
                    </div>
                  </label>
                </RadioGroup>
                <div className="flex items-start gap-2 mt-2 text-xs text-slate-600" aria-live="polite">
                  <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                  <span>You can switch this later. Choose "Living tribute" for someone who is alive.</span>
                </div>
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
                    className="border-2 focus:border-[#4A90A4] h-12 text-base"
                    required
                  />
                  <div className="flex items-start gap-2 mt-1 text-xs text-slate-600" aria-live="polite">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                    <span>Use their full legal name for easier searching.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-sm font-medium">
                    Subtitle
                  </Label>
                  <Select
                    value={memorialData.subtitle || "no_subtitle"}
                    onValueChange={(value) => handleInputChange("subtitle", value === "no_subtitle" ? "" : value)}
                  >
                  <SelectTrigger className="border-2 focus:border-[#4A90A4] h-12 text-base">
                    <SelectValue placeholder="Select a subtitle or leave blank" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_subtitle">No subtitle</SelectItem>
                      <SelectItem value="Beloved Mother">Beloved Mother</SelectItem>
                      <SelectItem value="Beloved Father">Beloved Father</SelectItem>
                      <SelectItem value="Beloved Wife">Beloved Wife</SelectItem>
                      <SelectItem value="Beloved Husband">Beloved Husband</SelectItem>
                      <SelectItem value="Beloved Mum">Beloved Mum</SelectItem>
                      <SelectItem value="Beloved Dad">Beloved Dad</SelectItem>
                      <SelectItem value="Beloved Grandmother">Beloved Grandmother</SelectItem>
                      <SelectItem value="Beloved Grandfather">Beloved Grandfather</SelectItem>
                      <SelectItem value="Beloved Gran">Beloved Gran</SelectItem>
                      <SelectItem value="Beloved Grandad">Beloved Grandad</SelectItem>
                      <SelectItem value="Beloved Sister">Beloved Sister</SelectItem>
                      <SelectItem value="Beloved Brother">Beloved Brother</SelectItem>
                      <SelectItem value="Beloved Friend">Beloved Friend</SelectItem>
                      <SelectItem value="Devoted Mother & Wife">Devoted Mother & Wife</SelectItem>
                      <SelectItem value="Devoted Father & Husband">Devoted Father & Husband</SelectItem>
                      <SelectItem value="Cherished Mother">Cherished Mother</SelectItem>
                      <SelectItem value="Cherished Father">Cherished Father</SelectItem>
                      <SelectItem value="Dear Friend">Dear Friend</SelectItem>
                      <SelectItem value="Loving Mother">Loving Mother</SelectItem>
                      <SelectItem value="Loving Father">Loving Father</SelectItem>
                      <SelectItem value="Wonderful Mother & Friend">Wonderful Mother & Friend</SelectItem>
                      <SelectItem value="Wonderful Father & Friend">Wonderful Father & Friend</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-start gap-2 mt-1 text-xs text-slate-600" aria-live="polite">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                    <span>Choose a common phrase or leave blank for just the name.</span>
                  </div>
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
                          "w-full justify-start text-left font-normal border-2 h-12 text-base focus:border-[#4A90A4]",
                          !memorialData.birthDate && "text-slate-500",
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
                    <div className="flex items-start gap-2 mt-1 text-xs text-slate-600" aria-live="polite">
                      <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                      <span>If you're unsure, month and year are perfectly fine.</span>
                    </div>
                </div>

                {!memorialData.isAlive && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date of Passing</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-2 h-12 text-base focus:border-[#4A90A4]",
                          !memorialData.passedDate && "text-slate-500",
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
                    <div className="flex items-start gap-2 mt-1 text-xs text-slate-600" aria-live="polite">
                      <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                      <span>Leave blank if you're not ready to share this yet.</span>
                    </div>
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
                  <SelectTrigger className="border-2 focus:border-[#4A90A4] h-12 text-base">
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
                <div className="flex items-start gap-2 mt-1 text-xs text-slate-600" aria-live="polite">
                  <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                  <span>Used to tailor suggestions; not shown publicly.</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="text-xs text-slate-600">
                  You can change anything later.
                </div>
                <Button
                  onClick={handleNext}
                  disabled={!memorialData.name}
                  className="!bg-[#1B3B5F] hover:!bg-[#16304d] !text-white px-8 rounded-full"
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
          <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl">
              <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl text-[#1B3B5F]">Share Their Story</CardTitle>
              <CardDescription className="text-lg text-slate-600">
                Tell us about their life, personality, and what made them special.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Life Story & Biography
                </Label>
                
                <div className="p-6 bg-[#E8F0F5] rounded-lg border border-[#C7D6E2]">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart className="h-5 w-5 text-[#4A90A4]" />
                    <h4 className="font-medium text-[#1B3B5F]">Biography will be automatically generated</h4>
                  </div>
                  <p className="text-slate-700 text-sm">
                    After creating the memorial, you'll be able to personalise the biography with their unique story, memories, and achievements.
                  </p>
                </div>
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
                        memorialData.theme === theme.id ? "border-[#4A90A4] bg-[#E8F0F5]" : "border-slate-200",
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
                        <h4 className="font-medium text-[#1B3B5F]">{theme.name}</h4>
                        <p className="text-sm text-slate-600">{theme.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600" aria-live="polite">
                <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                <span>Pick a starting look — you can change it at any time.</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="burialLocation" className="text-sm font-medium">
                  Burial or ashes location (optional)
                </Label>
                <Select
                  value={memorialData.burialLocation || "not_specified"}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      // Keep current custom value or clear it
                      return;
                    }
                    handleInputChange("burialLocation", value === "not_specified" ? null : value);
                  }}
                >
                  <SelectTrigger className="border-2 focus:border-primary h-12 text-base">
                    <SelectValue placeholder="Select location type or specify custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="Local cemetery">Local cemetery</SelectItem>
                    <SelectItem value="Church graveyard">Church graveyard</SelectItem>
                    <SelectItem value="Woodland burial site">Woodland burial site</SelectItem>
                    <SelectItem value="Crematorium">Crematorium</SelectItem>
                    <SelectItem value="Memorial garden">Memorial garden</SelectItem>
                    <SelectItem value="Garden of remembrance">Garden of remembrance</SelectItem>
                    <SelectItem value="At sea">At sea</SelectItem>
                    <SelectItem value="Family plot">Family plot</SelectItem>
                    <SelectItem value="Private memorial">Private memorial</SelectItem>
                    <SelectItem value="custom">Custom location...</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Show custom input if custom is selected or if there's a custom value that doesn't match presets */}
                {(memorialData.burialLocation && 
                  !["Local cemetery", "Church graveyard", "Woodland burial site", "Crematorium", 
                    "Memorial garden", "Garden of remembrance", "At sea", "Family plot", "Private memorial"].includes(memorialData.burialLocation)) && (
                  <div className="mt-2">
                    <Input
                      id="burialLocationCustom"
                      placeholder="e.g., Highgate Cemetery, London — Plot 24B"
                      value={memorialData.burialLocation || ""}
                      onChange={(e) => handleInputChange("burialLocation", e.target.value)}
                      className="border-2 focus:border-[#4A90A4] h-12 text-base"
                    />
                  </div>
                )}
                
                <p className="text-xs text-slate-600">Choose a general type or add specific details. Only share what the family is comfortable making public.</p>
              </div>

              <div className="flex justify-between pt-6">
                <Button onClick={handlePrevious} variant="outline" size="lg" className="border-2 border-[#1B3B5F] !text-[#1B3B5F] hover:!bg-[#1B3B5F] hover:!text-white rounded-full">
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={false}
                  className="!bg-[#1B3B5F] hover:!bg-[#16304d] !text-white px-8 rounded-full"
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
          <Card className="border border-slate-100 shadow-lg bg-white rounded-3xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl text-[#1B3B5F]">Add Photos & Review</CardTitle>
              <CardDescription className="text-lg text-slate-600">
                Upload photos and review your memorial page before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Profile Photo</Label>
                  <div className="flex items-start gap-2 -mt-1 mb-1 text-xs text-slate-600" aria-live="polite">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                    <span>Square works best; choose a clear, well‑lit photo.</span>
                  </div>
                <div
                  className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-[#4A90A4] transition-colors cursor-pointer overflow-hidden"
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
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload profile photo</p>
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
                  <div className="flex items-start gap-2 -mt-1 mb-1 text-xs text-slate-600" aria-live="polite">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-[#4A90A4]" aria-hidden="true" />
                    <span>Landscape image recommended; around 1600×600 looks great.</span>
                  </div>
                <div
                  className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-[#4A90A4] transition-colors cursor-pointer overflow-hidden"
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
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload cover photo</p>
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
              <div className="bg-[#E8F0F5] rounded-lg p-6 space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#1B3B5F]">Memorial Preview</h3>
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
                    <strong>Burial/Ashes:</strong> {memorialData.burialLocation?.trim() || "Not specified"}
                  </p>
                  <p>
                    <strong>Theme:</strong> {memorialData.theme}
                  </p>
                  <p>
                    <strong>Biography:</strong> Will be automatically generated with a lovely template
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button onClick={handlePrevious} variant="outline" size="lg" className="border-2 border-[#1B3B5F] !text-[#1B3B5F] hover:!bg-[#1B3B5F] hover:!text-white rounded-full">
                  Previous
                </Button>
                <div className="flex space-x-4">
                  <Button variant="outline" size="lg" className="flex items-center space-x-2 bg-transparent border-2 border-slate-300 !text-slate-600 rounded-full" disabled>
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="!bg-[#1B3B5F] hover:!bg-[#16304d] !text-white px-8 rounded-full"
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
