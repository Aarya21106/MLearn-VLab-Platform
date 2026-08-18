"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { regeneratePasswordAction } from "@/app/admin/classrooms/actions";

export function ResetPasswordButton({ studentId, registerNumber }: { studentId: string; registerNumber: string }) {
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    try {
      const password = await regeneratePasswordAction(studentId);
      setNewPassword(password);
    } catch (err) {
      console.error("Failed to reset password:", err);
      toast.error("Couldn't reset the password - try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" disabled={resetting} onClick={handleReset}>
        {resetting ? "Resetting..." : "Reset password"}
      </Button>
      <Dialog open={newPassword !== null} onOpenChange={(open) => !open && setNewPassword(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New password for {registerNumber}</DialogTitle>
            <DialogDescription>
              Shown once - write it down now. The old password no longer works.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-center font-mono text-lg tracking-wider">
            {newPassword}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
