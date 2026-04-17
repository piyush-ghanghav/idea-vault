'use client'
import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Handle,
    Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useApi } from '@/hooks/useApi'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const DOMAIN_COLORS: Record<string, string> = {
    DEV: '#6366f1',
    BUSINESS: '#f59e0b',
    CREATIVE: '#ec4899',
    HEALTH: '#10b981',
    TRAVEL: '#06b6d4',
    LEARNING: '#f97316',
    LIFE: '#8b5cf6',
}

function IdeaNode({ data }: { data: { label: string; domain: string; status: string } }) {
    return (
        <div
            style={{
                background: DOMAIN_COLORS[data.domain] ?? '#888',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500,
                maxWidth: 160,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border:
                    data.status === 'ENRICHED'
                        ? '2px solid rgba(255,255,255,0.6)'
                        : '2px solid transparent',
                position: 'relative',
            }}
        >
            {/* ✅ TARGET handle (incoming edge) */}
            <Handle type="target" position={Position.Top} />

            {data.label}

            {/* ✅ SOURCE handle (outgoing edge) */}
            <Handle type="source" position={Position.Bottom} />
        </div>
    )
}

const nodeTypes = { ideaNode: IdeaNode }

export default function GraphPage() {
    const api = useApi()
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [loading, setLoading] = useState(true)
    const [edgeCount, setEdgeCount] = useState(0)

    useEffect(() => {
        if (!api.isLoaded || !api.isSignedIn) return

        api.getGraph().then(({ nodes: rawNodes, edges: rawEdges }) => {
            // Arrange nodes in a circle for clean initial layout
            const radius = Math.max(200, rawNodes.length * 50)
            const positioned = rawNodes.map((n: Node, i: number) => {
                const angle = (2 * Math.PI * i) / rawNodes.length
                return {
                    ...n,
                    type: 'ideaNode',
                    position: {
                        x: 400 + radius * Math.cos(angle),
                        y: 300 + radius * Math.sin(angle),
                    },
                }
            })
            setNodes(positioned)
            setEdges(rawEdges)
            setEdgeCount(rawEdges.length)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [api.isLoaded, api.isSignedIn])

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Idea Graph</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {edgeCount === 0
                                ? 'No connections yet — add more ideas'
                                : `${edgeCount} semantic connection${edgeCount > 1 ? 's' : ''} found`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-700">
                            ← Dashboard
                        </Link>
                        <UserButton />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
                    Loading graph...
                </div>
            ) : nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <p className="text-lg mb-1">No ideas yet</p>
                    <p className="text-sm">Add ideas from the dashboard first</p>
                </div>
            ) : (
                <div style={{ width: '100%', height: 'calc(100vh - 73px)' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                    >
                        <Background color="#e5e7eb" gap={20} />
                        <Controls />
                        <MiniMap
                            nodeColor={n => DOMAIN_COLORS[n.data?.domain] ?? '#888'}
                            style={{ background: '#f9fafb' }}
                        />
                    </ReactFlow>
                </div>
            )}

            {/* Domain legend */}
            <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-2">Domains</p>
                <div className="flex flex-col gap-1">
                    {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
                        <div key={domain} className="flex items-center gap-2">
                            <div style={{ background: color }} className="w-2.5 h-2.5 rounded-full" />
                            <span className="text-xs text-gray-600">{domain}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}