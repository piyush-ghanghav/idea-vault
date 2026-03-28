export type Domain = 'DEV' | 'BUSINESS' | 'CREATIVE' | 'HEALTH' | 'TRAVEL' | 'LEARNING' | 'LIFE'
export type IdeaStatus = 'PENDING' | 'ENRICHED' | 'ACTIVE' | 'PARKED' | 'ARCHIVED'

export interface Enrichment{
    id: string;
    ideaId: string
    category: string
    summary: string
    viabilityNote: string
    phases: any[]
    estimatedHours?: number
    nextSteps: any[]
    domainMeta?: any
}

export interface Idea {
  id: string
  userId: string
  title: string
  rawDump: string
  domain: Domain
  status: IdeaStatus
  createdAt: string
  updatedAt: string
  enrichment: Enrichment | null
}

export const DOMAINS: Domain[] = ['DEV', 'BUSINESS', 'CREATIVE', 'HEALTH', 'TRAVEL', 'LEARNING', 'LIFE']

export const DOMAIN_COLORS: Record<Domain, { bg: string; text: string; border: string }> = {
  DEV:      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  BUSINESS: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  CREATIVE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  HEALTH:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  TRAVEL:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  LEARNING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  LIFE:     { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
}
