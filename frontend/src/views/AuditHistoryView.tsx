import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { AuditEventItem } from "../types";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Calendar,
  UserCheck,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const AuditHistoryView: React.FC = () => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getAuditEvents(100);
      setEvents(data);
    } catch (err) {
      console.error("Failed to load audit events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const eventTypes = [
    "ALL",
    "FACT_CREATED",
    "EVIDENCE_VERIFIED",
    "ASSET_CREATED",
    "ASSET_REVISION_CREATED",
    "AUDIT_EXECUTED",
    "APPROVAL_DECISION_RECORDED",
    "SCENARIO_CREATED",
    "SCENARIO_PROMOTED_TO_PRODUCTION",
    "REVISION_RESTORED",
  ];

  const filteredEvents = events.filter((e) => {
    const matchesType = eventTypeFilter === "ALL" || e.event_type === eventTypeFilter;
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEventBadgeColor = (type: string) => {
    if (type.includes("APPROVAL")) return "bg-[#FDF2F4] text-[#A36B73] border-[#F3D2D7]";
    if (type.includes("AUDIT")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (type.includes("EVIDENCE") || type.includes("FACT")) return "bg-[#EBF2EE] text-[#4A6B5B] border-[#D1E0D7]";
    if (type.includes("SCENARIO")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-[#FAF8F5] text-[#5C6460] border-[#E7E2D8]";
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E2D8] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#1F2421]">Immutable Audit Trail</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF2EE] text-[#4A6B5B] border border-[#D1E0D7] rounded">
              WORM Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-[#5C6460] mt-1">
            Complete, chronological record of every brand governance action: claim audits, reviewer decisions, evidence verification, and What-If scenario promotions.
          </p>
        </div>

        {/* Security badge */}
        <div className="p-2.5 bg-white border border-[#E7E2D8] rounded-lg shadow-xs flex items-center space-x-2 text-xs text-[#4A6B5B]">
          <Lock className="w-4 h-4 text-[#4A6B5B]" />
          <span className="font-semibold">Backend Authenticated Identities Only</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E7E2D8] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#5C6460] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, entity ID, or description..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A6B5B]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#5C6460]" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg px-3 py-2 text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#4A6B5B]"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#5C6460] whitespace-nowrap">
            ({filteredEvents.length} events)
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#E7E2D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2D8] text-[10px] font-bold text-[#5C6460] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Principal (Actor)</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#5C6460]">
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#5C6460]">
                    No audit events match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#5C6460] whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getEventBadgeColor(e.event_type)}`}>
                        {e.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#1F2421]">{e.actor_name}</div>
                      <div className="text-[10px] text-[#5C6460]">{e.actor_role}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-[#4A6B5B]">
                        {e.entity_type}
                      </span>
                      <div className="text-[10px] text-[#5C6460] font-mono truncate max-w-[120px]">
                        {e.entity_id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#1F2421] max-w-md leading-relaxed">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="text-xs text-[#4A6B5B] hover:underline font-medium inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E7E2D8] shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D8]">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#4A6B5B]" />
                <div>
                  <h3 className="font-bold text-sm text-[#1F2421]">Audit Event #{selectedEvent.id.slice(0, 8)}</h3>
                  <p className="text-[11px] text-[#5C6460]">{selectedEvent.event_type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-semibold text-[#5C6460] hover:text-[#1F2421]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F0ECE4]">
                <span className="text-[#5C6460]">Actor Principal:</span>
                <span className="font-semibold text-[#1F2421]">{selectedEvent.actor_name} ({selectedEvent.actor_role})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0ECE4]">
                <span className="text-[#5C6460]">Entity Target:</span>
                <span className="font-mono text-[#1F2421]">{selectedEvent.entity_type} ({selectedEvent.entity_id})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0ECE4]">
                <span className="text-[#5C6460]">Recorded Timestamp:</span>
                <span className="font-mono text-[#1F2421]">{selectedEvent.created_at}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#5C6460] uppercase tracking-wider block mb-1.5">
                Structured Event Payload JSON
              </span>
              <pre className="p-3 bg-[#FAF8F5] border border-[#E7E2D8] rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 text-[#1F2421]">
                {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F0ECE4]">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E7E2D8] text-xs font-semibold rounded-lg text-[#1F2421]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
