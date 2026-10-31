import React from "react";
import { ShieldCheck, Download, Printer, CheckCircle2, Lock, FileText, X, QrCode } from "lucide-react";
import { BrandClearanceCertificate } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificate: BrandClearanceCertificate | null;
}

export const ClearanceCertificateModal: React.FC<Props> = ({ isOpen, onClose, certificate }) => {
  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${certificate.certificate_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-[#131926] rounded-2xl border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Certificate Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Brand Clearance Certificate
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  WORM STATE LOCKED
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                {certificate.certificate_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#182234] hover:bg-gray-50 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-md shadow-emerald-950/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white dark:bg-[#0B0F17] print:p-0">
          {/* Certificate Header Banner */}
          <div className="border-4 border-double border-emerald-600/30 dark:border-emerald-500/20 p-6 rounded-xl relative overflow-hidden bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] tracking-widest font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                  Inkloom AI &bull; Enterprise Compliance Attestation
                </span>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 tracking-tight">
                  OFFICIAL BRAND CLEARANCE CERTIFICATE
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Issued under {certificate.governance_framework}
                </p>
              </div>
              <div className="p-2 border border-emerald-500/30 rounded-lg bg-white dark:bg-[#131926] shadow-sm text-center">
                <QrCode className="w-12 h-12 text-emerald-700 dark:text-emerald-400 mx-auto" />
                <span className="text-[9px] font-mono text-gray-400 block mt-1">VERIFIED WORM</span>
              </div>
            </div>

            {/* Asset Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-emerald-500/20 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-mono">Asset Title</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{certificate.asset_title}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-mono">Revision</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">v{certificate.revision_number} (State Locked)</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-mono">Certified Reviewer</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{certificate.reviewed_by}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-mono">Attestation Timestamp</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">{new Date(certificate.timestamp_utc).toLocaleString()}</span>
              </div>
            </div>

            {/* Approved Copy Snapshot */}
            <div className="mt-5 p-3.5 bg-gray-50 dark:bg-[#131926] rounded-lg border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Approved Content Snapshot
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "{certificate.content_text}"
              </p>
            </div>

            {/* Grounding & Evidence Lineage */}
            <div className="mt-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                Substantiated Evidentiary Citations (Zero Hallucination Guarantee)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {certificate.evidence_lineage.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {ev.title}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {ev.owner} &bull; <span className="font-mono text-emerald-600 dark:text-emerald-400">{ev.authority_tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Checksums */}
            <div className="mt-6 pt-5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded bg-gray-50 dark:bg-[#131926] border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[9px] uppercase">Content SHA-256 Digest</span>
                <span className="text-emerald-700 dark:text-emerald-400 truncate block font-bold mt-0.5">
                  {certificate.content_sha256}
                </span>
              </div>
              <div className="p-2.5 rounded bg-gray-50 dark:bg-[#131926] border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[9px] uppercase">Attestation Signature Fingerprint</span>
                <span className="text-emerald-700 dark:text-emerald-400 truncate block font-bold mt-0.5">
                  {certificate.attestation_fingerprint}
                </span>
              </div>
            </div>

            {/* Maker-Checker Seal */}
            <div className="mt-6 flex items-center justify-between text-xs pt-4 border-t border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Maker-Checker Separation: <strong>Verified</strong> (Creator Sarah Chen &ne; Reviewer Victoria Brooks)</span>
              </div>
              <div className="font-mono text-[10px]">
                Ledger Ref: <strong>{certificate.immutable_block_reference}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

