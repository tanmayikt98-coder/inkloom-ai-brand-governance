import {
  User, Brand, BrandFact, BrandRule, EvidenceSource, MarketingAsset,
  AssetRevision, AuditRun, ReviewQueueItem, ApprovalRecord,
  TimeMachineComparison, ImpactGraph, ImpactAnalysis, WhatIfScenario,
  ScenarioSimulationResult, DashboardOverview, TraceabilityChain,
  AuditEventItem, UserRole, FactStatus, EvidenceStatus, EvidenceType,
  RuleType, Severity, AssetType, ApprovalDecision, ScenarioChangeType,
  CampaignItem, GovernanceReportsResponse
} from "../types";

const rawBase = ((import.meta as any).env?.VITE_API_BASE_URL || "").trim();
// When running locally through the Vite dev server, empty or "/api" ensures all requests
// use the same origin (http://localhost:5173/api/...) reverse-proxied to http://localhost:8000
const API_BASE = (!rawBase || rawBase === "/" || rawBase === "/api")
  ? "/api"
  : (rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`);

// Active demo role stored in local storage for instant demo switching
let activeDemoRole: UserRole = (localStorage.getItem("inkloom_demo_role") as UserRole) || "BRAND_MANAGER";
let authToken: string | null = localStorage.getItem("inkloom_token");

export const setDemoRole = (role: UserRole) => {
  activeDemoRole = role;
  localStorage.setItem("inkloom_demo_role", role);
};

export const getActiveDemoRole = (): UserRole => activeDemoRole;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("inkloom_token", token);
  } else {
    localStorage.removeItem("inkloom_token");
  }
};

const getHeaders = (isJson: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {
    "X-Demo-Role": activeDemoRole,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const data = await res.json();
      errorDetail = data.detail || JSON.stringify(data);
    } catch {
      errorDetail = res.statusText;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Auth & RBAC
  auth: {
    getMe: async (): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      return handleResponse<User>(res);
    },
    getDemoUsers: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE}/auth/demo-users`, { headers: getHeaders() });
      return handleResponse<User[]>(res);
    },
    switchDemoRole: async (role: UserRole): Promise<{ access_token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/switch-demo-role`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ role }),
      });
      const data = await handleResponse<{ access_token: string; user: User }>(res);
      setDemoRole(role);
      setAuthToken(data.access_token);
      return data;
    },
  },

  // Brands
  brands: {
    list: async (): Promise<Brand[]> => {
      const res = await fetch(`${API_BASE}/brands`, { headers: getHeaders() });
      return handleResponse<Brand[]>(res);
    },
    get: async (brandId: string): Promise<Brand> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}`, { headers: getHeaders() });
      return handleResponse<Brand>(res);
    },
    create: async (data: { name: string; tagline?: string; description?: string }): Promise<Brand> => {
      const res = await fetch(`${API_BASE}/brands`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Brand>(res);
    },
  },

  // Brand Facts
  facts: {
    listByBrand: async (brandId: string): Promise<BrandFact[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/facts`, { headers: getHeaders() });
      return handleResponse<BrandFact[]>(res);
    },
    create: async (brandId: string, data: {
      claim_statement: string;
      category?: string;
      status?: FactStatus;
      metric_value?: number;
      metric_unit?: string;
      validity_start?: string;
      validity_end?: string;
      responsible_owner?: string;
      notes?: string;
      evidence_ids?: string[];
    }): Promise<BrandFact> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/facts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<BrandFact>(res);
    },
    update: async (factId: string, data: Partial<BrandFact>): Promise<BrandFact> => {
      const res = await fetch(`${API_BASE}/facts/${factId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<BrandFact>(res);
    },
  },

  // Evidence
  evidence: {
    listByBrand: async (brandId: string): Promise<EvidenceSource[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/evidence`, { headers: getHeaders() });
      return handleResponse<EvidenceSource[]>(res);
    },
    create: async (brandId: string, data: {
      title: string;
      source_type: EvidenceType;
      document_text: string;
      url?: string;
      publication_date?: string;
      expiration_date?: string;
      verification_status?: EvidenceStatus;
      responsible_owner?: string;
      verification_notes?: string;
    }): Promise<EvidenceSource> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/evidence`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<EvidenceSource>(res);
    },
    uploadFile: async (brandId: string, formData: FormData): Promise<EvidenceSource> => {
      const headers = getHeaders(false);
      const res = await fetch(`${API_BASE}/brands/${brandId}/evidence/upload`, {
        method: "POST",
        headers,
        body: formData,
      });
      return handleResponse<EvidenceSource>(res);
    },
    update: async (evidenceId: string, data: Partial<EvidenceSource>): Promise<EvidenceSource> => {
      const res = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<EvidenceSource>(res);
    },
  },

  // Brand Rules
  rules: {
    listByBrand: async (brandId: string): Promise<BrandRule[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/rules`, { headers: getHeaders() });
      return handleResponse<BrandRule[]>(res);
    },
    create: async (brandId: string, data: {
      rule_code: string;
      name: string;
      rule_type: RuleType;
      check_pattern: string;
      failure_message: string;
      severity: Severity;
      is_active?: boolean;
    }): Promise<BrandRule> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/rules`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<BrandRule>(res);
    },
    update: async (ruleId: string, data: Partial<BrandRule>): Promise<BrandRule> => {
      const res = await fetch(`${API_BASE}/rules/${ruleId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<BrandRule>(res);
    },
  },

  // Marketing Assets & Revisions
  assets: {
    listByBrand: async (brandId: string): Promise<MarketingAsset[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/assets`, { headers: getHeaders() });
      return handleResponse<MarketingAsset[]>(res);
    },
    get: async (assetId: string): Promise<MarketingAsset> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}`, { headers: getHeaders() });
      return handleResponse<MarketingAsset>(res);
    },
    create: async (brandId: string, data: {
      title: string;
      asset_type: AssetType;
      campaign_name?: string;
      content_text: string;
    }): Promise<MarketingAsset> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/assets`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<MarketingAsset>(res);
    },
    createRevision: async (assetId: string, data: {
      content_text: string;
      change_summary?: string;
    }): Promise<AssetRevision> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}/revisions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<AssetRevision>(res);
    },
  },

  // Audits & Traceability
  audits: {
    runAudit: async (revisionId: string): Promise<AuditRun> => {
      const res = await fetch(`${API_BASE}/revisions/${revisionId}/audit`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<AuditRun>(res);
    },
    getLatestAudit: async (revisionId: string): Promise<AuditRun | null> => {
      const res = await fetch(`${API_BASE}/revisions/${revisionId}/latest-audit`, { headers: getHeaders() });
      return handleResponse<AuditRun | null>(res);
    },
    getTraceability: async (findingId: string): Promise<TraceabilityChain> => {
      const res = await fetch(`${API_BASE}/traceability/${findingId}`, { headers: getHeaders() });
      return handleResponse<TraceabilityChain>(res);
    },
  },

  // Reviews & Maker-Checker
  reviews: {
    getQueue: async (): Promise<ReviewQueueItem[]> => {
      const res = await fetch(`${API_BASE}/reviews/queue`, { headers: getHeaders() });
      return handleResponse<ReviewQueueItem[]>(res);
    },
    submit: async (assetId: string): Promise<ReviewQueueItem> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}/submit`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<ReviewQueueItem>(res);
    },
    decide: async (assetId: string, data: {
      decision: ApprovalDecision;
      decision_reason: string;
    }): Promise<ApprovalRecord> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}/decide`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<ApprovalRecord>(res);
    },
  },

  // Brand Time Machine
  timeMachine: {
    listRevisions: async (assetId: string): Promise<AssetRevision[]> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}/revisions`, { headers: getHeaders() });
      return handleResponse<AssetRevision[]>(res);
    },
    compare: async (baseRevId: string, targetRevId: string): Promise<TimeMachineComparison> => {
      const res = await fetch(`${API_BASE}/time-machine/compare?base_rev_id=${baseRevId}&target_rev_id=${targetRevId}`, {
        headers: getHeaders(),
      });
      return handleResponse<TimeMachineComparison>(res);
    },
    restore: async (assetId: string, revisionId: string): Promise<AssetRevision> => {
      const res = await fetch(`${API_BASE}/assets/${assetId}/restore/${revisionId}`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<AssetRevision>(res);
    },
  },

  // Brand Impact Map
  impact: {
    getGraph: async (brandId: string): Promise<ImpactGraph> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/impact-graph`, { headers: getHeaders() });
      return handleResponse<ImpactGraph>(res);
    },
    analyze: async (entityId: string, entityType: string): Promise<ImpactAnalysis> => {
      const res = await fetch(`${API_BASE}/impact/analyze?entity_id=${entityId}&entity_type=${entityType}`, {
        headers: getHeaders(),
      });
      return handleResponse<ImpactAnalysis>(res);
    },
  },

  // What-If Simulator
  simulator: {
    listScenarios: async (brandId: string): Promise<WhatIfScenario[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/scenarios`, { headers: getHeaders() });
      return handleResponse<WhatIfScenario[]>(res);
    },
    create: async (brandId: string, data: {
      title: string;
      description?: string;
      change_type: ScenarioChangeType;
      target_entity_id: string;
      proposed_payload: Record<string, any>;
    }): Promise<WhatIfScenario> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/scenarios`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<WhatIfScenario>(res);
    },
    runSimulation: async (scenarioId: string): Promise<ScenarioSimulationResult> => {
      const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/run`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<ScenarioSimulationResult>(res);
    },
    promote: async (scenarioId: string): Promise<WhatIfScenario> => {
      const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/promote`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<WhatIfScenario>(res);
    },
  },

  // Dashboard & Audit Events
  dashboard: {
    getOverview: async (brandId?: string): Promise<DashboardOverview> => {
      const url = brandId ? `${API_BASE}/dashboard/overview?brand_id=${brandId}` : `${API_BASE}/dashboard/overview`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse<DashboardOverview>(res);
    },
    getAuditEvents: async (limit: number = 50): Promise<AuditEventItem[]> => {
      const res = await fetch(`${API_BASE}/dashboard/audit-events?limit=${limit}`, { headers: getHeaders() });
      return handleResponse<AuditEventItem[]>(res);
    },
  },

  // Campaign Management (Module 8)
  campaigns: {
    listByBrand: async (brandId: string): Promise<CampaignItem[]> => {
      const res = await fetch(`${API_BASE}/brands/${brandId}/campaigns`, { headers: getHeaders() });
      return handleResponse<CampaignItem[]>(res);
    },
  },

  // Governance Reports & Analytics
  reports: {
    getAnalytics: async (brandId?: string): Promise<GovernanceReportsResponse> => {
      const url = brandId ? `${API_BASE}/reports/governance-analytics?brand_id=${brandId}` : `${API_BASE}/reports/governance-analytics`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse<GovernanceReportsResponse>(res);
    },
    exportSummary: async (): Promise<any> => {
      const res = await fetch(`${API_BASE}/reports/export-summary`, { headers: getHeaders() });
      return handleResponse<any>(res);
    },
  },
};

