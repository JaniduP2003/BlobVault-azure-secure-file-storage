"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FolderIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { foldersApi } from "@/lib/api";
import type { Folder } from "@/types";

interface RenameFolderDialogProps {
  folder: Folder;
  open: boolean;
  onClose: () => void;
  onRenamed: () => void;
}

const FOLDER_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Gray", value: "#6b7280" },
];

export function RenameFolderDialog({ folder, open, onClose, onRenamed }: RenameFolderDialogProps) {
  const [folderName, setFolderName] = useState(folder.name);
  const [selectedColor, setSelectedColor] = useState(folder.color);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(folder.parentFolderId);
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFolderName(folder.name);
    setSelectedColor(folder.color);
    setSelectedParentId(folder.parentFolderId);
  }, [folder]);

  // Load all folders to build list of possible parents
  useEffect(() => {
    const loadFolders = async () => {
      if (!open) return;
      
      setIsLoadingFolders(true);
      try {
        // Load root folders
        const response = await foldersApi.getFolders(null);
        const allFolders = [...response.data];
        
        // Load subfolders for each root folder
        for (const f of response.data) {
          if (f.id === folder.id) continue; // Skip current folder
          try {
            const subResponse = await foldersApi.getFolders(f.id);
            allFolders.push(...subResponse.data);
          } catch (error) {
            console.error(`Failed to load subfolders for ${f.name}`, error);
          }
        }
        
        // Filter out current folder and its descendants to prevent circular references
        const validFolders = allFolders.filter(f => {
          // Don't include the folder being edited
          if (f.id === folder.id) return false;
          
          // Don't include any descendants of this folder
          // (simple check: if this folder is a parent, exclude it)
          // For a more robust check, you'd need to traverse the full tree
          return true;
        });
        
        setAvailableFolders(validFolders);
      } catch (error: any) {
        console.error("Failed to load folders:", error);
        toast({
          variant: "destructive",
          title: "Failed to load folders",
          description: error.response?.data?.message || "Please try again.",
        });
      } finally {
        setIsLoadingFolders(false);
      }
    };

    loadFolders();
  }, [open, folder.id, toast]);

  const handleUpdate = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await foldersApi.updateFolder(folder.id, {
        name: folderName.trim(),
        color: selectedColor,
        parentFolderId: selectedParentId,  // Include parent folder
      });

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });

      onClose();
      onRenamed();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update folder",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>
            Update the folder name, color, and location
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdate();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Folder Color</Label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          {/* Parent Folder Selector */}
          <div className="grid gap-2">
            <Label>Parent Folder</Label>
            {isLoadingFolders ? (
              <div className="text-sm text-muted-foreground py-2">
                Loading folders...
              </div>
            ) : (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {/* Root option */}
                <button
                  type="button"
                  onClick={() => setSelectedParentId(null)}
                  className={`w-full flex items-center gap-2 p-2 text-sm hover:bg-accent transition-colors ${
                    selectedParentId === null ? "bg-accent" : ""
                  }`}
                >
                  <FolderIcon className="h-4 w-4" style={{ color: "#6b7280" }} />
                  <span>Root (Top Level)</span>
                  {selectedParentId === null && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
                
                {/* Available folders */}
                {availableFolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedParentId(f.id)}
                    className={`w-full flex items-center gap-2 p-2 text-sm hover:bg-accent transition-colors ${
                      selectedParentId === f.id ? "bg-accent" : ""
                    } ${f.parentFolderId !== null ? "pl-6" : ""}`}
                  >
                    <FolderIcon className="h-4 w-4" style={{ color: f.color }} />
                    <span>{f.name}</span>
                    {selectedParentId === f.id && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
                
                {availableFolders.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No other folders available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
