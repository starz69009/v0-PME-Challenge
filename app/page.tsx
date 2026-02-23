import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Users, BarChart3, Shield, TrendingUp, Lightbulb } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Jeu serieux de gestion
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            PME Challenge
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Simulez la direction d{"'"}une PME et prenez des decisions strategiques.
            Gerez les crises, saisissez les opportunites et menez votre entreprise vers le succes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/auth/login">Se connecter</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link href="/auth/sign-up">Creer un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Travail en equipe"
            description="Formez une equipe, repartissez les roles (DG, Commercial, RH, Production, Finance) et prenez des decisions collectives."
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="12 evenements strategiques"
            description="Faites face a des crises, des opportunites et des defis qui impactent 5 domaines de votre entreprise."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Scores en temps reel"
            description="Suivez vos performances dans 5 categories : Social, Commercial, Tresorerie, Production, Reglementaire."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Processus de decision"
            description="Le responsable du secteur propose, l'equipe vote, le DG valide. Un vrai processus decisionnel."
          />
          <FeatureCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Apprentissage par la pratique"
            description="Decouvrez les enjeux reels de la gestion d'une PME a travers des scenarios concrets."
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5" />}
            title="Classement et analyse"
            description="Comparez vos resultats avec les autres equipes grace a des graphiques radar et des classements detailles."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          PME Challenge - Jeu serieux de gestion pour BTS Gestion PME/PMI
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border/60 transition-colors hover:border-primary/30">
      <CardContent className="p-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
