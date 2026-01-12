"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileCode,
  ImageIcon,
  FileIcon,
  MoreVertical,
  Trash,
  ExternalLink,
  X,
  Star,
  StarOff,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { clearAuth, getToken } from "@/lib/auth";
import { documentsApi } from "@/lib/api";

// File interface matching API contract
interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  lastAccessedAt: string;
  url?: string;
  isStarred: boolean;
}

export function StarredFileList() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch starred files from API
  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const data = await documentsApi.getStarredFiles();
      
      setFiles(data.data);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push("/login");
      } else {
        setError(error.response?.data?.message || "Unable to connect to server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files on mount and listen for changes
  React.useEffect(() => {
    fetchFiles();

    // Listen for file upload and star events
    const handleFileUploaded = () => {
      fetchFiles();
    };

    const handleStarChanged = () => {
      fetchFiles();
    };

    window.addEventListener("fileUploaded", handleFileUploaded);
    window.addEventListener("starChanged", handleStarChanged);
    
    return () => {
      window.removeEventListener("fileUploaded", handleFileUploaded);
      window.removeEventListener("starChanged", handleStarChanged);
    };
  }, []);

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

  const handleUnstar = async (id: string, fileName: string) => {
    try {
      await documentsApi.toggleStar(id);
      
      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== id));
      
      // Dispatch event for other components
      window.dispatchEvent(new Event("starChanged"));
      
      toast({
        title: "Removed from starred",
        description: `${fileName} has been unstarred.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Unstar failed",
        description: error.response?.data?.message || "Failed to unstar file. Please try again.",
      });
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    try {
      await documentsApi.deleteFile(id);

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== id));
      
      // Dispatch events
      window.dispatchEvent(new Event("starChanged"));
      window.dispatchEvent(new Event("fileUploaded"));
      window.dispatchEvent(new Event("trashChanged"));
      
      toast({
        title: "Moved to trash",
        description: `${fileName} has been moved to trash.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to move file to trash. Please try again.",
      });
    }
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

    if (
      file.contentType.includes("pdf") ||
      file.contentType.includes("image")
    ) {
      window.open(`http://localhost:8081/api/documents/preview/${file.id}?token=${token}`, "_blank");
    } else {
      window.open(`http://localhost:8081/api/documents/download/${file.id}?token=${token}`, "_blank");
    }
  };

  const handleDirectDownload = (file: FileItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please login to access files.",
      });
      return;
    }

    // Create a temporary anchor element to trigger download
    const downloadUrl = `http://localhost:8081/api/documents/download/${file.id}?token=${token}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${file.fileName}...`,
    });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading starred files...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-lg font-medium mb-1 text-destructive">Failed to load files</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={fetchFiles} 
            variant="outline" 
            size="sm"
          >
            Try Again
          </Button>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 border-2 border-yellow-500/20 mb-4">
            <Star className="h-10 w-10 text-yellow-500" />
          </div>
          <p className="text-lg font-medium mb-1">No starred files</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Star your important files for quick access. Click the star icon on any file to add it here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Size</th>
                <th className="hidden px-4 py-3 lg:table-cell">Uploaded</th>
                <th className="hidden px-4 py-3 xl:table-cell">Last Accessed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background group-hover:border-primary/50 transition-colors">
                        {getIcon(file.contentType)}
                      </div>
                      <button
                        onClick={() => handleFileClick(file)}
                        className="font-medium truncate max-w-[200px] text-left hover:text-primary hover:underline transition-all cursor-pointer"
                      >
                        {file.fileName}
                      </button>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatSize(file.fileSize)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {format(new Date(file.lastAccessedAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600"
                        onClick={() => handleUnstar(file.id, file.fileName)}
                        title="Remove from starred"
                      >
                        <Star className="h-4 w-4 fill-yellow-500" />
                      </Button>
                      <ShareDialog fileId={file.id} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Move to trash?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>{file.fileName}</strong> will be moved to trash.
                              You can restore it later or delete it permanently from the trash.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(file.id, file.fileName)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Move to Trash
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleFileClick(file)}
                          >
                            <ExternalLink className="h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleDirectDownload(file)}
                          >
                            <Download className="h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleUnstar(file.id, file.fileName)}
                          >
                            <StarOff className="h-4 w-4" /> Unstar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Move to trash?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{file.fileName}</strong> will be moved to trash.
                                  You can restore it later or delete it permanently from the trash.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(file.id, file.fileName)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Move to Trash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
