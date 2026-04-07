"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md mx-auto border-destructive/20 shadow-2xl animate-slide-up-fade">
        <CardHeader className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
            Ops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Uma exceção inesperada ocorreu. Vamos resolver isso rapidinho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center font-mono bg-muted/50 p-3 rounded-lg">
            {error.message || "Erro desconhecido"}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={reset} 
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Tentar novamente
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto flex-1" size="lg">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Ir ao Dashboard
              </Link>
            </Button>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-sm h-auto py-6 px-4 hover:bg-accent/50 transition-all">
            <Link href="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

