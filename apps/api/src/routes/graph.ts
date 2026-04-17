import { FastifyInstance } from "fastify";
import { authenticate } from "../plugins/auth";
import { prisma } from "../lib/prisma";


export async function graphRoutes(fastify: FastifyInstance) {
    fastify.get("/graph", { preHandler: authenticate }, async (request, reply) => {
        const ideas = await prisma.idea.findMany({
            where: { userId: request.userId },
            select: { id: true, title: true, domain: true, status: true, createdAt: true },
        })
        if (ideas.length === 0) {
            return reply.send({ nodes: [], edges: [] })
        }

        const edges = await prisma.$queryRaw<{
            source: string
            target: string
            similarity: number
        }[]>`
      SELECT
        a.id AS source,
        b.id AS target,
        1 - (a.embedding <=> b.embedding) AS similarity
      FROM "Idea" a
      JOIN "Idea" b ON b."userId" = ${request.userId} AND b.id > a.id
      WHERE
        a."userId" = ${request.userId}
        AND a.embedding IS NOT NULL
        AND b.embedding IS NOT NULL
        AND 1 - (a.embedding <=> b.embedding) > 0.78
    `
        const nodes = ideas.map(idea => ({
            id: idea.id,
            data: {
                label: idea.title,
                domain: idea.domain,
                status: idea.status,
            },
            position: { x: 0, y: 0 },
        }))

        const formattedEdges = edges.map(e => ({
            id: `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            style: {
                stroke: '#6366f1',
                strokeWidth: 2,
            },
            label: `${Math.round(Number(e.similarity) * 100)}%`,
            labelStyle: { fontSize: 10, fill: '#6b7280' },
        }))
        return reply.send({ nodes, edges: formattedEdges })
    })
}