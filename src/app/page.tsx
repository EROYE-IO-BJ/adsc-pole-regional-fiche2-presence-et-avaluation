import Link from "next/link";

const demoAccounts = [
  {
    role: "Super Administrateur",
    description: "Vision globale sur tous les services et départements",
    accounts: [
      { name: "Super Admin", email: "superadmin@semecity.bj" },
    ],
  },
  {
    role: "Administrateur",
    description: "Accès complet aux fonctionnalités de son service",
    accounts: [
      { name: "Admin Formation", email: "admin.formation@semecity.bj" },
      { name: "Admin Incubation", email: "admin.incubation@semecity.bj" },
      { name: "Admin Makerspace", email: "admin.makerspace@semecity.bj" },
      { name: "Admin Innovation", email: "admin.innovation@semecity.bj" },
      { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
      { name: "Admin Career Center", email: "admin.career@semecity.bj" },
      { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
    ],
  },
  {
    role: "Responsable de service",
    description: "Gestion des activités de son service",
    accounts: [
      { name: "Resp. Formation", email: "resp.formation@semecity.bj" },
      { name: "Resp. Incubation", email: "resp.incubation@semecity.bj" },
      { name: "Resp. Makerspace", email: "resp.makerspace@semecity.bj" },
      { name: "Resp. Innovation", email: "resp.innovation@semecity.bj" },
      { name: "Resp. IMA Lingua", email: "resp.lingua@semecity.bj" },
      { name: "Resp. Career Center", email: "resp.career@semecity.bj" },
      { name: "Resp. Recrutement", email: "resp.recrutement@semecity.bj" },
    ],
  },
  {
    role: "Intervenant",
    description: "Consultation des activités assignées",
    accounts: [
      { name: "Dr. Serge AKAKPO", email: "serge.a@semecity.bj" },
      { name: "Mme. Amara LAWANI", email: "amara.l@semecity.bj" },
      { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj" },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Sèmè City</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Plateforme de collecte de présences et feedbacks pour les activités
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-md bg-white/20 backdrop-blur px-6 py-3 text-sm font-medium text-white border border-white/30 hover:bg-white/30 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white text-center">
            Comptes de démonstration
          </h2>
          <p className="text-sm text-white/70 text-center">
            Mot de passe pour tous les comptes :{" "}
            <span className="font-bold text-white">password123</span>
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {demoAccounts.map((group) => (
              <div
                key={group.role}
                className="rounded-lg bg-white/10 border border-white/10 p-4 space-y-3 overflow-hidden"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {group.role}
                  </h3>
                  <p className="text-xs text-white/50">{group.description}</p>
                </div>
                <ul className="space-y-2">
                  {group.accounts.map((account) => (
                    <li key={account.email}>
                      <span className="text-white/70 block text-xs">
                        {account.name}
                      </span>
                      <Link
                        href="/connexion"
                        className="inline-block text-xs font-mono text-white/90 hover:text-white underline underline-offset-2 break-all"
                      >
                        {account.email}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
