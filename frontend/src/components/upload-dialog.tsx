"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Upload, X, File } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { clearAuth, getToken } from "@/lib/auth"
import { useStorage } from "@/contexts/storage-context"

interface UploadDialogProps {
  folderId?: number | null;
}

export function UploadDialog({ folderId }: UploadDialogProps = {}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [file, setFile] = React.useState<File | null>(null)
  const { toast } = useToast()
  const { refreshStorageQuota } = useStorage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB.",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setProgress(0)

    try {
      // Get JWT token from localStorage
      const token = getToken()
      if (!token) {
        throw new Error("Not authenticated. Please login again.")
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("file", file)
      if (folderId !== null && folderId !== undefined) {
        formData.append("folderId", folderId.toString())
      }

      // Upload file to backend
      const response = await fetch("http://localhost:8081/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - clear auth and redirect
          clearAuth()
          router.push("/login")
          return
        }

        let errorMessage = `Upload failed with status ${response.status}`
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      setProgress(100)
      setIsUploading(false)
      setFile(null)
      setIsOpen(false)

      toast({
        title: "Upload complete",
        description: `${file.name} has been uploaded successfully.`,
      })

      // Refresh storage quota after successful upload
      await refreshStorageQuota()

      // Trigger a page reload or event to refresh file list
      window.dispatchEvent(new Event("fileUploaded"))
    } catch (error: any) {
      setIsUploading(false)
      setProgress(0)
      
      // Check if it's a quota exceeded error
      if (error.message && error.message.includes("quota")) {
        toast({
          variant: "destructive",
          title: "Storage quota exceeded",
          description: "You don't have enough storage space. Please delete some files or upgrade your storage.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error.message || "Failed to upload file. Please try again.",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 shadow-sm">
          <Upload className="h-4 w-4" />
          <span>New Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {!file ? (
            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:bg-muted/50">
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF, Images, Documents, Archives, Text files (Max 50MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,image/*,.zip,.rar,.7z,.gz,.json,.xml"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : "Start Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
