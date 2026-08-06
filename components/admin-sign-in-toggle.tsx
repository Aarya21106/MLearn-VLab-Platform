"use client";

import { useState } from "react";
import { AdminSignInForm } from "@/components/admin-sign-in-form";

export function AdminSignInToggle() {
  const [open, setOpen] = useState(false);

  if (open) return <AdminSignInForm onCancel={() => setOpen(false)} />;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
    >
      Admin sign-in
    </button>
  );
}
