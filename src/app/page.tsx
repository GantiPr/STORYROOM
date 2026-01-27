"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page
    router.push("/projects");
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <div className="text-zinc-400">Loading...</div>
    </main>
  );
}