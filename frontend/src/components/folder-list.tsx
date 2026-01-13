"use client";

import * as React from "react";
import { 
  Folder as FolderIcon, 
  MoreVertical, 
  Edit, 
  Trash, 
  FolderOpen,
  ChevronRight
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { foldersApi } from "@/lib/api";
import type { Folder } from "@/types";
import { RenameFolderDialog } from "./rename-folder-dialog";

interface FolderListProps {
  parentId?: number | null;
  onFolderClick?: (folderId: number) => void;
  onRefresh?: () => void;
}

export function FolderList({ parentId, onFolderClick, onRefresh }: FolderListProps) {
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [folderToDelete, setFolderToDelete] = React.useState<Folder | null>(null);
  const [folderToRename, setFolderToRename] = React.useState<Folder | null>(null);
  const { toast } = useToast();

  const loadFolders = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await foldersApi.getFolders(parentId);
      setFolders(response.data);
    } catch (error: any) {
      console.error("Failed to load folders:", error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [parentId, toast]);

  React.useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleDelete = async (folder: Folder) => {
    try {
      await foldersApi.deleteFolder(folder.id);
      toast({
        title: "Success",
        description: `Folder "${folder.name}" deleted successfully`,
      });
      loadFolders();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete folder",
        variant: "destructive",
      });
    } finally {
      setFolderToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading folders...</p>
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return null; // Show nothing if no folders
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative flex items-center p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all cursor-pointer"
            onClick={() => onFolderClick && onFolderClick(folder.id)}
          >
            <div 
              className="p-2 rounded-md mr-3"
              style={{ backgroundColor: folder.color + "20" }}
            >
              <FolderIcon 
                className="h-6 w-6" 
                style={{ color: folder.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{folder.name}</h3>
              <p className="text-sm text-muted-foreground">
                {folder.fileCount || 0} files
                {folder.subFolderCount ? `, ${folder.subFolderCount} folders` : ''}
              </p>
            </div>
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onFolderClick && onFolderClick(folder.id);
                  }}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setFolderToRename(folder);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folder);
                    }}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folderToDelete?.name}"? 
              Files and subfolders will be moved to the parent folder.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => folderToDelete && handleDelete(folderToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      {folderToRename && (
        <RenameFolderDialog
          folder={folderToRename}
          open={!!folderToRename}
          onClose={() => setFolderToRename(null)}
          onRenamed={() => {
            loadFolders();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
