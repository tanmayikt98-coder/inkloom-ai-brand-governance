import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { Sidebar, NavSection } from "./components/Sidebar";

// Views
import { OverviewView } from "./views/OverviewView";
import { BrandKnowledgeHubView } from "./views/BrandKnowledgeHubView";
import { ContentAuditsView } from "./views/ContentAuditsView";
import { TraceabilityView } from "./views/TraceabilityView";
import { ReviewQueueView } from "./views/ReviewQueueView";
import { TimeMachineView } from "./views/TimeMachineView";
import { ImpactMapView } from "./views/ImpactMapView";
import { WhatIfSimulatorView } from "./views/WhatIfSimulatorView";
import { CampaignsAndReportsView } from "./views/CampaignsAndReportsView";
import { AuditHistoryView } from "./views/AuditHistoryView";
import { SettingsView } from "./views/SettingsView";

const MainLayout: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>("overview");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F2421] flex flex-col font-sans">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
        />
        <main className="flex-1 overflow-y-auto">
          {currentSection === "overview" && <OverviewView onNavigate={setCurrentSection} />}
          {currentSection === "knowledge-hub" && <BrandKnowledgeHubView />}
          {currentSection === "content-audits" && <ContentAuditsView />}
          {currentSection === "traceability" && <TraceabilityView />}
          {currentSection === "review-queue" && <ReviewQueueView />}
          {currentSection === "time-machine" && <TimeMachineView />}
          {currentSection === "impact-map" && <ImpactMapView />}
          {currentSection === "simulator" && <WhatIfSimulatorView />}
          {currentSection === "campaigns" && <CampaignsAndReportsView onNavigateAudit={() => setCurrentSection("content-audits")} />}
          {currentSection === "audit-history" && <AuditHistoryView />}
          {currentSection === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
