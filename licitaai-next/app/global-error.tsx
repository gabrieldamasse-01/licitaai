"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <Card className="w-full max-w-md mx-auto border-destructive/20 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Erro Crítico
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ocorreu um erro no layout da aplicação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center font-mono bg-muted/50 p-3 rounded-lg">
                {error.digest || error.message || "Erro desconhecido"}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full sm:w-auto flex-1"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto flex-1" size="lg">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Página Inicial
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}

