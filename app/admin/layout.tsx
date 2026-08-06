import { DeviceGate } from "@/components/device-gate";
import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceGate>
      <div className="flex min-h-screen flex-col">
        <AdminNav />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </DeviceGate>
  );
}
