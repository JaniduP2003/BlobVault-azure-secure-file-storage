"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FileList } from "@/components/file-list";
import { FolderList } from "@/components/folder-list";
import { FolderBreadcrumbs } from "@/components/folder-breadcrumbs";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { UploadDialog } from "@/components/upload-dialog";
import { isAuthenticated, getUserInfo, clearAuth } from "@/lib/auth";
import { foldersApi } from "@/lib/api";
import type { FolderDetail } from "@/types";

interface FolderBreadcrumb {
  id: number | null;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderDetail | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        // Token invalid or expired, redirect to login
        clearAuth();
        router.push("/login");
        return;
      }

      // Token is valid, load user info
      const userInfo = getUserInfo();
      setUsername(userInfo.username);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Load current folder details
  useEffect(() => {
    const loadFolder = async () => {
      if (currentFolderId === null) {
        setCurrentFolder(null);
        setBreadcrumbs([]);
        return;
      }

      try {
        const response = await foldersApi.getFolder(currentFolderId);
        setCurrentFolder(response.data);
        
        // Build breadcrumbs (simplified - in production, you'd fetch the full path)
        setBreadcrumbs([{ id: currentFolderId, name: response.data.name }]);
      } catch (error) {
        console.error("Failed to load folder:", error);
        setCurrentFolderId(null);
      }
    };

    loadFolder();
  }, [currentFolderId, refreshKey]);

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId);
  };

  const handleNavigate = (folderId: number | null) => {
    setCurrentFolderId(folderId);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back{username ? `, ${username}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your secure files and documents
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <FolderBreadcrumbs
              currentPath={breadcrumbs}
              onNavigate={handleNavigate}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">
              {currentFolder ? currentFolder.name : "Your Files"}
            </h2>
            <div className="flex gap-2">
              <CreateFolderDialog
                parentFolderId={currentFolderId}
                onFolderCreated={handleRefresh}
              />
              <UploadDialog folderId={currentFolderId} />
            </div>
          </div>

          {/* Folders */}
          <FolderList
            key={`folders-${currentFolderId}-${refreshKey}`}
            parentId={currentFolderId}
            onFolderClick={handleFolderClick}
            onRefresh={handleRefresh}
          />

          {/* Files */}
          <FileList 
            key={`files-${currentFolderId}-${refreshKey}`}
            folderId={currentFolderId} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
