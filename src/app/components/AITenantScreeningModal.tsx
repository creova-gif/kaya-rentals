import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { postAiRoute } from "../services/ai-client";

interface AITenantScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantData?: {
    name?: string;
    income?: number;
    creditScore?: number;
    employmentStatus?: string;
    rentalHistory?: string;
    references?: string;
  };
}

interface ScreeningResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendation: "approve" | "conditional" | "deny";
  strengths: string[];
  concerns: string[];
  redFlags: string[];
  verificationNeeded: string[];
  summary: string;
  incomeToRentRatio?: string;
  suggestedActions: string[];
}

export function AITenantScreeningModal({ isOpen, onClose, tenantData }: AITenantScreeningModalProps) {
  const [formData, setFormData] = useState({
    tenantName: tenantData?.name || "",
    income: tenantData?.income?.toString() || "",
    creditScore: tenantData?.creditScore?.toString() || "",
    employmentStatus: tenantData?.employmentStatus || "",
    rentalHistory: tenantData?.rentalHistory || "",
    references: tenantData?.references || "",
    additionalInfo: ""
  });
  
  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await postAiRoute('screen-tenant', {
        tenantName: formData.tenantName,
        income: formData.income ? parseInt(formData.income) : null,
        creditScore: formData.creditScore ? parseInt(formData.creditScore) : null,
        employmentStatus: formData.employmentStatus,
        rentalHistory: formData.rentalHistory,
        references: formData.references,
        additionalInfo: formData.additionalInfo
      });
      
      if (data.success) {
        setScreening(data.screening);
      } else {
        setError(data.error || 'Failed to screen tenant');
      }
    } catch (err) {
      console.error('Tenant screening error:', err);
      setError('Failed to screen tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
      case "high": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low": return <CheckCircle2 className="size-6" />;
      case "medium": return <AlertTriangle className="size-6" />;
      case "high": return <XCircle className="size-6" />;
      default: return <Sparkles className="size-6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-[rgba(0,0,0,0.05)] flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1D9E75]" />
            <h2 className="text-xl font-semibold text-[#1A1A1A]">AI Tenant Screening</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F9FAFB] rounded-[10px] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!screening ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Annual Income
                  </label>
                  <input
                    type="number"
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    placeholder="75000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Credit Score
                  </label>
                  <input
                    type="number"
                    value={formData.creditScore}
                    onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                    className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    placeholder="720"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Employment Status
                </label>
                <input
                  type="text"
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                  className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  placeholder="Full-time Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Rental History
                </label>
                <textarea
                  value={formData.rentalHistory}
                  onChange={(e) => setFormData({ ...formData, rentalHistory: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  placeholder="Previous landlord: Jane Doe, 2 years, no issues..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  References
                </label>
                <textarea
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  placeholder="Employer: ABC Corp, Personal: Mary Johnson..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  placeholder="Any other relevant details..."
                />
              </div>

              {error && (
                <p className="text-sm text-[#854F0B]">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-[#1D9E75] text-white rounded-[10px] font-medium hover:bg-[#0F6E56] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Claude AI is analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    Screen with AI
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Risk Score */}
              <div className={`border rounded-[14px] p-6 ${getRiskColor(screening.riskLevel)}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white rounded-full">
                    {getRiskIcon(screening.riskLevel)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold capitalize">{screening.riskLevel} Risk</h3>
                    <p className="text-sm opacity-80">Risk Score: {screening.riskScore}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium uppercase">Recommendation</p>
                    <p className="text-lg font-bold capitalize">{screening.recommendation}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{screening.summary}</p>
              </div>

              {/* Strengths */}
              {screening.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#1D9E75] mb-2 flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {screening.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-[#6B7280] flex items-start gap-2">
                        <span className="text-[#1D9E75]">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {screening.concerns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#854F0B] mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Concerns
                  </h4>
                  <ul className="space-y-1.5">
                    {screening.concerns.map((concern, i) => (
                      <li key={i} className="text-sm text-[#6B7280]">• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {screening.redFlags.length > 0 && (
                <div className="bg-[#FAEEDA] rounded-[14px] p-4 border border-[#854F0B]/20">
                  <h4 className="text-sm font-medium text-[#854F0B] mb-2 flex items-center gap-2">
                    <XCircle className="size-4" />
                    Red Flags
                  </h4>
                  <ul className="space-y-1.5">
                    {screening.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-[#1A1A1A]">⚠ {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Actions */}
              {screening.suggestedActions.length > 0 && (
                <div className="bg-[#E6F1FB] rounded-[14px] p-4">
                  <h4 className="text-sm font-medium text-[#185FA5] mb-2">Suggested Actions</h4>
                  <ul className="space-y-1.5">
                    {screening.suggestedActions.map((action, i) => (
                      <li key={i} className="text-sm text-[#1A1A1A]">→ {action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setScreening(null)}
                  className="flex-1 px-4 py-3 border border-[rgba(0,0,0,0.08)] rounded-[10px] font-medium hover:bg-[#F9FAFB] transition"
                >
                  Screen Another Tenant
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-[#1D9E75] text-white rounded-[10px] font-medium hover:bg-[#0F6E56] transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
