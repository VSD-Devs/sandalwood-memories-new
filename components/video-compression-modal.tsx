"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { VideoCompressor, type CompressionOptions, type CompressionProgress } from "@/lib/video-compression"
import { toast } from "@/hooks/use-toast"
import { Play, Settings, Zap, Clock, HardDrive } from "lucide-react"

interface VideoCompressionModalProps {
  file: File
  isOpen: boolean
  onClose: () => void
  onComplete: (result: { file: File; thumbnail: string; duration: number }) => void
}

export function VideoCompressionModal({ file, isOpen, onClose, onComplete }: VideoCompressionModalProps) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState<CompressionProgress>({ progress: 0, stage: "loading" })
  const [selectedQuality, setSelectedQuality] = useState<"low" | "medium" | "high">("medium")

  const fileSizeMB = Math.round(file.size / (1024 * 1024))
  const recommendedSettings = VideoCompressor.getRecommendedSettings(file.size)

  const qualityOptions = [
    {
      value: "low" as const,
      label: "Low Quality",
      description: "Smallest file size, good for sharing",
      icon: Zap,
      estimatedSize: Math.round(fileSizeMB * 0.3),
      estimatedTime: "1-2 min",
    },
    {
      value: "medium" as const,
      label: "Medium Quality",
      description: "Balanced size and quality",
      icon: Settings,
      estimatedSize: Math.round(fileSizeMB * 0.5),
      estimatedTime: "2-3 min",
    },
    {
      value: "high" as const,
      label: "High Quality",
      description: "Best quality, larger file size",
      icon: Play,
      estimatedSize: Math.round(fileSizeMB * 0.7),
      estimatedTime: "3-5 min",
    },
  ]

  const handleCompress = async () => {
    setIsCompressing(true)

    try {
      const options: CompressionOptions = {
        quality: selectedQuality,
        maxWidth: 1920,
        maxHeight: 1080,
        format: "mp4",
      }

      const result = await VideoCompressor.compressVideo(file, options, setProgress)

      toast({
        title: "Video Compressed Successfully",
        description: `File size reduced by ${Math.round(((file.size - result.file.size) / file.size) * 100)}%`,
      })

      onComplete(result)
      onClose()
    } catch (error) {
      toast({
        title: "Compression Failed",
        description: "There was an error compressing your video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-rose-600" />
            Compress Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-rose-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-rose-900">{file.name}</span>
              <Badge variant="secondary">{fileSizeMB} MB</Badge>
            </div>
            <div className="text-sm text-rose-700">Original file size: {fileSizeMB} MB</div>
          </div>

          {!isCompressing ? (
            <>
              {/* Quality Selection */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Choose Compression Quality</h4>
                {qualityOptions.map((option) => {
                  const Icon = option.icon
                  const isRecommended = option.value === recommendedSettings.quality

                  return (
                    <div
                      key={option.value}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedQuality === option.value
                          ? "border-rose-500 bg-rose-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedQuality(option.value)}
                    >
                      {isRecommended && (
                        <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600">Recommended</Badge>
                      )}

                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-rose-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mb-2">{option.description}</div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />~{option.estimatedSize} MB
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {option.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleCompress} className="flex-1 bg-rose-600 hover:bg-rose-700">
                  Compress Video
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Compression Progress */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-medium text-gray-900 mb-1">
                    {progress.stage === "loading" && "Preparing video..."}
                    {progress.stage === "compressing" && "Compressing video..."}
                    {progress.stage === "finalizing" && "Finalizing..."}
                    {progress.stage === "complete" && "Complete!"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {progress.estimatedTime && `About ${Math.round(progress.estimatedTime)}s remaining`}
                  </div>
                </div>

                <Progress value={progress.progress} className="h-2" />

                <div className="text-center text-sm text-gray-500">{Math.round(progress.progress)}% complete</div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
