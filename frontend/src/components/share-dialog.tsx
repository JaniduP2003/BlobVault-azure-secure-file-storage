"use client"

import * as React from "react"
import { Share2, Copy, Check, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function ShareDialog({ fileId }: { fileId: string }) {
  const [expiry, setExpiry] = React.useState("15")
  const [shareLink, setShareLink] = React.useState("")
  const [isCopied, setIsCopied] = React.useState(false)
  const { toast } = useToast()

  const handleGenerate = () => {
    // Mock generating a share link
    const link = `https://blobdrive.app/share/${Math.random().toString(36).substring(7)}`
    setShareLink(link)
    toast({
      title: "Share link generated",
      description: `Link expires in ${expiry === "1440" ? "24 hours" : expiry + " minutes"}.`,
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "Link copied successfully.",
    })
  }

  return (
    <Dialog onOpenChange={(open) => !open && setShareLink("")}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>Generate a temporary link to share this file with others.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Link Expiry</label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Minutes (Default)</SelectItem>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="360">6 Hours</SelectItem>
                <SelectItem value="1440">24 Hours (Max)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Link will be automatically deactivated after expiry.</span>
            </div>
          </div>

          {shareLink ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Shareable Link</label>
              <div className="flex gap-2">
                <Input readOnly value={shareLink} className="flex-1 bg-muted/50" />
                <Button size="icon" onClick={copyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full gap-2" onClick={handleGenerate}>
              <Share2 className="h-4 w-4" />
              Generate Link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
