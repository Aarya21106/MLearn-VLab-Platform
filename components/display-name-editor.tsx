"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDisplayName } from "@/app/actions/profile";

export function DisplayNameEditor({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDisplayName(value);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update display name:", err);
      toast.error("Couldn't save your display name - check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1.5 text-left text-sm hover:text-foreground"
        >
          <span className="truncate">{currentName}</span>
          <Pencil className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Display name</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="display-name-input">
            Shown to you and to admins instead of your email
          </Label>
          <Input
            id="display-name-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={40}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
