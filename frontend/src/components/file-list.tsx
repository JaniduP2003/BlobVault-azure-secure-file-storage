"use client";

import * as React from "react";
import {
  FileText,
  FileCode,
  ImageIcon,
  FileIcon,
  MoreVertical,
  Trash,
  ExternalLink,
  X,
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

// Mock data based on API contract
interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  lastAccessedAt: string;
  url?: string;
}

const MOCK_FILES: FileItem[] = [
  {
    id: "1",
    fileName: "Q4_Report.pdf",
    fileSize: 2400000,
    contentType: "application/pdf",
    uploadedAt: "2024-01-02T10:00:00Z",
    lastAccessedAt: "2024-01-02T14:30:00Z",
  },
  {
    id: "2",
    fileName: "Project_Assets.zip",
    fileSize: 45000000,
    contentType: "application/zip",
    uploadedAt: "2024-01-01T15:20:00Z",
    lastAccessedAt: "2024-01-02T09:15:00Z",
  },
  {
    id: "3",
    fileName: "Team_Photos.jpg",
    fileSize: 1200000,
    contentType: "image/jpeg",
    uploadedAt: "2023-12-30T11:45:00Z",
    lastAccessedAt: "2024-01-01T18:00:00Z",
  },
  {
    id: "4",
    fileName: "Budget_2024.xlsx",
    fileSize: 450000,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedAt: "2023-12-28T09:00:00Z",
    lastAccessedAt: "2023-12-29T11:20:00Z",
  },
];

export function FileList() {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<FileItem[]>(MOCK_FILES);
  const [isLoading, setIsLoading] = React.useState(false);

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

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast({
      title: "File deleted",
      description: "The file has been permanently removed.",
    });
  };

  const handleFileClick = (file: FileItem) => {
    console.log("[v0] Handling file click for:", file.fileName);
    if (
      file.contentType.includes("pdf") ||
      file.contentType.includes("image")
    ) {
      window.open(`/api/documents/preview/${file.id}`, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = `/api/documents/download/${file.id}`;
      link.download = file.fileName;
      link.click();
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
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
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete <strong>{file.fileName}</strong> from our
                            servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(file.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
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
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete{" "}
                                <strong>{file.fileName}</strong> from our
                                servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(file.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
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
    </div>
  );
}
