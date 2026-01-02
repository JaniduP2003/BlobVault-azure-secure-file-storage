import { DashboardLayout } from "@/components/dashboard-layout"
import { FileList } from "@/components/file-list"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">All Files</h1>
          <p className="text-sm text-muted-foreground">Manage and organize your documents securely in BLOBDRIVE.</p>
        </div>
        <FileList />
      </div>
    </DashboardLayout>
  )
}
