import { PrismaClient, Role, ActivityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────

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
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function calcDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ── Data pools ───────────────────────────────────────────────────────

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
  "Service rapide et efficace.",
  null,null,null,
];

// ── Organization / Department / Service hierarchy ────────────────────

interface OrgDef {
  name: string;
  slug: string;
  description: string;
  departments: DeptDef[];
}
interface DeptDef {
  name: string;
  slug: string;
  description: string;
  services: SvcDef[];
}
interface SvcDef {
  name: string;
  slug: string;
  description: string;
}

const orgDefs: OrgDef[] = [
  {
    name: "Agence de Développement de Sèmè City",
    slug: "adsc",
    description: "Agence de Développement de Sèmè City (ADSC)",
    departments: [
      {
        name: "Montage des programmes",
        slug: "montage-des-programmes",
        description: "Département en charge du montage et de la validation des programmes de Sèmè City",
        services: [
          { name: "Formation", slug: "adsc-montage-formation", description: "Service de formation du département Montage des programmes" },
          { name: "Opération", slug: "adsc-montage-operation", description: "Service des opérations du département Montage des programmes" },
          { name: "Montage et validation de programmes", slug: "adsc-montage-validation", description: "Service de montage et validation de programmes" },
          { name: "Bibliothèque", slug: "adsc-montage-bibliotheque", description: "Service de la bibliothèque" },
          { name: "IMA Lingua", slug: "adsc-montage-ima-lingua", description: "Centre de langues IMA Lingua" },
          { name: "Career Center", slug: "adsc-montage-career-center", description: "Centre de carrière et d'orientation professionnelle" },
          { name: "Recrutement Accueil et Mobilité", slug: "adsc-montage-recrutement", description: "Service de recrutement, accueil et mobilité" },
          { name: "Incubation", slug: "adsc-montage-incubation", description: "Service d'incubation du département Montage des programmes" },
        ],
      },
      {
        name: "Valorisation des Innovations",
        slug: "valorisation-des-innovations",
        description: "Département de valorisation des innovations de Sèmè City",
        services: [
          { name: "Opération", slug: "adsc-valorisation-operation", description: "Service des opérations du département Valorisation des Innovations" },
          { name: "Formation", slug: "adsc-valorisation-formation", description: "Service de formation du département Valorisation des Innovations" },
          { name: "Incubation", slug: "adsc-valorisation-incubation", description: "Service d'incubation du département Valorisation des Innovations" },
          { name: "Développement de solutions", slug: "adsc-valorisation-dev-solutions", description: "Service de développement de solutions" },
          { name: "TechIMA", slug: "adsc-valorisation-techima", description: "Service TechIMA de fabrication numérique" },
        ],
      },
    ],
  },
  {
    name: "Sèmè City Institute of Technology and Innovation",
    slug: "sciti",
    description: "Sèmè City Institute of Technology and Innovation (SCITI)",
    departments: [
      {
        name: "Département Formation",
        slug: "departement-formation",
        description: "Département de formation du SCITI",
        services: [
          { name: "Inscription", slug: "sciti-formation-inscription", description: "Service d'inscription" },
          { name: "Admission", slug: "sciti-formation-admission", description: "Service d'admission" },
        ],
      },
      {
        name: "Département Recherche (X-TechLab)",
        slug: "departement-recherche-x-techlab",
        description: "Département de recherche et d'expérimentation X-TechLab du SCITI",
        services: [
          { name: "Appui à l'expérimentation", slug: "sciti-recherche-experimentation", description: "Service d'appui à l'expérimentation" },
          { name: "Commercialisation", slug: "sciti-recherche-commercialisation", description: "Service de commercialisation" },
        ],
      },
    ],
  },
];

// ── Locations per department ─────────────────────────────────────────

const LOCATIONS: Record<string, string[]> = {
  "montage-des-programmes": [
    "Salle de Formation A - Sèmè City","Salle de Formation B - Sèmè City","Salle de Formation C - Sèmè City",
    "Amphithéâtre Sèmè City","Lab Informatique - Sèmè City","Salle de classe D - Sèmè City",
    "Salle Santé - Sèmè City","Salle Archi - Sèmè City","Laboratoire Sciences - Sèmè City",
    "Studio Film - Sèmè City","Atelier Couture - Sèmè City","Studio Animation - Sèmè City",
    "Bibliothèque Sèmè City","Salle Lingua A - Sèmè City","Salle Career A - Sèmè City",
    "Salle Accueil - Sèmè City","Espace Incubation - Sèmè City",
  ],
  "valorisation-des-innovations": [
    "Lab Innovation - Sèmè City","Salle de Conférence - Sèmè City","Hub Data - Sèmè City",
    "Espace Co-création - Sèmè City","Salle de Recherche - Sèmè City","Bureau Innovation - Sèmè City",
    "Fab Lab - Sèmè City","Atelier Bois - Sèmè City","Lab Électronique - Sèmè City",
    "Espace Prototypage - Sèmè City","Atelier Céramique - Sèmè City",
  ],
  "departement-formation": [
    "Salle de Formation SCITI A","Salle de Formation SCITI B","Amphithéâtre SCITI",
    "Lab Informatique SCITI","Salle de classe SCITI C","Bureau Inscription SCITI",
  ],
  "departement-recherche-x-techlab": [
    "Lab X-TechLab A","Lab X-TechLab B","Salle de Conférence X-TechLab",
    "Espace Expérimentation","Bureau Recherche SCITI","Atelier Prototypage SCITI",
  ],
};

// ── Program definitions (37 programs from Excel) ─────────────────────

type ActDef = [string, "F" | "S"];
interface ProgramDef {
  name: string;
  desc: string;
  dept: string; // department slug
  svc?: string; // optional service slug
  acts: ActDef[];
}

const programDefs: ProgramDef[] = [
  // ═══ ADSC / Montage des programmes (22 programs) ═══════════════════

  // Service: Formation
  { name: "Le programme IMA leadership", desc: "Programme de développement du leadership et des compétences transversales", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Leadership transformationnel","F"],["Atelier Prise de parole en public","F"],
    ["Formation Gestion de conflits et médiation","F"],["Séminaire Intelligence émotionnelle","F"],
    ["Coaching en leadership de projet","F"],["Masterclass Leadership féminin","F"],
    ["Formation Management interculturel","F"],["Atelier Négociation et influence","F"],
  ]},
  { name: "Les campus connectés", desc: "Programme de formation à distance via les campus connectés de Sèmè City", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Outils de collaboration en ligne","F"],["Atelier Création de contenus numériques","F"],
    ["Initiation à la programmation web","F"],["Formation Cybersécurité pour étudiants","F"],
    ["Cours Introduction au Cloud Computing","F"],["Atelier Méthodologie d'apprentissage en ligne","F"],
    ["Accompagnement technique étudiant","S"],
  ]},
  { name: "Les programmes de formation en health-tech", desc: "Formations en technologies de la santé et innovation médicale", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Télémédecine et e-santé","F"],["Bootcamp Développement d'applications santé","F"],
    ["Formation Gestion de données médicales","F"],["Atelier IoT pour la santé","F"],
    ["Séminaire Innovation santé en Afrique","F"],["Formation IA appliquée à la santé","F"],
    ["Atelier Régulation et éthique en health-tech","F"],["Consultation healthtech startup","S"],
  ]},
  { name: "Le Master en architecture", desc: "Programme de Master en architecture et urbanisme durable pour l'Afrique", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Atelier Conception architecturale durable","F"],["Formation Design bioclimatique et écoconstruction","F"],
    ["Cours Modélisation 3D et BIM","F"],["Séminaire Urbanisme africain contemporain","F"],
    ["Atelier Maquettage et prototypage architectural","F"],["Formation Matériaux locaux et construction","F"],
    ["Revue de projets architecturaux","S"],
  ]},
  { name: "Le service du Digital Learning Lab", desc: "Laboratoire d'innovation pédagogique numérique de Sèmè City", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Conception pédagogique numérique","F"],["Atelier Création de cours en ligne (MOOC)","F"],
    ["Formation Réalité virtuelle appliquée à l'éducation","F"],["Initiation au design UX/UI pédagogique","F"],
    ["Formation Gamification de l'apprentissage","F"],["Atelier Évaluation et analytics éducatifs","F"],
    ["Production de contenus e-learning","S"],["Support technique plateforme d'apprentissage","S"],
  ]},
  { name: "La formation en IA des élèves et enseignements des collèges et lycées", desc: "Programme d'introduction de l'IA dans le système éducatif béninois", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Initiation à la programmation pour collégiens","F"],["Atelier IA pour lycéens - Niveau débutant","F"],
    ["Formation Fondamentaux du Machine Learning pour enseignants","F"],["Atelier Robotique éducative et IA","F"],
    ["Cours NLP et traitement du langage pour enseignants","F"],["Formation Certification enseignants en IA","F"],
    ["Atelier Création de ressources pédagogiques IA","F"],["Accompagnement clubs IA dans les établissements","S"],
  ]},
  { name: "Les Olympiades de l'Intelligence Artificielle (IA)", desc: "Préparation des lycéens béninois aux Olympiades internationales de l'IA", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Fondamentaux de l'IA pour lycéens","F"],["Atelier Programmation Python pour l'IA","F"],
    ["Bootcamp Préparation aux Olympiades internationales","F"],["Formation Machine Learning et Deep Learning","F"],
    ["Atelier NLP et traitement du langage","F"],["Olympiades nationales d'IA - Sélection","F"],
    ["Évaluation et suivi des candidats","S"],
  ]},
  { name: "Les formations en IA/informatique de type École 42 / Zone 01", desc: "Formations intensives en informatique et IA basées sur la pédagogie par projets", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Piscine C - Initiation à la programmation","F"],["Formation Développement web full-stack","F"],
    ["Bootcamp Intelligence Artificielle","F"],["Formation Cybersécurité avancée","F"],
    ["Atelier DevOps et Cloud Computing","F"],["Hackathon IA pour le développement","F"],
    ["Formation Python et Data Science","F"],["Cours Algorithmique et structures de données","F"],
    ["Formation Développement mobile (Flutter/React Native)","F"],["Mentorat technique individuel","S"],
  ]},
  { name: "Les formations de techniciens de laboratoire", desc: "Formations techniques pour les futurs techniciens de laboratoire et la biofabrication", dept: "montage-des-programmes", svc: "adsc-montage-formation", acts: [
    ["Formation Techniques d'analyse biochimique","F"],["Formation Microbiologie appliquée","F"],
    ["Cours Sécurité en laboratoire","F"],["Formation Instrumentation analytique","F"],
    ["Atelier Contrôle qualité et BPF","F"],["Formation Biofabrication et production pharmaceutique","F"],
    ["Calibration et maintenance d'équipements","S"],
  ]},

  // Service: Opération
  { name: "Le service de propédeutique", desc: "Programme préparatoire pour renforcer les bases académiques des apprenants", dept: "montage-des-programmes", svc: "adsc-montage-operation", acts: [
    ["Mise à niveau en mathématiques","F"],["Mise à niveau en physique-chimie","F"],
    ["Renforcement en méthodologie universitaire","F"],["Atelier Rédaction scientifique","F"],
    ["Cours préparatoire en biologie","F"],["Formation Techniques d'apprentissage et gestion du temps","F"],
    ["Orientation académique personnalisée","S"],
  ]},

  // Service: Bibliothèque
  { name: "Le service de bibliothèque", desc: "Bibliothèque et centre de ressources documentaires de Sèmè City", dept: "montage-des-programmes", svc: "adsc-montage-bibliotheque", acts: [
    ["Atelier Recherche documentaire avancée","F"],["Formation Bases de données académiques","F"],
    ["Initiation à la veille informationnelle","F"],["Club de lecture scientifique","F"],
    ["Formation Gestion bibliographique (Zotero)","F"],["Atelier Rédaction d'articles scientifiques","F"],
    ["Consultation bibliographique personnalisée","S"],["Prêt inter-bibliothèques","S"],
  ]},

  // Service: IMA Lingua
  { name: "Le centre de langues, IMA Lingua", desc: "Centre de langues multilingue pour la communauté de Sèmè City et au-delà", dept: "montage-des-programmes", svc: "adsc-montage-ima-lingua", acts: [
    ["Formation Anglais professionnel - Niveau B2","F"],["Cours Français Langue Étrangère - Niveau A2","F"],
    ["Atelier Conversation en mandarin","F"],["Préparation au DELF B1","F"],
    ["Formation Espagnol professionnel","F"],["Cours intensif de portugais","F"],
    ["Atelier Écriture académique en anglais","F"],["Formation Anglais technique pour ingénieurs","F"],
    ["Cours Français des affaires","F"],["Atelier Communication interculturelle","F"],
    ["Évaluation de niveau linguistique","S"],["Traduction certifiée de documents officiels","S"],
  ]},

  // Service: Career Center
  { name: "Le Career Center (service placement)", desc: "Centre de carrière et d'insertion professionnelle des apprenants de Sèmè City", dept: "montage-des-programmes", svc: "adsc-montage-career-center", acts: [
    ["Atelier CV et lettre de motivation","F"],["Simulation d'entretien d'embauche","F"],
    ["Formation Personal Branding et LinkedIn","F"],["Forum entreprises et recrutement","F"],
    ["Formation Entrepreneuriat et Business Plan","F"],["Atelier Techniques de recherche d'emploi","F"],
    ["Formation Communication professionnelle","F"],["Masterclass Reconversion professionnelle","F"],
    ["Coaching carrière individuel","S"],["Mise en relation entreprises-candidats","S"],
  ]},

  // Service: Recrutement Accueil et Mobilité
  { name: "Le service recrutement, accueil et mobilité des apprenants et enseignants", desc: "Service pilotant le parcours des apprenants et enseignants à Sèmè City", dept: "montage-des-programmes", svc: "adsc-montage-recrutement", acts: [
    ["Formation Intégration culturelle","F"],["Atelier Procédures administratives au Bénin","F"],
    ["Formation Droit du travail béninois","F"],["Atelier Networking professionnel","F"],
    ["Formation Gestion de la mobilité internationale","F"],
    ["Assistance visa et titre de séjour","S"],["Accompagnement logement","S"],
    ["Service de relocation internationale","S"],["Accompagnement ouverture de compte bancaire","S"],
  ]},

  // Service: Incubation
  { name: "Sèmè City Film Lab", desc: "Laboratoire de création et expérimentation cinématographique", dept: "montage-des-programmes", svc: "adsc-montage-incubation", acts: [
    ["Résidence de création cinématographique","F"],["Formation Documentaire créatif","F"],
    ["Atelier Courts-métrages","F"],["Workshop Son et design sonore","F"],
    ["Formation Animation pour le cinéma","F"],["Atelier Scénarisation et storyboard","F"],
    ["Projection des films du lab","S"],
  ]},
  { name: "Fashion Led by Youth", desc: "Programme de formation et incubation dans le design de mode pour les jeunes créateurs", dept: "montage-des-programmes", svc: "adsc-montage-incubation", acts: [
    ["Formation Design de mode durable","F"],["Atelier Patronage et couture","F"],
    ["Formation Stylisme et tendances","F"],["Cours Textile et impression","F"],
    ["Atelier Accessoires et maroquinerie","F"],["Formation Business de la mode","F"],
    ["Masterclass Branding de marque de mode","F"],
    ["Défilé et présentation de collections","S"],["Consultation design de mode","S"],
  ]},
  { name: "IncubIMA Animation", desc: "Incubateur spécialisé dans l'animation 2D/3D et le motion design", dept: "montage-des-programmes", svc: "adsc-montage-incubation", acts: [
    ["Formation Animation 2D","F"],["Cours Animation 3D et motion design","F"],
    ["Atelier Character design","F"],["Formation Storyboarding","F"],
    ["Workshop Stop-motion","F"],["Atelier Direction artistique animation","F"],
    ["Revue de portfolio animation","S"],
  ]},
  { name: "IncubIMA Narration", desc: "Incubateur dédié à l'écriture créative et la narration transmédia", dept: "montage-des-programmes", svc: "adsc-montage-incubation", acts: [
    ["Formation Écriture créative","F"],["Atelier Narration transmédia","F"],
    ["Cours Storytelling pour le digital","F"],["Formation Écriture de bande dessinée","F"],
    ["Workshop Slam et spoken word","F"],["Atelier Podcast et narration audio","F"],
    ["Lecture et critique de manuscrits","S"],
  ]},
  { name: "IncubIMA Jeux Vidéo", desc: "Incubateur spécialisé dans la création de jeux vidéo et expériences interactives", dept: "montage-des-programmes", svc: "adsc-montage-incubation", acts: [
    ["Formation Game design et level design","F"],["Cours Programmation de jeux (Unity)","F"],
    ["Atelier Art pour jeux vidéo","F"],["Formation Sound design pour jeux","F"],
    ["Game Jam IncubIMA","F"],["Formation Monétisation et publishing","F"],
    ["Test et feedback de prototypes","S"],
  ]},

  // Service: Montage et validation de programmes
  { name: "L'École des Arts du Bénin", desc: "École de formation aux arts visuels, décoratifs et vivants", dept: "montage-des-programmes", svc: "adsc-montage-validation", acts: [
    ["Formation Arts plastiques contemporains","F"],["Atelier Sculpture et modelage","F"],
    ["Cours Peinture techniques mixtes","F"],["Formation Art numérique et création digitale","F"],
    ["Masterclass Performance artistique","F"],["Atelier Photographie artistique","F"],
    ["Formation Design textile et mode","F"],["Atelier Sérigraphie et gravure","F"],
    ["Exposition et critique d'œuvres","S"],
  ]},
  { name: "L'African Screen Institute", desc: "Institut de formation aux métiers des industries de l'écran", dept: "montage-des-programmes", svc: "adsc-montage-validation", acts: [
    ["Formation Réalisation cinématographique","F"],["Atelier Écriture de scénario","F"],
    ["Formation Production audiovisuelle","F"],["Cours Montage et post-production","F"],
    ["Masterclass Direction d'acteurs","F"],["Formation Animation et VFX","F"],
    ["Atelier Narration et XR","F"],["Projection et analyse de films africains","S"],
  ]},

  // ═══ ADSC / Valorisation des Innovations (8 programs) ══════════════

  // Service: Formation
  { name: "Le baromètre de l'innovation", desc: "Outil de mesure et de valorisation des formes d'innovation africaines", dept: "valorisation-des-innovations", svc: "adsc-valorisation-formation", acts: [
    ["Formation Méthodologie de mesure de l'innovation africaine","F"],
    ["Atelier Conception d'indicateurs d'innovation","F"],
    ["Séminaire Panorama de l'innovation en Afrique de l'Ouest","F"],
    ["Formation Enquêtes de terrain numériques","F"],["Atelier Analyse de données qualitatives","F"],
    ["Publication et diffusion du baromètre","S"],
  ]},
  { name: "Le Ouidah Living Lab", desc: "Laboratoire territorial d'innovation urbaine et environnementale à Ouidah", dept: "valorisation-des-innovations", svc: "adsc-valorisation-formation", acts: [
    ["Formation Méthodologie Living Lab","F"],["Atelier Co-création de solutions urbaines","F"],
    ["Séminaire Assainissement et gestion des déchets","F"],
    ["Formation Éco-construction et matériaux durables","F"],
    ["Atelier Numérisation du patrimoine culturel","F"],
    ["Accompagnement de projets d'innovation locale","S"],["Diagnostic territorial participatif","S"],
  ]},

  // Service: Opération
  { name: "L'IMA Data & Digital Excellence hub", desc: "Hub de services numériques et data/IA pour les entreprises", dept: "valorisation-des-innovations", svc: "adsc-valorisation-operation", acts: [
    ["Formation Développement logiciel selon standards internationaux","F"],
    ["Bootcamp Data Science et IA appliquée","F"],
    ["Formation Services digitaux et opérations data","F"],
    ["Atelier Éthique et gouvernance des données","F"],
    ["Programme d'insertion professionnelle tech","F"],["Formation Data Engineering et pipelines","F"],
    ["Consultation en transformation digitale","S"],["Accompagnement création de startup tech","S"],
  ]},
  { name: "Le programme MIT REAP", desc: "Programme d'élite du MIT pour structurer des écosystèmes d'innovation en santé — partenariat avec le Ministère de la Santé et l'ASIN", dept: "valorisation-des-innovations", svc: "adsc-valorisation-operation", acts: [
    ["Séminaire Structuration d'écosystèmes d'innovation","F"],
    ["Formation Politiques publiques et innovation en santé","F"],
    ["Atelier Méthodologie MIT REAP","F"],
    ["Workshop Alignement acteurs publics-privés-académiques","F"],
    ["Masterclass Accélération HealthTech au Bénin","F"],
    ["Consultation stratégie écosystème innovation","S"],
  ]},

  // Service: Incubation
  // (no specific programs listed for incubation in this dept in the Excel)

  // Service: Développement de solutions
  // (no specific programs listed)

  // Service: TechIMA
  { name: "Les programmes fondamentaux du TechIMA", desc: "Programmes de fabrication numérique du makerspace TechIMA", dept: "valorisation-des-innovations", svc: "adsc-valorisation-techima", acts: [
    ["Formation Impression 3D et prototypage","F"],["Atelier Découpe laser et CNC","F"],
    ["Cours Électronique et Arduino","F"],["Formation CAO/DAO","F"],
    ["Workshop Fabrication de PCB","F"],["Atelier Robotique éducative","F"],
    ["Formation Programmation de microcontrôleurs","F"],["Accès libre au Fab Lab","S"],
  ]},
  { name: "Digital Artisan", desc: "Programme d'accompagnement des artisans dans l'adoption de la fabrication numérique", dept: "valorisation-des-innovations", svc: "adsc-valorisation-techima", acts: [
    ["Formation Fabrication numérique pour artisans du bois","F"],
    ["Atelier Fabrication numérique pour artisans du textile","F"],
    ["Cours Prototypage et développement produit","F"],["Formation Création de marque artisanale","F"],
    ["Atelier Mise en visibilité et e-commerce","F"],["Workshop Design assisté par ordinateur pour artisans","F"],
    ["Consultation projet artisanal numérique","S"],
  ]},
  { name: "TechIMA Seniors", desc: "Programme intergénérationnel de fabrication numérique pour artisans expérimentés", dept: "valorisation-des-innovations", svc: "adsc-valorisation-techima", acts: [
    ["Formation Prototypage pour artisans seniors","F"],
    ["Atelier Transmission intergénérationnelle de savoir-faire","F"],
    ["Cours Introduction à la fabrication numérique","F"],
    ["Formation Compétences pédagogiques pour jeunes mentors","F"],
    ["Workshop Documentation de méthodes artisanales","F"],
    ["Accompagnement personnalisé artisan senior","S"],
  ]},
  { name: "La Fabrique des Métiers d'Art", desc: "Laboratoires dédiés aux métiers d'art, transmission, expérimentation et production", dept: "valorisation-des-innovations", svc: "adsc-valorisation-techima", acts: [
    ["Formation Tissage traditionnel et contemporain","F"],["Atelier Sculpture sur bois","F"],
    ["Formation Poterie et céramique moderne","F"],["Cours Teintures et batik","F"],
    ["Atelier Vannerie et design","F"],["Formation Maroquinerie artisanale","F"],
    ["Atelier Ferronnerie d'art","F"],["Exposition et vente d'œuvres artisanales","S"],
  ]},

  // ═══ SCITI / Département Formation (4 programs) ════════════════════

  { name: "Programme de Licence en Sciences et Technologies", desc: "Formation de premier cycle en sciences et technologies au SCITI", dept: "departement-formation", svc: "sciti-formation-inscription", acts: [
    ["Cours Mathématiques fondamentales","F"],["Formation Physique expérimentale","F"],
    ["Cours Introduction aux sciences de l'ingénieur","F"],["Atelier Programmation scientifique","F"],
    ["Séminaire Méthodologie de recherche","F"],["Évaluation des candidatures","S"],
  ]},
  { name: "Programme de Master en Innovation Technologique", desc: "Formation de deuxième cycle en innovation technologique au SCITI", dept: "departement-formation", svc: "sciti-formation-admission", acts: [
    ["Formation Management de l'innovation","F"],["Cours Propriété intellectuelle et brevets","F"],
    ["Atelier Design thinking et prototypage","F"],["Séminaire Entrepreneuriat technologique","F"],
    ["Formation Financement de l'innovation","F"],["Accompagnement mémoire de recherche","S"],
  ]},
  { name: "Programme de formation continue SCITI", desc: "Formations courtes et certifiantes pour les professionnels", dept: "departement-formation", svc: "sciti-formation-inscription", acts: [
    ["Formation Leadership et gestion d'équipe","F"],["Atelier Transformation digitale","F"],
    ["Cours Gestion de projet agile","F"],["Formation Data Analytics pour managers","F"],
    ["Séminaire Intelligence artificielle pour dirigeants","F"],
    ["Inscription et orientation","S"],["Suivi post-formation","S"],
  ]},
  { name: "Programme d'été SCITI", desc: "Programme intensif d'été en sciences, technologie et innovation", dept: "departement-formation", svc: "sciti-formation-admission", acts: [
    ["Bootcamp Coding intensif","F"],["Atelier Robotique et électronique","F"],
    ["Formation Design et fabrication 3D","F"],["Cours Introduction à l'IA","F"],
    ["Hackathon Innovation sociale","F"],["Sélection et admission des candidats","S"],
  ]},

  // ═══ SCITI / Département Recherche X-TechLab (3 programs) ══════════

  { name: "Programme de recherche appliquée X-TechLab", desc: "Programme de recherche appliquée en technologies émergentes", dept: "departement-recherche-x-techlab", svc: "sciti-recherche-experimentation", acts: [
    ["Formation Méthodologie de recherche appliquée","F"],["Atelier Rédaction d'articles scientifiques","F"],
    ["Séminaire Technologies émergentes en Afrique","F"],["Formation Expérimentation et validation","F"],
    ["Workshop Collaboration recherche-industrie","F"],["Appui technique aux chercheurs","S"],
  ]},
  { name: "Programme de valorisation des résultats de recherche", desc: "Accompagnement à la valorisation et commercialisation des résultats de recherche", dept: "departement-recherche-x-techlab", svc: "sciti-recherche-commercialisation", acts: [
    ["Formation Transfert de technologie","F"],["Atelier Propriété intellectuelle","F"],
    ["Cours Business model pour la recherche","F"],["Formation Pitch et levée de fonds","F"],
    ["Séminaire Partenariats public-privé","F"],["Accompagnement commercialisation","S"],
  ]},
  { name: "Incubateur de projets de recherche X-TechLab", desc: "Incubation de projets issus de la recherche pour les transformer en solutions viables", dept: "departement-recherche-x-techlab", svc: "sciti-recherche-experimentation", acts: [
    ["Formation De la recherche au marché","F"],["Atelier Prototypage rapide","F"],
    ["Cours Validation de marché","F"],["Formation Gestion de projet d'innovation","F"],
    ["Workshop Présentation aux investisseurs","F"],["Mentorat de projet de recherche","S"],
  ]},
];

// ── User definitions ─────────────────────────────────────────────────

// 1 admin per department
const adminDefs: { name: string; email: string; dept: string }[] = [
  { name: "Admin Montage des Programmes", email: "admin.montage@semecity.bj", dept: "montage-des-programmes" },
  { name: "Admin Valorisation des Innovations", email: "admin.valorisation@semecity.bj", dept: "valorisation-des-innovations" },
  { name: "Admin Formation SCITI", email: "admin.formation-sciti@semecity.bj", dept: "departement-formation" },
  { name: "Admin Recherche X-TechLab", email: "admin.recherche@semecity.bj", dept: "departement-recherche-x-techlab" },
];

// 1 responsable per service (18 services)
const respDefs: { name: string; email: string; svc: string }[] = [
  // ADSC / Montage
  { name: "Responsable Formation (Montage)", email: "resp.montage-formation@semecity.bj", svc: "adsc-montage-formation" },
  { name: "Responsable Opération (Montage)", email: "resp.montage-operation@semecity.bj", svc: "adsc-montage-operation" },
  { name: "Responsable Montage et Validation", email: "resp.montage-validation@semecity.bj", svc: "adsc-montage-validation" },
  { name: "Responsable Bibliothèque", email: "resp.bibliotheque@semecity.bj", svc: "adsc-montage-bibliotheque" },
  { name: "Responsable IMA Lingua", email: "resp.ima-lingua@semecity.bj", svc: "adsc-montage-ima-lingua" },
  { name: "Responsable Career Center", email: "resp.career-center@semecity.bj", svc: "adsc-montage-career-center" },
  { name: "Responsable Recrutement Accueil et Mobilité", email: "resp.recrutement@semecity.bj", svc: "adsc-montage-recrutement" },
  { name: "Responsable Incubation (Montage)", email: "resp.montage-incubation@semecity.bj", svc: "adsc-montage-incubation" },
  // ADSC / Valorisation
  { name: "Responsable Opération (Valorisation)", email: "resp.valorisation-operation@semecity.bj", svc: "adsc-valorisation-operation" },
  { name: "Responsable Formation (Valorisation)", email: "resp.valorisation-formation@semecity.bj", svc: "adsc-valorisation-formation" },
  { name: "Responsable Incubation (Valorisation)", email: "resp.valorisation-incubation@semecity.bj", svc: "adsc-valorisation-incubation" },
  { name: "Responsable Développement de Solutions", email: "resp.dev-solutions@semecity.bj", svc: "adsc-valorisation-dev-solutions" },
  { name: "Responsable TechIMA", email: "resp.techima@semecity.bj", svc: "adsc-valorisation-techima" },
  // SCITI / Formation
  { name: "Responsable Inscription", email: "resp.inscription@semecity.bj", svc: "sciti-formation-inscription" },
  { name: "Responsable Admission", email: "resp.admission@semecity.bj", svc: "sciti-formation-admission" },
  // SCITI / Recherche
  { name: "Responsable Appui à l'Expérimentation", email: "resp.experimentation@semecity.bj", svc: "sciti-recherche-experimentation" },
  { name: "Responsable Commercialisation", email: "resp.commercialisation@semecity.bj", svc: "sciti-recherche-commercialisation" },
];

// 2 intervenants per department
const intervenantDefs: { name: string; email: string; dept: string }[] = [
  // ADSC / Montage
  { name: "Dr. Serge AKAKPO", email: "serge.a@semecity.bj", dept: "montage-des-programmes" },
  { name: "Mme. Amara LAWANI", email: "amara.l@semecity.bj", dept: "montage-des-programmes" },
  // ADSC / Valorisation
  { name: "Dr. Patrice GBAGUIDI", email: "patrice.g@semecity.bj", dept: "valorisation-des-innovations" },
  { name: "Mme. Diane MONTCHO", email: "diane.m@semecity.bj", dept: "valorisation-des-innovations" },
  // SCITI / Formation
  { name: "Dr. Aristide HOUNKPATIN", email: "aristide.h@semecity.bj", dept: "departement-formation" },
  { name: "Mme. Chantal DOSSOU", email: "chantal.d@semecity.bj", dept: "departement-formation" },
  // SCITI / Recherche
  { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj", dept: "departement-recherche-x-techlab" },
  { name: "Mme. Irene BANKOLE", email: "irene.b@semecity.bj", dept: "departement-recherche-x-techlab" },
];

// ── Main seed ────────────────────────────────────────────────────────

async function main() {
  console.log("Cleaning existing data...");
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.program.deleteMany();
  await prisma.userService.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  // ── Organizations & Departments & Services ──
  console.log("Creating organizations, departments, services...");
  const deptIdMap: Record<string, string> = {};
  const svcIdMap: Record<string, string> = {};
  const deptSvcIds: Record<string, string[]> = {};

  for (const orgDef of orgDefs) {
    const org = await prisma.organization.create({
      data: { name: orgDef.name, slug: orgDef.slug, description: orgDef.description },
    });

    for (const deptDef of orgDef.departments) {
      const dept = await prisma.department.create({
        data: {
          name: deptDef.name,
          slug: deptDef.slug,
          description: deptDef.description,
          organizationId: org.id,
        },
      });
      deptIdMap[deptDef.slug] = dept.id;
      deptSvcIds[deptDef.slug] = [];

      for (const svcDef of deptDef.services) {
        const svc = await prisma.service.create({
          data: {
            name: svcDef.name,
            slug: svcDef.slug,
            description: svcDef.description,
            departmentId: dept.id,
          },
        });
        svcIdMap[svcDef.slug] = svc.id;
        deptSvcIds[deptDef.slug].push(svc.id);
      }
    }
  }

  // ── Users ──
  console.log("Creating users...");

  // Super admin
  await prisma.user.create({
    data: { name: "Super Administrateur", email: "superadmin@semecity.bj", password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
  });

  // Admins (1 per department)
  for (const a of adminDefs) {
    await prisma.user.create({
      data: { name: a.name, email: a.email, password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
    });
  }

  // Responsables (1 per service, with UserService link)
  const respUsers: { id: string; svcId: string; deptSlug: string }[] = [];
  for (const r of respDefs) {
    const svcId = svcIdMap[r.svc];
    const u = await prisma.user.create({
      data: { name: r.name, email: r.email, password: hashedPassword, role: Role.RESPONSABLE_SERVICE, emailVerified: new Date() },
    });
    await prisma.userService.create({
      data: { userId: u.id, serviceId: svcId },
    });
    // Find the dept slug for this service
    const deptSlug = Object.entries(deptSvcIds).find(([, ids]) => ids.includes(svcId))?.[0] || "";
    respUsers.push({ id: u.id, svcId, deptSlug });
  }

  // Intervenants (2 per department, with UserService for all services in dept)
  const intervenantsByDept: Record<string, string[]> = {};
  for (const i of intervenantDefs) {
    const u = await prisma.user.create({
      data: { name: i.name, email: i.email, password: hashedPassword, role: Role.INTERVENANT, emailVerified: new Date() },
    });
    // Link to all services in their department
    const svcIds = deptSvcIds[i.dept] || [];
    for (const svcId of svcIds) {
      await prisma.userService.create({
        data: { userId: u.id, serviceId: svcId },
      });
    }
    if (!intervenantsByDept[i.dept]) intervenantsByDept[i.dept] = [];
    intervenantsByDept[i.dept].push(u.id);
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
  console.log("Creating programs...");
  const programMap: Record<string, string> = {};
  for (const pd of programDefs) {
    const prog = await prisma.program.create({
      data: {
        name: pd.name,
        description: pd.desc,
        departmentId: deptIdMap[pd.dept],
        serviceId: pd.svc ? svcIdMap[pd.svc] : null,
      },
    });
    programMap[pd.name] = prog.id;
  }

  // ── Activities, Sessions, Attendances, Feedbacks ──
  console.log("Creating activities with sessions, attendances, and feedbacks...");
  const startRange = new Date("2024-01-15");
  const endRange = new Date("2026-02-28");
  const rangeMs = endRange.getTime() - startRange.getTime();

  let totalActivities = 0;
  let totalSessions = 0;
  let totalAttendances = 0;
  let totalFeedbacks = 0;

  for (const pd of programDefs) {
    const deptSlug = pd.dept;
    const serviceId = pd.svc ? svcIdMap[pd.svc] : null;
    const intervenants = intervenantsByDept[deptSlug] || [];
    // Find a responsable for this service (or first in dept)
    const resp = serviceId
      ? respUsers.find((r) => r.svcId === serviceId) || respUsers.find((r) => r.deptSlug === deptSlug)
      : respUsers.find((r) => r.deptSlug === deptSlug);
    if (!resp) { console.warn(`No resp for program ${pd.name}`); continue; }

    const locs = LOCATIONS[deptSlug] || ["Sèmè City"];
    const programId = programMap[pd.name];

    const attendanceBatch: { firstName: string; lastName: string; email: string; phone: string | null; organization: string | null; activityId: string; sessionId: string; createdAt: Date }[] = [];
    const feedbackBatch: Record<string, unknown>[] = [];

    for (let ai = 0; ai < pd.acts.length; ai++) {
      const [title, typeCode] = pd.acts[ai];
      const isFormation = typeCode === "F";
      const actType = isFormation ? "FORMATION" : "SERVICE";

      const activityDate = new Date(
        startRange.getTime() + (rangeMs / pd.acts.length) * ai + randomInt(0, 15) * 86400000
      );

      let status: ActivityStatus = "ACTIVE";
      if (activityDate < new Date("2025-06-01")) status = "CLOSED";
      else if (activityDate > new Date("2026-02-01")) status = "DRAFT";

      const intervenantId = intervenants.length > 0 ? randomChoice(intervenants) : resp.id;
      const location = randomChoice(locs);

      // Session counts: FORMATION 3-15, SERVICE 1-3
      const sessionCount = isFormation ? randomInt(3, 15) : randomInt(1, 3);
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
      const timeSlots: [string, string][] = [
        ["08:00", "12:00"], ["08:30", "12:30"], ["09:00", "13:00"],
        ["14:00", "17:00"], ["14:00", "18:00"], ["14:30", "17:30"],
        ["08:00", "17:00"], ["09:00", "16:00"],
      ];
      const sessions: { id: string; date: Date }[] = [];

      for (let s = 0; s < sessionCount; s++) {
        const sessionDate = new Date(activityDate.getTime() + s * 7 * 86400000);
        const [sTime, eTime] = randomChoice(timeSlots);
        const duration = calcDurationMinutes(sTime, eTime);
        const session = await prisma.activitySession.create({
          data: {
            title: isFormation ? `Séance ${s + 1}` : (sessionCount > 1 ? `Session ${s + 1}` : null),
            startDate: sessionDate,
            endDate: sessionDate,
            startTime: sTime,
            endTime: eTime,
            durationMinutes: duration,
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
                overallRating: randomInt(2, 5), contentRating: randomInt(2, 5),
                organizationRating: randomInt(3, 5),
                comment: randomChoice(formationComments),
                suggestions: randomChoice(formationSuggestions),
                wouldRecommend: Math.random() > 0.18,
                participantName: `${p.firstName} ${p.lastName}`,
                participantEmail: p.email,
                activityId: activity.id, sessionId: sess.id,
                createdAt: new Date(sess.date.getTime() + randomInt(1, 48) * 3600000),
              });
              totalFeedbacks++;
            }
          }
        }
      } else {
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
                overallRating: randomInt(2, 5), contentRating: randomInt(2, 5),
                organizationRating: randomInt(3, 5),
                comment: randomChoice(formationComments),
                suggestions: randomChoice(formationSuggestions),
                wouldRecommend: Math.random() > 0.18,
                participantName: `${p.firstName} ${p.lastName}`,
                participantEmail: p.email,
                activityId: activity.id, sessionId: sess.id,
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
                activityId: activity.id, sessionId: sess.id,
                createdAt: new Date(sess.date.getTime() + randomInt(1, 72) * 3600000),
              });
            }
            totalFeedbacks++;
          }
        }
      }
    }

    // Deduplicate and bulk insert
    const seenAttKeys = new Set<string>();
    const dedupedAtt = attendanceBatch.filter((a) => {
      const key = `${a.sessionId}:${a.email}`;
      if (seenAttKeys.has(key)) return false;
      seenAttKeys.add(key);
      return true;
    });
    const seenFbKeys = new Set<string>();
    const dedupedFb = feedbackBatch.filter((f) => {
      const key = `${f.sessionId}:${f.participantEmail}`;
      if (seenFbKeys.has(key)) return false;
      seenFbKeys.add(key);
      return true;
    });

    for (let i = 0; i < dedupedAtt.length; i += 500) {
      await prisma.attendance.createMany({ data: dedupedAtt.slice(i, i + 500) });
    }
    for (let i = 0; i < dedupedFb.length; i += 500) {
      await prisma.feedback.createMany({ data: dedupedFb.slice(i, i + 500) as any });
    }

    totalAttendances -= (attendanceBatch.length - dedupedAtt.length);
    totalFeedbacks -= (feedbackBatch.length - dedupedFb.length);

    console.log(`  > ${pd.name}: ${pd.acts.length} activities, ${dedupedAtt.length} att, ${dedupedFb.length} fb`);
  }

  console.log("\n=== Seed completed! ===");
  console.log(`  Organizations: ${orgDefs.length}`);
  console.log(`  Departments: ${Object.keys(deptIdMap).length}`);
  console.log(`  Services: ${Object.keys(svcIdMap).length}`);
  console.log(`  Users: ${1 + adminDefs.length + respDefs.length + intervenantDefs.length}`);
  console.log(`  Programs: ${programDefs.length}`);
  console.log(`  Activities: ${totalActivities}`);
  console.log(`  Sessions: ${totalSessions}`);
  console.log(`  Attendances: ${totalAttendances}`);
  console.log(`  Feedbacks: ${totalFeedbacks}`);
  console.log(`\n  Password for all accounts: password123`);
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
