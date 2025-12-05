import { format } from "date-fns"

export interface BiographyData {
  full_name: string
  birth_date?: string | null
  death_date?: string | null
  is_alive?: boolean
}

export function generateTemplateBiography(data: BiographyData): string {
  const { full_name, birth_date, death_date, is_alive } = data
  
  let template = `${full_name} was a beloved soul who touched the lives of everyone they met. `
  
  // Add dates if available
  if (birth_date && death_date && !is_alive) {
    const birthYear = format(new Date(birth_date), "yyyy")
    const deathYear = format(new Date(death_date), "yyyy")
    template += `Born in ${birthYear} and peacefully passed away in ${deathYear}, `
  } else if (birth_date) {
    const birthYear = format(new Date(birth_date), "yyyy")
    if (is_alive) {
      template += `Born in ${birthYear}, `
    } else {
      template += `Born in ${birthYear}, `
    }
  }
  
  template += `they lived a life filled with love, laughter, and cherished memories.

Their warmth and kindness created lasting impressions on family and friends alike. Whether sharing stories, offering a helping hand, or simply being present during life's important moments, ${full_name} had a special way of making others feel valued and loved.

The memories we hold dear will forever keep their spirit alive in our hearts. Their legacy of compassion and joy continues to inspire all who were fortunate enough to know them.

Though we deeply miss their presence, we celebrate the beautiful life they lived and the countless ways they enriched our world.`

  return template
}
