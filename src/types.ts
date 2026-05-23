export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  agentRole?: 'router' | 'sales' | 'support' | 'escalation' | 'manager';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  voiceTranslation?: string;
}

export interface CustomerMemory {
  customer_name: string;
  language: string;
  budget: string;
  interest: string;
  last_issue: string;
  sentiment: 'happy' | 'neutral' | 'angry' | 'vip';
  lead_score: number;
}

export interface Appointment {
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  agentName: string;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  language: string;
  budget: string;
  interest: string;
  lastIssue: string;
  sentiment: 'happy' | 'neutral' | 'angry' | 'vip';
  leadScore: number;
  priority: 'high' | 'medium' | 'low';
  history: ChatMessage[];
  lastInteraction: string;
  appointment?: Appointment;
}

export interface AgentMetric {
  name: string;
  callsHandled: number;
  score: number; // Quality / Performance rating (0-100)
  satisfactionRate: number; // 0-100
  resolutions: number;
  upsells: number;
}

export interface SystemAnalytics {
  totalLeads: number;
  convertedLeads: number;
  activeTickets: number;
  escalatedCount: number;
  byLanguage: { [key: string]: number };
  bySentiment: { [key: string]: number };
  industryMetrics: { [key: string]: number };
  agentMetrics: AgentMetric[];
  recentReviewsByManager: {
    id: string;
    customerName: string;
    transcriptSnippet: string;
    agentPerformance: string;
    rating: number;
    coachingAdvice: string;
    timestamp: string;
  }[];
}

export type BusinessIndustry = 'real_estate' | 'solar' | 'visa';

export interface BusinessPreset {
  id: BusinessIndustry;
  name: string;
  location: string;
  description: string;
  faqs: { q: string; a: string }[];
  catalog: { item: string; price: string; details: string }[];
}
