"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RosterUploadForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChosen(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch(`/admin/classrooms/${classroomId}/roster-upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Upload failed." }));
        const detail: string | undefined = body.errors?.[0]
          ? `Row ${body.errors[0].row}: ${body.errors[0].message}`
          : body.message;
        toast.error(detail ?? "Upload failed - check the file format and try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mlearn-credentials.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Roster updated - credentials sheet downloaded.");
      router.refresh();
    } catch (err) {
      console.error("Roster upload failed:", err);
      toast.error("Upload failed - check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploading ? "Uploading..." : "Upload filled roster"}
      </Button>
    </div>
  );
}
