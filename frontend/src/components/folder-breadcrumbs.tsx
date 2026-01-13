"use client";

import * as React from "react";
import { Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FolderBreadcrumb {
  id: number | null;
  name: string;
}

interface FolderBreadcrumbsProps {
  currentPath: FolderBreadcrumb[];
  onNavigate: (folderId: number | null) => void;
}

export function FolderBreadcrumbs({ currentPath, onNavigate }: FolderBreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => onNavigate(null)}
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {currentPath.map((crumb, index) => (
        <React.Fragment key={crumb.id || 'root'}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${
              index === currentPath.length - 1
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => crumb.id && onNavigate(crumb.id)}
            disabled={index === currentPath.length - 1}
          >
            {crumb.name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
}
