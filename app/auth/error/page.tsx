import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-dot-grid px-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-destructive/10" />
          <AlertTriangle className="relative h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Erreur d{"'"}authentification</h1>
        <p className="mt-3 text-muted-foreground">
          Une erreur est survenue lors de l{"'"}authentification. Veuillez reessayer.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button size="lg">Retour a la connexion</Button>
        </Link>
      </div>
    </div>
  )
}
