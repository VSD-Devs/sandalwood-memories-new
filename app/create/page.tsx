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
import { format, parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { checkUsageLimits } from "@/lib/usage-limits"
import UsageLimitModal from "@/components/usage-limit-modal"
import { useRouter } from "next/navigation"

interface MemorialData {
  name: string
  subtitle: string
  birthDate: Date | undefined
  passedDate: Date | undefined
  relationship: string
  profileImage: string
  isAlive: boolean
  burialLocation?: string | null
}

export default function CreateMemorialPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const profileInputRef = useRef<HTMLInputElement | null>(null)
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
    isAlive: false,
    burialLocation: null,
  })
  const [dateInputs, setDateInputs] = useState<{ birth: string; pass: string }>({
    birth: "",
    pass: "",
  })
  const [dateErrors, setDateErrors] = useState<{ birth: string; pass: string }>({
    birth: "",
    pass: "",
  })

  const handleInputChange = (field: keyof MemorialData, value: any) => {
    setMemorialData((prev) => ({ ...prev, [field]: value }))
  }

  const parseTypedDate = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return { date: undefined, error: "" }

    const formats = ["d/M/yyyy", "d/M/yy", "dd/MM/yyyy", "yyyy-MM-dd", "yyyy/MM/dd", "yyyy-MM"]
    for (const fmt of formats) {
      const parsed = parse(trimmed, fmt, new Date())
      if (isValid(parsed)) return { date: parsed, error: "" }
    }

    // Fallback: just a year
    if (/^\d{4}$/.test(trimmed)) {
      const parsed = new Date(Number(trimmed), 0, 1)
      if (isValid(parsed)) return { date: parsed, error: "" }
    }

    return {
      date: undefined,
      error: "Use DD/MM/YYYY, YYYY-MM-DD or just YYYY",
    }
  }

  const handleDateTextChange = (key: "birth" | "pass", value: string) => {
    setDateInputs((prev) => ({ ...prev, [key]: value }))
    const { date, error } = parseTypedDate(value)
    setDateErrors((prev) => ({ ...prev, [key]: error }))
    if (key === "birth") {
      handleInputChange("birthDate", date)
    } else {
      handleInputChange("passedDate", date)
    }
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
          profile_image_url: memorialData.profileImage || null,
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
                        onSelect={(date) => {
                          handleInputChange("birthDate", date)
                          setDateInputs((prev) => ({
                            ...prev,
                            birth: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                          setDateErrors((prev) => ({ ...prev, birth: "" }))
                        }}
                        fromYear={1800}
                        toYear={new Date().getFullYear() + 5}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Prefer typing?</Label>
                    <Input
                      placeholder="DD/MM/YYYY or YYYY"
                      value={dateInputs.birth}
                      onChange={(e) => handleDateTextChange("birth", e.target.value)}
                      className="h-10"
                      inputMode="numeric"
                      aria-describedby={dateErrors.birth ? "birth-date-error" : undefined}
                    />
                    {dateErrors.birth ? (
                      <p id="birth-date-error" className="text-xs text-red-600">{dateErrors.birth}</p>
                    ) : (
                      <p className="text-xs text-slate-600">You can enter day, month, year or just the year.</p>
                    )}
                  </div>
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
                          onSelect={(date) => {
                            handleInputChange("passedDate", date)
                            setDateInputs((prev) => ({
                              ...prev,
                              pass: date ? format(date, "yyyy-MM-dd") : "",
                            }))
                            setDateErrors((prev) => ({ ...prev, pass: "" }))
                          }}
                          fromYear={1800}
                          toYear={new Date().getFullYear() + 5}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Prefer typing?</Label>
                      <Input
                        placeholder="DD/MM/YYYY or YYYY"
                        value={dateInputs.pass}
                        onChange={(e) => handleDateTextChange("pass", e.target.value)}
                        className="h-10"
                        inputMode="numeric"
                        aria-describedby={dateErrors.pass ? "pass-date-error" : undefined}
                      />
                      {dateErrors.pass ? (
                        <p id="pass-date-error" className="text-xs text-red-600">{dateErrors.pass}</p>
                      ) : (
                        <p className="text-xs text-slate-600">You can enter day, month, year or just the year.</p>
                      )}
                    </div>
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
                        // Simple client-side image processing for preview
                        const canvas = document.createElement("canvas")
                        const ctx = canvas.getContext("2d")
                        const img = new Image()

                        img.onload = () => {
                          // Resize for preview (max 400px)
                          const maxSize = 400
                          let { width, height } = img

                          if (width > maxSize || height > maxSize) {
                            const ratio = Math.min(maxSize / width, maxSize / height)
                            width *= ratio
                            height *= ratio
                          }

                          canvas.width = width
                          canvas.height = height
                          ctx?.drawImage(img, 0, 0, width, height)

                          const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
                          handleInputChange("profileImage", dataUrl)
                        }

                        img.src = URL.createObjectURL(file)
                      } catch (err) {
                        console.error("Failed to process profile image", err)
                      } finally {
                        if (profileInputRef.current) profileInputRef.current.value = ""
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
