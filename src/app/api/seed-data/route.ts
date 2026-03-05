import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, ActivityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ── Helpers ──────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Data pools ───────────────────────────────────────────────────────

const firstNames = [
  "Aicha", "Benedicte", "Chantal", "Desire", "Euphrasie", "Fabrice",
  "Grace", "Honore", "Irene", "Jean-Baptiste", "Koffi", "Lamine",
  "Mariam", "Noel", "Odette", "Parfait", "Rachidatou", "Seraphin",
  "Tatiana", "Ulrich", "Viviane", "Wilfried", "Xavier", "Yolande",
  "Zacharie", "Amina", "Boris", "Claudine", "Didier", "Estelle",
  "Felicien", "Ghislaine", "Habib", "Isabelle", "Joel", "Karim",
  "Leontine", "Mohamed", "Nadege", "Olivier", "Pelagie", "Quentin",
  "Rosalie", "Sylvain", "Therese", "Urbain", "Veronique", "Wenceslas",
  "Yacouba", "Zenabou", "Adama", "Bernadette", "Cosme", "Denise",
  "Emmanuel", "Francine", "Gaston", "Hortense", "Ibrahim", "Justine",
];

const lastNames = [
  "AHOUANDJINOU", "BIAOU", "CODJO", "DOSSOU", "EGOUNLETI", "FASSINOU",
  "GNIMASSOU", "HOUNKPATIN", "IDOHOU", "JOHNSON", "KIKI", "LALEYE",
  "MAMA", "NTCHA", "OROU", "POGNON", "QUENUM", "ROBIOU",
  "SOSSOU", "TOGBE", "UHLENBROCK", "VODOUHE", "WANSI", "XAVIER",
  "YESSOUFOU", "ZANNOU", "ADJOVI", "BANKOLE", "CAKPO", "DAGAN",
  "ESSE", "FALADE", "GANSE", "HOUNMENOU", "ISSIFOU", "JOSSOU",
  "KPADONOU", "LOKOSSOU", "MENSAH", "NOUKPO", "OLODO", "PADONOU",
];

const organizations = [
  "Universite d'Abomey-Calavi", "EPITECH Benin", "Seme City",
  "Institut CERCO", "Ecole Polytechnique d'Abomey-Calavi",
  "ENEAM", "FASEG", "ISM Benin", "Universite de Parakou",
  "BioGuinee Consulting", "CIPB", "Chambre de Commerce du Benin",
  "GIZ Benin", "Enabel", "AFD Benin", "Startup Benin",
  "Digital Benin", "SBEE", "Port Autonome de Cotonou", "Benin Telecoms",
  null, null, null,
];

const phones = [
  "+229 97 00 12 34", "+229 96 55 78 90", "+229 67 11 22 33",
  "+229 95 44 55 66", "+229 66 77 88 99", "+229 97 33 44 55",
  null, null,
];

// ── Activity definitions ─────────────────────────────────────────────

interface ActivityDef {
  title: string;
  description: string;
  type: "FORMATION" | "SERVICE";
  location: string;
  sessionsCount?: number;
  programName?: string;
}

const linguaFormations: ActivityDef[] = [
  { title: "Formation Francais des Affaires - Niveau B2", description: "Formation intensive en francais des affaires pour les professionnels", type: "FORMATION", location: "Salle Lingua A - Seme City", sessionsCount: 6 },
  { title: "Atelier d'anglais professionnel", description: "Atelier pratique d'anglais pour le monde professionnel", type: "FORMATION", location: "Salle Lingua B - Seme City", sessionsCount: 4 },
  { title: "Cours de mandarin - Initiation", description: "Decouverte du mandarin pour les echanges avec la Chine", type: "FORMATION", location: "Salle Lingua A - Seme City", sessionsCount: 8 },
  { title: "Formation DELF B1 - Preparation examen", description: "Preparation complete a l'examen DELF B1", type: "FORMATION", location: "Salle Lingua C - Seme City", sessionsCount: 5 },
  { title: "Atelier d'ecriture academique", description: "Techniques de redaction pour memoires et articles scientifiques", type: "FORMATION", location: "Bibliotheque Seme City", sessionsCount: 3 },
];

const linguaServices: ActivityDef[] = [
  { title: "Traduction certifiee de documents", description: "Service de traduction officielle de documents administratifs", type: "SERVICE", location: "Bureau Lingua - Seme City", programName: "Programme de traduction certifiee" },
  { title: "Evaluation de niveau linguistique", description: "Test de positionnement en langues etrangeres", type: "SERVICE", location: "Salle Lingua A - Seme City", programName: "Programme d'evaluation linguistique" },
  { title: "Accompagnement redaction CV en anglais", description: "Aide a la redaction de CV et lettres de motivation en anglais", type: "SERVICE", location: "Bureau Lingua - Seme City", programName: "Programme d'evaluation linguistique" },
  { title: "Interpretariat conference internationale", description: "Service d'interpretariat pour evenements internationaux", type: "SERVICE", location: "Auditorium Seme City", programName: "Programme de traduction certifiee" },
];

const careerFormations: ActivityDef[] = [
  { title: "Atelier CV et Lettre de motivation", description: "Redaction efficace de CV et lettres de motivation", type: "FORMATION", location: "Salle Career A - Seme City", sessionsCount: 3 },
  { title: "Preparation aux entretiens d'embauche", description: "Techniques et simulations d'entretiens professionnels", type: "FORMATION", location: "Salle Career B - Seme City", sessionsCount: 4 },
  { title: "Formation Entrepreneuriat et Business Plan", description: "Construire son projet entrepreneurial de A a Z", type: "FORMATION", location: "Amphitheatre Seme City", sessionsCount: 6 },
  { title: "Atelier Personal Branding et LinkedIn", description: "Optimiser sa presence professionnelle en ligne", type: "FORMATION", location: "Salle Career A - Seme City", sessionsCount: 2 },
  { title: "Formation Leadership et Management", description: "Developper ses competences en leadership et gestion d'equipe", type: "FORMATION", location: "Salle Career C - Seme City", sessionsCount: 5 },
];

const careerServices: ActivityDef[] = [
  { title: "Coaching individuel de carriere", description: "Seance de coaching personnalise pour orientation professionnelle", type: "SERVICE", location: "Bureau Career Center", programName: "Programme d'orientation professionnelle" },
  { title: "Bilan de competences", description: "Evaluation complete des competences et aptitudes", type: "SERVICE", location: "Bureau Career Center", programName: "Programme d'orientation professionnelle" },
  { title: "Mentorat entrepreneurial", description: "Accompagnement personnalise par un mentor entrepreneur", type: "SERVICE", location: "Espace Coworking Seme City", programName: "Programme de coaching entrepreneurial" },
  { title: "Conseil en reconversion professionnelle", description: "Accompagnement dans le changement de carriere", type: "SERVICE", location: "Bureau Career Center", programName: "Programme de coaching entrepreneurial" },
];

const recrutementFormations: ActivityDef[] = [
  { title: "Atelier d'integration culturelle", description: "Comprendre les codes culturels et professionnels beninois", type: "FORMATION", location: "Salle Accueil - Seme City", sessionsCount: 3 },
  { title: "Formation aux procedures administratives", description: "Guide pratique des demarches administratives au Benin", type: "FORMATION", location: "Salle Accueil - Seme City", sessionsCount: 4 },
  { title: "Atelier de networking professionnel", description: "Techniques de reseautage dans l'ecosysteme beninois", type: "FORMATION", location: "Auditorium Seme City", sessionsCount: 2 },
  { title: "Formation Droit du travail beninois", description: "Comprendre le cadre juridique du travail au Benin", type: "FORMATION", location: "Salle Recrutement B - Seme City", sessionsCount: 3 },
];

const recrutementServices: ActivityDef[] = [
  { title: "Assistance visa et titre de sejour", description: "Aide aux demarches de visa et permis de sejour", type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des residents" },
  { title: "Accompagnement logement", description: "Aide a la recherche de logement pour les expatries", type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des residents" },
  { title: "Service de relocation internationale", description: "Accompagnement complet pour les mobilites internationales", type: "SERVICE", location: "Bureau Mobilite", programName: "Programme de mobilite internationale" },
  { title: "Conseil en recrutement", description: "Aide au recrutement de talents pour les entreprises partenaires", type: "SERVICE", location: "Bureau Recrutement", programName: "Programme de mobilite internationale" },
  { title: "Accompagnement ouverture de compte bancaire", description: "Aide aux demarches bancaires pour les nouveaux residents", type: "SERVICE", location: "Bureau Recrutement", programName: "Programme d'accueil des residents" },
];

const formationComments = [
  "Tres bonne formation, j'ai beaucoup appris.",
  "Le formateur est excellent et tres pedagogue.",
  "Contenu riche et bien structure.",
  "Formation tres pratique avec de bons exercices.",
  "J'aurais aime que ca dure plus longtemps.",
  "Excellente organisation, tout etait parfait.",
  "Les supports de cours sont tres bien faits.",
  "Bonne ambiance, groupe dynamique.",
  "Formation utile pour mon parcours professionnel.",
  "Je recommande vivement cette formation.",
  "Le rythme etait un peu rapide pour moi.",
  "Tres satisfait de cette experience.",
  "Les cas pratiques etaient tres pertinents.",
  "Bonne formation mais la salle etait un peu petite.",
  "Merci pour cette formation de qualite.",
  null, null, null,
];

const formationSuggestions = [
  "Plus de travaux pratiques serait apprecie.",
  "Prevoir des pauses cafe plus longues.",
  "Ajouter des ressources en ligne pour continuer l'apprentissage.",
  "Organiser un suivi post-formation.",
  "Fournir les supports avant la formation.",
  "Prevoir plus de sessions en petits groupes.",
  null, null, null, null,
];

const serviceImprovements = [
  "Le delai de traitement pourrait etre reduit.",
  "Plus de creneaux horaires disponibles seraient apprecies.",
  "Le processus est clair mais pourrait etre dematerialise.",
  "RAS, tout etait parfait.",
  "Plus de documentation en ligne serait utile.",
  "Le suivi post-service pourrait etre ameliore.",
  "Excellent service, rien a ameliorer.",
  "Serait bien d'avoir un numero de suivi de dossier.",
  "Le temps d'attente etait un peu long.",
  "Prevoir un guide ecrit des etapes a suivre.",
  null, null, null,
];

// ── Route handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    // Clean existing data
    await prisma.feedback.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.activitySession.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.program.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 12);

    // ── Services ──
    const services = await Promise.all([
      prisma.service.upsert({ where: { slug: "ima-lingua" }, update: {}, create: { name: "IMA Lingua", slug: "ima-lingua", description: "Institut des Metiers d'Avenir - Lingua" } }),
      prisma.service.upsert({ where: { slug: "career-center" }, update: {}, create: { name: "Career Center", slug: "career-center", description: "Centre de carriere et d'orientation professionnelle" } }),
      prisma.service.upsert({ where: { slug: "recrutement-mobilite" }, update: {}, create: { name: "Service Recrutement, Accueil et Mobilite", slug: "recrutement-mobilite", description: "Service de recrutement, accueil et mobilite internationale" } }),
    ]);
    const [lingua, career, recrutement] = services;

    // ── Users ──
    await prisma.user.upsert({ where: { email: "superadmin@semecity.bj" }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: "Super Administrateur", email: "superadmin@semecity.bj", password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() } });

    const adminData = [
      { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
      { name: "Admin Career Center", email: "admin.career@semecity.bj" },
      { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
    ];
    for (const a of adminData) {
      await prisma.user.upsert({ where: { email: a.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { ...a, password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() } });
    }

    const respData = [
      { name: "Responsable IMA Lingua", email: "resp.lingua@semecity.bj", serviceId: lingua.id },
      { name: "Responsable Career Center", email: "resp.career@semecity.bj", serviceId: career.id },
      { name: "Responsable Recrutement", email: "resp.recrutement@semecity.bj", serviceId: recrutement.id },
    ];
    const respUsers = [];
    for (const r of respData) {
      const u = await prisma.user.upsert({ where: { email: r.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: r.name, email: r.email, password: hashedPassword, role: Role.RESPONSABLE_SERVICE, emailVerified: new Date() } });
      await prisma.userService.upsert({ where: { userId_serviceId: { userId: u.id, serviceId: r.serviceId } }, update: {}, create: { userId: u.id, serviceId: r.serviceId } });
      respUsers.push(u);
    }

    const intervenantData = [
      { name: "Dr. Aristide HOUNKPATIN", email: "aristide.h@semecity.bj", serviceId: lingua.id },
      { name: "Mme. Chantal DOSSOU", email: "chantal.d@semecity.bj", serviceId: lingua.id },
      { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj", serviceId: career.id },
      { name: "Mme. Irene BANKOLE", email: "irene.b@semecity.bj", serviceId: career.id },
      { name: "M. Koffi MENSAH", email: "koffi.m@semecity.bj", serviceId: recrutement.id },
      { name: "Mme. Nadege QUENUM", email: "nadege.q@semecity.bj", serviceId: recrutement.id },
    ];
    const intervenantUsers = [];
    for (const i of intervenantData) {
      const u = await prisma.user.upsert({ where: { email: i.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: i.name, email: i.email, password: hashedPassword, role: Role.INTERVENANT, emailVerified: new Date() } });
      await prisma.userService.upsert({ where: { userId_serviceId: { userId: u.id, serviceId: i.serviceId } }, update: {}, create: { userId: u.id, serviceId: i.serviceId } });
      intervenantUsers.push(u);
    }

    const intervenantsByService: Record<string, typeof intervenantUsers> = {
      [lingua.id]: intervenantUsers.filter((_, idx) => idx < 2),
      [career.id]: intervenantUsers.filter((_, idx) => idx >= 2 && idx < 4),
      [recrutement.id]: intervenantUsers.filter((_, idx) => idx >= 4),
    };

    // ── Programs ──
    const programDefs = [
      { name: "Programme de traduction certifiee", description: "Services de traduction et certification linguistique", serviceId: lingua.id },
      { name: "Programme d'evaluation linguistique", description: "Evaluations et accompagnement linguistique personnalise", serviceId: lingua.id },
      { name: "Programme d'orientation professionnelle", description: "Coaching et accompagnement en orientation de carriere", serviceId: career.id },
      { name: "Programme de coaching entrepreneurial", description: "Mentorat et accompagnement pour entrepreneurs", serviceId: career.id },
      { name: "Programme d'accueil des residents", description: "Accompagnement des nouveaux residents a Seme City", serviceId: recrutement.id },
      { name: "Programme de mobilite internationale", description: "Facilitation de la mobilite internationale des talents", serviceId: recrutement.id },
    ];

    const programs: Record<string, any> = {};
    for (const p of programDefs) {
      const prog = await prisma.program.create({ data: p });
      programs[p.name] = prog;
    }

    // ── Activities ──
    const allActivityDefs = [
      { serviceId: lingua.id, respUser: respUsers[0], defs: [...linguaFormations, ...linguaServices] },
      { serviceId: career.id, respUser: respUsers[1], defs: [...careerFormations, ...careerServices] },
      { serviceId: recrutement.id, respUser: respUsers[2], defs: [...recrutementFormations, ...recrutementServices] },
    ];

    const startRange = new Date("2024-01-15");
    const endRange = new Date("2026-02-28");

    let totalActivities = 0;
    let totalSessions = 0;
    let totalAttendances = 0;
    let totalFeedbacks = 0;

    // Participant pool
    const participantPool: { firstName: string; lastName: string; email: string; org: string | null; phone: string | null }[] = [];
    const usedEmails = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const fn = randomChoice(firstNames);
      const ln = randomChoice(lastNames);
      const email = `${fn.toLowerCase().replace(/[^a-z]/g, "")}.${ln.toLowerCase()}${i}@example.com`;
      if (!usedEmails.has(email)) {
        usedEmails.add(email);
        participantPool.push({ firstName: fn, lastName: ln, email, org: randomChoice(organizations), phone: randomChoice(phones) });
      }
    }

    for (const { serviceId, respUser, defs } of allActivityDefs) {
      const serviceIntervenants = intervenantsByService[serviceId];

      for (let i = 0; i < defs.length; i++) {
        const def = defs[i];
        const intervenant = randomChoice(serviceIntervenants);
        const activityDate = new Date(startRange.getTime() + ((endRange.getTime() - startRange.getTime()) / defs.length) * i + randomInt(0, 15) * 86400000);

        const now = new Date();
        let status: ActivityStatus = "ACTIVE";
        if (activityDate < new Date("2025-06-01")) status = "CLOSED";
        else if (activityDate > now) status = "DRAFT";

        const programId = def.programName ? programs[def.programName]?.id : undefined;

        const activity = await prisma.activity.create({
          data: {
            title: def.title, description: def.description, date: activityDate,
            location: def.location, status, type: def.type, serviceId,
            createdById: respUser.id, intervenantId: intervenant.id,
            programId: programId || undefined, accessToken: uid(),
          },
        });
        totalActivities++;

        if (def.type === "FORMATION" && def.sessionsCount) {
          const sessionRecords = [];
          for (let s = 0; s < def.sessionsCount; s++) {
            const sessionDate = new Date(activityDate.getTime() + s * 7 * 86400000);
            const session = await prisma.activitySession.create({
              data: { title: `Seance ${s + 1}`, date: sessionDate, location: def.location, intervenantId: intervenant.id, activityId: activity.id, accessToken: uid(), isDefault: s === 0 },
            });
            sessionRecords.push(session);
            totalSessions++;
          }

          const numParticipants = randomInt(8, 22);
          const activityParticipants = participantPool.sort(() => Math.random() - 0.5).slice(0, numParticipants);

          // Track used session+email combos to avoid unique constraint violations
          const usedSessionEmails = new Set<string>();

          for (const participant of activityParticipants) {
            const session = randomChoice(sessionRecords);
            const key = `${session.id}:${participant.email}`;
            if (usedSessionEmails.has(key)) continue;
            usedSessionEmails.add(key);

            await prisma.attendance.create({
              data: { firstName: participant.firstName, lastName: participant.lastName, email: participant.email, phone: participant.phone, organization: participant.org, activityId: activity.id, sessionId: session.id, createdAt: session.date },
            });
            totalAttendances++;

            if (Math.random() < 0.7) {
              await prisma.feedback.create({
                data: { feedbackType: "FORMATION", overallRating: randomInt(3, 5), contentRating: randomInt(2, 5), organizationRating: randomInt(3, 5), comment: randomChoice(formationComments), suggestions: randomChoice(formationSuggestions), wouldRecommend: Math.random() > 0.15, participantName: `${participant.firstName} ${participant.lastName}`, participantEmail: participant.email, activityId: activity.id, sessionId: session.id, createdAt: new Date(session.date.getTime() + randomInt(1, 48) * 3600000) },
              });
              totalFeedbacks++;
            }
          }
        } else {
          // SERVICE: create a default session
          const defaultSession = await prisma.activitySession.create({
            data: { title: null, date: activityDate, location: def.location, intervenantId: intervenant.id, activityId: activity.id, accessToken: uid(), isDefault: true },
          });
          totalSessions++;

          const numParticipants = randomInt(5, 15);
          const activityParticipants = participantPool.sort(() => Math.random() - 0.5).slice(0, numParticipants);

          // Track used session+email combos to avoid unique constraint violations
          const usedSessionEmails = new Set<string>();

          for (const participant of activityParticipants) {
            const key = `${defaultSession.id}:${participant.email}`;
            if (usedSessionEmails.has(key)) continue;
            usedSessionEmails.add(key);

            await prisma.attendance.create({
              data: { firstName: participant.firstName, lastName: participant.lastName, email: participant.email, phone: participant.phone, organization: participant.org, activityId: activity.id, sessionId: defaultSession.id, createdAt: new Date(activityDate.getTime() + randomInt(0, 24) * 3600000) },
            });
            totalAttendances++;

            if (Math.random() < 0.65) {
              const satisfaction = randomInt(2, 5);
              await prisma.feedback.create({
                data: { feedbackType: "SERVICE", satisfactionRating: satisfaction, informationClarity: Math.random() > 0.2, improvementSuggestion: randomChoice(serviceImprovements), wouldRecommend: satisfaction >= 3, participantName: `${participant.firstName} ${participant.lastName}`, participantEmail: participant.email, activityId: activity.id, sessionId: defaultSession.id, createdAt: new Date(activityDate.getTime() + randomInt(1, 72) * 3600000) },
              });
              totalFeedbacks++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seed complet execute avec succes",
      data: {
        services: services.length,
        users: adminData.length + respData.length + intervenantData.length + 1,
        programs: programDefs.length,
        activities: totalActivities,
        sessions: totalSessions,
        attendances: totalAttendances,
        feedbacks: totalFeedbacks,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Erreur lors du seed", details: String(error) }, { status: 500 });
  }
}
