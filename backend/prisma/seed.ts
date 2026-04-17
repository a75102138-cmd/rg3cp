import {
  DecisionStatus,
  DecisionType,
  ElementType,
  FileKind,
  HeritageSensitivity,
  InterventionStatus,
  InterventionType,
  LabTestResult,
  LabTestType,
  ObservationType,
  PathologyType,
  ProjectStatus,
  RiskCategory,
  RiskImpact,
  RiskProbability,
  RiskStatus,
  SeverityLevel,
  UserRole,
  WeatherType,
  ZoneType,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Demo projects: re-seed removes and recreates this slice (other DB rows are kept). */
const DEMO_PROJECT_CODES = [
  'PROJ-TINMEL-26',
  'PROJ-QARAWIYYIN-25',
  'PROJ-KSAR-ATLAS-24',
  'PROJ-ETA-2025',
] as const;

function placeholderDoc(projectCode: string, slug: string) {
  const publicId = `seed/${projectCode}/documents/${slug.replace(/[^a-z0-9_-]/gi, '_')}`;
  return {
    fileKind: FileKind.REPORT,
    originalFilename: `${slug}.pdf`,
    mimeType: 'application/pdf',
    url: `https://res.cloudinary.com/demo/raw/upload/v1/${publicId}`,
    secureUrl: `https://res.cloudinary.com/demo/raw/upload/v1/${publicId}`,
    publicId,
    assetFolder: `projects/${projectCode}/documents`,
  };
}

function placeholderPhoto(projectCode: string, zoneCode: string, slug: string, caption: string) {
  const publicId = `seed/${projectCode}/zones/${zoneCode}/photos/${slug}`;
  return {
    fileKind: FileKind.PHOTO,
    originalFilename: `${slug}.jpg`,
    mimeType: 'image/jpeg',
    url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}`,
    secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}`,
    publicId,
    assetFolder: `projects/${projectCode}/zones/${zoneCode}/photos`,
    caption,
  };
}

async function wipeDemoProjects(): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { code: { in: [...DEMO_PROJECT_CODES] } },
    select: { id: true },
  });
  const projIds = projects.map((p) => p.id);
  if (!projIds.length) return;

  const zones = await prisma.zone.findMany({
    where: { projectId: { in: projIds } },
    select: { id: true },
  });
  const zoneIds = zones.map((z) => z.id);

  await prisma.labTest.deleteMany({ where: { zoneId: { in: zoneIds } } });

  await prisma.decision.updateMany({
    where: { zoneId: { in: zoneIds } },
    data: { pvDocumentId: null },
  });

  await prisma.document.deleteMany({
    where: {
      OR: [
        { projectId: { in: projIds } },
        { zoneId: { in: zoneIds } },
        { observation: { zoneId: { in: zoneIds } } },
        { pathology: { zoneId: { in: zoneIds } } },
        { decision: { zoneId: { in: zoneIds } } },
        { intervention: { zoneId: { in: zoneIds } } },
      ],
    },
  });

  await prisma.photo.deleteMany({
    where: {
      OR: [
        { projectId: { in: projIds } },
        { zoneId: { in: zoneIds } },
        { observation: { zoneId: { in: zoneIds } } },
        { pathology: { zoneId: { in: zoneIds } } },
        { intervention: { zoneId: { in: zoneIds } } },
      ],
    },
  });

  await prisma.risk.deleteMany({
    where: {
      OR: [{ projectId: { in: projIds } }, { zoneId: { in: zoneIds } }],
    },
  });

  await prisma.logbook.deleteMany({ where: { projectId: { in: projIds } } });
  await prisma.project.deleteMany({ where: { id: { in: projIds } } });
}

/** Compte ADMIN pour connexion initiale (mot de passe via SEED_ADMIN_PASSWORD). */
async function seedPlatformAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@g3c.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      code: 'USR-SEED-ADMIN',
      firstName: 'Admin',
      lastName: 'Plateforme',
      email,
      passwordHash: hash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    update: {},
  });
}

async function main(): Promise<void> {
  await seedPlatformAdmin();
  await wipeDemoProjects();

  const NAME = {
    arch: 'Atelier Bennani — Architecte du patrimoine',
    lab: 'Laboratoire de recherche des monuments historiques',
    ent: 'Entreprise Ighil — Maçonnerie de pierre',
    cons: 'Fatima Alaoui',
    ing: 'Bureau GEC Structure',
    moa: 'Habous — Chantier Tinmel',
    geo: 'Cabinet de géométrie El Maghribi',
    photo: 'Studio Aziza — Documentation photographique',
  } as const;

  const matPierre = await prisma.material.upsert({
    where: { code: 'MAT-PIERRE-CALCAIRE' },
    update: {
      type: 'STONE',
      origin: 'Haut Atlas',
      compatibility: 'Compatible chaux hydraulique faible dosage',
    },
    create: {
      code: 'MAT-PIERRE-CALCAIRE',
      name: 'Pierre calcaire locale',
      type: 'STONE',
      origin: 'Haut Atlas',
      compatibility: 'Compatible chaux hydraulique faible dosage',
    },
  });

  const matTerre = await prisma.material.upsert({
    where: { code: 'MAT-Terre-crue' },
    update: {
      type: 'EARTH',
      origin: 'Carrière locale Haut Atlas',
      compatibility: 'Compatible chaux hydraulique faible dosage',
    },
    create: {
      code: 'MAT-Terre-crue',
      name: 'Terre crue / pisé',
      type: 'EARTH',
      origin: 'Carrière locale Haut Atlas',
      compatibility: 'Compatible chaux hydraulique faible dosage',
    },
  });

  const matBois = await prisma.material.upsert({
    where: { code: 'MAT-BOIS-CEDRE' },
    update: {
      type: 'WOOD',
      origin: 'Cèdre de l’Atlas',
      compatibility: 'Traitement fongicide avant pose',
    },
    create: {
      code: 'MAT-BOIS-CEDRE',
      name: 'Bois de cèdre (charpente)',
      type: 'WOOD',
      origin: 'Cèdre de l’Atlas',
      compatibility: 'Traitement fongicide avant pose',
    },
  });

  const matStuc = await prisma.material.upsert({
    where: { code: 'MAT-STUC-PLAT' },
    update: {
      type: 'MORTAR',
      origin: 'Atelier Fès',
      compatibility: 'Sous-couche chaux sable compatible',
    },
    create: {
      code: 'MAT-STUC-PLAT',
      name: 'Stuc sculpté',
      type: 'MORTAR',
      origin: 'Atelier Fès',
      compatibility: 'Sous-couche chaux sable compatible',
    },
  });

  const projTinmel = await prisma.project.create({
    data: {
      code: 'PROJ-TINMEL-26',
      name: 'Mosquée de Tinmel — consolidation et mise en valeur',
      description:
        'Chantier patrimonial sur l’ancienne mosquée almohade : diagnostic structure, traitement de l’humidité, relevés des fissures et consolidation des maçonneries d’enceinte et du minaret.',
      location: 'Tinmel, Haut Atlas, Maroc',
      imageUrl:
        'https://images.unsplash.com/photo-1564769625905-50d53657e81c?auto=format&fit=crop&w=1400&q=80',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2026-01-08'),
      plannedEndDate: new Date('2027-12-15'),
    },
  });

  const projQara = await prisma.project.create({
    data: {
      code: 'PROJ-QARAWIYYIN-25',
      name: 'Al-Qaraouiyine — préservation des espaces de prière',
      description:
        'Campagne de surveillance des facades intérieures, micro-fissuration plâtres, et arbitrages de consolidation non invasifs.',
      location: 'Fès, Maroc',
      imageUrl:
        'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2025-06-01'),
      plannedEndDate: new Date('2026-11-30'),
    },
  });

  const projKsar = await prisma.project.create({
    data: {
      code: 'PROJ-KSAR-ATLAS-24',
      name: 'Ksar du Haut Atlas — enceintes et habitations',
      description:
        'Restauration participative des tours d’angle, reprises en terre-pisé, et sécurisation des galeries d’accès.',
      location: 'Vallée de l’Ourika, Haut Atlas',
      imageUrl:
        'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1400&q=80',
      status: ProjectStatus.ON_HOLD,
      startDate: new Date('2024-09-15'),
      plannedEndDate: new Date('2026-03-31'),
    },
  });

  type Z = {
    code: string;
    name: string;
    type: ZoneType;
    parent?: string;
    sen?: HeritageSensitivity;
  };

  const tinZones: Z[] = [
    { code: 'TIN-Z-SITE', name: 'Emprise monumentale', type: ZoneType.SECTION, sen: HeritageSensitivity.CRITICAL },
    { code: 'TIN-Z-MIN', name: 'Minaret', type: ZoneType.COLUMN, parent: 'TIN-Z-SITE', sen: HeritageSensitivity.HIGH },
    { code: 'TIN-Z-F-SUD', name: 'Façade sud — portique', type: ZoneType.WALL, parent: 'TIN-Z-SITE' },
    { code: 'TIN-Z-F-NORD', name: 'Façade nord — face vallée', type: ZoneType.WALL, parent: 'TIN-Z-SITE' },
    { code: 'TIN-Z-SDP', name: 'Salle de prière', type: ZoneType.ROOM, parent: 'TIN-Z-SITE', sen: HeritageSensitivity.HIGH },
    { code: 'TIN-Z-COUR', name: 'Cour et ablutions', type: ZoneType.SECTION, parent: 'TIN-Z-SITE' },
    { code: 'TIN-Z-ARC', name: 'Arcades côté cour', type: ZoneType.ARCADE, parent: 'TIN-Z-COUR' },
    { code: 'TIN-Z-MUR', name: 'Mur d’enceinte — courtine nord', type: ZoneType.PERIPHERAL_WALL, parent: 'TIN-Z-SITE' },
  ];

  const qaraZones: Z[] = [
    { code: 'QAR-Z-SDP', name: 'Salle de prière principale', type: ZoneType.ROOM, sen: HeritageSensitivity.CRITICAL },
    { code: 'QAR-Z-FQ', name: 'Façade Qibla — niche', type: ZoneType.WALL },
    { code: 'QAR-Z-GRN', name: 'Galerie nord', type: ZoneType.ROOM },
    { code: 'QAR-Z-COUR', name: 'Cour des ablutions', type: ZoneType.SECTION },
  ];

  const ksarZones: Z[] = [
    { code: 'KSR-Z-SITE', name: 'Ksar — emprise', type: ZoneType.SECTION },
    { code: 'KSR-Z-TOR', name: 'Tour d’angle ouest', type: ZoneType.COLUMN, parent: 'KSR-Z-SITE' },
    { code: 'KSR-Z-RUE', name: 'Rue intérieure couverte', type: ZoneType.SECTION, parent: 'KSR-Z-SITE' },
    { code: 'KSR-Z-HAB', name: 'Habitation témoin', type: ZoneType.ROOM, parent: 'KSR-Z-SITE' },
  ];

  async function seedZones(projectId: string, defs: Z[], projectCode: string) {
    const byCode = new Map<string, { id: string }>();
    for (const d of defs) {
      const z = await prisma.zone.create({
        data: {
          projectId,
          parentZoneId: d.parent ? byCode.get(d.parent)!.id : null,
          code: d.code,
          name: d.name,
          zoneType: d.type,
          heritageSensitivity: d.sen ?? null,
          description: `Zone chantier ${projectCode} — ${d.name}.`,
        },
      });
      byCode.set(d.code, z);
    }
    return byCode;
  }

  const tin = await seedZones(projTinmel.id, tinZones, 'PROJ-TINMEL-26');
  const qar = await seedZones(projQara.id, qaraZones, 'PROJ-QARAWIYYIN-25');
  const ksr = await seedZones(projKsar.id, ksarZones, 'PROJ-KSAR-ATLAS-24');

  const el = (
    zoneId: string,
    code: string,
    name: string,
    type: ElementType,
    materialId?: string,
  ) =>
    prisma.element.create({
      data: {
        zoneId,
        code,
        name,
        elementType: type,
        materialId: materialId ?? null,
        description: `Élément ${code}`,
      },
    });

  const tinE1 = await el(
    tin.get('TIN-Z-MUR')!.id,
    'TIN-EL-MN1',
    'Maçonnerie courtine nord',
    ElementType.WALL,
    matPierre.id,
  );
  const tinE2 = await el(
    tin.get('TIN-Z-MIN')!.id,
    'TIN-EL-MIN-SHAFT',
    'Fût du minaret',
    ElementType.STRUCTURAL_MEMBER,
    matPierre.id,
  );
  const tinE3 = await el(
    tin.get('TIN-Z-SDP')!.id,
    'TIN-EL-PLAT',
    'Plafond stuc',
    ElementType.DECORATIVE_FEATURE,
    matStuc.id,
  );
  const tinE4 = await el(
    tin.get('TIN-Z-F-SUD')!.id,
    'TIN-EL-OUV',
    'Porte bois historique',
    ElementType.JOINERY,
    matBois.id,
  );
  const qarE1 = await el(
    qar.get('QAR-Z-SDP')!.id,
    'QAR-EL-MUQ',
    'Mur de la niche — enduit',
    ElementType.WALL,
    matStuc.id,
  );
  const qarE2 = await el(
    qar.get('QAR-Z-FQ')!.id,
    'QAR-EL-FEN',
    'Fenêtre haute de ventilation',
    ElementType.JOINERY,
    matBois.id,
  );
  const ksrE1 = await el(
    ksr.get('KSR-Z-TOR')!.id,
    'KSR-EL-TOR-BASE',
    'Base en pisé — tour',
    ElementType.WALL,
    matTerre.id,
  );
  const ksrE2 = await el(
    ksr.get('KSR-Z-HAB')!.id,
    'KSR-EL-MUR-FAC',
    'Façade rue intérieure',
    ElementType.WALL,
    matTerre.id,
  );

  type ObsIn = {
    zoneCode: string;
    code: string;
    title: string;
    type: ObservationType;
    sev?: SeverityLevel;
    elementId?: string;
    at: string;
    desc: string;
  };

  async function seedObs(map: Map<string, { id: string }>, projectCode: string, list: ObsIn[], authorName: string) {
    const out: { id: string; code: string; zoneId: string; title: string }[] = [];
    for (const o of list) {
      const zid = map.get(o.zoneCode)!.id;
      const r = await prisma.observation.create({
        data: {
          zoneId: zid,
          elementId: o.elementId ?? null,
          authorName,
          code: o.code,
          title: o.title,
          observationType: o.type,
          severity: o.sev ?? null,
          description: o.desc,
          observedAt: new Date(o.at),
        },
      });
      out.push({ id: r.id, code: o.code, zoneId: zid, title: o.title });
    }
    return out;
  }

  const tinObs = await seedObs(
    tin,
    'TIN',
    [
      {
        zoneCode: 'TIN-Z-MUR',
        code: 'TIN-OBS-001',
        title: 'Fissuration horizontale sous glacis',
        type: ObservationType.CONDITION_SURVEY,
        sev: SeverityLevel.HIGH,
        elementId: tinE1.id,
        at: '2026-01-12',
        desc: 'Replier de fissures à 1,8 m du sol, avec salissement local.',
      },
      {
        zoneCode: 'TIN-Z-MIN',
        code: 'TIN-OBS-002',
        title: 'Décollement d’enduit au sommet du fût',
        type: ObservationType.SITE_VISUAL,
        sev: SeverityLevel.MEDIUM,
        elementId: tinE2.id,
        at: '2026-01-14',
        desc: 'Zones soufflées sur le tiers supérieur côté vallée.',
      },
      {
        zoneCode: 'TIN-Z-SDP',
        code: 'TIN-OBS-003',
        title: 'Humidité ascendante près du mihrab',
        type: ObservationType.MONITORING,
        sev: SeverityLevel.MEDIUM,
        at: '2026-02-02',
        desc: 'Cartographie IR — condensation saisonnière possible.',
      },
      {
        zoneCode: 'TIN-Z-F-NORD',
        code: 'TIN-OBS-004',
        title: 'Déformation légère de linteau',
        type: ObservationType.MEASURE,
        sev: SeverityLevel.LOW,
        at: '2026-02-05',
        desc: 'Flèche mesurée < 8 mm sur entrée latérale.',
      },
      {
        zoneCode: 'TIN-Z-ARC',
        code: 'TIN-OBS-005',
        title: 'Pertes de grain en clé d’arcade',
        type: ObservationType.CONDITION_SURVEY,
        sev: SeverityLevel.HIGH,
        at: '2026-02-06',
        desc: 'Sous arcades couvertes — inspection de liaison mortier.',
      },
    ],
    NAME.arch,
  );

  const moreTinObs = await seedObs(
    tin,
    'TIN',
    [
      {
        zoneCode: 'TIN-Z-COUR',
        code: 'TIN-OBS-006',
        title: 'Relevé de niveau — dalage cour',
        type: ObservationType.MEASURE,
        at: '2026-02-08',
        desc: 'Fosse d’ablutions — infiltrations après pluie.',
      },
      {
        zoneCode: 'TIN-Z-F-SUD',
        code: 'TIN-OBS-007',
        title: 'Biocroissance sur appui de fenêtre',
        type: ObservationType.SITE_VISUAL,
        sev: SeverityLevel.LOW,
        at: '2026-02-09',
        desc: 'Lichens et mousses superficiels.',
      },
    ],
    NAME.photo,
  );

  const qaraObs = await seedObs(
    qar,
    'QAR',
    [
      {
        zoneCode: 'QAR-Z-SDP',
        code: 'QAR-OBS-001',
        title: 'Micro-fissuration plâtre niche',
        type: ObservationType.CONDITION_SURVEY,
        sev: SeverityLevel.MEDIUM,
        elementId: qarE1.id,
        at: '2025-08-10',
        desc: 'Réseau fin en étoile au-dessus du mihrab.',
      },
      {
        zoneCode: 'QAR-Z-FQ',
        code: 'QAR-OBS-002',
        title: 'Mesure d’ouverture de baie haute',
        type: ObservationType.PRE_INTERVENTION,
        at: '2025-09-02',
        desc: 'Relevé préalable à calfeutrage breathable.',
      },
      {
        zoneCode: 'QAR-Z-GRN',
        code: 'QAR-OBS-003',
        title: 'Note de réunion chantier',
        type: ObservationType.MEETING_NOTE,
        at: '2025-10-18',
        desc: 'Arbitrage sur méthode de déshumidification passive.',
      },
    ],
    NAME.cons,
  );

  const ksrObs = await seedObs(
    ksr,
    'KSR',
    [
      {
        zoneCode: 'KSR-Z-TOR',
        code: 'KSR-OBS-001',
        title: 'Érosion de parement pisé — base',
        type: ObservationType.CONDITION_SURVEY,
        sev: SeverityLevel.HIGH,
        elementId: ksrE1.id,
        at: '2024-11-03',
        desc: 'Perte de matière sur 40 cm en rive nord.',
      },
      {
        zoneCode: 'KSR-Z-RUE',
        code: 'KSR-OBS-002',
        title: 'Déformations plancher bois',
        type: ObservationType.CONDITION_SURVEY,
        at: '2024-12-01',
        desc: 'Vibrations usage — vérification section.',
      },
      {
        zoneCode: 'KSR-Z-HAB',
        code: 'KSR-OBS-003',
        title: 'Infiltration toiture terrasse',
        type: ObservationType.MONITORING,
        at: '2025-01-15',
        desc: 'Trace d’humidité au plafond témoin.',
      },
    ],
    NAME.ing,
  );

  const allObs = [...tinObs, ...moreTinObs, ...qaraObs, ...ksrObs];

  async function mkPath(
    zoneMap: Map<string, { id: string }>,
    zoneCode: string,
    code: string,
    name: string,
    type: PathologyType,
    severity: SeverityLevel,
    obsId: string | null,
    elementId: string | null,
    desc: string,
  ) {
    return prisma.pathology.create({
      data: {
        zoneId: zoneMap.get(zoneCode)!.id,
        elementId,
        observationId: obsId,
        code,
        name,
        pathologyType: type,
        severity,
        description: desc,
      },
    });
  }

  const tinP1 = await mkPath(tin, 'TIN-Z-MUR', 'TIN-P-FIS-01', 'Fissure active mur nord', PathologyType.CRACKING, SeverityLevel.HIGH, tinObs[0]!.id, tinE1.id, 'Fissuration active — à suivre après saison des pluies.');
  const tinP2 = await mkPath(tin, 'TIN-Z-MIN', 'TIN-P-DET-01', 'Décollement enduit minaret', PathologyType.DETACHMENT, SeverityLevel.MEDIUM, tinObs[1]!.id, tinE2.id, 'Décollement d’enduit historique.');
  const tinP3 = await mkPath(tin, 'TIN-Z-SDP', 'TIN-P-MOU-01', 'Humidité ascensionnelle salle de prière', PathologyType.MOISTURE, SeverityLevel.HIGH, tinObs[2]!.id, tinE3.id, 'Remontées capillaires localisées.');
  const tinP4 = await mkPath(tin, 'TIN-Z-ARC', 'TIN-P-SAL-01', 'Efflorescences sous arcades', PathologyType.SALT_ATTACK, SeverityLevel.MEDIUM, moreTinObs[0]!.id, null, 'Efflorescences sous arcades.');
  const qarP1 = await mkPath(qar, 'QAR-Z-SDP', 'QAR-P-CRK-01', 'Fissures décor plâtre', PathologyType.CRACKING, SeverityLevel.MEDIUM, qaraObs[0]!.id, qarE1.id, 'Fissilation plâtre décoratif.');
  const qarP2 = await mkPath(qar, 'QAR-Z-FQ', 'QAR-P-DEF-01', 'Déformation baie de ventilation', PathologyType.DEFORMATION, SeverityLevel.HIGH, qaraObs[1]!.id, null, 'Ouverture non symétrique — charge historique.');
  const ksrP1 = await mkPath(ksr, 'KSR-Z-TOR', 'KSR-P-ML-01', 'Perte de matière en base', PathologyType.MATERIAL_LOSS, SeverityLevel.HIGH, ksrObs[0]!.id, ksrE1.id, 'Perte de matière pisé.');
  const ksrP2 = await mkPath(ksr, 'KSR-Z-HAB', 'KSR-P-MO-01', 'Humidité mur porteur', PathologyType.MOISTURE, SeverityLevel.MEDIUM, ksrObs[2]!.id, ksrE2.id, 'Humidité de toiture sur mur porteur.');

  async function mkDec(
    zoneMap: Map<string, { id: string }>,
    zoneCode: string,
    code: string,
    title: string,
    dtype: DecisionType,
    status: DecisionStatus,
    obsId: string | null,
    pathId: string | null,
    desc: string,
    justification: string,
    doctrinal: string,
    decidedAt: Date | null,
  ) {
    return prisma.decision.create({
      data: {
        zoneId: zoneMap.get(zoneCode)!.id,
        observationId: obsId,
        pathologyId: pathId,
        authorName: NAME.arch,
        code,
        title,
        decisionType: dtype,
        status,
        description: desc,
        justification,
        doctrinalPrinciples: doctrinal,
        decidedAt,
      },
    });
  }

  const dT1 = await mkDec(
    tin,
    'TIN-Z-MUR',
    'TIN-D-001',
    'Approche conservation — reprise de fissures',
    DecisionType.CONSERVATION_APPROACH,
    DecisionStatus.APPROVED,
    tinObs[0]!.id,
    tinP1.id,
    'Injection faible pression et rejointoiement chaux.',
    'Validation après essais de compatibilité.',
    'Patrimoine — minimal intervention',
    new Date('2026-02-18'),
  );
  const dT2 = await mkDec(
    tin,
    'TIN-Z-MIN',
    'TIN-D-002',
    'Principe d’intervention minaret',
    DecisionType.INTERVENTION_PRINCIPLE,
    DecisionStatus.PROPOSED,
    tinObs[1]!.id,
    tinP2.id,
    'Désamarrer zones soufflées avant reprise.',
    'En attente avis structure.',
    'Lisibilité historique du minaret',
    null,
  );
  const dT3 = await mkDec(
    tin,
    'TIN-Z-SDP',
    'TIN-D-003',
    'Choix de mortier compatible',
    DecisionType.MATERIAL_CHOICE,
    DecisionStatus.APPROVED,
    tinObs[2]!.id,
    tinP3.id,
    'Mortier chaux NHL faible dosage.',
    'PV matériaux signé.',
    'Réversibilité et breathabilité',
    new Date('2026-02-20'),
  );
  const dT4 = await mkDec(
    tin,
    'TIN-Z-ARC',
    'TIN-D-004',
    'Méthodologie de désensimage des sels',
    DecisionType.METHODOLOGY,
    DecisionStatus.DRAFT,
    moreTinObs[0]!.id,
    tinP4.id,
    'Compressement et rinçages contrôlés.',
    '',
    'Préparer protocol LRMH',
    null,
  );
  const dQ1 = await mkDec(
    qar,
    'QAR-Z-SDP',
    'QAR-D-001',
    'PV de validation travaux niche',
    DecisionType.VALIDATION_PV,
    DecisionStatus.APPROVED,
    qaraObs[0]!.id,
    qarP1.id,
    'Stabilisation micro-fissures à l’argile diluée.',
    'Accord conservateur.',
    'Intégrité du décor',
    new Date('2025-11-05'),
  );
  const dQ2 = await mkDec(
    qar,
    'QAR-Z-GRN',
    'QAR-D-002',
    'Cadre réglementaire ventilation',
    DecisionType.REGULATORY,
    DecisionStatus.PROPOSED,
    qaraObs[2]!.id,
    null,
    'Compatibilité avec prescriptions locales.',
    '',
    'Sécurité publique & monument',
    null,
  );
  const dK1 = await mkDec(
    ksr,
    'KSR-Z-TOR',
    'KSR-D-001',
    'Consolidation tour — principe',
    DecisionType.INTERVENTION_PRINCIPLE,
    DecisionStatus.APPROVED,
    ksrObs[0]!.id,
    ksrP1.id,
    'Recharge des pertes en terre stabilisée compatible.',
    'Accord MOA.',
    'Authenticité matière',
    new Date('2025-02-10'),
  );
  const dK2 = await mkDec(
    ksr,
    'KSR-Z-HAB',
    'KSR-D-002',
    'Traitement toiture — autre',
    DecisionType.OTHER,
    DecisionStatus.DRAFT,
    ksrObs[2]!.id,
    ksrP2.id,
    'Étanchéité locale et évacuations.',
    '',
    'À compléter après diagnostic toiture',
    null,
  );

  async function mkInt(
    decisionId: string,
    zoneId: string,
    code: string,
    type: InterventionType,
    status: InterventionStatus,
    _progress: number,
    companyName: string,
    _leadName: string,
    pathologyId: string | null,
    elementId: string | null,
    start: string | null,
    end: string | null,
    desc: string,
  ) {
    return prisma.intervention.create({
      data: {
        decisionId,
        zoneId,
        pathologyId,
        elementId,
        companyName,
        code,
        interventionType: type,
        status,
        plannedStart: start ? new Date(start) : null,
        plannedEnd: end ? new Date(end) : null,
        description: desc,
      },
    });
  }

  const iT1 = await mkInt(
    dT1.id,
    tin.get('TIN-Z-MUR')!.id,
    'TIN-I-001',
    InterventionType.CONSOLIDATION,
    InterventionStatus.IN_PROGRESS,
    45,
    NAME.ent,
    NAME.arch,
    tinP1.id,
    tinE1.id,
    '2026-03-01',
    '2026-05-30',
    'Reprise joints et pose de trous de désactivation.',
  );
  const iT2 = await mkInt(
    dT3.id,
    tin.get('TIN-Z-SDP')!.id,
    'TIN-I-002',
    InterventionType.REPAIR,
    InterventionStatus.PLANNED,
    0,
    NAME.ent,
    NAME.arch,
    tinP3.id,
    tinE3.id,
    '2026-05-15',
    '2026-07-01',
    'Dépose partielle et recharge enduits compatibles.',
  );
  const iT3 = await mkInt(
    dT2.id,
    tin.get('TIN-Z-MIN')!.id,
    'TIN-I-003',
    InterventionType.SURVEY,
    InterventionStatus.PLANNED,
    10,
    NAME.geo,
    NAME.ing,
    tinP2.id,
    tinE2.id,
    '2026-04-01',
    '2026-04-20',
    'Campagne de fissurométrie et géoradar léger.',
  );
  const iT4 = await mkInt(
    dT4.id,
    tin.get('TIN-Z-ARC')!.id,
    'TIN-I-004',
    InterventionType.CLEANING,
    InterventionStatus.PLANNED,
    0,
    NAME.ent,
    NAME.arch,
    tinP4.id,
    null,
    '2026-06-01',
    '2026-06-15',
    'Décapage doux des efflorescences avant compresse.',
  );
  const iQ1 = await mkInt(
    dQ1.id,
    qar.get('QAR-Z-SDP')!.id,
    'QAR-I-001',
    InterventionType.RE_INTEGRATION,
    InterventionStatus.IN_PROGRESS,
    60,
    NAME.ent,
    NAME.cons,
    qarP1.id,
    qarE1.id,
    '2025-12-01',
    '2026-02-28',
    'Réintégration décor niche.',
  );
  const iQ2 = await mkInt(
    dQ2.id,
    qar.get('QAR-Z-GRN')!.id,
    'QAR-I-002',
    InterventionType.PROVISIONAL,
    InterventionStatus.COMPLETED,
    100,
    NAME.ent,
    NAME.arch,
    null,
    null,
    '2025-10-01',
    '2025-10-20',
    'Bâchement et ventilation provisoire.',
  );
  const iK1 = await mkInt(
    dK1.id,
    ksr.get('KSR-Z-TOR')!.id,
    'KSR-I-001',
    InterventionType.CONSOLIDATION,
    InterventionStatus.IN_PROGRESS,
    35,
    NAME.ent,
    NAME.moa,
    ksrP1.id,
    ksrE1.id,
    '2025-03-01',
    '2025-08-31',
    'Recharge pisé — mise en pause hiver.',
  );
  const iK2 = await mkInt(
    dK1.id,
    ksr.get('KSR-Z-TOR')!.id,
    'KSR-I-002',
    InterventionType.PROTECTION,
    InterventionStatus.PLANNED,
    0,
    NAME.ent,
    NAME.arch,
    ksrP1.id,
    null,
    '2026-04-01',
    '2026-05-15',
    'Couvertine terre cuite et rejet d’eau.',
  );
  const iK3 = await mkInt(
    dK2.id,
    ksr.get('KSR-Z-HAB')!.id,
    'KSR-I-003',
    InterventionType.REPAIR,
    InterventionStatus.PLANNED,
    0,
    NAME.ent,
    NAME.ing,
    ksrP2.id,
    ksrE2.id,
    null,
    null,
    'Reprise étanchéité locale.',
  );
  const iExtra = await mkInt(
    dT1.id,
    tin.get('TIN-Z-F-NORD')!.id,
    'TIN-I-005',
    InterventionType.OTHER,
    InterventionStatus.CANCELLED,
    0,
    NAME.ent,
    NAME.arch,
    null,
    null,
    null,
    null,
    'Intervention annulée — doublon avec autre phasage.',
  );

  const allInts = [iT1, iT2, iT3, iT4, iQ1, iQ2, iK1, iK2, iK3, iExtra];

  const logs = [
    {
      p: projTinmel.id,
      code: 'JRN-0001',
      title: 'Relevés de chantier — semaine 6',
      date: new Date('2026-02-10'),
      w: WeatherType.CLEAR,
      workforce: 4,
      sum: 'Escalade contrôlée mur nord ; photos Aziza.',
      body: 'Équipe 4 personnes ; accès sécurisé.',
      dec: dT1.id,
      int: iT1.id,
    },
    {
      p: projTinmel.id,
      code: 'JRN-0002',
      title: 'Pluie locale — report mesures',
      date: new Date('2026-02-12'),
      w: WeatherType.RAIN,
      workforce: 2,
      sum: 'Interruption fissurométrie minaret.',
      body: 'Reprise prévue 14/02.',
      dec: dT2.id,
      int: iT3.id,
    },
    {
      p: projTinmel.id,
      code: 'JRN-0003',
      title: 'Réunion MOA — jalons printemps',
      date: new Date('2026-02-15'),
      w: WeatherType.CLOUDY,
      workforce: 8,
      sum: 'Budget phase consolidation validé.',
      body: '',
      dec: dT3.id,
      int: iT2.id,
    },
    {
      p: projQara.id,
      code: 'JRN-0001',
      title: 'Compte rendu niche — avancement',
      date: new Date('2025-11-20'),
      w: WeatherType.CLEAR,
      workforce: 6,
      sum: 'Fin première passe réintégration.',
      body: 'Contrôle conservateur positif.',
      dec: dQ1.id,
      int: iQ1.id,
    },
    {
      p: projQara.id,
      code: 'JRN-0002',
      title: 'Accès galerie nord — sécurisation',
      date: new Date('2025-12-05'),
      w: WeatherType.WIND,
      workforce: 5,
      sum: 'Baches renforcées.',
      body: '',
      dec: dQ2.id,
      int: iQ2.id,
    },
    {
      p: projKsar.id,
      code: 'JRN-0001',
      title: 'Suspension hivernale — Ksar',
      date: new Date('2025-11-30'),
      w: WeatherType.FOG,
      workforce: 3,
      sum: 'Protection des recharges pisé.',
      body: 'Reprise saison sèche.',
      dec: dK1.id,
      int: iK1.id,
    },
  ];

  for (const L of logs) {
    const description =
      L.body?.trim() && L.sum?.trim()
        ? `${L.sum}\n${L.body}`.trim()
        : L.sum?.trim() || L.body?.trim() || null;
    await prisma.logbook.create({
      data: {
        projectId: L.p,
        code: L.code,
        authorName: NAME.arch,
        title: L.title,
        eventAt: L.date,
        weather: L.w,
        workforce: L.workforce,
        description,
        decisionLinks: { create: [{ decisionId: L.dec, note: '' }] },
        interventionLinks: { create: [{ interventionId: L.int, note: '' }] },
      },
    });
  }

  await prisma.labTest.upsert({
    where: { zoneId_code: { zoneId: tin.get('TIN-Z-MUR')!.id, code: 'TIN-LAB-SOL-01' } },
    update: {},
    create: {
      zoneId: tin.get('TIN-Z-MUR')!.id,
      materialId: matPierre.id,
      laboratoryName: NAME.lab,
      code: 'TIN-LAB-SOL-01',
      labTestType: LabTestType.SALT_CHLORIDE,
      result: LabTestResult.POSITIVE,
      testedAt: new Date('2026-02-01'),
    },
  });

  await prisma.labTest.upsert({
    where: { zoneId_code: { zoneId: tin.get('TIN-Z-SDP')!.id, code: 'TIN-LAB-HUM-01' } },
    update: {},
    create: {
      zoneId: tin.get('TIN-Z-SDP')!.id,
      labTestType: LabTestType.MOISTURE,
      code: 'TIN-LAB-HUM-01',
      result: LabTestResult.INCONCLUSIVE,
      testedAt: new Date('2026-02-03'),
    },
  });

  await prisma.labTest.upsert({
    where: { zoneId_code: { zoneId: qar.get('QAR-Z-SDP')!.id, code: 'QAR-LAB-STU-01' } },
    update: {},
    create: {
      zoneId: qar.get('QAR-Z-SDP')!.id,
      materialId: matStuc.id,
      laboratoryName: NAME.lab,
      code: 'QAR-LAB-STU-01',
      labTestType: LabTestType.PETROGRAPHY,
      result: LabTestResult.NEGATIVE,
      testedAt: new Date('2025-09-15'),
    },
  });

  await prisma.labTest.upsert({
    where: { zoneId_code: { zoneId: ksr.get('KSR-Z-TOR')!.id, code: 'KSR-LAB-MECH-01' } },
    update: {},
    create: {
      zoneId: ksr.get('KSR-Z-TOR')!.id,
      materialId: matTerre.id,
      laboratoryName: NAME.lab,
      code: 'KSR-LAB-MECH-01',
      labTestType: LabTestType.MECHANICAL,
      result: LabTestResult.POSITIVE,
      testedAt: new Date('2025-01-20'),
    },
  });

  const docsPayload = [
    { proj: projTinmel, zone: tin.get('TIN-Z-MUR')!, title: 'Rapport diagnostic mur nord', slug: 'rapport-diagnostic-mur-nord' },
    { proj: projTinmel, zone: tin.get('TIN-Z-MIN')!, title: 'Notice sécurité échafaudage', slug: 'notice-echafaudage-minaret' },
    { proj: projTinmel, zone: tin.get('TIN-Z-SDP')!, title: 'PV choix mortier', slug: 'pv-choix-mortier' },
    { proj: projQara, zone: qar.get('QAR-Z-SDP')!, title: 'Dossier niche décor', slug: 'dossier-niche-decor' },
    { proj: projQara, zone: qar.get('QAR-Z-FQ')!, title: 'Permis travaux ventilation', slug: 'permis-ventilation' },
    { proj: projKsar, zone: ksr.get('KSR-Z-TOR')!, title: 'Étude terre pisé', slug: 'etude-pise' },
  ];

  const createdDocs: { id: string }[] = [];
  for (const d of docsPayload) {
    const ph = placeholderDoc(d.proj.code, d.slug);
    const doc = await prisma.document.create({
      data: {
        ...ph,
        title: d.title,
        projectId: d.proj.id,
        zoneId: d.zone.id,
        authorName: NAME.arch,
        observationId: null,
        pathologyId: null,
        decisionId: null,
        interventionId: null,
        logbookId: null,
      },
    });
    createdDocs.push(doc);
  }

  await prisma.decision.update({
    where: { id: dQ1.id },
    data: { pvDocumentId: createdDocs[3]!.id },
  });

  const photoSpecs: {
    proj: typeof projTinmel;
    zoneCode: string;
    map: Map<string, { id: string }>;
    slug: string;
    cap: string;
    obsId?: string;
    intId?: string;
  }[] = [
    { proj: projTinmel, zoneCode: 'TIN-Z-MUR', map: tin, slug: 'fissures-mn1', cap: 'Réseau de fissures — courtine nord', obsId: tinObs[0]!.id },
    { proj: projTinmel, zoneCode: 'TIN-Z-MIN', map: tin, slug: 'minaret-sommet', cap: 'Décollement enduit — fût', obsId: tinObs[1]!.id },
    { proj: projTinmel, zoneCode: 'TIN-Z-SDP', map: tin, slug: 'mihrab-hum', cap: 'Zone d’humidité mihrab', obsId: tinObs[2]!.id },
    { proj: projTinmel, zoneCode: 'TIN-Z-F-SUD', map: tin, slug: 'portique-sud', cap: 'Portique façade sud' },
    { proj: projTinmel, zoneCode: 'TIN-Z-ARC', map: tin, slug: 'arcades-sels', cap: 'Efflorescences arcades' },
    { proj: projQara, zoneCode: 'QAR-Z-SDP', map: qar, slug: 'niche-detail', cap: 'Détail stuc niche', obsId: qaraObs[0]!.id },
    { proj: projQara, zoneCode: 'QAR-Z-COUR', map: qar, slug: 'cour-ablutions', cap: 'Cour des ablutions' },
    { proj: projKsar, zoneCode: 'KSR-Z-TOR', map: ksr, slug: 'tour-erosion', cap: 'Érosion base tour', obsId: ksrObs[0]!.id, intId: iK1.id },
  ];

  for (const pho of photoSpecs) {
    const zid = pho.map.get(pho.zoneCode)!.id;
    const base = placeholderPhoto(pho.proj.code, pho.zoneCode, pho.slug, pho.cap);
    await prisma.photo.create({
      data: {
        ...base,
        projectId: pho.proj.id,
        zoneId: zid,
        observationId: pho.obsId ?? null,
        interventionId: pho.intId ?? null,
        authorName: NAME.photo,
      },
    });
  }

  const risksData: {
    title: string;
    cat: RiskCategory;
    prob: RiskProbability;
    imp: RiskImpact;
    stat: RiskStatus;
    projId: string | null;
    zoneId: string | null;
    decisionId: string | null;
    interventionId: string | null;
    desc: string;
  }[] = [
    {
      title: 'Stabilité locale courtine — surcharge échafaudage',
      cat: RiskCategory.STRUCTURAL,
      prob: RiskProbability.POSSIBLE,
      imp: RiskImpact.MAJOR,
      stat: RiskStatus.MITIGATING,
      projId: projTinmel.id,
      zoneId: tin.get('TIN-Z-MUR')!.id,
      decisionId: null,
      interventionId: null,
      desc: 'Calage des étais et inspection hebdomadaire.',
    },
    {
      title: 'Perte de valeur patrimoniale — finitions inappropriées',
      cat: RiskCategory.HERITAGE_VALUE,
      prob: RiskProbability.UNLIKELY,
      imp: RiskImpact.CATASTROPHIC,
      stat: RiskStatus.OPEN,
      projId: projTinmel.id,
      zoneId: tin.get('TIN-Z-SDP')!.id,
      decisionId: dT3.id,
      interventionId: null,
      desc: 'Validation stricte des nuanciers.',
    },
    {
      title: 'Sécurité public — accès minaret',
      cat: RiskCategory.HEALTH_SAFETY,
      prob: RiskProbability.LIKELY,
      imp: RiskImpact.MODERATE,
      stat: RiskStatus.MITIGATING,
      projId: null,
      zoneId: tin.get('TIN-Z-MIN')!.id,
      decisionId: null,
      interventionId: iT3.id,
      desc: 'Port du harnais et binôme cordiste.',
    },
    {
      title: 'Conditions climatiques — report calendrier',
      cat: RiskCategory.ENVIRONMENTAL,
      prob: RiskProbability.POSSIBLE,
      imp: RiskImpact.MODERATE,
      stat: RiskStatus.OPEN,
      projId: projTinmel.id,
      zoneId: null,
      decisionId: null,
      interventionId: null,
      desc: 'Fenêtre sèche pour reprises mortier.',
    },
    {
      title: 'Concentration visiteurs pendant travaux niche',
      cat: RiskCategory.HEALTH_SAFETY,
      prob: RiskProbability.LIKELY,
      imp: RiskImpact.MINOR,
      stat: RiskStatus.ACCEPTED,
      projId: projQara.id,
      zoneId: qar.get('QAR-Z-SDP')!.id,
      decisionId: dQ1.id,
      interventionId: iQ1.id,
      desc: 'Cheminements balisés et horaires décalés.',
    },
    {
      title: 'Poursuite érosion KSAR — saison pluie',
      cat: RiskCategory.STRUCTURAL,
      prob: RiskProbability.LIKELY,
      imp: RiskImpact.MAJOR,
      stat: RiskStatus.OPEN,
      projId: projKsar.id,
      zoneId: ksr.get('KSR-Z-TOR')!.id,
      decisionId: dK1.id,
      interventionId: iK1.id,
      desc: 'Bâchage saisonnier déjà en place.',
    },
  ];

  for (const r of risksData) {
    await prisma.risk.create({
      data: {
        title: r.title,
        description: r.desc,
        riskCategory: r.cat,
        probability: r.prob,
        impact: r.imp,
        status: r.stat,
        projectId: r.projId,
        zoneId: r.zoneId,
        decisionId: r.decisionId,
        interventionId: r.interventionId,
        ownerName: NAME.arch,
      },
    });
  }

  console.log('Seed OK — patrimoine démo', {
    projects: [projTinmel.code, projQara.code, projKsar.code],
    zones: tinZones.length + qaraZones.length + ksarZones.length,
    observations: allObs.length,
    interventions: allInts.length,
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
