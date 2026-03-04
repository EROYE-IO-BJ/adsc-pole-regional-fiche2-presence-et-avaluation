"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

const demoAccounts = [
  { email: "superadmin@semecity.bj", role: "Super Admin" },
  { email: "admin.lingua@semecity.bj", role: "Admin" },
  { email: "admin.career@semecity.bj", role: "Admin" },
  { email: "resp.lingua@semecity.bj", role: "Responsable" },
  { email: "resp.career@semecity.bj", role: "Responsable" },
  { email: "resp.recrutement@semecity.bj", role: "Responsable" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/tableau-de-bord";
  const registered = searchParams.get("registered") === "true";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect, ou email non vérifié");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {registered && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          Compte créé avec succès ! Vous pouvez maintenant vous connecter.
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
          >
            Adresse email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="votre@email.com"
            required
            autoComplete="email"
            className="h-12 rounded-xl border-gray-200 text-base"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
            >
              Mot de passe
            </label>
            <span className="text-sm text-[#6C5CE7] cursor-pointer hover:underline">
              Mot de passe oublié ?
            </span>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="h-12 rounded-xl border-gray-200 text-base pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#6C5CE7] focus:ring-[#6C5CE7]"
          />
          <span className="text-sm text-gray-500">Se souvenir de moi</span>
        </label>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white text-lg font-semibold shadow-lg shadow-[#6C5CE7]/30"
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <>
            Se connecter
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 uppercase">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* SSO Button */}
      <button
        type="button"
        className="w-full h-14 rounded-2xl border border-gray-200 bg-white flex items-center justify-center gap-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        <Shield className="h-5 w-5 text-[#6C5CE7]" />
        Connexion SSO (Keycloak)
      </button>

      {/* Demo accounts */}
      <div className="rounded-2xl bg-white border border-[#6C5CE7]/30 p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-[#6C5CE7]">
          Mode démo — Comptes disponibles
        </h3>
        <p className="text-sm text-gray-600">
          Mot de passe pour tous :{" "}
          <span className="font-bold text-gray-900">password123</span>
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {demoAccounts.map((account) => (
            <div key={account.email} className="flex items-baseline gap-2 min-w-0">
              <code className="text-xs font-mono text-[#6C5CE7] font-semibold truncate">
                {account.email}
              </code>
              <span className="text-xs text-gray-500 shrink-0">
                ({account.role})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="text-[#6C5CE7] font-medium hover:underline"
          >
            S&apos;inscrire
          </Link>
        </p>
        <p className="text-xs text-gray-300">
          Sécurisé par Keycloak OIDC/OAuth2 — Chiffrement TLS 1.3
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Sèmè City</h1>
          <p className="text-white/70 mt-1">
            Connectez-vous à votre espace
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
