import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { DisplayNameEditor } from "@/components/display-name-editor";
import { requireAdmin } from "@/lib/auth-helpers";
import { displayNameOf } from "@/lib/display-name";

export async function AdminNav() {
  const admin = await requireAdmin();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="text-base font-semibold text-foreground">
          MLEARN <span className="font-normal text-muted-foreground">Admin</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <DisplayNameEditor currentName={displayNameOf(admin)} />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
