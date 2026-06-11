'use client'
import { useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Handle,
  Position,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useApi } from '@/hooks/useApi'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Domain config ────────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<string, { accent: string; text: string; bg: string }> = {
  DEV:      { accent: '#5b5bd6', text: '#3d3d9e', bg: '#ededfc' },
  DESIGN:   { accent: '#1d9e75', text: '#0f6e56', bg: '#eaf8f3' },
  BUSINESS: { accent: '#d85a30', text: '#9b3a25', bg: '#fef0ed' },
  PERSONAL: { accent: '#d4537e', text: '#993556', bg: '#fbeaf0' },
  RESEARCH: { accent: '#ba7517', text: '#854f0b', bg: '#faeeda' },
  CREATIVE: { accent: '#9333ea', text: '#6b21a8', bg: '#f3e8ff' },
  HEALTH:   { accent: '#0f9e6e', text: '#065f46', bg: '#d1fae5' },
  TRAVEL:   { accent: '#0891b2', text: '#164e63', bg: '#e0f2fe' },
  LEARNING: { accent: '#ea580c', text: '#7c2d12', bg: '#fff7ed' },
  LIFE:     { accent: '#7c3aed', text: '#4c1d95', bg: '#ede9fe' },
}

const fallbackConfig = { accent: '#9d9994', text: '#6b6760', bg: '#f5f4f2' }

// ─── Custom node ──────────────────────────────────────────────────────────────

function IdeaNode({ data }: {
  data: { label: string; domain: string; status: string }
}) {
  const config = DOMAIN_CONFIG[data.domain] ?? fallbackConfig
  const enriched = data.status === 'ENRICHED'

  return (
    <div style={{
      background: '#ffffff',
      border: `0.5px solid ${enriched ? config.accent : '#e8e6e2'}`,
      borderRadius: 10,
      overflow: 'hidden',
      minWidth: 120,
      maxWidth: 160,
      boxShadow: enriched
        ? `0 0 0 1px ${config.accent}22, 0 2px 12px rgba(0,0,0,0.08)`
        : '0 2px 8px rgba(0,0,0,0.06)',
      cursor: 'grab',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: config.accent, width: 6, height: 6, border: 'none' }}
      />

      {/* Domain accent bar */}
      <div style={{ height: 3, background: config.accent }} />

      <div style={{ padding: '8px 12px' }}>
        {/* Domain label */}
        <p style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: config.text,
          marginBottom: 5,
          opacity: 0.85,
        }}>
          {data.domain}
        </p>
        {/* Title */}
        <p style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#1a1916',
          lineHeight: 1.4,
          textAlign: 'left',
        }}>
          {data.label}
        </p>
        {/* Enriched indicator */}
        {enriched && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 6,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: config.accent,
            }} />
            <span style={{ fontSize: 9, color: config.text, opacity: 0.8 }}>
              enriched
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: config.accent, width: 6, height: 6, border: 'none' }}
      />
    </div>
  )
}

const nodeTypes = { ideaNode: IdeaNode }

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard', label: 'Ideas', icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a3.5 3.5 0 0 1 2.5 5.96V10a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V7.46A3.5 3.5 0 0 1 8 1.5ZM6 11.5h4M6.5 13h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )},
  { href: '/focus', label: 'Weekly Focus', icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
  )},
  { href: '/goals', label: 'Learning Goals', icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 12 8 4l3.5 4.5L11 7l3 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { href: '/graph', label: 'Idea Graph', icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8h3m0 0v-3l3-1m-3 4v3l3 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )},
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const api = useApi()
  const path = usePathname()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [edgeCount, setEdgeCount] = useState(0)
  const [nodeCount, setNodeCount] = useState(0)

  useEffect(() => {
    if (!api.isLoaded || !api.isSignedIn) return

    api.getGraph()
      .then(({ nodes: rawNodes, edges: rawEdges }) => {
        const radius = Math.max(220, rawNodes.length * 55)
        const positioned = rawNodes.map((n: Node, i: number) => {
          const angle = (2 * Math.PI * i) / rawNodes.length
          return {
            ...n,
            type: 'ideaNode',
            position: {
              x: 500 + radius * Math.cos(angle),
              y: 400 + radius * Math.sin(angle),
            },
          }
        })

        // Style edges to match design system
        const styledEdges = rawEdges.map((e: any) => ({
          ...e,
          style: { stroke: '#d4d1cc', strokeWidth: 1.2 },
          animated: false,
        }))

        setNodes(positioned)
        setEdges(styledEdges)
        setEdgeCount(rawEdges.length)
        setNodeCount(rawNodes.length)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [api.isLoaded, api.isSignedIn])

  // Unique domains across nodes for legend
  const activeDomains = [...new Set(nodes.map(n => n.data?.domain).filter(Boolean))]

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#f7f5f0',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* React Flow canvas — full screen */}
      {!loading && nodes.length > 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={2}
          style={{ background: 'transparent' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            color="#d4d1cc"
            gap={24}
            size={1}
          />
          <Controls
            style={{
              display: 'none', // we use our own controls panel
            }}
          />
          <MiniMap
            nodeColor={n => (DOMAIN_CONFIG[n.data?.domain] ?? fallbackConfig).accent}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '0.5px solid #e8e6e2',
              borderRadius: 10,
              // position it above our bottom-right controls
              bottom: 130,
              right: 16,
            }}
            maskColor="rgba(247,245,240,0.6)"
          />
        </ReactFlow>
      )}

      {/* ── Floating nav panel (top-left) ─── */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '0.5px solid #e8e6e2',
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        minWidth: 180,
        zIndex: 10,
      }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1916', marginBottom: 2 }}>
          IdeaVault
        </p>
        <p style={{
          fontSize: 11, color: '#9d9994',
          paddingBottom: 10, marginBottom: 10,
          borderBottom: '0.5px solid #e8e6e2',
        }}>
          Personal Clarity OS
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  color: active ? '#3d3d9e' : '#6b6760',
                  background: active ? '#ededfc' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                <span style={{ opacity: active ? 1 : 0.65, display: 'flex', color: 'inherit' }}>
                  {icon}
                </span>
                {label}
              </Link>
            )
          })}
        </nav>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid #e8e6e2' }}>
          <UserButton />
        </div>
      </div>

      {/* ── Stats panel (top-right) ─── */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '0.5px solid #e8e6e2',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        zIndex: 10,
        minWidth: 150,
      }}>
        {[
          { label: 'Ideas', value: nodeCount },
          { label: 'Connections', value: edgeCount },
          { label: 'Domains', value: activeDomains.length },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 20,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 11, color: '#9d9994' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1916' }}>{value}</span>
          </div>
        ))}
        {edgeCount === 0 && (
          <p style={{
            fontSize: 11, color: '#9d9994',
            marginTop: 8, paddingTop: 8,
            borderTop: '0.5px solid #e8e6e2',
            fontStyle: 'italic',
          }}>
            Add more ideas to surface connections
          </p>
        )}
      </div>

      {/* ── Domain legend (bottom-left) ─── */}
      {activeDomains.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          border: '0.5px solid #e8e6e2',
          borderRadius: 14,
          padding: '12px 14px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          zIndex: 10,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: '#9d9994',
            letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Domains
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {activeDomains.map(domain => {
              const config = DOMAIN_CONFIG[domain] ?? fallbackConfig
              return (
                <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: config.accent, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, color: '#6b6760' }}>
                    {domain.charAt(0) + domain.slice(1).toLowerCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Loading / empty states ─── */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: '0.5px solid #e8e6e2',
            borderRadius: 14,
            padding: '24px 32px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#6b6760', marginBottom: 4 }}>
              Building your idea graph...
            </p>
            <p style={{ fontSize: 11, color: '#9d9994' }}>
              Fetching semantic connections
            </p>
          </div>
        </div>
      )}

      {!loading && nodes.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: '0.5px solid #e8e6e2',
            borderRadius: 14,
            padding: '32px 40px',
            textAlign: 'center',
            maxWidth: 280,
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12, background: '#f5f4f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="2" stroke="#9d9994" strokeWidth="1.2"/>
                <circle cx="13" cy="4" r="2" stroke="#9d9994" strokeWidth="1.2"/>
                <circle cx="13" cy="12" r="2" stroke="#9d9994" strokeWidth="1.2"/>
                <path d="M5 8h3m0 0v-3l3-1m-3 4v3l3 1" stroke="#9d9994" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1916', marginBottom: 6 }}>
              No ideas yet
            </p>
            <p style={{ fontSize: 12, color: '#9d9994', marginBottom: 16, lineHeight: 1.6 }}>
              Dump a few ideas from the dashboard and AI will surface connections between them.
            </p>
            <Link href="/dashboard" style={{
              display: 'inline-block',
              padding: '8px 18px',
              borderRadius: 8,
              background: '#5b5bd6',
              color: '#fff',
              fontSize: 12, fontWeight: 500,
              textDecoration: 'none',
            }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}