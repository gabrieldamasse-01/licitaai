import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({ request })

  // Refresh Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const twoFAPending = request.cookies.get("2fa_pending")?.value === "1"
  const twoFAVerified = request.cookies.get("2fa_verified")?.value === "1"

  // Usuário está em verify-2fa mas JÁ completou o 2FA → evita loop
  if (pathname === "/auth/verify-2fa" && twoFAVerified) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Usuário autenticado, 2FA pendente e ainda não verificado → força verificação
  if (user && twoFAPending && !twoFAVerified && !pathname.startsWith("/auth/") && pathname !== "/") {
    return NextResponse.redirect(new URL("/auth/verify-2fa", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
