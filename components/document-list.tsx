"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink, Download } from "lucide-react"

export type DocumentItem = {
  id: string
  url: string
  title: string
  description?: string
  uploadedBy?: string
  date?: Date
}

export default function DocumentList({ documents, title = "Funeral booklets & obituaries" }: { documents: DocumentItem[]; title?: string }) {
  if (!documents || documents.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <h2 className="font-serif text-2xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">Add a funeral service booklet or obituary as a PDF so family and friends can view or download it.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <Badge variant="secondary" className="text-xs">{documents.length} {documents.length === 1 ? "document" : "documents"}</Badge>
        </div>
        <ul className="divide-y">
          {documents.map((doc) => (
            <li key={doc.id} className="py-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center" aria-hidden>
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{doc.title || "Funeral booklet"}</p>
                {(doc.description || doc.uploadedBy || doc.date) && (
                  <p className="text-sm text-muted-foreground truncate">
                    {doc.description || "PDF"}
                    {doc.uploadedBy ? ` · uploaded by ${doc.uploadedBy}` : ""}
                    {doc.date ? ` · ${format(doc.date, "MMM d, yyyy")}` : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="bg-transparent">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label="Open PDF in a new tab">
                    <ExternalLink className="w-4 h-4 mr-2" /> View
                  </a>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href={doc.url} download aria-label="Download PDF">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}


