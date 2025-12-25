import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AgentsList } from "./components/agents-list";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  // Let client-side fetch handle the API call for better debugging
  return <AgentsList />;
}
