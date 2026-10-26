import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Brand, UserRole } from "../types";
import { api, getActiveDemoRole, setDemoRole } from "../services/api";

interface AuthContextType {
  currentUser: User | null;
  activeBrand: Brand | null;
  allBrands: Brand[];
  demoUsers: User[];
  isLoading: boolean;
  switchRole: (role: UserRole) => Promise<void>;
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

      // Fetch brands
      const brands = await api.brands.list();
      setAllBrands(brands);
      if (brands.length > 0) {
        // Set Aurevia as default
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
        demoUsers,
        isLoading,
        switchRole,
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
