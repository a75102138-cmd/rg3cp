import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function requireZone(prisma: PrismaService, zoneId: string) {
  const z = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!z) throw new NotFoundException('Zone not found');
  return z;
}

export async function requireProject(prisma: PrismaService, projectId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) throw new NotFoundException('Project not found');
  return p;
}

export async function requireElement(prisma: PrismaService, elementId: string) {
  const e = await prisma.element.findUnique({ where: { id: elementId } });
  if (!e) throw new NotFoundException('Element not found');
  return e;
}

export async function requireObservation(prisma: PrismaService, observationId: string) {
  const o = await prisma.observation.findUnique({ where: { id: observationId } });
  if (!o) throw new NotFoundException('Observation not found');
  return o;
}

export async function requirePathology(prisma: PrismaService, pathologyId: string) {
  const p = await prisma.pathology.findUnique({ where: { id: pathologyId } });
  if (!p) throw new NotFoundException('Pathology not found');
  return p;
}

export async function requireDecision(prisma: PrismaService, decisionId: string) {
  const d = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!d) throw new NotFoundException('Decision not found');
  return d;
}

export async function requireMaterial(prisma: PrismaService, materialId: string) {
  const m = await prisma.material.findUnique({ where: { id: materialId } });
  if (!m) throw new NotFoundException('Material not found');
  return m;
}

export async function requireActor(prisma: PrismaService, actorId: string) {
  const a = await prisma.actor.findUnique({ where: { id: actorId } });
  if (!a) throw new NotFoundException('Actor not found');
  return a;
}

export async function requireDocument(prisma: PrismaService, documentId: string) {
  const d = await prisma.document.findUnique({ where: { id: documentId } });
  if (!d) throw new NotFoundException('Document not found');
  return d;
}

export async function requireIntervention(prisma: PrismaService, interventionId: string) {
  const i = await prisma.intervention.findUnique({ where: { id: interventionId } });
  if (!i) throw new NotFoundException('Intervention not found');
  return i;
}

/** Observation.elementId must be in the same zone as observation.zoneId */
export function assertObservationElementZone(
  zoneId: string,
  elementZoneId: string | null | undefined,
) {
  if (elementZoneId != null && elementZoneId !== zoneId) {
    throw new BadRequestException(
      'Observation element does not belong to the specified zone',
    );
  }
}

/** Pathology.elementId must match zone */
export function assertPathologyElementZone(
  zoneId: string,
  elementZoneId: string | null | undefined,
) {
  if (elementZoneId != null && elementZoneId !== zoneId) {
    throw new BadRequestException(
      'Pathology element does not belong to the specified zone',
    );
  }
}

/** Pathology.observationId must match zone */
export function assertPathologyObservationZone(
  zoneId: string,
  observationZoneId: string | null | undefined,
) {
  if (observationZoneId != null && observationZoneId !== zoneId) {
    throw new BadRequestException(
      'Pathology observation does not belong to the specified zone',
    );
  }
}

/** Decision observation/pathology must match decision.zoneId */
export function assertDecisionObservationZone(
  zoneId: string,
  observationZoneId: string | null | undefined,
) {
  if (observationZoneId != null && observationZoneId !== zoneId) {
    throw new BadRequestException(
      'Decision observation does not belong to the specified zone',
    );
  }
}

export function assertDecisionPathologyZone(
  zoneId: string,
  pathologyZoneId: string | null | undefined,
) {
  if (pathologyZoneId != null && pathologyZoneId !== zoneId) {
    throw new BadRequestException(
      'Decision pathology does not belong to the specified zone',
    );
  }
}

/** Intervention element/pathology must match intervention.zoneId; decision must match zone */
export function assertInterventionElementZone(
  zoneId: string,
  elementZoneId: string | null | undefined,
) {
  if (elementZoneId != null && elementZoneId !== zoneId) {
    throw new BadRequestException(
      'Intervention element does not belong to the specified zone',
    );
  }
}

export function assertInterventionPathologyZone(
  zoneId: string,
  pathologyZoneId: string | null | undefined,
) {
  if (pathologyZoneId != null && pathologyZoneId !== zoneId) {
    throw new BadRequestException(
      'Intervention pathology does not belong to the specified zone',
    );
  }
}

export function assertInterventionDecisionZone(decisionZoneId: string, zoneId: string) {
  if (decisionZoneId !== zoneId) {
    throw new BadRequestException(
      'Intervention zoneId must match the Decision zone (decision belongs to a different zone)',
    );
  }
}

/** Document / Photo: at least one contextual FK */
export function assertDocumentHasContext(data: {
  projectId?: string | null;
  zoneId?: string | null;
  observationId?: string | null;
  pathologyId?: string | null;
  decisionId?: string | null;
  interventionId?: string | null;
  logbookId?: string | null;
}) {
  const has =
    data.projectId ||
    data.zoneId ||
    data.observationId ||
    data.pathologyId ||
    data.decisionId ||
    data.interventionId ||
    data.logbookId;
  if (!has) {
    throw new BadRequestException(
      'At least one context reference must be provided for Document (project, zone, observation, pathology, decision, intervention, or logbook)',
    );
  }
}

export function assertPhotoHasContext(data: {
  projectId?: string | null;
  zoneId?: string | null;
  elementId?: string | null;
  observationId?: string | null;
  pathologyId?: string | null;
  interventionId?: string | null;
  logbookId?: string | null;
}) {
  const has =
    data.projectId ||
    data.zoneId ||
    data.elementId ||
    data.observationId ||
    data.pathologyId ||
    data.interventionId ||
    data.logbookId;
  if (!has) {
    throw new BadRequestException(
      'At least one context reference must be provided for Photo (project, zone, element, observation, pathology, intervention, or logbook)',
    );
  }
}

/** Risk: at least one scope */
export function assertRiskHasScope(data: {
  projectId?: string | null;
  zoneId?: string | null;
  decisionId?: string | null;
  interventionId?: string | null;
}) {
  const has =
    data.projectId || data.zoneId || data.decisionId || data.interventionId;
  if (!has) {
    throw new BadRequestException(
      'At least one scope is required for Risk (project, zone, decision, or intervention)',
    );
  }
}
