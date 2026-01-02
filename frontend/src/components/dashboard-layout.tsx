"use client"

import * as React from "react"
import { Cloud, Files, Clock, Star, Trash2, Search, Settings, HelpCircle, Menu, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadDialog } from "@/components/upload-dialog"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:flex">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Cloud className="h-5 w-5" />
            </div>
            <span className="hidden tracking-tight md:inline-block">BLOBDRIVE</span>
          </div>
        </div>

        <div className="flex max-w-xl flex-1 items-center px-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              className="w-full bg-muted/50 pl-9 md:w-full lg:w-full"
            />
            <div className="absolute right-2 top-2 hidden items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400" />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`w-64 flex-col border-r bg-muted/30 transition-all duration-300 ${isSidebarOpen ? "flex" : "hidden"}`}
        >
          <div className="p-4">
            <UploadDialog />
          </div>
          <nav className="flex-1 space-y-1 px-2">
            <NavItem icon={<Files className="h-4 w-4" />} label="My Files" active />
            <NavItem icon={<Clock className="h-4 w-4" />} label="Recent" />
            <NavItem icon={<Star className="h-4 w-4" />} label="Starred" />
            <NavItem icon={<Trash2 className="h-4 w-4" />} label="Trash" />
          </nav>

          <div className="mt-auto border-t p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>Storage</span>
                </div>
                <span>4.2 GB of 50 GB</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[12%] bg-primary" />
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full text-xs bg-transparent">
                Upgrade Storage
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {icon}
      {label}
    </button>
  )
}
