import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    // PKCE flow: Supabase sent ?code= — exchange server-side and set session cookie
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/tilbakestill-passord?recovery=1`);
    }
  }

  // Implicit flow: Supabase sent #access_token= in the hash fragment.
  // Hash fragments are never sent to the server, so we return a tiny HTML page
  // that reads window.location.hash and forwards it to the reset page client-side.
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
      var h = window.location.hash;
      window.location.replace('/tilbakestill-passord' + (h || ''));
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
