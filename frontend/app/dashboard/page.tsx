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
import { LavaBackground } from "@/components/lava-background";
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

  // Load current folder details and build breadcrumb trail
  useEffect(() => {
    const loadFolderAndBreadcrumbs = async () => {
      if (currentFolderId === null) {
        setCurrentFolder(null);
        setBreadcrumbs([]);
        return;
      }

      try {
        const response = await foldersApi.getFolder(currentFolderId);
        setCurrentFolder(response.data);

        // Build breadcrumb trail by traversing parent folders
        const trail: FolderBreadcrumb[] = [];
        let currentId: number | null = currentFolderId;
        let folder = response.data;

        // Add current folder to trail
        trail.unshift({ id: folder.id, name: folder.name });

        // Traverse up the parent chain
        while (folder.parentFolderId !== null) {
          try {
            const parentResponse = await foldersApi.getFolder(
              folder.parentFolderId
            );
            folder = parentResponse.data;
            trail.unshift({ id: folder.id, name: folder.name });
          } catch (error) {
            console.error("Failed to load parent folder:", error);
            break;
          }
        }

        setBreadcrumbs(trail);
      } catch (error) {
        console.error("Failed to load folder:", error);
        setCurrentFolderId(null);
      }
    };

    loadFolderAndBreadcrumbs();
  }, [currentFolderId, refreshKey]);

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId);
  };

  const handleNavigate = (folderId: number | null) => {
    setCurrentFolderId(folderId);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
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
        {/* Modern Blue Welcome Card - ALIVE VERSION WITH LAVA LAMP */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-8 shadow-2xl transition-all duration-500 hover:shadow-blue-500/50 hover:shadow-[0_0_40px] hover:scale-[1.01] group">
          {/* LAVA LAMP BACKGROUND - More visible */}
          <LavaBackground />
          
          {/* Animated background pattern - less opaque to show lava */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
          
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Reduced static orb opacity to let lava show through */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          
          {/* Floating particles */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}></div>
          <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-cyan-300/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg animate-fade-in">
                Welcome back{username ? `, ${username}` : ""}! <span className="inline-block animate-wave">👋</span>
              </h1>
              <p className="text-blue-50 text-lg font-medium drop-shadow animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Manage your secure files and documents with ease
              </p>
              <div className="flex items-center gap-4 mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2 text-blue-50 group/status hover:scale-105 transition-transform cursor-default">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>

            {/* Icon with enhanced animations */}
            <div className="hidden md:block animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="relative">
                {/* Rotating ring behind icon */}
                <div className="absolute inset-0 w-24 h-24 border-2 border-white/20 rounded-2xl animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="absolute inset-0 w-24 h-24 border-2 border-cyan-300/30 rounded-2xl animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                
                <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30 transform transition-all duration-300 hover:scale-110 hover:rotate-6 hover:bg-white/30 group-hover:animate-bounce">
                  <svg
                    className="w-12 h-12 text-white transform transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
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
