import { BookText, Image as ImageIcon, Users, Calendar, QrCode, Heart, Lock } from "lucide-react"

export type FeatureStep = {
  number: number
  title: string
  description: string
  image: string
}

export type Feature = {
  slug: string
  title: string
  tagline: string
  heroImage: string
  icon: typeof BookText
  steps: FeatureStep[]
  highlights: string[]
}

export const features: Feature[] = [
  {
    slug: "guided-storytelling",
    title: "Guided storytelling",
    tagline: "Shape a calm biography with prompts, milestones, and gentle wording support when it is hard to start.",
    heroImage: "/elderly-woman-reading.png",
    icon: BookText,
    steps: [
      {
        number: 1,
        title: "Start with gentle prompts",
        description: "Our guided biography builder helps you begin with thoughtful questions and prompts. Never face a blank page—we'll guide you through each section with care.",
        image: "/memorial-cover.png"
      },
      {
        number: 2,
        title: "Build a timeline of moments",
        description: "Add key dates, milestones, and memories to create a rich timeline. Each moment can include photos, stories, and audio recordings.",
        image: "/elderly-woman-smiling.png"
      },
      {
        number: 3,
        title: "Refine and preserve",
        description: "Review, edit, and organise your loved one's story. Everything is saved securely and can be shared with family or kept private.",
        image: "/rose-garden.png"
      }
    ],
    highlights: [
      "Timeline cards for key moments and dates",
      "Audio notes and captions for every memory",
      "Helpful suggestions so you never face a blank box"
    ]
  },
  {
    slug: "media-galleries",
    title: "Media galleries",
    tagline: "Photos, video, and audio display clearly on any screen so every face and place is easy to see.",
    heroImage: "/elderly-woman-smiling.png",
    icon: ImageIcon,
    steps: [
      {
        number: 1,
        title: "Upload your memories",
        description: "Add photos, videos, and audio recordings with ease. Our platform handles all file types and automatically optimises them for viewing.",
        image: "/family-gathering-dinner.png"
      },
      {
        number: 2,
        title: "Organise beautifully",
        description: "Media automatically arranges in elegant galleries. Portrait and landscape photos display perfectly on any device—mobile, tablet, or desktop.",
        image: "/memorial-field.png"
      },
      {
        number: 3,
        title: "Share and protect",
        description: "Control who can view and download your media. Original files stay protected while family and friends can enjoy beautiful, optimised versions.",
        image: "/elderly-woman-volunteering-library.png"
      }
    ],
    highlights: [
      "Balanced layouts that honour portrait and landscape shots",
      "Alt-text nudges to keep the page accessible",
      "Downloads and originals stay protected"
    ]
  },
  {
    slug: "collaboration",
    title: "Invite-only collaboration",
    tagline: "Share with the people who matter most. Everyone can add memories without the worry of a public feed.",
    heroImage: "/family-gathering-dinner.png",
    icon: Users,
    steps: [
      {
        number: 1,
        title: "Invite your circle",
        description: "Send private invitations via email or share a secure link. Only people you invite can access and contribute to the memorial.",
        image: "/elderly-woman-reading.png"
      },
      {
        number: 2,
        title: "Set roles and permissions",
        description: "Choose who can edit, who can view, and who can add content. Flexible roles ensure everyone feels comfortable contributing.",
        image: "/elderly-woman-gardening.png"
      },
      {
        number: 3,
        title: "Collaborate with ease",
        description: "Family and friends can add photos, stories, and tributes. All contributions are organised in one calm place—no clutter or ads.",
        image: "/rose-garden.png"
      }
    ],
    highlights: [
      "Private invites with simple accept links",
      "Roles for owners, editors, and gentle viewers",
      "Notes and updates that keep the family aligned"
    ]
  }
]

export const relatedFeatures = [
  {
    title: "Timeline builder",
    description: "Create an interactive timeline of your loved one's life story.",
    icon: Calendar,
    image: "/memorial-cover.png",
    slug: "timeline-builder"
  },
  {
    title: "QR codes & sharing",
    description: "Share memorials easily with QR codes for services and gatherings.",
    icon: QrCode,
    image: "/qr-scan.png",
    slug: "qr-codes-sharing"
  },
  {
    title: "Tributes & messages",
    description: "Collect heartfelt messages and memories from family and friends.",
    icon: Heart,
    image: "/flowers.png",
    slug: "tributes-messages"
  },
  {
    title: "Privacy controls",
    description: "Keep memorials private or share them publicly—you're in control.",
    icon: Lock,
    image: "/memorial-field.png",
    slug: "privacy-controls"
  }
]

export function getFeatureBySlug(slug: string): Feature | undefined {
  return features.find(f => f.slug === slug)
}





