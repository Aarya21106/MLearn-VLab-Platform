"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClassroomAction } from "@/app/admin/classrooms/actions";

export function CreateClassroomForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.set("name", trimmed);
      const id = await createClassroomAction(formData);
      setName("");
      router.push(`/admin/classrooms/${id}`);
      router.refresh();
    } catch (err) {
      console.error("Failed to create classroom:", err);
      toast.error("Couldn't create the classroom - try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Section A - 2026 batch"
        className="max-w-xs"
        required
      />
      <Button type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create classroom"}
      </Button>
    </form>
  );
}
