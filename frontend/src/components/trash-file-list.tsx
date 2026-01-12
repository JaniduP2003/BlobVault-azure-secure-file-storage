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
  Trash2,
  RotateCcw,
  X,
  AlertTriangle,
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

// File interface matching API contract
interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  lastAccessedAt: string;
  deletedAt?: string;
  url?: string;
}

export function TrashFileList() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Get trashed file IDs from localStorage
  const getTrashedFiles = (): Map<string, { fileName: string; deletedAt: string; fileSize: number; contentType: string; uploadedAt: string; lastAccessedAt: string }> => {
    const trashed = localStorage.getItem("trashedFiles");
    return trashed ? new Map(JSON.parse(trashed)) : new Map();
  };

  // Fetch files from localStorage (trashed files)
  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trashedFiles = getTrashedFiles();
      
      if (trashedFiles.size === 0) {
        setFiles([]);
        setIsLoading(false);
        return;
      }

      // Convert Map to array of FileItems
      const fileArray: FileItem[] = Array.from(trashedFiles.entries()).map(([id, data]) => ({
        id,
        fileName: data.fileName,
        fileSize: data.fileSize,
        contentType: data.contentType,
        uploadedAt: data.uploadedAt,
        lastAccessedAt: data.lastAccessedAt,
        deletedAt: data.deletedAt,
      }));

      // Sort by deletion date (most recent first)
      fileArray.sort((a, b) => {
        const dateA = new Date(a.deletedAt || 0).getTime();
        const dateB = new Date(b.deletedAt || 0).getTime();
        return dateB - dateA;
      });

      setFiles(fileArray);
    } catch (error: any) {
      console.error("Error fetching trashed files:", error);
      setError(error.message || "Unable to load trashed files");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files on mount and listen for changes
  React.useEffect(() => {
    fetchFiles();

    // Listen for trash events
    const handleTrashChanged = () => {
      fetchFiles();
    };

    window.addEventListener("trashChanged", handleTrashChanged);
    
    return () => {
      window.removeEventListener("trashChanged", handleTrashChanged);
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

  const handleRestore = (id: string, fileName: string) => {
    const trashedFiles = getTrashedFiles();
    
    if (!trashedFiles.has(id)) {
      toast({
        variant: "destructive",
        title: "Restore failed",
        description: "File not found in trash.",
      });
      return;
    }

    // Remove from trash
    trashedFiles.delete(id);
    localStorage.setItem("trashedFiles", JSON.stringify([...trashedFiles.entries()]));
    
    // Remove from local state
    setFiles((prev) => prev.filter((f) => f.id !== id));
    
    // Dispatch events
    window.dispatchEvent(new Event("trashChanged"));
    window.dispatchEvent(new Event("fileUploaded")); // Refresh main file list
    window.dispatchEvent(new Event("starChanged")); // Refresh starred list if applicable
    
    toast({
      title: "File restored",
      description: `${fileName} has been restored to your files.`,
    });
  };

  const handlePermanentDelete = async (id: string, fileName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`http://localhost:8081/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete file permanently");
      }

      // Remove from trash
      const trashedFiles = getTrashedFiles();
      trashedFiles.delete(id);
      localStorage.setItem("trashedFiles", JSON.stringify([...trashedFiles.entries()]));

      // Remove from starred if it was starred
      const starredIds = localStorage.getItem("starredFiles");
      if (starredIds) {
        const starred = new Set(JSON.parse(starredIds));
        starred.delete(id);
        localStorage.setItem("starredFiles", JSON.stringify([...starred]));
      }

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== id));
      
      // Dispatch events
      window.dispatchEvent(new Event("trashChanged"));
      window.dispatchEvent(new Event("starChanged"));
      
      toast({
        title: "File permanently deleted",
        description: "The file has been permanently removed from the server.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete file permanently. Please try again.",
      });
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Delete all files from server
      const deletePromises = files.map((file) =>
        fetch(`http://localhost:8081/api/documents/${file.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      await Promise.all(deletePromises);

      // Clear trash and starred references
      localStorage.setItem("trashedFiles", JSON.stringify([]));
      
      const starredIds = localStorage.getItem("starredFiles");
      if (starredIds) {
        const starred = new Set(JSON.parse(starredIds));
        files.forEach((file) => starred.delete(file.id));
        localStorage.setItem("starredFiles", JSON.stringify([...starred]));
      }

      // Clear local state
      setFiles([]);
      
      // Dispatch events
      window.dispatchEvent(new Event("trashChanged"));
      window.dispatchEvent(new Event("starChanged"));
      
      toast({
        title: "Trash emptied",
        description: `${deletePromises.length} file(s) permanently deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Empty trash failed",
        description: error.message || "Failed to empty trash. Please try again.",
      });
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Empty Trash Button */}
      {files.length > 0 && (
        <div className="border-b p-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{files.length} file{files.length !== 1 ? 's' : ''} in trash</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {files.length} file{files.length !== 1 ? 's' : ''} in trash. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmptyTrash}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Empty Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading trash...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-lg font-medium mb-1 text-destructive">Failed to load trash</p>
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-muted-foreground/20 mb-4">
            <Trash2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">Trash is empty</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Deleted files will appear here. You can restore them or delete them permanently.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Size</th>
                <th className="hidden px-4 py-3 lg:table-cell">Deleted</th>
                <th className="hidden px-4 py-3 xl:table-cell">Original Upload</th>
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background opacity-50">
                        {getIcon(file.contentType)}
                      </div>
                      <span className="font-medium truncate max-w-[200px] text-muted-foreground">
                        {file.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatSize(file.fileSize)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {file.deletedAt ? format(new Date(file.deletedAt), "MMM d, yyyy") : "Unknown"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary/80"
                        onClick={() => handleRestore(file.id, file.fileName)}
                        title="Restore file"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                            title="Delete permanently"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete permanently?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{file.fileName}</strong> from 
                              our servers. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(file.id, file.fileName)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Permanently
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleRestore(file.id, file.fileName)}
                          >
                            <RotateCcw className="h-4 w-4" /> Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash className="h-4 w-4" /> Delete Permanently
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete permanently?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete{" "}
                                  <strong>{file.fileName}</strong> from our
                                  servers. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handlePermanentDelete(file.id, file.fileName)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Permanently
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
