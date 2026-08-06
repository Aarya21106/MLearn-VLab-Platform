import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AdminSignInToggle } from "@/components/admin-sign-in-toggle";
import { DeviceGate } from "@/components/device-gate";

export default function LandingPage() {
  const dummyAdminAuthEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DUMMY_ADMIN_AUTH === "true";

  return (
    <DeviceGate>
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              MLEARN
            </h1>
            <p className="text-sm text-muted-foreground">
              Machine Learning Virtual Lab.
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <GoogleSignInButton />
            {dummyAdminAuthEnabled && <AdminSignInToggle />}
          </div>
        </div>
      </main>
    </DeviceGate>
  );
}
