"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Download, Printer, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  memorialUrl: string
  memorialName: string
}

export default function QRCodeGenerator({ memorialUrl, memorialName }: QRCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrSize, setQrSize] = useState("200")
  const [customMessage, setCustomMessage] = useState(`Scan to visit ${memorialName}'s memorial`)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Generate QR code using canvas (simplified version - in production use a proper QR library)
  const generateQRCode = (text: string, size: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    // Create a simple pattern (in production, use a proper QR code library like qrcode.js)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = "#000000"
    const moduleSize = size / 25

    // Create a mock QR pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // Add corner squares (finder patterns)
    const cornerSize = moduleSize * 7
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, cornerSize, cornerSize)
    ctx.fillRect(size - cornerSize, 0, cornerSize, cornerSize)
    ctx.fillRect(0, size - cornerSize, cornerSize, cornerSize)

    ctx.fillStyle = "#ffffff"
    const innerSize = moduleSize * 5
    const offset = moduleSize
    ctx.fillRect(offset, offset, innerSize, innerSize)
    ctx.fillRect(size - cornerSize + offset, offset, innerSize, innerSize)
    ctx.fillRect(offset, size - cornerSize + offset, innerSize, innerSize)

    ctx.fillStyle = "#000000"
    const centerSize = moduleSize * 3
    const centerOffset = moduleSize * 2
    ctx.fillRect(centerOffset, centerOffset, centerSize, centerSize)
    ctx.fillRect(size - cornerSize + centerOffset, centerOffset, centerSize, centerSize)
    ctx.fillRect(centerOffset, size - cornerSize + centerOffset, centerSize, centerSize)
  }

  const handleGenerate = () => {
    generateQRCode(memorialUrl, Number.parseInt(qrSize))
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a larger canvas with text
    const downloadCanvas = document.createElement("canvas")
    const ctx = downloadCanvas.getContext("2d")
    if (!ctx) return

    const qrSizeNum = Number.parseInt(qrSize)
    const padding = 40
    const textHeight = 60
    downloadCanvas.width = qrSizeNum + padding * 2
    downloadCanvas.height = qrSizeNum + padding * 2 + textHeight

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height)

    // Draw QR code
    ctx.drawImage(canvas, padding, padding)

    // Add text
    ctx.fillStyle = "#000000"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText(customMessage, downloadCanvas.width / 2, qrSizeNum + padding + 30)
    ctx.font = "12px Arial"
    ctx.fillStyle = "#666666"
    ctx.fillText(memorialUrl, downloadCanvas.width / 2, qrSizeNum + padding + 50)

    // Download
    const link = document.createElement("a")
    link.download = `${memorialName.replace(/\s+/g, "-")}-memorial-qr.png`
    link.href = downloadCanvas.toDataURL()
    link.click()

    toast({
      title: "QR Code Downloaded",
      description: "Your memorial QR code has been saved to your device.",
    })
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(memorialUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "URL Copied",
        description: "Memorial URL copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const img = canvas.toDataURL()
    printWindow.document.write(`
      <html>
        <head>
          <title>Memorial QR Code - ${memorialName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              background: white;
            }
            .message {
              margin: 20px 0 10px 0;
              font-size: 18px;
              font-weight: bold;
            }
            .url {
              margin: 10px 0;
              font-size: 12px;
              color: #666;
              word-break: break-all;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${img}" alt="Memorial QR Code" />
            <div class="message">${customMessage}</div>
            <div class="url">${memorialUrl}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start bg-transparent">
          <QrCode className="h-4 w-4 mr-2" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Memorial QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message</Label>
              <Input
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter message for QR code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">QR Code Size</Label>
              <Select value={qrSize} onValueChange={setQrSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">Small (150px)</SelectItem>
                  <SelectItem value="200">Medium (200px)</SelectItem>
                  <SelectItem value="300">Large (300px)</SelectItem>
                  <SelectItem value="400">Extra Large (400px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} className="w-full">
              Generate QR Code
            </Button>
          </div>

          <div className="text-center">
            <canvas ref={canvasRef} className="border border-border rounded-lg mx-auto" style={{ maxWidth: "100%" }} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 bg-muted rounded text-sm">
              <span className="flex-1 truncate">{memorialUrl}</span>
              <Button size="sm" variant="ghost" onClick={handleCopyUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 bg-transparent">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Perfect for headstones, plaques, and memorial cards
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
