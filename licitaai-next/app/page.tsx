import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingProblema } from "@/components/landing/landing-problema"
import { LandingBeneficios } from "@/components/landing/landing-beneficios"
import { LandingNumeros } from "@/components/landing/landing-numeros"
import { LandingComoFunciona } from "@/components/landing/landing-como-funciona"
import { LandingDepoimentos } from "@/components/landing/landing-depoimentos"
import { LandingPlanos } from "@/components/landing/landing-planos"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFaq } from "@/components/landing/landing-faq"
import { LandingFooter } from "@/components/landing/landing-footer"

async function getLicitacoesStats() {
  try {
    const supabase = createServiceClient()

    const [{ count: totalLicitacoes }, { data: ufsData }] = await Promise.all([
      supabase.from("licitacoes").select("*", { count: "exact", head: true }),
      supabase.from("licitacoes").select("uf"),
    ])

    const totalUfs = ufsData
      ? new Set(ufsData.map((r: { uf: string }) => r.uf).filter(Boolean)).size
      : 0

    return {
      totalLicitacoes: totalLicitacoes ?? 0,
      totalUfs,
    }
  } catch {
    return { totalLicitacoes: 0, totalUfs: 0 }
  }
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  const { totalLicitacoes, totalUfs } = await getLicitacoesStats()

  return (
    <main className="bg-[#050D1A]">
      <LandingNavbar isLoggedIn={false} />
      <LandingHero />
      <LandingProblema />
      <LandingBeneficios />
      <LandingNumeros totalLicitacoes={totalLicitacoes} totalUfs={totalUfs} />
      <LandingComoFunciona />
      <LandingDepoimentos />
      <LandingPlanos />
      <LandingCTA />
      <LandingFaq />
      <LandingFooter />
    </main>
  )
}
