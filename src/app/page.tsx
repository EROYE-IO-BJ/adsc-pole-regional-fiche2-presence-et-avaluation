import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0]">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-white">
          Sèmè City
        </h1>
        <p className="text-lg text-white/80 max-w-md mx-auto">
          Plateforme de collecte de présences et feedbacks pour les activités
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Espace Administrateur
        </Link>
      </div>
    </div>
  );
}
