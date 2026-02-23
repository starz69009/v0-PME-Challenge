import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2,
  Users,
  BarChart3,
  Shield,
  TrendingUp,
  Lightbulb,
  Zap,
  ArrowRight,
  Target,
} from "lucide-react"

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Dot grid background */}
      <div className="pointer-events-none fixed inset-0 bg-dot-grid opacity-40" />

      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed right-1/4 bottom-0 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-accent/5 blur-[100px]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            PME Challenge
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/auth/login">Connexion</Link>
          </Button>
          <Button size="sm" asChild className="glow-primary">
            <Link href="/auth/sign-up">
              Commencer
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 lg:pt-24">
        <div className="flex flex-col items-center text-center">
          {/* Pill tag */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Jeu de simulation de gestion
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Pilotez votre PME.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Devenez dirigeant.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
            12 defis strategiques. 5 competences a maitriser.
            Formez votre equipe, affrontez des crises et menez votre entreprise vers le succes.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="glow-primary min-w-[220px] text-base">
              <Link href="/auth/sign-up">
                <Zap className="mr-2 h-4 w-4" />
                Rejoindre le jeu
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[220px] border-border/60 text-base">
              <Link href="/auth/login">Se connecter</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            <StatPill value="12" label="Evenements" />
            <StatPill value="5" label="Competences" />
            <StatPill value="3" label="Options par defi" />
            <StatPill value="x5" label="Roles par equipe" />
          </div>
        </div>
      </section>

      {/* Features bento grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Comment ca marche
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un processus decisionnel realiste en trois etapes
          </p>
        </div>

        {/* Bento layout */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Large card */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm md:col-span-2 lg:col-span-2">
            <CardContent className="flex flex-col justify-between p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Target className="h-3.5 w-3.5" />
                  Processus
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
                  Proposer, Voter, Valider
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Le responsable du secteur concerne propose une decision,
                  toute l{"'"}equipe vote, puis le DG valide. Un vrai processus de gouvernance d{"'"}entreprise.
                </p>
              </div>
              <div className="mt-6 flex shrink-0 gap-3 sm:mt-0 sm:flex-col">
                <StepBadge step={1} label="Proposer" />
                <StepBadge step={2} label="Voter" />
                <StepBadge step={3} label="Valider" />
              </div>
            </CardContent>
          </Card>

          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="5 roles distincts"
            description="DG, Commercial, RH, Production, Finance. Chaque membre a sa zone de responsabilite."
            accent="primary"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Scores en temps reel"
            description="Suivez 5 indicateurs : Social, Commercial, Tresorerie, Production, Reglementaire."
            accent="accent"
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Classement live"
            description="Comparez vos performances avec les autres equipes via des graphiques radar et des classements."
            accent="primary"
          />
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm md:col-span-2 lg:col-span-1">
            <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <Lightbulb className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">Concu pour le BTS GPME</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Des scenarios concrets et pedagogiques inspires des enjeux reels de gestion de PME.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <HowStep
            number="01"
            icon={<Building2 className="h-5 w-5" />}
            title="Creez votre entreprise"
            description="Formez votre equipe de 5 personnes et repartissez les roles cles de la direction."
          />
          <HowStep
            number="02"
            icon={<Zap className="h-5 w-5" />}
            title="Affrontez les defis"
            description="12 evenements strategiques mettent votre equipe a l'epreuve : crises, opportunites, reglementations."
          />
          <HowStep
            number="03"
            icon={<Shield className="h-5 w-5" />}
            title="Analysez vos resultats"
            description="Radar de competences, evolution des scores, classement final : decouvrez vos forces et faiblesses."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="gradient-border overflow-hidden rounded-2xl">
          <div className="flex flex-col items-center gap-6 bg-card/80 px-8 py-14 text-center backdrop-blur-sm">
            <h2 className="max-w-lg text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {"Pret a relever le defi ?"}
            </h2>
            <p className="max-w-md text-muted-foreground">
              Rejoignez PME Challenge et testez vos competences de gestionnaire en equipe.
            </p>
            <Button asChild size="lg" className="glow-primary text-base">
              <Link href="/auth/sign-up">
                Creer mon compte
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          PME Challenge - Jeu de simulation de gestion pour BTS GPME
        </div>
      </footer>
    </main>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-2xl font-bold text-primary">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
        {step}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode
  title: string
  description: string
  accent: "primary" | "accent"
}) {
  const colorClass = accent === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${colorClass}`}>
          {icon}
        </div>
        <h3 className="mb-2 font-bold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function HowStep({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card/40 p-6 transition-all hover:border-primary/30 hover:bg-card/80">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-3xl font-bold text-primary/30">{number}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
