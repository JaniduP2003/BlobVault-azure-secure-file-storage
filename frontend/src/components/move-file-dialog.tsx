"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { FolderIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { documentsApi, foldersApi } from "@/lib/api";
import type { Folder } from "@/types";

interface MoveFileDialogProps {
  fileId: string;
  fileName: string;
  currentFolderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileMoved: () => void;
}

export function MoveFileDialog({
  fileId,
  fileName,
  currentFolderId,
  open,
  onOpenChange,
  onFileMoved,
}: MoveFileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentFolderId);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (open) {
      loadAllFolders();
      setSelectedFolderId(currentFolderId);
    }
  }, [open, currentFolderId]);

  const loadAllFolders = async () => {
    setLoadingFolders(true);
    try {
      // Load root folders
      const response = await foldersApi.getFolders(null);
      const allFolders = [...response.data];
      
      // Load subfolders for each root folder
      for (const folder of response.data) {
        try {
          const subResponse = await foldersApi.getFolders(folder.id);
          allFolders.push(...subResponse.data);
        } catch (error) {
          console.error(`Failed to load subfolders for ${folder.name}`, error);
        }
      }
      
      setFolders(allFolders);
    } catch (error: any) {
      console.error("Failed to load folders:", error);
      toast({
        variant: "destructive",
        title: "Failed to load folders",
        description: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) {
      toast({
        title: "No change",
        description: "File is already in this location.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await documentsApi.moveFile(fileId, selectedFolderId);
      
      toast({
        title: "File moved",
        description: `${fileName} has been moved successfully.`,
      });
      
      onFileMoved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to move file:", error);
      toast({
        variant: "destructive",
        title: "Move failed",
        description: error.response?.data?.message || "Failed to move file. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
          <DialogDescription>
            Choose a destination folder for "{fileName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          {loadingFolders ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading folders...
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No folders available. Create a folder first.
            </div>
          ) : (
            <div className="space-y-1">
              {/* Root option */}
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedFolderId === null
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <FolderIcon className="h-5 w-5" style={{ color: "#6b7280" }} />
                <div className="flex-1 text-left">
                  <div className="font-medium">Root Folder</div>
                  <div className="text-xs text-muted-foreground">Top level</div>
                </div>
                {selectedFolderId === null && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
              
              {/* Folders */}
              {folders.map((folder) => {
                const isParent = folder.parentFolderId === null;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedFolderId === folder.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    } ${!isParent ? "ml-6" : ""}`}
                  >
                    <FolderIcon className="h-5 w-5" style={{ color: folder.color }} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isParent ? "Root level" : "Subfolder"}
                      </div>
                    </div>
                    {selectedFolderId === folder.id && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={isLoading || loadingFolders || selectedFolderId === currentFolderId}
          >
            {isLoading ? "Moving..." : "Move File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
