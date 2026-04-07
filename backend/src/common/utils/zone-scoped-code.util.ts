import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

async function nextCodeForZone(
  prisma: PrismaService,
  zoneId: string,
  suffix: string,
  exists: (zoneId: string, code: string) => Promise<boolean>,
): Promise<string> {
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) throw new NotFoundException('Zone not found');
  const prefix = `${zone.code}-${suffix}-`;
  const count =
    suffix === 'EL'
      ? await prisma.element.count({ where: { zoneId } })
      : suffix === 'OBS'
        ? await prisma.observation.count({ where: { zoneId } })
        : suffix === 'PATH'
          ? await prisma.pathology.count({ where: { zoneId } })
          : await prisma.decision.count({ where: { zoneId } });
  let n = count + 1;
  for (let i = 0; i < 2000; i++) {
    const code = `${prefix}${pad3(n)}`;
    if (!(await exists(zoneId, code))) return code;
    n += 1;
  }
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export async function nextElementCode(prisma: PrismaService, zoneId: string): Promise<string> {
  return nextCodeForZone(prisma, zoneId, 'EL', (zid, code) =>
    prisma.element
      .findFirst({ where: { zoneId: zid, code } })
      .then((r) => Boolean(r)),
  );
}

export async function nextObservationCode(prisma: PrismaService, zoneId: string): Promise<string> {
  return nextCodeForZone(prisma, zoneId, 'OBS', (zid, code) =>
    prisma.observation
      .findFirst({ where: { zoneId: zid, code } })
      .then((r) => Boolean(r)),
  );
}

export async function nextPathologyCode(prisma: PrismaService, zoneId: string): Promise<string> {
  return nextCodeForZone(prisma, zoneId, 'PATH', (zid, code) =>
    prisma.pathology
      .findFirst({ where: { zoneId: zid, code } })
      .then((r) => Boolean(r)),
  );
}

export async function nextDecisionCode(prisma: PrismaService, zoneId: string): Promise<string> {
  return nextCodeForZone(prisma, zoneId, 'DEC', (zid, code) =>
    prisma.decision
      .findFirst({ where: { zoneId: zid, code } })
      .then((r) => Boolean(r)),
  );
}

/** Codes uniques par décision : `INT-001`, `INT-002`, … */
export async function nextInterventionCode(
  prisma: PrismaService,
  decisionId: string,
): Promise<string> {
  const count = await prisma.intervention.count({ where: { decisionId } });
  let n = count + 1;
  for (let i = 0; i < 2000; i++) {
    const code = `INT-${pad3(n)}`;
    const exists = await prisma.intervention.findFirst({
      where: { decisionId, code },
    });
    if (!exists) return code;
    n += 1;
  }
  return `INT-${Date.now().toString(36).toUpperCase()}`;
}
