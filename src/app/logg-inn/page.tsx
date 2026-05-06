"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthForm } from "@/components/AuthForm";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [router, next]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="text-center mb-8">
        <Image src="/favicon.png" alt="Sportsbytte" width={52} height={52} className="rounded-xl mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-ink">
          {mode === "signup" ? "Opprett konto" : "Logg inn"}
        </h1>
        <p className="mt-2 text-sm text-ink-light">
          {mode === "signup"
            ? "Bli med på Norges markedsplass for brukt sportsutstyr"
            : "Velkommen tilbake til Sportsbytte"}
        </p>
      </div>
      <AuthForm
        initialMode={mode}
        onSuccess={() => router.replace(next)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
