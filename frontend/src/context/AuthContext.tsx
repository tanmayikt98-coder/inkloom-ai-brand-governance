import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Brand, UserRole, TenantOrganization } from "../types";
import { api, getActiveDemoRole, setDemoRole } from "../services/api";

export const DEFAULT_BRAND: Brand = {
  id: "brand-aurevia-001",
  organization_id: "org-aurevia-001",
  name: "Aurevia",
  tagline: "Enterprise Intelligence with Deterministic Trust",
  description: "Next-generation automated workflow and enterprise governance engine operating under FTC 16 CFR Part 255 standards.",
  created_at: "2026-10-31T00:00:00Z",
  updated_at: "2026-10-31T00:00:00Z",
};

export const DEFAULT_ORG: TenantOrganization = {
  id: "org-aurevia-001",
  name: "Aurevia Technologies Inc.",
  slug: "aurevia-corp",
  brand_count: 1,
  asset_count: 9,
  active_framework: "FTC 16 CFR Part 255 & Enterprise SLAs",
};

export const DEFAULT_USER: User = {
  id: "user-brand-02",
  full_name: "Marcus Sterling (Brand Mgr)",
  email: "brand.manager@inkloom.ai",
  role: "BRAND_MANAGER",
  organization_id: "org-aurevia-001",
  is_active: true,
  created_at: "2026-10-31T00:00:00Z",
};

interface AuthContextType {
  currentUser: User | null;
  activeBrand: Brand | null;
  allBrands: Brand[];
  activeOrg: TenantOrganization | null;
  allOrgs: TenantOrganization[];
  demoUsers: User[];
  isLoading: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  switchTenant: (orgId: string) => Promise<void>;
  setActiveBrand: (brand: Brand) => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canEditFacts: () => boolean;
  canUploadEvidence: () => boolean;
  canApprove: () => boolean;
  canCreateContent: () => boolean;
  canSimulate: () => boolean;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(DEFAULT_BRAND);
  const [allBrands, setAllBrands] = useState<Brand[]>([DEFAULT_BRAND]);
  const [activeOrg, setActiveOrg] = useState<TenantOrganization | null>(DEFAULT_ORG);
  const [allOrgs, setAllOrgs] = useState<TenantOrganization[]>([DEFAULT_ORG]);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch me
      try {
        const me = await api.auth.getMe();
        if (me && me.id) {
          setCurrentUser(me);
        }
      } catch (e) {
        console.warn("[Inkloom AI] Failed loading current user, using default principal:", e);
      }

      // 2. Fetch demo users for switcher
      try {
        const demos = await api.auth.getDemoUsers();
        if (Array.isArray(demos) && demos.length > 0) {
          setDemoUsers(demos);
        }
      } catch (e) {
        console.warn("[Inkloom AI] Failed loading demo accounts:", e);
      }

      // 3. Fetch organizations (Round 3 Multi-Tenancy)
      try {
        const orgs = await api.auth.listOrganizations();
        if (Array.isArray(orgs) && orgs.length > 0) {
          setAllOrgs(orgs);
          const curOrg = orgs.find((o) => o.id === (currentUser?.organization_id || "org-aurevia-001")) || orgs[0];
          setActiveOrg(curOrg);
        }
      } catch (e) {
        console.warn("[Inkloom AI] Failed loading organizations:", e);
      }

      // 4. Fetch brands
      try {
        const brands = await api.brands.list();
        if (Array.isArray(brands) && brands.length > 0) {
          setAllBrands(brands);
          const aurevia = brands.find((b) => b.name.toLowerCase().includes("aurevia")) || brands[0];
          setActiveBrand(aurevia);
        }
      } catch (e) {
        console.warn("[Inkloom AI] Failed loading brands, keeping default Aurevia:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const switchTenant = async (orgId: string) => {
    try {
      setIsLoading(true);
      const res = await api.auth.switchTenant(orgId);
      setCurrentUser(res.user);
      const targetOrg = allOrgs.find((o) => o.id === orgId) || null;
      setActiveOrg(targetOrg);
      // Reload brands for newly switched tenant
      const brands = await api.brands.list();
      if (Array.isArray(brands) && brands.length > 0) {
        setAllBrands(brands);
        setActiveBrand(brands[0]);
      }
    } catch (err) {
      console.error("[Inkloom AI] Failed switching tenant:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    try {
      setIsLoading(true);
      const res = await api.auth.switchDemoRole(role);
      setCurrentUser(res.user);
    } catch (err) {
      console.error("[Inkloom AI] Failed to switch role:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === "ORGANIZATION_ADMIN") return true;
    return roles.includes(currentUser.role);
  };

  const canEditFacts = () => hasRole("BRAND_MANAGER", "ORGANIZATION_ADMIN");
  const canUploadEvidence = () => hasRole("EVIDENCE_CUSTODIAN", "BRAND_MANAGER", "ORGANIZATION_ADMIN");
  const canApprove = () => hasRole("REVIEWER_APPROVER", "ORGANIZATION_ADMIN");
  const canCreateContent = () => hasRole("CONTENT_CREATOR", "BRAND_MANAGER", "CAMPAIGN_MANAGER", "ORGANIZATION_ADMIN");
  const canSimulate = () => hasRole("BRAND_MANAGER", "CAMPAIGN_MANAGER", "ORGANIZATION_ADMIN");

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeBrand,
        allBrands,
        activeOrg,
        allOrgs,
        demoUsers,
        isLoading,
        switchRole,
        switchTenant,
        setActiveBrand,
        hasRole,
        canEditFacts,
        canUploadEvidence,
        canApprove,
        canCreateContent,
        canSimulate,
        refreshData: loadInitialData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
