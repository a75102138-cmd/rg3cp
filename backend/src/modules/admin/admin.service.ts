import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalProjects,
      totalUsers,
      totalActors,
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      actorPendingDocs,
      actors,
      projects,
      pendingDocs,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.user.count(),
      this.prisma.actor.count(),
      this.prisma.document.count(),
      this.prisma.document.count({ where: { status: 'PENDING' } }),
      this.prisma.document.count({ where: { status: 'APPROVED' } }),
      this.prisma.document.count({ where: { status: 'REJECTED' } }),
      this.prisma.document.groupBy({
        by: ['authorActorId'],
        where: {
          status: 'PENDING',
          authorActorId: { not: null },
        },
        _count: { _all: true },
      }),
      this.prisma.actor.findMany({
        orderBy: { name: 'asc' },
        include: {
          projectAssignments: {
            select: {
              projectId: true,
              project: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              documents: true,
              userAssignments: true,
              actorAssignments: true,
            },
          },
          documents: {
            select: { status: true },
          },
        },
      }),
      this.prisma.document.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              userAssignments: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
          authorActor: {
            select: {
              id: true,
              code: true,
              name: true,
              organization: true,
            },
          },
        },
      }),
    ]);

    return {
      totals: {
        totalProjects,
        totalUsers,
        totalActors,
        totalDocuments,
        pendingDocuments,
        approvedDocuments,
        rejectedDocuments,
      },
      actors: actors.map((actor) => ({
        id: actor.id,
        code: actor.code,
        name: actor.name,
        organization: actor.organization,
        role: actor.role,
        email: actor.email,
        phone: actor.phone,
        pendingDocuments:
          actorPendingDocs.find((row) => row.authorActorId === actor.id)?._count._all ?? 0,
        projectAssignments: actor.projectAssignments.map((assignment) => assignment.project),
      })),
      projects: projects.map((project) => {
        const counts = { pending: 0, approved: 0, rejected: 0 };
        for (const document of project.documents) {
          if (document.status === 'PENDING') counts.pending += 1;
          if (document.status === 'APPROVED') counts.approved += 1;
          if (document.status === 'REJECTED') counts.rejected += 1;
        }
        return {
          id: project.id,
          code: project.code,
          name: project.name,
          status: project.status,
          documentsCount: project._count.documents,
          pendingDocuments: counts.pending,
          approvedDocuments: counts.approved,
          rejectedDocuments: counts.rejected,
          usersCount: project._count.userAssignments,
          actorsCount: project._count.actorAssignments,
        };
      }),
      pendingDocuments: pendingDocs.map((document) => ({
        id: document.id,
        title: document.title,
        originalFilename: document.originalFilename,
        createdAt: document.createdAt,
        project: document.project
          ? {
              id: document.project.id,
              code: document.project.code,
              name: document.project.name,
            }
          : null,
        assignedUsers:
          document.project?.userAssignments
            .map((assignment) => assignment.user)
            .filter((user) => user.role === 'ACTEUR' || user.role === 'ADMIN')
            .map((user) => ({
              id: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
              role: user.role,
            })) ?? [],
        responsibleActor: document.authorActor
          ? {
              id: document.authorActor.id,
              code: document.authorActor.code,
              name: document.authorActor.name,
              organization: document.authorActor.organization,
            }
          : null,
      })),
    };
  }
}
