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

// ── Service definitions ──────────────────────────────────────────────

type SvcKey =
  | "programmes-formation"
  | "programmes-incubation"
  | "makerspace-scop"
  | "valorisation-innovation"
  | "ima-lingua"
  | "career-center"
  | "recrutement-mobilite";

const serviceDefs: { key: SvcKey; name: string; slug: string; description: string }[] = [
  { key: "programmes-formation", name: "Service des Programmes de Formation", slug: "programmes-formation", description: "Service de formation et de renforcement des competences" },
  { key: "programmes-incubation", name: "Service des Programmes d'Incubation", slug: "programmes-incubation", description: "Service d'incubation et d'accompagnement des projets creatifs" },
  { key: "makerspace-scop", name: "Makerspace - Seme City Open Park (SCOP)", slug: "makerspace-scop", description: "Tiers-lieu dedie a la fabrication numerique et au prototypage" },
  { key: "valorisation-innovation", name: "Service de Valorisation de l'Innovation", slug: "valorisation-innovation", description: "Service de recherche, experimentation et valorisation de l'innovation" },
  { key: "ima-lingua", name: "IMA Lingua", slug: "ima-lingua", description: "Centre de langues de Seme City" },
  { key: "career-center", name: "Career Center", slug: "career-center", description: "Centre de carriere et d'orientation professionnelle" },
  { key: "recrutement-mobilite", name: "Service Recrutement, Accueil et Mobilite", slug: "recrutement-mobilite", description: "Service de recrutement, accueil et mobilite internationale" },
];

// ── Locations ────────────────────────────────────────────────────────

const LOCATIONS: Record<SvcKey, string[]> = {
  "programmes-formation": [
    "Salle de Formation A - Seme City","Salle de Formation B - Seme City","Salle de Formation C - Seme City",
    "Amphitheatre Seme City","Lab Informatique - Seme City","Salle de classe D - Seme City",
    "Salle Sante - Seme City","Salle Archi - Seme City","Laboratoire Sciences - Seme City",
  ],
  "programmes-incubation": [
    "Studio Film - Seme City","Atelier Couture - Seme City","Studio Animation - Seme City",
    "Salle de Projection - Seme City","Studio Narration - Seme City","Lab Jeux Video - Seme City",
    "Espace Incubation - Seme City","Salle Creative - Seme City",
  ],
  "makerspace-scop": [
    "Fab Lab - Seme City","Atelier Bois - Seme City","Atelier Textile - Seme City",
    "Lab Electronique - Seme City","Atelier Ceramique - Seme City","Espace Prototypage - Seme City",
    "Atelier Metal - Seme City","Salle CNC - Seme City",
  ],
  "valorisation-innovation": [
    "Lab Innovation - Seme City","Salle de Conference - Seme City","Hub Data - Seme City",
    "Espace Co-creation - Seme City","Salle de Recherche - Seme City","Bureau Innovation - Seme City",
  ],
  "ima-lingua": [
    "Salle Lingua A - Seme City","Salle Lingua B - Seme City","Salle Lingua C - Seme City",
    "Bibliotheque Seme City","Lab Digital Lingua - Seme City","Auditorium Seme City",
  ],
  "career-center": [
    "Salle Career A - Seme City","Salle Career B - Seme City","Salle Career C - Seme City",
    "Amphitheatre Seme City","Espace Coworking - Seme City","Hub Innovation - Seme City",
  ],
  "recrutement-mobilite": [
    "Salle Accueil - Seme City","Bureau Recrutement - Seme City","Bureau Mobilite - Seme City",
    "Salle de reunion - Seme City","Guichet Unique - Seme City",
  ],
};

// ── Program + Activity definitions ───────────────────────────────────

type ActDef = [string, "F" | "S"];
interface ProgramDef { name: string; desc: string; svc: SvcKey; acts: ActDef[]; }

const programDefs: ProgramDef[] = [
  // ═══ Training Programs Service (13 programs) ═══════════════════════

  { name: "Le programme IMA leadership", desc: "Programme de developpement du leadership et des competences transversales", svc: "programmes-formation", acts: [
    ["Formation Leadership transformationnel","F"],["Atelier Prise de parole en public","F"],
    ["Formation Gestion de conflits et mediation","F"],["Seminaire Intelligence emotionnelle","F"],
    ["Coaching en leadership de projet","F"],["Masterclass Leadership feminin","F"],
    ["Formation Management interculturel","F"],["Atelier Negociation et influence","F"],
  ]},
  { name: "Les campus connectes", desc: "Programme de formation a distance via les campus connectes de Seme City", svc: "programmes-formation", acts: [
    ["Formation Outils de collaboration en ligne","F"],["Atelier Creation de contenus numeriques","F"],
    ["Initiation a la programmation web","F"],["Formation Cybersecurite pour etudiants","F"],
    ["Cours Introduction au Cloud Computing","F"],["Atelier Methodologie d'apprentissage en ligne","F"],
    ["Accompagnement technique etudiant","S"],
  ]},
  { name: "Les programmes de formation en health-tech", desc: "Formations en technologies de la sante et innovation medicale", svc: "programmes-formation", acts: [
    ["Formation Telemedecine et e-sante","F"],["Bootcamp Developpement d'applications sante","F"],
    ["Formation Gestion de donnees medicales","F"],["Atelier IoT pour la sante","F"],
    ["Seminaire Innovation sante en Afrique","F"],["Formation IA appliquee a la sante","F"],
    ["Atelier Regulation et ethique en health-tech","F"],["Consultation healthtech startup","S"],
  ]},
  { name: "Le Master en architecture", desc: "Programme de Master en architecture et urbanisme durable pour l'Afrique", svc: "programmes-formation", acts: [
    ["Atelier Conception architecturale durable","F"],["Formation Design bioclimatique et ecoconstruction","F"],
    ["Cours Modelisation 3D et BIM","F"],["Seminaire Urbanisme africain contemporain","F"],
    ["Atelier Maquettage et prototypage architectural","F"],["Formation Materiaux locaux et construction","F"],
    ["Revue de projets architecturaux","S"],
  ]},
  { name: "Le service du Digital Learning Lab", desc: "Laboratoire d'innovation pedagogique numerique de Seme City", svc: "programmes-formation", acts: [
    ["Formation Conception pedagogique numerique","F"],["Atelier Creation de cours en ligne (MOOC)","F"],
    ["Formation Realite virtuelle appliquee a l'education","F"],["Initiation au design UX/UI pedagogique","F"],
    ["Formation Gamification de l'apprentissage","F"],["Atelier Evaluation et analytics educatifs","F"],
    ["Production de contenus e-learning","S"],["Support technique plateforme d'apprentissage","S"],
  ]},
  { name: "Le service de bibliotheque", desc: "Bibliotheque et centre de ressources documentaires de Seme City", svc: "programmes-formation", acts: [
    ["Atelier Recherche documentaire avancee","F"],["Formation Bases de donnees academiques","F"],
    ["Initiation a la veille informationnelle","F"],["Club de lecture scientifique","F"],
    ["Formation Gestion bibliographique (Zotero)","F"],["Atelier Redaction d'articles scientifiques","F"],
    ["Consultation bibliographique personnalisee","S"],["Pret inter-bibliotheques","S"],
  ]},
  { name: "Le service de propedeutique", desc: "Programme preparatoire pour renforcer les bases academiques des apprenants", svc: "programmes-formation", acts: [
    ["Mise a niveau en mathematiques","F"],["Mise a niveau en physique-chimie","F"],
    ["Renforcement en methodologie universitaire","F"],["Atelier Redaction scientifique","F"],
    ["Cours preparatoire en biologie","F"],["Formation Techniques d'apprentissage et gestion du temps","F"],
    ["Orientation academique personnalisee","S"],
  ]},
  { name: "Les formations en IA/informatique de type Ecole 42 / Zone 01", desc: "Formations intensives en informatique et IA basees sur la pedagogie par projets", svc: "programmes-formation", acts: [
    ["Piscine C - Initiation a la programmation","F"],["Formation Developpement web full-stack","F"],
    ["Bootcamp Intelligence Artificielle","F"],["Formation Cybersecurite avancee","F"],
    ["Atelier DevOps et Cloud Computing","F"],["Hackathon IA pour le developpement","F"],
    ["Formation Python et Data Science","F"],["Cours Algorithmique et structures de donnees","F"],
    ["Formation Developpement mobile (Flutter/React Native)","F"],["Mentorat technique individuel","S"],
  ]},
  { name: "Les formations de techniciens de laboratoire", desc: "Formations techniques pour les futurs techniciens de laboratoire et la biofabrication", svc: "programmes-formation", acts: [
    ["Formation Techniques d'analyse biochimique","F"],["Formation Microbiologie appliquee","F"],
    ["Cours Securite en laboratoire","F"],["Formation Instrumentation analytique","F"],
    ["Atelier Controle qualite et BPF","F"],["Formation Biofabrication et production pharmaceutique","F"],
    ["Calibration et maintenance d'equipements","S"],
  ]},
  { name: "La formation en IA des eleves et enseignements des colleges et lycees", desc: "Programme d'introduction de l'IA dans le systeme educatif beninois", svc: "programmes-formation", acts: [
    ["Formation Initiation a la programmation pour collegiens","F"],["Atelier IA pour lyceens - Niveau debutant","F"],
    ["Formation Fondamentaux du Machine Learning pour enseignants","F"],["Atelier Robotique educative et IA","F"],
    ["Cours NLP et traitement du langage pour enseignants","F"],["Formation Certification enseignants en IA","F"],
    ["Atelier Creation de ressources pedagogiques IA","F"],["Accompagnement clubs IA dans les etablissements","S"],
  ]},
  { name: "Les Olympiades de l'Intelligence Artificielle (IA)", desc: "Preparation des lyceens beninois aux Olympiades internationales de l'IA", svc: "programmes-formation", acts: [
    ["Formation Fondamentaux de l'IA pour lyceens","F"],["Atelier Programmation Python pour l'IA","F"],
    ["Bootcamp Preparation aux Olympiades internationales","F"],["Formation Machine Learning et Deep Learning","F"],
    ["Atelier NLP et traitement du langage","F"],["Olympiades nationales d'IA - Selection","F"],
    ["Evaluation et suivi des candidats","S"],
  ]},
  { name: "L'Ecole des Arts du Benin", desc: "Ecole de formation aux arts visuels, decoratifs et vivants", svc: "programmes-formation", acts: [
    ["Formation Arts plastiques contemporains","F"],["Atelier Sculpture et modelage","F"],
    ["Cours Peinture techniques mixtes","F"],["Formation Art numerique et creation digitale","F"],
    ["Masterclass Performance artistique","F"],["Atelier Photographie artistique","F"],
    ["Formation Design textile et mode","F"],["Atelier Serigraphie et gravure","F"],
    ["Exposition et critique d'oeuvres","S"],
  ]},
  { name: "L'African Screen Institute", desc: "Institut de formation aux metiers des industries de l'ecran", svc: "programmes-formation", acts: [
    ["Formation Realisation cinematographique","F"],["Atelier Ecriture de scenario","F"],
    ["Formation Production audiovisuelle","F"],["Cours Montage et post-production","F"],
    ["Masterclass Direction d'acteurs","F"],["Formation Animation et VFX","F"],
    ["Atelier Narration et XR","F"],["Projection et analyse de films africains","S"],
  ]},

  // ═══ Incubation Programs Service (5 programs) ═════════════════════

  { name: "Seme City Film Lab", desc: "Laboratoire de creation et experimentation cinematographique", svc: "programmes-incubation", acts: [
    ["Residence de creation cinematographique","F"],["Formation Documentaire creatif","F"],
    ["Atelier Courts-metrages","F"],["Workshop Son et design sonore","F"],
    ["Formation Animation pour le cinema","F"],["Atelier Scenarisation et storyboard","F"],
    ["Projection des films du lab","S"],
  ]},
  { name: "Fashion Led by Youth", desc: "Programme de formation et incubation dans le design de mode pour les jeunes createurs", svc: "programmes-incubation", acts: [
    ["Formation Design de mode durable","F"],["Atelier Patronage et couture","F"],
    ["Formation Stylisme et tendances","F"],["Cours Textile et impression","F"],
    ["Atelier Accessoires et maroquinerie","F"],["Formation Business de la mode","F"],
    ["Masterclass Branding de marque de mode","F"],
    ["Defile et presentation de collections","S"],["Consultation design de mode","S"],
  ]},
  { name: "IncubIMA Animation", desc: "Incubateur specialise dans l'animation 2D/3D et le motion design", svc: "programmes-incubation", acts: [
    ["Formation Animation 2D","F"],["Cours Animation 3D et motion design","F"],
    ["Atelier Character design","F"],["Formation Storyboarding","F"],
    ["Workshop Stop-motion","F"],["Atelier Direction artistique animation","F"],
    ["Revue de portfolio animation","S"],
  ]},
  { name: "IncubIMA Narration", desc: "Incubateur dedie a l'ecriture creative et la narration transmedia", svc: "programmes-incubation", acts: [
    ["Formation Ecriture creative","F"],["Atelier Narration transmedia","F"],
    ["Cours Storytelling pour le digital","F"],["Formation Ecriture de bande dessinee","F"],
    ["Workshop Slam et spoken word","F"],["Atelier Podcast et narration audio","F"],
    ["Lecture et critique de manuscrits","S"],
  ]},
  { name: "IncubIMA Jeux Video", desc: "Incubateur specialise dans la creation de jeux video et experiences interactives", svc: "programmes-incubation", acts: [
    ["Formation Game design et level design","F"],["Cours Programmation de jeux (Unity)","F"],
    ["Atelier Art pour jeux video","F"],["Formation Sound design pour jeux","F"],
    ["Game Jam IncubIMA","F"],["Formation Monetisation et publishing","F"],
    ["Test et feedback de prototypes","S"],
  ]},

  // ═══ Makerspace – SCOP (4 programs) ═══════════════════════════════

  { name: "Les programmes fondamentaux du TechIMA", desc: "Programmes de fabrication numerique du makerspace TechIMA", svc: "makerspace-scop", acts: [
    ["Formation Impression 3D et prototypage","F"],["Atelier Decoupe laser et CNC","F"],
    ["Cours Electronique et Arduino","F"],["Formation CAO/DAO","F"],
    ["Workshop Fabrication de PCB","F"],["Atelier Robotique educative","F"],
    ["Formation Programmation de microcontroleurs","F"],["Acces libre au Fab Lab","S"],
  ]},
  { name: "Digital Artisan", desc: "Programme d'accompagnement des artisans dans l'adoption de la fabrication numerique", svc: "makerspace-scop", acts: [
    ["Formation Fabrication numerique pour artisans du bois","F"],
    ["Atelier Fabrication numerique pour artisans du textile","F"],
    ["Cours Prototypage et developpement produit","F"],["Formation Creation de marque artisanale","F"],
    ["Atelier Mise en visibilite et e-commerce","F"],["Workshop Design assiste par ordinateur pour artisans","F"],
    ["Consultation projet artisanal numerique","S"],
  ]},
  { name: "TechIMA Seniors", desc: "Programme intergenerationnel de fabrication numerique pour artisans experimentes", svc: "makerspace-scop", acts: [
    ["Formation Prototypage pour artisans seniors","F"],
    ["Atelier Transmission intergenerationnelle de savoir-faire","F"],
    ["Cours Introduction a la fabrication numerique","F"],
    ["Formation Competences pedagogiques pour jeunes mentors","F"],
    ["Workshop Documentation de methodes artisanales","F"],
    ["Accompagnement personnalise artisan senior","S"],
  ]},
  { name: "La Fabrique des Metiers d'Art", desc: "Laboratoires dedies aux metiers d'art, transmission, experimentation et production", svc: "makerspace-scop", acts: [
    ["Formation Tissage traditionnel et contemporain","F"],["Atelier Sculpture sur bois","F"],
    ["Formation Poterie et ceramique moderne","F"],["Cours Teintures et batik","F"],
    ["Atelier Vannerie et design","F"],["Formation Maroquinerie artisanale","F"],
    ["Atelier Ferronnerie d'art","F"],["Exposition et vente d'oeuvres artisanales","S"],
  ]},

  // ═══ Innovation Valorization Service (4 programs) ═════════════════

  { name: "Le barometre de l'innovation", desc: "Outil de mesure et de valorisation des formes d'innovation africaines", svc: "valorisation-innovation", acts: [
    ["Formation Methodologie de mesure de l'innovation africaine","F"],
    ["Atelier Conception d'indicateurs d'innovation","F"],
    ["Seminaire Panorama de l'innovation en Afrique de l'Ouest","F"],
    ["Formation Enquetes de terrain numeriques","F"],["Atelier Analyse de donnees qualitatives","F"],
    ["Publication et diffusion du barometre","S"],
  ]},
  { name: "Le Ouidah Living Lab", desc: "Laboratoire territorial d'innovation urbaine et environnementale a Ouidah", svc: "valorisation-innovation", acts: [
    ["Formation Methodologie Living Lab","F"],["Atelier Co-creation de solutions urbaines","F"],
    ["Seminaire Assainissement et gestion des dechets","F"],
    ["Formation Eco-construction et materiaux durables","F"],
    ["Atelier Numerisation du patrimoine culturel","F"],
    ["Accompagnement de projets d'innovation locale","S"],["Diagnostic territorial participatif","S"],
  ]},
  { name: "L'IMA Data & Digital Excellence hub", desc: "Hub de services numeriques et data/IA pour les entreprises", svc: "valorisation-innovation", acts: [
    ["Formation Developpement logiciel selon standards internationaux","F"],
    ["Bootcamp Data Science et IA appliquee","F"],
    ["Formation Services digitaux et operations data","F"],
    ["Atelier Ethique et gouvernance des donnees","F"],
    ["Programme d'insertion professionnelle tech","F"],["Formation Data Engineering et pipelines","F"],
    ["Consultation en transformation digitale","S"],["Accompagnement creation de startup tech","S"],
  ]},
  { name: "Le programme MIT REAP - partenariat avec le Ministere de la Sante et l'ASIN", desc: "Programme d'elite du MIT pour structurer des ecosystemes d'innovation en sante", svc: "valorisation-innovation", acts: [
    ["Seminaire Structuration d'ecosystemes d'innovation","F"],
    ["Formation Politiques publiques et innovation en sante","F"],
    ["Atelier Methodologie MIT REAP","F"],
    ["Workshop Alignement acteurs publics-prives-academiques","F"],
    ["Masterclass Acceleration HealthTech au Benin","F"],
    ["Consultation strategie ecosysteme innovation","S"],
  ]},

  // ═══ IMA Lingua (1 program) ═══════════════════════════════════════

  { name: "Le centre de langues, IMA Lingua", desc: "Centre de langues multilingue pour la communaute de Seme City et au-dela", svc: "ima-lingua", acts: [
    ["Formation Anglais professionnel - Niveau B2","F"],["Cours Francais Langue Etrangere - Niveau A2","F"],
    ["Atelier Conversation en mandarin","F"],["Preparation au DELF B1","F"],
    ["Formation Espagnol professionnel","F"],["Cours intensif de portugais","F"],
    ["Atelier Ecriture academique en anglais","F"],["Formation Anglais technique pour ingenieurs","F"],
    ["Cours Francais des affaires","F"],["Atelier Communication interculturelle","F"],
    ["Evaluation de niveau linguistique","S"],["Traduction certifiee de documents officiels","S"],
  ]},

  // ═══ Career Center (1 program) ════════════════════════════════════

  { name: "Le Career Center (service placement)", desc: "Centre de carriere et d'insertion professionnelle des apprenants de Seme City", svc: "career-center", acts: [
    ["Atelier CV et lettre de motivation","F"],["Simulation d'entretien d'embauche","F"],
    ["Formation Personal Branding et LinkedIn","F"],["Forum entreprises et recrutement","F"],
    ["Formation Entrepreneuriat et Business Plan","F"],["Atelier Techniques de recherche d'emploi","F"],
    ["Formation Communication professionnelle","F"],["Masterclass Reconversion professionnelle","F"],
    ["Coaching carriere individuel","S"],["Mise en relation entreprises-candidats","S"],
  ]},

  // ═══ Recrutement, Accueil et Mobilité (1 program) ═════════════════

  { name: "Le service recrutement, accueil et mobilite des apprenants et enseignants", desc: "Service pilotant le parcours des apprenants et enseignants a Seme City", svc: "recrutement-mobilite", acts: [
    ["Formation Integration culturelle","F"],["Atelier Procedures administratives au Benin","F"],
    ["Formation Droit du travail beninois","F"],["Atelier Networking professionnel","F"],
    ["Formation Gestion de la mobilite internationale","F"],
    ["Assistance visa et titre de sejour","S"],["Accompagnement logement","S"],
    ["Service de relocation internationale","S"],["Accompagnement ouverture de compte bancaire","S"],
  ]},
];

// ── User definitions ─────────────────────────────────────────────────

const adminDefs = [
  { name: "Admin Programmes de Formation", email: "admin.formation@semecity.bj" },
  { name: "Admin Programmes d'Incubation", email: "admin.incubation@semecity.bj" },
  { name: "Admin Makerspace SCOP", email: "admin.makerspace@semecity.bj" },
  { name: "Admin Valorisation Innovation", email: "admin.innovation@semecity.bj" },
  { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
  { name: "Admin Career Center", email: "admin.career@semecity.bj" },
  { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
];

const respDefs: { name: string; email: string; svc: SvcKey }[] = [
  { name: "Responsable Programmes de Formation", email: "resp.formation@semecity.bj", svc: "programmes-formation" },
  { name: "Responsable Programmes d'Incubation", email: "resp.incubation@semecity.bj", svc: "programmes-incubation" },
  { name: "Responsable Makerspace SCOP", email: "resp.makerspace@semecity.bj", svc: "makerspace-scop" },
  { name: "Responsable Valorisation Innovation", email: "resp.innovation@semecity.bj", svc: "valorisation-innovation" },
  { name: "Responsable IMA Lingua", email: "resp.lingua@semecity.bj", svc: "ima-lingua" },
  { name: "Responsable Career Center", email: "resp.career@semecity.bj", svc: "career-center" },
  { name: "Responsable Recrutement", email: "resp.recrutement@semecity.bj", svc: "recrutement-mobilite" },
];

const intervenantDefs: { name: string; email: string; svc: SvcKey }[] = [
  // Training (3)
  { name: "Dr. Serge AKAKPO", email: "serge.a@semecity.bj", svc: "programmes-formation" },
  { name: "Mme. Amara LAWANI", email: "amara.l@semecity.bj", svc: "programmes-formation" },
  { name: "M. Edmond CHABI", email: "edmond.c@semecity.bj", svc: "programmes-formation" },
  // Incubation (2)
  { name: "M. Yves HOUESSOU", email: "yves.h@semecity.bj", svc: "programmes-incubation" },
  { name: "Mme. Flora OSSENI", email: "flora.o@semecity.bj", svc: "programmes-incubation" },
  // Makerspace (2)
  { name: "M. Bruno ELEGBE", email: "bruno.e@semecity.bj", svc: "makerspace-scop" },
  { name: "Mme. Simone FAGNON", email: "simone.f@semecity.bj", svc: "makerspace-scop" },
  // Innovation (2)
  { name: "Dr. Patrice GBAGUIDI", email: "patrice.g@semecity.bj", svc: "valorisation-innovation" },
  { name: "Mme. Diane MONTCHO", email: "diane.m@semecity.bj", svc: "valorisation-innovation" },
  // IMA Lingua (2)
  { name: "Dr. Aristide HOUNKPATIN", email: "aristide.h@semecity.bj", svc: "ima-lingua" },
  { name: "Mme. Chantal DOSSOU", email: "chantal.d@semecity.bj", svc: "ima-lingua" },
  // Career Center (2)
  { name: "M. Fabrice ADJOVI", email: "fabrice.a@semecity.bj", svc: "career-center" },
  { name: "Mme. Irene BANKOLE", email: "irene.b@semecity.bj", svc: "career-center" },
  // Recrutement (2)
  { name: "M. Koffi MENSAH", email: "koffi.m@semecity.bj", svc: "recrutement-mobilite" },
  { name: "Mme. Nadege QUENUM", email: "nadege.q@semecity.bj", svc: "recrutement-mobilite" },
];

// ── Main seed ────────────────────────────────────────────────────────

async function main() {
  console.log("Cleaning existing activity data...");
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.program.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  // ── Services ──
  console.log("Creating services...");
  const serviceMap: Record<SvcKey, string> = {} as any;
  for (const sd of serviceDefs) {
    const svc = await prisma.service.upsert({
      where: { slug: sd.slug },
      update: {},
      create: { name: sd.name, slug: sd.slug, description: sd.description },
    });
    serviceMap[sd.key] = svc.id;
  }

  // ── Users ──
  console.log("Creating users...");

  // Super admin
  await prisma.user.upsert({
    where: { email: "superadmin@semecity.bj" },
    update: { password: hashedPassword, emailVerified: new Date() },
    create: { name: "Super Administrateur", email: "superadmin@semecity.bj", password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
  });

  // Admins
  for (const a of adminDefs) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { password: hashedPassword, emailVerified: new Date() },
      create: { ...a, password: hashedPassword, role: Role.ADMIN, emailVerified: new Date() },
    });
  }

  // Responsables
  const respUsers: { id: string; svcId: string }[] = [];
  for (const r of respDefs) {
    const svcId = serviceMap[r.svc];
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: { password: hashedPassword, emailVerified: new Date() },
      create: { name: r.name, email: r.email, password: hashedPassword, role: Role.RESPONSABLE_SERVICE, emailVerified: new Date() },
    });
    await prisma.userService.upsert({
      where: { userId_serviceId: { userId: u.id, serviceId: svcId } },
      update: {},
      create: { userId: u.id, serviceId: svcId },
    });
    respUsers.push({ id: u.id, svcId });
  }

  // Intervenants
  const intervenantsBySvc: Record<string, string[]> = {};
  for (const i of intervenantDefs) {
    const svcId = serviceMap[i.svc];
    const u = await prisma.user.upsert({
      where: { email: i.email },
      update: { password: hashedPassword, emailVerified: new Date() },
      create: { name: i.name, email: i.email, password: hashedPassword, role: Role.INTERVENANT, emailVerified: new Date() },
    });
    await prisma.userService.upsert({
      where: { userId_serviceId: { userId: u.id, serviceId: svcId } },
      update: {},
      create: { userId: u.id, serviceId: svcId },
    });
    if (!intervenantsBySvc[svcId]) intervenantsBySvc[svcId] = [];
    intervenantsBySvc[svcId].push(u.id);
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
      data: { name: pd.name, description: pd.desc, serviceId: serviceMap[pd.svc] },
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
      const timeVariations = ["08:00", "08:30", "09:00", "09:30", "10:00"];
      const endTimeVariations = ["16:00", "16:30", "17:00", "17:30", "18:00"];
      const sessions: { id: string; date: Date }[] = [];

      for (let s = 0; s < sessionCount; s++) {
        const sessionDate = new Date(activityDate.getTime() + s * 7 * 86400000);
        const sTime = randomChoice(timeVariations);
        const eTime = randomChoice(endTimeVariations);
        const session = await prisma.activitySession.create({
          data: {
            title: isFormation ? `Seance ${s + 1}` : (sessionCount > 1 ? `Session ${s + 1}` : null),
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
  console.log(`  Services: ${serviceDefs.length}`);
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
