import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Brand, UserRole, TenantOrganization } from "../types";
import { api, getActiveDemoRole, setDemoRole } from "../services/api";

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [activeOrg, setActiveOrg] = useState<TenantOrganization | null>(null);
  const [allOrgs, setAllOrgs] = useState<TenantOrganization[]>([]);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch me
      const me = await api.auth.getMe();
      setCurrentUser(me);

      // Fetch demo users for switcher
      const demos = await api.auth.getDemoUsers();
      setDemoUsers(demos);

      // Fetch organizations (Round 3 Multi-Tenancy)
      const orgs = await api.auth.listOrganizations();
      setAllOrgs(orgs);
      if (orgs.length > 0) {
        const curOrg = orgs.find((o) => o.id === me.organization_id) || orgs[0];
        setActiveOrg(curOrg);
      }

      // Fetch brands
      const brands = await api.brands.list();
      setAllBrands(brands);
      if (brands.length > 0) {
        const aurevia = brands.find((b) => b.name.toLowerCase().includes("aurevia")) || brands[0];
        setActiveBrand(aurevia);
      }
    } catch (err) {
      console.error("[Inkloom AI] Failed loading initial auth data:", err);
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
      setAllBrands(brands);
      if (brands.length > 0) {
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
