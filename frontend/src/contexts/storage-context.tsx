"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface StorageQuota {
  storageQuotaBytes: number;
  storageUsedBytes: number;
  storageAvailableBytes: number;
  storageUsedPercentage: number;
  storageQuotaFormatted: string;
  storageUsedFormatted: string;
  storageAvailableFormatted: string;
}

interface StorageContextType {
  storageQuota: StorageQuota | null;
  isLoading: boolean;
  refreshStorageQuota: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStorageQuota = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/storage/quota`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStorageQuota(data);
      } else {
        console.error("Failed to fetch storage quota");
      }
    } catch (error) {
      console.error("Error fetching storage quota:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshStorageQuota();
  }, [refreshStorageQuota]);

  return (
    <StorageContext.Provider
      value={{ storageQuota, isLoading, refreshStorageQuota }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
