"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TrashFileList } from "@/components/trash-file-list";
import { isAuthenticated, getUserInfo, clearAuth } from "@/lib/auth";
import { Trash2 } from "lucide-react";

export default function TrashPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Trash
                </h1>
                <p className="text-muted-foreground mt-1">
                  Files in trash will be automatically deleted after 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <TrashFileList />
        </div>
      </div>
    </DashboardLayout>
  );
}
