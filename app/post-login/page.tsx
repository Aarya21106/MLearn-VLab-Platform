import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  redirect(session.user.role === "ADMIN" ? "/admin" : "/lab");
}
