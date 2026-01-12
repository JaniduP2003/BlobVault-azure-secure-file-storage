"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileCode,
  ImageIcon,
  FileIcon,
  Search,
  X,
  Clock,
  Star,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearAuth, getToken } from "@/lib/auth";
import { documentsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

// File interface matching API contract
interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  lastAccessedAt: string;
  isStarred: boolean;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [allFiles, setAllFiles] = React.useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fetch all files when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchAllFiles();
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when dialog closes
      setSearchQuery("");
      setFilteredFiles([]);
      setHasSearched(false);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
        setHasSearched(true);
      } else {
        setFilteredFiles([]);
        setHasSearched(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allFiles]);

  const fetchAllFiles = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const data = await documentsApi.getFiles();
      setAllFiles(data.data);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load files for search.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    const filtered = allFiles.filter((file) => {
      // Search in file name
      const nameMatch = file.fileName.toLowerCase().includes(lowerQuery);
      
      // Search in content type
      const typeMatch = file.contentType.toLowerCase().includes(lowerQuery);
      
      // Search in file extension
      const extension = file.fileName.split('.').pop()?.toLowerCase() || '';
      const extensionMatch = extension.includes(lowerQuery);
      
      return nameMatch || typeMatch || extensionMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    filtered.sort((a, b) => {
      const aName = a.fileName.toLowerCase();
      const bName = b.fileName.toLowerCase();
      
      // Exact match
      if (aName === lowerQuery) return -1;
      if (bName === lowerQuery) return 1;
      
      // Starts with query
      if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
      if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
      
      // Most recent first
      return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
    });

    setFilteredFiles(filtered);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getIcon = (type: string) => {
    if (type.includes("pdf"))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("image"))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes("spreadsheet") || type.includes("excel"))
      return <FileCode className="h-5 w-5 text-emerald-500" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileTypeLabel = (contentType: string) => {
    if (contentType.includes("pdf")) return "PDF";
    if (contentType.includes("image")) return "Image";
    if (contentType.includes("spreadsheet") || contentType.includes("excel"))
      return "Spreadsheet";
    if (contentType.includes("word") || contentType.includes("document"))
      return "Document";
    if (contentType.includes("text")) return "Text";
    if (contentType.includes("video")) return "Video";
    if (contentType.includes("audio")) return "Audio";
    return "File";
  };

  const handleFileClick = (file: FileItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please login to access files.",
      });
      return;
    }

    // Close dialog
    onOpenChange(false);

    // Open file
    if (
      file.contentType.includes("pdf") ||
      file.contentType.includes("image")
    ) {
      window.open(
        `http://localhost:8081/api/documents/preview/${file.id}?token=${token}`,
        "_blank"
      );
    } else {
      window.open(
        `http://localhost:8081/api/documents/download/${file.id}?token=${token}`,
        "_blank"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Close dialog on Escape
    if (e.key === "Escape") {
      onOpenChange(false);
    }
    
    // Navigate with arrow keys (future enhancement)
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      // Could add keyboard navigation here
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Files
          </DialogTitle>
          <DialogDescription>
            Search through your files by name, type, or extension
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Start typing to search your files
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Search by name, type, or extension
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No files found</p>
              <p className="text-sm text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-muted-foreground px-2 mb-3">
                {filteredFiles.length} result{filteredFiles.length !== 1 ? "s" : ""} found
              </p>
              {filteredFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background group-hover:border-primary/50 transition-colors flex-shrink-0">
                    {getIcon(file.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {file.fileName}
                      </p>
                      {file.isStarred && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {getFileTypeLabel(file.contentType)}
                      </Badge>
                      <span>{formatSize(file.fileSize)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(file.lastAccessedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
