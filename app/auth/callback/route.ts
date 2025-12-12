import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function safeNextPath(next: string | null) {
  if (!next) return "/";
  // Prevent open redirects; allow only absolute paths on this origin.
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  // If there's no code, just continue.
  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const redirectUrl = new URL("/auth/login", url.origin);
    redirectUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

