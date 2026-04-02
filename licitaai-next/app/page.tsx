import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingBeneficios } from "@/components/landing/landing-beneficios"
import { LandingComoFunciona } from "@/components/landing/landing-como-funciona"
import { LandingDepoimentos } from "@/components/landing/landing-depoimentos"
import { LandingPlanos } from "@/components/landing/landing-planos"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main>
      <LandingNavbar isLoggedIn={false} />
      <LandingHero />
      <LandingBeneficios />
      <LandingComoFunciona />
      <LandingDepoimentos />
      <LandingPlanos />
      <LandingCTA />
      <LandingFooter />
    </main>
  )
}
