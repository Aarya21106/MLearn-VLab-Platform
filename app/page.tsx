import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AdminSignInToggle } from "@/components/admin-sign-in-toggle";
import { DeviceGate } from "@/components/device-gate";

export default function LandingPage() {
  const dummyAdminAuthEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DUMMY_ADMIN_AUTH === "true";

  return (
    <DeviceGate>
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 overflow-hidden">
        {/* Dynamic Grid Background with Radial Fade */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-60 dark:opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />

        <div className="relative flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-border bg-card/65 backdrop-blur-xl p-10 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-muted-foreground/30">
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              MLEARN
            </h1>
            <p className="text-sm font-medium text-muted-foreground max-w-[280px] mx-auto">
              21CSC305P — Machine Learning Virtual Lab
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <GoogleSignInButton />
            {dummyAdminAuthEnabled && (
              <div className="w-full flex flex-col items-center gap-2 border-t border-border/80 pt-4">
                <AdminSignInToggle />
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs text-muted-foreground/60 font-medium">
            SRM Institute of Science and Technology
          </p>
        </div>
      </main>
    </DeviceGate>
  );
}
