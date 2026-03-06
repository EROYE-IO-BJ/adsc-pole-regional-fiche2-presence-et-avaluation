import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, ActivityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ═══ Helpers ═══════════════════════════════════════════════════════════

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ═══ Data pools ═══════════════════════════════════════════════════════

const firstNames = [
  "Aicha","Benedicte","Chantal","Desire","Euphrasie","Fabrice","Grace","Honore",
  "Irene","Jean-Baptiste","Koffi","Lamine","Mariam","Noel","Odette","Parfait",
  "Rachidatou","Seraphin","Tatiana","Ulrich","Viviane","Wilfried","Xavier","Yolande",
  "Zacharie","Amina","Boris","Claudine","Didier","Estelle","Felicien","Ghislaine",
  "Habib","Isabelle","Joel","Karim","Leontine","Mohamed","Nadege","Olivier",
  "Pelagie","Quentin","Rosalie","Sylvain","Therese","Urbain","Veronique","Wenceslas",
  "Yacouba","Zenabou","Adama","Bernadette","Cosme","Denise","Emmanuel","Francine",
  "Gaston","Hortense","Ibrahim","Justine","Arnaud","Blanche","Celestin","Delphine",
  "Edmond","Fidele","Gerard","Henriette","Innocent","Josephine","Kevin","Lucienne",
  "Mathieu","Norbert","Oceane","Patrick","Rita","Stanislas","Thelma","Victorin",
];

const lastNames = [
  "AHOUANDJINOU","BIAOU","CODJO","DOSSOU","EGOUNLETI","FASSINOU","GNIMASSOU",
  "HOUNKPATIN","IDOHOU","JOHNSON","KIKI","LALEYE","MAMA","NTCHA","OROU","POGNON",
  "QUENUM","ROBIOU","SOSSOU","TOGBE","UHLENBROCK","VODOUHE","WANSI","XAVIER",
  "YESSOUFOU","ZANNOU","ADJOVI","BANKOLE","CAKPO","DAGAN","ESSE","FALADE","GANSE",
  "HOUNMENOU","ISSIFOU","JOSSOU","KPADONOU","LOKOSSOU","MENSAH","NOUKPO","OLODO",
  "PADONOU","AKAKPO","BONOU","CHABI","DJOSSOU","ELEGBE","FAGNON","GBAGUIDI",
  "HOUESSOU","ISSA","KOUTON","LAWANI","MONTCHO","NOUDEKE","OSSENI","SAKA",
];

const organizations = [
  "Universite d'Abomey-Calavi","EPITECH Benin","Seme City","Institut CERCO",
  "Ecole Polytechnique d'Abomey-Calavi","ENEAM","FASEG","ISM Benin",
  "Universite de Parakou","BioGuinee Consulting","CIPB","Chambre de Commerce du Benin",
  "GIZ Benin","Enabel","AFD Benin","Startup Benin","Digital Benin","SBEE",
  "Port Autonome de Cotonou","Benin Telecoms","UAC","ENA Benin",
  "Institut de Mathematiques et Sciences Physiques","IFRI","INRAB",
  null,null,null,null,
];

const phones = [
  "+229 97 00 12 34","+229 96 55 78 90","+229 67 11 22 33","+229 95 44 55 66",
  "+229 66 77 88 99","+229 97 33 44 55","+229 96 22 11 00","+229 67 88 99 00",
  null,null,null,
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
  "Le niveau etait adapte a mes attentes.",
  "J'ai pu appliquer directement ce que j'ai appris.",
  "Formateur tres disponible pour repondre aux questions.",
  null,null,null,
];

const formationSuggestions = [
  "Plus de travaux pratiques serait apprecie.",
  "Prevoir des pauses cafe plus longues.",
  "Ajouter des ressources en ligne pour continuer l'apprentissage.",
  "Organiser un suivi post-formation.",
  "Fournir les supports avant la formation.",
  "Prevoir plus de sessions en petits groupes.",
  "Ajouter un module avance pour approfondir.",
  "Proposer un certificat de completion.",
  null,null,null,null,
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
  "Service rapide et efficace.",
  null,null,null,
];

// ═══ Locations ════════════════════════════════════════════════════════

const LOCATIONS: Record<string, string[]> = {
  "ima-lingua": [
    "Salle Lingua A - Seme City","Salle Lingua B - Seme City","Salle Lingua C - Seme City",
    "Bibliotheque Seme City","Lab Digital - Seme City","Auditorium Seme City",
    "Salle Informatique A - Seme City","Salle Archi - Seme City","Laboratoire Seme City",
  ],
  "career-center": [
    "Salle Career A - Seme City","Salle Career B - Seme City","Salle Career C - Seme City",
    "Amphitheatre Seme City","Espace Coworking - Seme City","Hub Innovation - Seme City",
    "Salle Conference - Seme City","Incubateur Seme City",
  ],
  "recrutement-mobilite": [
    "Salle Accueil - Seme City","Bureau Recrutement - Seme City","Bureau Mobilite - Seme City",
    "Studio Arts - Seme City","Studio Film - Seme City","Fab Lab - Seme City",
    "Atelier Couture - Seme City","Studio Animation - Seme City","Salle Projection - Seme City",
  ],
};

// ═══ Program & Activity definitions ══════════════════════════════════

type SvcKey = "ima-lingua" | "career-center" | "recrutement-mobilite";
// [title, "F"=FORMATION | "S"=SERVICE]
type ActDef = [string, "F" | "S"];

interface ProgramDef {
  name: string;
  desc: string;
  svc: SvcKey;
  acts: ActDef[];
}

const programDefs: ProgramDef[] = [
  // ── IMA Lingua (education, languages, academic, tech) ─────────
  {
    name: "Le centre de langues, IMA Lingua",
    desc: "Centre de langues proposant des formations et services linguistiques pour la communaute de Seme City",
    svc: "ima-lingua",
    acts: [
      ["Formation Anglais professionnel - Niveau B2", "F"],
      ["Cours de Francais Langue Etrangere - Niveau A2", "F"],
      ["Atelier de conversation en mandarin", "F"],
      ["Preparation au DELF B1", "F"],
      ["Formation d'espagnol professionnel", "F"],
      ["Cours intensif de portugais", "F"],
      ["Atelier d'ecriture academique en anglais", "F"],
      ["Evaluation de niveau linguistique", "S"],
      ["Traduction certifiee de documents officiels", "S"],
      ["Interpretariat pour conferences", "S"],
    ],
  },
  {
    name: "Le service de bibliotheque",
    desc: "Bibliotheque et centre de ressources documentaires de Seme City",
    svc: "ima-lingua",
    acts: [
      ["Atelier de recherche documentaire", "F"],
      ["Formation aux bases de donnees academiques", "F"],
      ["Initiation a la veille informationnelle", "F"],
      ["Club de lecture scientifique", "F"],
      ["Formation en gestion bibliographique (Zotero)", "F"],
      ["Consultation bibliographique personnalisee", "S"],
      ["Pret inter-bibliotheques", "S"],
    ],
  },
  {
    name: "Le service de propedeutique",
    desc: "Programme preparatoire pour renforcer les bases academiques des apprenants",
    svc: "ima-lingua",
    acts: [
      ["Mise a niveau en mathematiques", "F"],
      ["Mise a niveau en physique-chimie", "F"],
      ["Renforcement en methodologie universitaire", "F"],
      ["Atelier de redaction scientifique", "F"],
      ["Cours preparatoire en biologie", "F"],
      ["Orientation academique personnalisee", "S"],
    ],
  },
  {
    name: "Les campus connectes",
    desc: "Programme de formation a distance via les campus connectes de Seme City",
    svc: "ima-lingua",
    acts: [
      ["Formation aux outils de collaboration en ligne", "F"],
      ["Atelier de creation de contenus numeriques", "F"],
      ["Initiation a la programmation web", "F"],
      ["Formation cybersecurite pour etudiants", "F"],
      ["Accompagnement technique etudiant", "S"],
    ],
  },
  {
    name: "Le service du Digital Learning Lab",
    desc: "Laboratoire d'innovation pedagogique numerique de Seme City",
    svc: "ima-lingua",
    acts: [
      ["Formation en conception pedagogique numerique", "F"],
      ["Atelier de creation de cours en ligne (MOOC)", "F"],
      ["Formation en realite virtuelle appliquee a l'education", "F"],
      ["Initiation au design UX/UI", "F"],
      ["Production de contenus e-learning", "S"],
      ["Support technique plateforme d'apprentissage", "S"],
    ],
  },
  {
    name: "Les formations en IA/informatique type Ecole 42 / Zone 01",
    desc: "Formations intensives en informatique et intelligence artificielle basees sur la pedagogie par projets",
    svc: "ima-lingua",
    acts: [
      ["Piscine C - Initiation a la programmation", "F"],
      ["Formation developpement web full-stack", "F"],
      ["Bootcamp Intelligence Artificielle", "F"],
      ["Formation en cybersecurite avancee", "F"],
      ["Atelier DevOps et Cloud Computing", "F"],
      ["Hackathon IA pour le developpement", "F"],
      ["Formation Python et Data Science", "F"],
      ["Mentorat technique individuel", "S"],
    ],
  },
  {
    name: "Le Master en architecture",
    desc: "Programme de Master en architecture et urbanisme durable pour l'Afrique",
    svc: "ima-lingua",
    acts: [
      ["Atelier de conception architecturale", "F"],
      ["Formation en design durable et bioclimatique", "F"],
      ["Cours de modelisation 3D (BIM)", "F"],
      ["Seminaire d'urbanisme africain contemporain", "F"],
      ["Atelier de maquettage et prototypage", "F"],
      ["Revue de projets architecturaux", "S"],
    ],
  },
  {
    name: "Les programmes de formation en health-tech",
    desc: "Formations en technologies de la sante et innovation medicale",
    svc: "ima-lingua",
    acts: [
      ["Formation en telemedecine et e-sante", "F"],
      ["Bootcamp developpement d'applications sante", "F"],
      ["Formation gestion de donnees medicales", "F"],
      ["Atelier IoT pour la sante", "F"],
      ["Seminaire innovation sante en Afrique", "F"],
      ["Consultation healthtech startup", "S"],
    ],
  },
  {
    name: "Les formations de techniciens de laboratoire",
    desc: "Formations techniques pour les futurs techniciens de laboratoire",
    svc: "ima-lingua",
    acts: [
      ["Formation techniques d'analyse biochimique", "F"],
      ["Formation en microbiologie appliquee", "F"],
      ["Cours de securite en laboratoire", "F"],
      ["Formation en instrumentation analytique", "F"],
      ["Atelier de controle qualite", "F"],
      ["Calibration et maintenance d'equipements", "S"],
    ],
  },

  // ── Career Center (career, entrepreneurship, business) ────────
  {
    name: "Le Skill-Matcher",
    desc: "Plateforme de matching entre competences et opportunites professionnelles",
    svc: "career-center",
    acts: [
      ["Atelier d'identification des competences transferables", "F"],
      ["Formation en cartographie des competences", "F"],
      ["Workshop de matching competences-emplois", "F"],
      ["Bilan de competences individuel", "S"],
      ["Test de personnalite et orientation", "S"],
      ["Accompagnement reconversion professionnelle", "S"],
    ],
  },
  {
    name: "Le programme IMA leadership",
    desc: "Programme de developpement du leadership pour les jeunes professionnels africains",
    svc: "career-center",
    acts: [
      ["Formation Leadership transformationnel", "F"],
      ["Atelier de prise de parole en public", "F"],
      ["Formation en gestion de conflits", "F"],
      ["Seminaire d'intelligence emotionnelle", "F"],
      ["Coaching en leadership de projet", "F"],
      ["Masterclass leadership feminin", "F"],
    ],
  },
  {
    name: "Le Career Center (service placement)",
    desc: "Centre de carriere pour l'accompagnement a l'insertion professionnelle",
    svc: "career-center",
    acts: [
      ["Atelier CV et lettre de motivation", "F"],
      ["Simulation d'entretien d'embauche", "F"],
      ["Formation Personal Branding et LinkedIn", "F"],
      ["Forum entreprises et recrutement", "F"],
      ["Coaching carriere individuel", "S"],
      ["Conseil en strategie de recherche d'emploi", "S"],
      ["Mise en relation entreprises-candidats", "S"],
    ],
  },
  {
    name: "RISE",
    desc: "Programme d'entrepreneuriat social et a impact pour les jeunes innovateurs",
    svc: "career-center",
    acts: [
      ["Bootcamp entrepreneuriat social", "F"],
      ["Formation en modele economique a impact", "F"],
      ["Atelier de design thinking social", "F"],
      ["Seminaire de mesure d'impact", "F"],
      ["Pitch competition RISE", "F"],
      ["Mentorat entrepreneur social", "S"],
    ],
  },
  {
    name: "Next Impact",
    desc: "Programme d'acceleration pour les startups a fort potentiel de croissance",
    svc: "career-center",
    acts: [
      ["Programme d'acceleration startup Next Impact", "F"],
      ["Formation en levee de fonds", "F"],
      ["Atelier de prototypage rapide", "F"],
      ["Masterclass strategie de croissance", "F"],
      ["Workshop go-to-market", "F"],
      ["Coaching startup individuel", "S"],
    ],
  },
  {
    name: "TEF Ideation",
    desc: "Programme Tony Elumelu Foundation - Phase d'ideation et validation de concept",
    svc: "career-center",
    acts: [
      ["Bootcamp ideation et creativite", "F"],
      ["Atelier de validation d'idee business", "F"],
      ["Formation en etude de marche", "F"],
      ["Workshop de Business Model Canvas", "F"],
      ["Session de brainstorming guide", "S"],
      ["Evaluation de faisabilite de projet", "S"],
    ],
  },
  {
    name: "TEF Acceleration",
    desc: "Programme Tony Elumelu Foundation - Phase d'acceleration et mise a l'echelle",
    svc: "career-center",
    acts: [
      ["Programme d'acceleration TEF", "F"],
      ["Formation en gestion financiere startup", "F"],
      ["Atelier de strategie marketing digital", "F"],
      ["Formation en management d'equipe startup", "F"],
      ["Masterclass scaling et internationalisation", "F"],
      ["Suivi post-acceleration", "S"],
    ],
  },
  {
    name: "La labellisation des Organisations d'Appui a l'Entrepreneuriat (OAE)",
    desc: "Programme de labellisation et certification des structures d'accompagnement entrepreneurial",
    svc: "career-center",
    acts: [
      ["Formation aux standards de qualite OAE", "F"],
      ["Atelier de preparation au label", "F"],
      ["Audit et diagnostic organisationnel", "S"],
      ["Accompagnement a la labellisation", "S"],
      ["Evaluation de conformite", "S"],
    ],
  },
  {
    name: "Les reformes pour ameliorer l'environnement des affaires des MPME et des startups au Benin",
    desc: "Programme d'accompagnement lie aux reformes du cadre des affaires pour les micro, petites et moyennes entreprises",
    svc: "career-center",
    acts: [
      ["Seminaire cadre juridique des MPME", "F"],
      ["Formation en formalisation d'entreprise", "F"],
      ["Atelier fiscalite des startups au Benin", "F"],
      ["Formation propriete intellectuelle pour entrepreneurs", "F"],
      ["Consultation reglementaire", "S"],
      ["Accompagnement a l'enregistrement d'entreprise", "S"],
    ],
  },

  // ── Recrutement, Accueil et Mobilite (creative, arts, recruitment) ──
  {
    name: "Le service recrutement, accueil et mobilite des apprenants et enseignants",
    desc: "Service d'accompagnement pour le recrutement, l'accueil et la mobilite internationale",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation d'integration culturelle", "F"],
      ["Atelier procedures administratives au Benin", "F"],
      ["Formation droit du travail beninois", "F"],
      ["Atelier de networking professionnel", "F"],
      ["Assistance visa et titre de sejour", "S"],
      ["Accompagnement logement", "S"],
      ["Service de relocation internationale", "S"],
      ["Accompagnement ouverture de compte bancaire", "S"],
    ],
  },
  {
    name: "L'Ecole des Arts du Benin",
    desc: "Ecole de formation aux arts visuels et plastiques contemporains",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation arts plastiques contemporains", "F"],
      ["Atelier de sculpture et modelage", "F"],
      ["Cours de peinture - techniques mixtes", "F"],
      ["Formation en art numerique et creation digitale", "F"],
      ["Masterclass performance artistique", "F"],
      ["Atelier de photographie artistique", "F"],
      ["Exposition et critique d'oeuvres", "S"],
    ],
  },
  {
    name: "L'African Screen Institute",
    desc: "Institut de formation aux metiers du cinema et de l'audiovisuel en Afrique",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation en realisation cinematographique", "F"],
      ["Atelier d'ecriture de scenario", "F"],
      ["Formation en production audiovisuelle", "F"],
      ["Cours de montage et post-production", "F"],
      ["Masterclass direction d'acteurs", "F"],
      ["Projection et analyse de films africains", "S"],
    ],
  },
  {
    name: "Les mesures incitatives pour les industries de l'ecran",
    desc: "Programme de soutien et incitations fiscales pour le developpement des industries cinematographiques",
    svc: "recrutement-mobilite",
    acts: [
      ["Seminaire dispositifs fiscaux pour l'audiovisuel", "F"],
      ["Formation en financement de projets cinema", "F"],
      ["Atelier montage de dossiers de subvention", "F"],
      ["Consultation sur les fonds d'aide au cinema", "S"],
      ["Accompagnement demande d'agrement", "S"],
    ],
  },
  {
    name: "Seme City Film Lab",
    desc: "Laboratoire de creation et experimentation cinematographique de Seme City",
    svc: "recrutement-mobilite",
    acts: [
      ["Residence de creation cinematographique", "F"],
      ["Formation en documentaire creatif", "F"],
      ["Atelier courts-metrages", "F"],
      ["Workshop son et design sonore", "F"],
      ["Formation en animation pour le cinema", "F"],
      ["Projection des films du lab", "S"],
    ],
  },
  {
    name: "Fashion Led by Youth",
    desc: "Programme de formation et incubation dans le design de mode pour les jeunes createurs",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation design de mode durable", "F"],
      ["Atelier de patronage et couture", "F"],
      ["Formation en stylisme et tendances", "F"],
      ["Cours de textile et impression", "F"],
      ["Atelier accessoires et maroquinerie", "F"],
      ["Defile et presentation de collections", "S"],
      ["Consultation design de mode", "S"],
    ],
  },
  {
    name: "IncubIMA Animation",
    desc: "Incubateur specialise dans l'animation 2D/3D et le motion design",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation animation 2D", "F"],
      ["Cours d'animation 3D et motion design", "F"],
      ["Atelier de character design", "F"],
      ["Formation en storyboarding", "F"],
      ["Workshop de stop-motion", "F"],
      ["Revue de portfolio animation", "S"],
    ],
  },
  {
    name: "IncubIMA Narration",
    desc: "Incubateur dedie a l'ecriture creative et la narration transmedia",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation en ecriture creative", "F"],
      ["Atelier de narration transmedia", "F"],
      ["Cours de storytelling pour le digital", "F"],
      ["Formation en ecriture de bande dessinee", "F"],
      ["Workshop de slam et spoken word", "F"],
      ["Lecture et critique de manuscrits", "S"],
    ],
  },
  {
    name: "IncubIMA Jeux Video",
    desc: "Incubateur specialise dans la creation de jeux video et experiences interactives",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation game design et level design", "F"],
      ["Cours de programmation de jeux (Unity)", "F"],
      ["Atelier d'art pour jeux video", "F"],
      ["Formation en sound design pour jeux", "F"],
      ["Game jam IncubIMA", "F"],
      ["Test et feedback de prototypes", "S"],
    ],
  },
  {
    name: "Fab'Studio",
    desc: "Atelier de fabrication numerique et prototypage rapide",
    svc: "recrutement-mobilite",
    acts: [
      ["Formation impression 3D et prototypage", "F"],
      ["Atelier de decoupe laser et CNC", "F"],
      ["Cours d'electronique et Arduino", "F"],
      ["Formation en CAO/DAO", "F"],
      ["Workshop de fabrication de PCB", "F"],
      ["Acces libre au Fab Lab", "S"],
      ["Consultation projet de fabrication", "S"],
    ],
  },
];

// ═══ Route handler ═══════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    // ── Clean ──
    await prisma.feedback.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.activitySession.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.program.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 12);

    // ── Services ──
    const [lingua, career, recrutement] = await Promise.all([
      prisma.service.upsert({ where: { slug: "ima-lingua" }, update: {}, create: { name: "IMA Lingua", slug: "ima-lingua", description: "Institut des Metiers d'Avenir - Lingua" } }),
      prisma.service.upsert({ where: { slug: "career-center" }, update: {}, create: { name: "Career Center", slug: "career-center", description: "Centre de carriere et d'orientation professionnelle" } }),
      prisma.service.upsert({ where: { slug: "recrutement-mobilite" }, update: {}, create: { name: "Service Recrutement, Accueil et Mobilite", slug: "recrutement-mobilite", description: "Service de recrutement, accueil et mobilite internationale" } }),
    ]);
    const serviceMap: Record<SvcKey, string> = {
      "ima-lingua": lingua.id,
      "career-center": career.id,
      "recrutement-mobilite": recrutement.id,
    };

    // ── Users ──
    await prisma.user.upsert({ where: { email: "superadmin@semecity.bj" }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: "Super Administrateur", email: "superadmin@semecity.bj", password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() } });

    for (const a of [
      { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
      { name: "Admin Career Center", email: "admin.career@semecity.bj" },
      { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
    ]) {
      await prisma.user.upsert({ where: { email: a.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { ...a, password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() } });
    }

    const respData = [
      { name: "Responsable IMA Lingua", email: "resp.lingua@semecity.bj", svc: lingua.id },
      { name: "Responsable Career Center", email: "resp.career@semecity.bj", svc: career.id },
      { name: "Responsable Recrutement", email: "resp.recrutement@semecity.bj", svc: recrutement.id },
    ];
    const respUsers: { id: string; svcId: string }[] = [];
    for (const r of respData) {
      const u = await prisma.user.upsert({ where: { email: r.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: r.name, email: r.email, password: hashedPassword, role: Role.RESPONSABLE_SERVICE, emailVerified: new Date() } });
      await prisma.userService.upsert({ where: { userId_serviceId: { userId: u.id, serviceId: r.svc } }, update: {}, create: { userId: u.id, serviceId: r.svc } });
      respUsers.push({ id: u.id, svcId: r.svc });
    }

    const intervenantDefs = [
      { name: "Dr. Aristide HOUNKPATIN", email: "aristide.h@semecity.bj", svc: lingua.id },
      { name: "Mme. Chantal DOSSOU", email: "chantal.d@semecity.bj", svc: lingua.id },
      { name: "M. Serge AKAKPO", email: "serge.a@semecity.bj", svc: lingua.id },
      { name: "Dr. Amara LAWANI", email: "amara.l@semecity.bj", svc: lingua.id },
      { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj", svc: career.id },
      { name: "Mme. Irene BANKOLE", email: "irene.b@semecity.bj", svc: career.id },
      { name: "M. Pascal GBAGUIDI", email: "pascal.g@semecity.bj", svc: career.id },
      { name: "Mme. Diane MONTCHO", email: "diane.m@semecity.bj", svc: career.id },
      { name: "M. Koffi MENSAH", email: "koffi.m@semecity.bj", svc: recrutement.id },
      { name: "Mme. Nadege QUENUM", email: "nadege.q@semecity.bj", svc: recrutement.id },
      { name: "M. Yves HOUESSOU", email: "yves.h@semecity.bj", svc: recrutement.id },
      { name: "Mme. Flora OSSENI", email: "flora.o@semecity.bj", svc: recrutement.id },
    ];
    const intervenantsBySvc: Record<string, string[]> = {};
    for (const i of intervenantDefs) {
      const u = await prisma.user.upsert({ where: { email: i.email }, update: { password: hashedPassword, emailVerified: new Date() }, create: { name: i.name, email: i.email, password: hashedPassword, role: Role.INTERVENANT, emailVerified: new Date() } });
      await prisma.userService.upsert({ where: { userId_serviceId: { userId: u.id, serviceId: i.svc } }, update: {}, create: { userId: u.id, serviceId: i.svc } });
      if (!intervenantsBySvc[i.svc]) intervenantsBySvc[i.svc] = [];
      intervenantsBySvc[i.svc].push(u.id);
    }

    // ── Participant pool ──
    const participantPool: { firstName: string; lastName: string; email: string; org: string | null; phone: string | null }[] = [];
    const usedEmails = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const fn = randomChoice(firstNames);
      const ln = randomChoice(lastNames);
      const email = `${fn.toLowerCase().replace(/[^a-z]/g, "")}.${ln.toLowerCase()}${i}@example.com`;
      if (!usedEmails.has(email)) {
        usedEmails.add(email);
        participantPool.push({ firstName: fn, lastName: ln, email, org: randomChoice(organizations), phone: randomChoice(phones) });
      }
    }

    // ── Programs ──
    const programMap: Record<string, string> = {}; // programDef name → program.id
    for (const pd of programDefs) {
      const prog = await prisma.program.create({
        data: { name: pd.name, description: pd.desc, serviceId: serviceMap[pd.svc] },
      });
      programMap[pd.name] = prog.id;
    }

    // ── Activities, Sessions, Attendances, Feedbacks ──
    const startRange = new Date("2024-01-15");
    const endRange = new Date("2026-02-28");
    const rangeMs = endRange.getTime() - startRange.getTime();

    let totalActivities = 0;
    let totalSessions = 0;
    let totalAttendances = 0;
    let totalFeedbacks = 0;

    for (const pd of programDefs) {
      const serviceId = serviceMap[pd.svc];
      const intervenants = intervenantsBySvc[serviceId] || [];
      const resp = respUsers.find((r) => r.svcId === serviceId)!;
      const locs = LOCATIONS[pd.svc];
      const programId = programMap[pd.name];

      const attendanceBatch: { firstName: string; lastName: string; email: string; phone: string | null; organization: string | null; activityId: string; sessionId: string; createdAt: Date }[] = [];
      const feedbackBatch: Record<string, unknown>[] = [];

      for (let ai = 0; ai < pd.acts.length; ai++) {
        const [title, typeCode] = pd.acts[ai];
        const isFormation = typeCode === "F";
        const actType = isFormation ? "FORMATION" : "SERVICE";

        // Spread activities across the date range
        const activityDate = new Date(
          startRange.getTime() + (rangeMs / pd.acts.length) * ai + randomInt(0, 15) * 86400000
        );

        let status: ActivityStatus = "ACTIVE";
        if (activityDate < new Date("2025-06-01")) status = "CLOSED";
        else if (activityDate > new Date("2026-02-01")) status = "DRAFT";

        const intervenantId = randomChoice(intervenants);
        const location = randomChoice(locs);

        const sessionCount = isFormation ? randomInt(3, 12) : 1;
        const activityEndDate = new Date(activityDate.getTime() + (sessionCount - 1) * 7 * 86400000);

        const activity = await prisma.activity.create({
          data: {
            title,
            description: `${title} — programme « ${pd.name} »`,
            startDate: activityDate,
            endDate: activityEndDate,
            location,
            status,
            type: actType,
            serviceId,
            createdById: resp.id,
            intervenantId,
            programId,
            accessToken: uid(),
          },
        });
        totalActivities++;

        // ── Sessions ──
        const timeVariations = ["08:00", "08:30", "09:00", "09:30", "10:00"];
        const endTimeVariations = ["16:00", "16:30", "17:00", "17:30", "18:00"];
        const sessions: { id: string; date: Date }[] = [];

        for (let s = 0; s < sessionCount; s++) {
          const sessionDate = new Date(activityDate.getTime() + s * 7 * 86400000);
          const sTime = randomChoice(timeVariations);
          const eTime = randomChoice(endTimeVariations);
          const session = await prisma.activitySession.create({
            data: {
              title: isFormation ? `Seance ${s + 1}` : null,
              startDate: sessionDate,
              endDate: sessionDate,
              startTime: sTime,
              endTime: eTime,
              location,
              intervenantId,
              activityId: activity.id,
              accessToken: uid(),
              isDefault: s === 0,
            },
          });
          sessions.push({ id: session.id, date: sessionDate });
          totalSessions++;
        }

        // ── Participants & Feedbacks ──
        const numParticipants = isFormation ? randomInt(10, 25) : randomInt(5, 15);
        const participants = shuffle(participantPool).slice(0, numParticipants);

        if (isFormation && sessions.length > 1) {
          // FORMATION: each participant attends 40-100% of sessions
          for (const p of participants) {
            const attendRate = 0.4 + Math.random() * 0.6;
            const sessionsToAttend = shuffle(sessions).slice(
              0, Math.max(1, Math.round(sessions.length * attendRate))
            );

            for (const sess of sessionsToAttend) {
              attendanceBatch.push({
                firstName: p.firstName, lastName: p.lastName, email: p.email,
                phone: p.phone, organization: p.org,
                activityId: activity.id, sessionId: sess.id,
                createdAt: sess.date,
              });
              totalAttendances++;

              if (Math.random() < 0.6) {
                feedbackBatch.push({
                  feedbackType: "FORMATION",
                  overallRating: randomInt(2, 5),
                  contentRating: randomInt(2, 5),
                  organizationRating: randomInt(3, 5),
                  comment: randomChoice(formationComments),
                  suggestions: randomChoice(formationSuggestions),
                  wouldRecommend: Math.random() > 0.18,
                  participantName: `${p.firstName} ${p.lastName}`,
                  participantEmail: p.email,
                  activityId: activity.id,
                  sessionId: sess.id,
                  createdAt: new Date(sess.date.getTime() + randomInt(1, 48) * 3600000),
                });
                totalFeedbacks++;
              }
            }
          }
        } else {
          // SERVICE or single-session FORMATION
          const sess = sessions[0];
          for (const p of participants) {
            attendanceBatch.push({
              firstName: p.firstName, lastName: p.lastName, email: p.email,
              phone: p.phone, organization: p.org,
              activityId: activity.id, sessionId: sess.id,
              createdAt: new Date(sess.date.getTime() + randomInt(0, 24) * 3600000),
            });
            totalAttendances++;

            if (Math.random() < 0.65) {
              if (isFormation) {
                feedbackBatch.push({
                  feedbackType: "FORMATION",
                  overallRating: randomInt(2, 5),
                  contentRating: randomInt(2, 5),
                  organizationRating: randomInt(3, 5),
                  comment: randomChoice(formationComments),
                  suggestions: randomChoice(formationSuggestions),
                  wouldRecommend: Math.random() > 0.18,
                  participantName: `${p.firstName} ${p.lastName}`,
                  participantEmail: p.email,
                  activityId: activity.id,
                  sessionId: sess.id,
                  createdAt: new Date(sess.date.getTime() + randomInt(1, 48) * 3600000),
                });
              } else {
                const sat = randomInt(2, 5);
                feedbackBatch.push({
                  feedbackType: "SERVICE",
                  satisfactionRating: sat,
                  informationClarity: Math.random() > 0.22,
                  improvementSuggestion: randomChoice(serviceImprovements),
                  wouldRecommend: sat >= 3 && Math.random() > 0.12,
                  participantName: `${p.firstName} ${p.lastName}`,
                  participantEmail: p.email,
                  activityId: activity.id,
                  sessionId: sess.id,
                  createdAt: new Date(sess.date.getTime() + randomInt(1, 72) * 3600000),
                });
              }
              totalFeedbacks++;
            }
          }
        }
      }

      // Bulk insert attendances & feedbacks per program (avoid unique constraint issues)
      // Deduplicate by (sessionId, email)
      const seenAttKeys = new Set<string>();
      const dedupedAtt = attendanceBatch.filter((a: { sessionId: string; email: string }) => {
        const key = `${a.sessionId}:${a.email}`;
        if (seenAttKeys.has(key)) return false;
        seenAttKeys.add(key);
        return true;
      });

      // Deduplicate feedbacks by (sessionId, participantEmail)
      const seenFbKeys = new Set<string>();
      const dedupedFb = feedbackBatch.filter((f: Record<string, unknown>) => {
        const key = `${f.sessionId}:${f.participantEmail}`;
        if (seenFbKeys.has(key)) return false;
        seenFbKeys.add(key);
        return true;
      });

      // Insert in chunks of 500
      for (let i = 0; i < dedupedAtt.length; i += 500) {
        await prisma.attendance.createMany({ data: dedupedAtt.slice(i, i + 500) });
      }
      for (let i = 0; i < dedupedFb.length; i += 500) {
        await prisma.feedback.createMany({ data: dedupedFb.slice(i, i + 500) as any });
      }

      // Adjust counts after dedup
      totalAttendances = totalAttendances - (attendanceBatch.length - dedupedAtt.length);
      totalFeedbacks = totalFeedbacks - (feedbackBatch.length - dedupedFb.length);
    }

    return NextResponse.json({
      success: true,
      message: "Seed complet execute avec succes",
      data: {
        services: 3,
        users: 1 + 3 + 3 + intervenantDefs.length,
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
