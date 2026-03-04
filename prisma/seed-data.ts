import { PrismaClient, Role, ActivityType, ActivityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Data pools ───────────────────────────────────────────────────────

const firstNames = [
  "Aïcha", "Bénédicte", "Chantal", "Désiré", "Euphrasie", "Fabrice",
  "Grâce", "Honoré", "Irène", "Jean-Baptiste", "Koffi", "Lamine",
  "Mariam", "Noël", "Odette", "Parfait", "Rachidatou", "Séraphin",
  "Tatiana", "Ulrich", "Viviane", "Wilfried", "Xavier", "Yolande",
  "Zacharie", "Amina", "Boris", "Claudine", "Didier", "Estelle",
  "Félicien", "Ghislaine", "Habib", "Isabelle", "Joël", "Karim",
  "Léontine", "Mohamed", "Nadège", "Olivier", "Pélagie", "Quentin",
  "Rosalie", "Sylvain", "Thérèse", "Urbain", "Véronique", "Wenceslas",
  "Yacouba", "Zénabou", "Adama", "Bernadette", "Cosme", "Denise",
  "Emmanuel", "Francine", "Gaston", "Hortense", "Ibrahim", "Justine",
];

const lastNames = [
  "AHOUANDJINOU", "BIAOU", "CODJO", "DOSSOU", "EGOUNLETI", "FASSINOU",
  "GNIMASSOU", "HOUNKPATIN", "IDOHOU", "JOHNSON", "KIKI", "LALEYE",
  "MAMA", "N'TCHA", "OROU", "POGNON", "QUENUM", "ROBIOU",
  "SOSSOU", "TOGBE", "UHLENBROCK", "VODOUHE", "WANSI", "XAVIER",
  "YESSOUFOU", "ZANNOU", "ADJOVI", "BANKOLE", "CAKPO", "DAGAN",
  "ESSE", "FALADE", "GANSE", "HOUNMENOU", "ISSIFOU", "JOSSOU",
  "KPADONOU", "LOKOSSOU", "MENSAH", "NOUKPO", "OLODO", "PADONOU",
];

const organizations = [
  "Université d'Abomey-Calavi", "EPITECH Bénin", "Sèmè City",
  "Institut CERCO", "École Polytechnique d'Abomey-Calavi",
  "ENEAM", "FASEG", "ISM Bénin", "Université de Parakou",
  "BioGuinée Consulting", "CIPB", "Chambre de Commerce du Bénin",
  "GIZ Bénin", "Enabel", "AFD Bénin", "Startup Bénin",
  "Digital Bénin", "SBEE", "Port Autonome de Cotonou", "Bénin Telecoms",
  null, null, null, // some without org
];

const phones = [
  "+229 97 00 12 34", "+229 96 55 78 90", "+229 67 11 22 33",
  "+229 95 44 55 66", "+229 66 77 88 99", "+229 97 33 44 55",
  null, null, // some without phone
];

// ── Activity definitions ─────────────────────────────────────────────

interface ActivityDef {
  title: string;
  description: string;
  type: ActivityType;
  location: string;
  sessionsCount?: number; // for FORMATION
  programName?: string;   // for SERVICE
}

const linguaFormations: ActivityDef[] = [
  {
    title: "Formation Français des Affaires - Niveau B2",
    description: "Formation intensive en français des affaires pour les professionnels",
    type: "FORMATION", location: "Salle Lingua A - Sèmè City", sessionsCount: 6,
  },
  {
    title: "Atelier d'anglais professionnel",
    description: "Atelier pratique d'anglais pour le monde professionnel",
    type: "FORMATION", location: "Salle Lingua B - Sèmè City", sessionsCount: 4,
  },
  {
    title: "Cours de mandarin - Initiation",
    description: "Découverte du mandarin pour les échanges avec la Chine",
    type: "FORMATION", location: "Salle Lingua A - Sèmè City", sessionsCount: 8,
  },
  {
    title: "Formation DELF B1 - Préparation examen",
    description: "Préparation complète à l'examen DELF B1",
    type: "FORMATION", location: "Salle Lingua C - Sèmè City", sessionsCount: 5,
  },
  {
    title: "Atelier d'écriture académique",
    description: "Techniques de rédaction pour mémoires et articles scientifiques",
    type: "FORMATION", location: "Bibliothèque Sèmè City", sessionsCount: 3,
  },
];

const linguaServices: ActivityDef[] = [
  {
    title: "Traduction certifiée de documents",
    description: "Service de traduction officielle de documents administratifs",
    type: "SERVICE", location: "Bureau Lingua - Sèmè City", programName: "Programme de traduction certifiée",
  },
  {
    title: "Évaluation de niveau linguistique",
    description: "Test de positionnement en langues étrangères",
    type: "SERVICE", location: "Salle Lingua A - Sèmè City", programName: "Programme d'évaluation linguistique",
  },
  {
    title: "Accompagnement rédaction CV en anglais",
    description: "Aide à la rédaction de CV et lettres de motivation en anglais",
    type: "SERVICE", location: "Bureau Lingua - Sèmè City", programName: "Programme d'évaluation linguistique",
  },
  {
    title: "Interprétariat conférence internationale",
    description: "Service d'interprétariat pour événements internationaux",
    type: "SERVICE", location: "Auditorium Sèmè City", programName: "Programme de traduction certifiée",
  },
];

const careerFormations: ActivityDef[] = [
  {
    title: "Atelier CV et Lettre de motivation",
    description: "Rédaction efficace de CV et lettres de motivation",
    type: "FORMATION", location: "Salle Career A - Sèmè City", sessionsCount: 3,
  },
  {
    title: "Préparation aux entretiens d'embauche",
    description: "Techniques et simulations d'entretiens professionnels",
    type: "FORMATION", location: "Salle Career B - Sèmè City", sessionsCount: 4,
  },
  {
    title: "Formation Entrepreneuriat et Business Plan",
    description: "Construire son projet entrepreneurial de A à Z",
    type: "FORMATION", location: "Amphithéâtre Sèmè City", sessionsCount: 6,
  },
  {
    title: "Atelier Personal Branding et LinkedIn",
    description: "Optimiser sa présence professionnelle en ligne",
    type: "FORMATION", location: "Salle Career A - Sèmè City", sessionsCount: 2,
  },
  {
    title: "Formation Leadership et Management",
    description: "Développer ses compétences en leadership et gestion d'équipe",
    type: "FORMATION", location: "Salle Career C - Sèmè City", sessionsCount: 5,
  },
];

const careerServices: ActivityDef[] = [
  {
    title: "Coaching individuel de carrière",
    description: "Séance de coaching personnalisé pour orientation professionnelle",
    type: "SERVICE", location: "Bureau Career Center", programName: "Programme d'orientation professionnelle",
  },
  {
    title: "Bilan de compétences",
    description: "Évaluation complète des compétences et aptitudes",
    type: "SERVICE", location: "Bureau Career Center", programName: "Programme d'orientation professionnelle",
  },
  {
    title: "Mentorat entrepreneurial",
    description: "Accompagnement personnalisé par un mentor entrepreneur",
    type: "SERVICE", location: "Espace Coworking Sèmè City", programName: "Programme de coaching entrepreneurial",
  },
  {
    title: "Conseil en reconversion professionnelle",
    description: "Accompagnement dans le changement de carrière",
    type: "SERVICE", location: "Bureau Career Center", programName: "Programme de coaching entrepreneurial",
  },
];

const recrutementFormations: ActivityDef[] = [
  {
    title: "Atelier d'intégration culturelle",
    description: "Comprendre les codes culturels et professionnels béninois",
    type: "FORMATION", location: "Salle Accueil - Sèmè City", sessionsCount: 3,
  },
  {
    title: "Formation aux procédures administratives",
    description: "Guide pratique des démarches administratives au Bénin",
    type: "FORMATION", location: "Salle Accueil - Sèmè City", sessionsCount: 4,
  },
  {
    title: "Atelier de networking professionnel",
    description: "Techniques de réseautage dans l'écosystème béninois",
    type: "FORMATION", location: "Auditorium Sèmè City", sessionsCount: 2,
  },
  {
    title: "Formation Droit du travail béninois",
    description: "Comprendre le cadre juridique du travail au Bénin",
    type: "FORMATION", location: "Salle Recrutement B - Sèmè City", sessionsCount: 3,
  },
];

const recrutementServices: ActivityDef[] = [
  {
    title: "Assistance visa et titre de séjour",
    description: "Aide aux démarches de visa et permis de séjour",
    type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des résidents",
  },
  {
    title: "Accompagnement logement",
    description: "Aide à la recherche de logement pour les expatriés",
    type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des résidents",
  },
  {
    title: "Service de relocation internationale",
    description: "Accompagnement complet pour les mobilités internationales",
    type: "SERVICE", location: "Bureau Mobilité", programName: "Programme de mobilité internationale",
  },
  {
    title: "Conseil en recrutement",
    description: "Aide au recrutement de talents pour les entreprises partenaires",
    type: "SERVICE", location: "Bureau Recrutement", programName: "Programme de mobilité internationale",
  },
  {
    title: "Accompagnement ouverture de compte bancaire",
    description: "Aide aux démarches bancaires pour les nouveaux résidents",
    type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des résidents",
  },
];

// ── Feedback comments ────────────────────────────────────────────────

const formationComments = [
  "Très bonne formation, j'ai beaucoup appris.",
  "Le formateur est excellent et très pédagogue.",
  "Contenu riche et bien structuré.",
  "Formation très pratique avec de bons exercices.",
  "J'aurais aimé que ça dure plus longtemps.",
  "Excellente organisation, tout était parfait.",
  "Les supports de cours sont très bien faits.",
  "Bonne ambiance, groupe dynamique.",
  "Formation utile pour mon parcours professionnel.",
  "Je recommande vivement cette formation.",
  "Le rythme était un peu rapide pour moi.",
  "Très satisfait de cette expérience.",
  "Les cas pratiques étaient très pertinents.",
  "Bonne formation mais la salle était un peu petite.",
  "Merci pour cette formation de qualité.",
  null, null, null, // some without comments
];

const formationSuggestions = [
  "Plus de travaux pratiques serait apprécié.",
  "Prévoir des pauses café plus longues.",
  "Ajouter des ressources en ligne pour continuer l'apprentissage.",
  "Organiser un suivi post-formation.",
  "Fournir les supports avant la formation.",
  "Prévoir plus de sessions en petits groupes.",
  null, null, null, null, // most without suggestions
];

const serviceImprovements = [
  "Le délai de traitement pourrait être réduit.",
  "Plus de créneaux horaires disponibles seraient appréciés.",
  "Le processus est clair mais pourrait être dématérialisé.",
  "RAS, tout était parfait.",
  "Plus de documentation en ligne serait utile.",
  "Le suivi post-service pourrait être amélioré.",
  "Excellent service, rien à améliorer.",
  "Serait bien d'avoir un numéro de suivi de dossier.",
  "Le temps d'attente était un peu long.",
  "Prévoir un guide écrit des étapes à suivre.",
  null, null, null, // some without suggestions
];

// ── Main seed ────────────────────────────────────────────────────────

async function main() {
  console.log("🧹 Cleaning existing activity data...");
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.program.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  // ── 1. Services ──────────────────────────────────────────────────

  console.log("📦 Creating services...");
  const services = await Promise.all([
    prisma.service.upsert({
      where: { slug: "ima-lingua" },
      update: {},
      create: { name: "IMA Lingua", slug: "ima-lingua", description: "Institut des Métiers d'Avenir - Lingua" },
    }),
    prisma.service.upsert({
      where: { slug: "career-center" },
      update: {},
      create: { name: "Career Center", slug: "career-center", description: "Centre de carrière et d'orientation professionnelle" },
    }),
    prisma.service.upsert({
      where: { slug: "recrutement-mobilite" },
      update: {},
      create: { name: "Service Recrutement, Accueil et Mobilité", slug: "recrutement-mobilite", description: "Service de recrutement, accueil et mobilité internationale" },
    }),
  ]);

  const [lingua, career, recrutement] = services;

  // ── 2. Users ─────────────────────────────────────────────────────

  console.log("👤 Creating users...");

  // Super admin
  await prisma.user.upsert({
    where: { email: "superadmin@semecity.bj" },
    update: {},
    create: { name: "Super Administrateur", email: "superadmin@semecity.bj", password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
  });

  // Admins
  const adminData = [
    { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
    { name: "Admin Career Center", email: "admin.career@semecity.bj" },
    { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
  ];
  const adminUsers = [];
  for (const a of adminData) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { ...a, password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
    });
    adminUsers.push(u);
  }

  // Responsables
  const respData = [
    { name: "Responsable IMA Lingua", email: "resp.lingua@semecity.bj", serviceId: lingua.id },
    { name: "Responsable Career Center", email: "resp.career@semecity.bj", serviceId: career.id },
    { name: "Responsable Recrutement", email: "resp.recrutement@semecity.bj", serviceId: recrutement.id },
  ];
  const respUsers = [];
  for (const r of respData) {
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { name: r.name, email: r.email, password: hashedPassword, role: Role.RESPONSABLE_SERVICE, emailVerified: new Date() },
    });
    await prisma.userService.upsert({
      where: { userId_serviceId: { userId: u.id, serviceId: r.serviceId } },
      update: {},
      create: { userId: u.id, serviceId: r.serviceId },
    });
    respUsers.push(u);
  }

  // Intervenants (2 per service)
  const intervenantData = [
    { name: "Dr. Aristide HOUNKPATIN", email: "aristide.h@semecity.bj", serviceId: lingua.id },
    { name: "Mme. Chantal DOSSOU", email: "chantal.d@semecity.bj", serviceId: lingua.id },
    { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj", serviceId: career.id },
    { name: "Mme. Irène BANKOLE", email: "irene.b@semecity.bj", serviceId: career.id },
    { name: "M. Koffi MENSAH", email: "koffi.m@semecity.bj", serviceId: recrutement.id },
    { name: "Mme. Nadège QUENUM", email: "nadege.q@semecity.bj", serviceId: recrutement.id },
  ];
  const intervenantUsers = [];
  for (const i of intervenantData) {
    const u = await prisma.user.upsert({
      where: { email: i.email },
      update: {},
      create: { name: i.name, email: i.email, password: hashedPassword, role: Role.INTERVENANT, emailVerified: new Date() },
    });
    await prisma.userService.upsert({
      where: { userId_serviceId: { userId: u.id, serviceId: i.serviceId } },
      update: {},
      create: { userId: u.id, serviceId: i.serviceId },
    });
    intervenantUsers.push(u);
  }

  // Group intervenants by service
  const intervenantsByService: Record<string, typeof intervenantUsers> = {
    [lingua.id]: intervenantUsers.filter((_, i) => i < 2),
    [career.id]: intervenantUsers.filter((_, i) => i >= 2 && i < 4),
    [recrutement.id]: intervenantUsers.filter((_, i) => i >= 4),
  };

  // ── 3. Programs ──────────────────────────────────────────────────

  console.log("📋 Creating programs...");

  const programDefs = [
    { name: "Programme de traduction certifiée", description: "Services de traduction et certification linguistique", serviceId: lingua.id },
    { name: "Programme d'évaluation linguistique", description: "Évaluations et accompagnement linguistique personnalisé", serviceId: lingua.id },
    { name: "Programme d'orientation professionnelle", description: "Coaching et accompagnement en orientation de carrière", serviceId: career.id },
    { name: "Programme de coaching entrepreneurial", description: "Mentorat et accompagnement pour entrepreneurs", serviceId: career.id },
    { name: "Programme d'accueil des résidents", description: "Accompagnement des nouveaux résidents à Sèmè City", serviceId: recrutement.id },
    { name: "Programme de mobilité internationale", description: "Facilitation de la mobilité internationale des talents", serviceId: recrutement.id },
  ];

  const programs: Record<string, any> = {};
  for (const p of programDefs) {
    const prog = await prisma.program.create({ data: p });
    programs[p.name] = prog;
  }

  // ── 4. Activities ────────────────────────────────────────────────

  console.log("📅 Creating activities with sessions, attendances, and feedbacks...");

  const allActivityDefs: { serviceId: string; respUser: any; defs: ActivityDef[] }[] = [
    { serviceId: lingua.id, respUser: respUsers[0], defs: [...linguaFormations, ...linguaServices] },
    { serviceId: career.id, respUser: respUsers[1], defs: [...careerFormations, ...careerServices] },
    { serviceId: recrutement.id, respUser: respUsers[2], defs: [...recrutementFormations, ...recrutementServices] },
  ];

  // Spread activities from Jan 2024 to Feb 2026
  const startRange = new Date("2024-01-15");
  const endRange = new Date("2026-02-28");

  let totalActivities = 0;
  let totalSessions = 0;
  let totalAttendances = 0;
  let totalFeedbacks = 0;

  // Generate unique participant emails pool
  const participantPool: { firstName: string; lastName: string; email: string; org: string | null; phone: string | null }[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < 200; i++) {
    const fn = randomChoice(firstNames);
    const ln = randomChoice(lastNames);
    const email = `${fn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")}.${ln.toLowerCase()}${i}@example.com`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      participantPool.push({
        firstName: fn,
        lastName: ln,
        email,
        org: randomChoice(organizations),
        phone: randomChoice(phones),
      });
    }
  }

  for (const { serviceId, respUser, defs } of allActivityDefs) {
    const serviceIntervenants = intervenantsByService[serviceId];

    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const intervenant = randomChoice(serviceIntervenants);

      // Spread activity dates evenly
      const activityDate = new Date(
        startRange.getTime() + ((endRange.getTime() - startRange.getTime()) / defs.length) * i + randomInt(0, 15) * 86400000
      );

      // Status based on date
      const now = new Date();
      let status: ActivityStatus = "ACTIVE";
      if (activityDate < new Date("2025-06-01")) status = "CLOSED";
      else if (activityDate > now) status = "DRAFT";

      const programId = def.programName ? programs[def.programName]?.id : undefined;

      const activity = await prisma.activity.create({
        data: {
          title: def.title,
          description: def.description,
          date: activityDate,
          location: def.location,
          status,
          type: def.type,
          serviceId,
          createdById: respUser.id,
          intervenantId: intervenant.id,
          programId: programId || undefined,
          accessToken: uid(),
        },
      });
      totalActivities++;

      if (def.type === "FORMATION" && def.sessionsCount) {
        // ── Create sessions ──
        const sessionRecords = [];
        for (let s = 0; s < def.sessionsCount; s++) {
          const sessionDate = new Date(activityDate.getTime() + s * 7 * 86400000); // weekly sessions
          const session = await prisma.activitySession.create({
            data: {
              title: `Séance ${s + 1}`,
              date: sessionDate,
              location: def.location,
              intervenantId: intervenant.id,
              activityId: activity.id,
              accessToken: uid(),
            },
          });
          sessionRecords.push(session);
          totalSessions++;
        }

        // ── Attendances for each session (unique per activity+email) ──
        const numParticipants = randomInt(8, 22);
        const activityParticipants = participantPool
          .sort(() => Math.random() - 0.5)
          .slice(0, numParticipants);

        for (const participant of activityParticipants) {
          // Assign to a random session
          const session = randomChoice(sessionRecords);
          await prisma.attendance.create({
            data: {
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
              phone: participant.phone,
              organization: participant.org,
              activityId: activity.id,
              sessionId: session.id,
              createdAt: session.date,
            },
          });
          totalAttendances++;

          // 70% chance of leaving feedback
          if (Math.random() < 0.7) {
            await prisma.feedback.create({
              data: {
                feedbackType: "FORMATION",
                overallRating: randomInt(3, 5),
                contentRating: randomInt(2, 5),
                organizationRating: randomInt(3, 5),
                comment: randomChoice(formationComments),
                suggestions: randomChoice(formationSuggestions),
                wouldRecommend: Math.random() > 0.15,
                participantName: `${participant.firstName} ${participant.lastName}`,
                participantEmail: participant.email,
                activityId: activity.id,
                sessionId: session.id,
                createdAt: new Date(session.date.getTime() + randomInt(1, 48) * 3600000),
              },
            });
            totalFeedbacks++;
          }
        }
      } else {
        // ── SERVICE: attendances directly on activity ──
        const numParticipants = randomInt(5, 15);
        const activityParticipants = participantPool
          .sort(() => Math.random() - 0.5)
          .slice(0, numParticipants);

        for (const participant of activityParticipants) {
          await prisma.attendance.create({
            data: {
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
              phone: participant.phone,
              organization: participant.org,
              activityId: activity.id,
              createdAt: new Date(activityDate.getTime() + randomInt(0, 24) * 3600000),
            },
          });
          totalAttendances++;

          // 65% chance of leaving feedback
          if (Math.random() < 0.65) {
            const satisfaction = randomInt(2, 5);
            await prisma.feedback.create({
              data: {
                feedbackType: "SERVICE",
                satisfactionRating: satisfaction,
                informationClarity: Math.random() > 0.2,
                improvementSuggestion: randomChoice(serviceImprovements),
                wouldRecommend: satisfaction >= 3,
                participantName: `${participant.firstName} ${participant.lastName}`,
                participantEmail: participant.email,
                activityId: activity.id,
                createdAt: new Date(activityDate.getTime() + randomInt(1, 72) * 3600000),
              },
            });
            totalFeedbacks++;
          }
        }
      }
    }
  }

  console.log("\n✅ Seed completed!");
  console.log(`   📦 ${services.length} services`);
  console.log(`   👤 ${adminData.length + respData.length + intervenantData.length + 1} users (1 super admin, ${adminData.length} admins, ${respData.length} responsables, ${intervenantData.length} intervenants)`);
  console.log(`   📋 ${programDefs.length} programs`);
  console.log(`   📅 ${totalActivities} activities`);
  console.log(`   🎓 ${totalSessions} sessions`);
  console.log(`   ✍️  ${totalAttendances} attendances`);
  console.log(`   ⭐ ${totalFeedbacks} feedbacks`);
  console.log(`\n   Mot de passe pour tous les comptes : password123`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
