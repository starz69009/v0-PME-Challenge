'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.redirectTo) {
      router.push(result.redirectTo)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-dot-grid opacity-30" />
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">PME Challenge</span>
        </Link>

        <Card className="w-full border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4 text-center">
            <h1 className="text-xl font-bold text-foreground">Connexion</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrez vos identifiants pour acceder a votre espace
            </p>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm text-foreground/80">Adresse email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vous@exemple.fr"
                  required
                  autoComplete="email"
                  className="border-border/60 bg-background/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm text-foreground/80">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  required
                  autoComplete="current-password"
                  className="border-border/60 bg-background/50"
                />
              </div>
              <Button type="submit" className="mt-2 w-full glow-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border/40 pt-4">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                Creer un compte
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
