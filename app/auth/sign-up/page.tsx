'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signup } from '@/app/auth/actions'
import Link from 'next/link'
import { Zap, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('team_member')
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('role', role)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="pointer-events-none fixed inset-0 bg-dot-grid opacity-30" />
        <Card className="relative z-10 w-full max-w-md border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="items-center pb-4 text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Compte cree !</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Votre compte a ete cree avec succes. Vous pouvez maintenant vous connecter.
            </p>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button className="glow-primary" onClick={() => router.push('/auth/login')}>
              Se connecter
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-dot-grid opacity-30" />
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[120px]" />

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
            <h1 className="text-xl font-bold text-foreground">Inscription</h1>
            <p className="mt-1 text-sm text-muted-foreground">Creez votre compte pour rejoindre le jeu</p>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName" className="text-sm text-foreground/80">Nom complet</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Jean Dupont"
                  required
                  className="border-border/60 bg-background/50"
                />
              </div>
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
                  placeholder="Minimum 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="border-border/60 bg-background/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-foreground/80">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="border-border/60 bg-background/50">
                    <SelectValue placeholder="Choisir un role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team_member">Membre d{"'"}equipe</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === 'admin' && (
                <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Label htmlFor="adminCode" className="text-sm font-medium text-primary">
                    Code de creation administrateur
                  </Label>
                  <Input
                    id="adminCode"
                    name="adminCode"
                    type="password"
                    placeholder="Entrez le code fourni"
                    required
                    className="border-primary/30 bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce code est requis pour creer un compte administrateur.
                  </p>
                </div>
              )}
              <Button type="submit" className="mt-2 w-full glow-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creation en cours...
                  </>
                ) : (
                  'Creer mon compte'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border/40 pt-4">
            <p className="text-sm text-muted-foreground">
              Deja un compte ?{' '}
              <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
