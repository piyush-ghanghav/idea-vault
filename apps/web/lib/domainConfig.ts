export interface DomainConfig {
  accent: string
  bg:     string
  text:   string
}

export const DOMAIN_CONFIG: Record<string, DomainConfig> = {
  DEV:      { accent: 'var(--dom-dev-accent)',      bg: 'var(--dom-dev-bg)',      text: 'var(--dom-dev-text)'      },
  DESIGN:   { accent: 'var(--dom-design-accent)',   bg: 'var(--dom-design-bg)',   text: 'var(--dom-design-text)'   },
  BUSINESS: { accent: 'var(--dom-business-accent)', bg: 'var(--dom-business-bg)', text: 'var(--dom-business-text)' },
  PERSONAL: { accent: 'var(--dom-personal-accent)', bg: 'var(--dom-personal-bg)', text: 'var(--dom-personal-text)' },
  RESEARCH: { accent: 'var(--dom-research-accent)', bg: 'var(--dom-research-bg)', text: 'var(--dom-research-text)' },
  CREATIVE: { accent: 'var(--dom-creative-accent)', bg: 'var(--dom-creative-bg)', text: 'var(--dom-creative-text)' },
  HEALTH:   { accent: 'var(--dom-health-accent)',   bg: 'var(--dom-health-bg)',   text: 'var(--dom-health-text)'   },
  TRAVEL:   { accent: 'var(--dom-travel-accent)',   bg: 'var(--dom-travel-bg)',   text: 'var(--dom-travel-text)'   },
  LEARNING: { accent: 'var(--dom-learning-accent)', bg: 'var(--dom-learning-bg)', text: 'var(--dom-learning-text)' },
  LIFE:     { accent: 'var(--dom-life-accent)',     bg: 'var(--dom-life-bg)',     text: 'var(--dom-life-text)'     },
}

export const fallbackDomain: DomainConfig = {
  accent: 'var(--border-2)',
  bg:     'var(--surface-2)',
  text:   'var(--text-3)',
}

export function getDomain(domain: string): DomainConfig {
  return DOMAIN_CONFIG[domain] ?? fallbackDomain
}