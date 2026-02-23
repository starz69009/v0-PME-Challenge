import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Erreur d{"'"}authentification</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Une erreur est survenue lors de l{"'"}authentification. Veuillez reessayer.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/auth/login">
            <Button>Retour a la connexion</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
