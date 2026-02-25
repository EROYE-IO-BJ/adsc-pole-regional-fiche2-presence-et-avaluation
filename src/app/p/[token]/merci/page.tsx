import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14355A] to-[#7DD3D0] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-[#D4A017]/20 p-4">
            <CheckCircle className="h-12 w-12 text-[#D4A017]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Merci !</h1>
        <p className="text-white/80">
          Votre soumission a été enregistrée avec succès. Nous vous remercions
          pour votre participation.
        </p>
        <Link
          href={`/p/${token}`}
          className="inline-flex items-center justify-center rounded-md bg-[#D4A017] px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-[#B8880F] transition-colors"
        >
          Retour
        </Link>
        <p className="text-xs text-white/50">Sèmè City</p>
      </div>
    </div>
  );
}
