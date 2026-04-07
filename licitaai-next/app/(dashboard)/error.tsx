"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogIn, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const isAuthError = error.message.includes("auth") || error.message.includes("session") || error.message.includes("user");

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md mx-auto border-destructive/20 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
            {isAuthError ? (
              <ShieldAlert className="w-10 h-10 text-destructive" />
            ) : (
              <AlertCircle className="w-10 h-10 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            {isAuthError ? "Acesso Negado" : "Erro no Dashboard"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isAuthError 
              ? "Você precisa estar logado para acessar esta área."
              : "Erro ao carregar dashboard. Tente novamente."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {isAuthError ? (
            <Button asChild className="w-full bg-primary hover:bg-primary/90" size="lg">
              <Link href="/auth/login">
                <LogIn className="w-4 h-4 mr-2" />
                Fazer Login
              </Link>
            </Button>
          ) : (
            <>
              <Button onClick={reset} className="w-full" size="lg">
                Tentar Novamente
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/dashboard">
                  Voltar ao Dashboard
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

