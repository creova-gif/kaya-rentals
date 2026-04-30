import { useState, useEffect } from "react";
import { PaymentAPI } from "../services/backend.service";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  DollarSign,
  CreditCard,
  Send,
  Check,
  Clock,
  AlertTriangle,
  Download,
  Mail,
  Copy,
  ExternalLink,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  Info,
  Shield,
  Leaf,
  Sparkles,
  Wind,
  ParkingCircle,
} from "lucide-react";
type LIcon=React.ComponentType<{size?:number;color?:string}>;
const MU = "#767570";

interface Payment {
  id: string;
  tenantName: string;
  unit: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "late" | "processing";
  method?: "interac" | "stripe" | "auto-pad";
  paidDate?: string;
}

const normalizePaymentStatus = (s: string): Payment["status"] => {
  if (s === "completed") return "paid";
  if (s === "late" || s === "overdue") return "late";
  if (s === "processing") return "processing";
  return "pending";
};

export function RentCollection() {
  const [selectedMethod, setSelectedMethod] = useState<"interac" | "stripe" | "auto-pad">("interac");
  const [showInteracInstructions, setShowInteracInstructions] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"residential" | "cam">("residential");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    PaymentAPI.getAll()
      .then(raw => setPayments(
        raw.map((p: any) => ({
          id: p.id,
          tenantName: p.tenantName ?? p.tenantId ?? "Tenant",
          unit: p.unitId ?? p.unit ?? "—",
          amount: p.amount ?? 0,
          dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split("T")[0] : "",
          status: normalizePaymentStatus(p.status ?? "pending"),
          method: p.method ?? undefined,
          paidDate: p.paidDate ? new Date(p.paidDate).toISOString().split("T")[0] : undefined,
        }))
      ))
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, []);

  const camTenants = [
    { tenant: "Maple Leaf Café Inc.", unit: "Suite 101", sqft: 1400, baseRent: 5600, estimatedCAM: 1400, actualCAM: 1628, leaseType: "NNN" as const },
    { tenant: "TechNest Solutions Ltd.", unit: "Suite 305", sqft: 2400, baseRent: 9200, estimatedCAM: 0, actualCAM: 0, leaseType: "Gross" as const },
    { tenant: "GreenByte Digital Inc.", unit: "Suite 410", sqft: 1600, baseRent: 5600, estimatedCAM: 1120, actualCAM: 984, leaseType: "NNN" as const },
  ];

  const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalLate = payments.filter((p) => p.status === "late").reduce((sum, p) => sum + p.amount, 0);

  const collectionRate = ((totalCollected / totalExpected) * 100).toFixed(0);

  const copyInteracEmail = () => {
    navigator.clipboard.writeText("rent@kaya.ca");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12" style={{ background: '#F8F7F4', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-[10px] font-semibold text-[#767570] uppercase tracking-wider mb-3">
            Financial Operations
          </p>
          <div className="flex items-center gap-4 mb-3">
            <DollarSign className="size-10 text-[#0A7A52]" strokeWidth={2} />
            <h1 className="text-[52px] font-normal text-[#0E0F0C] leading-tight tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-1.5px' }}>
              Rent Collection
            </h1>
          </div>
          <p className="text-[14px] text-[#767570] font-normal">
            Collect rent via Interac e-Transfer, Stripe, or Pre-Authorized Debit
          </p>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-10" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 5, width: "fit-content" }}>
          {[{ key: "residential" as const, label: "Residential Rent" }, { key: "cam" as const, label: "CAM Reconciliation" }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-2"
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
                background: activeTab === t.key ? "#0E0F0C" : "transparent", color: activeTab === t.key ? "#fff" : "#767570", transition: "all .2s" }}>
              {t.key === "cam" && <Building2 size={13} />}
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "residential" && <>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <p className="text-[11px] text-[#767570] uppercase tracking-wider font-semibold mb-3">
              Expected This Month
            </p>
            <h2 className="text-[38px] font-normal text-[#0E0F0C] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              ${totalExpected.toLocaleString()}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <p className="text-[11px] text-[#767570] uppercase tracking-wider font-semibold mb-3">
              Collected
            </p>
            <h2 className="text-[38px] font-normal text-[#0A7A52] leading-none mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              ${totalCollected.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-[#E5F4EE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0A7A52] rounded-full transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <span className="text-[12px] text-[#767570] font-medium">{collectionRate}%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <p className="text-[11px] text-[#767570] uppercase tracking-wider font-semibold mb-3">
              Pending
            </p>
            <h2 className="text-[38px] font-normal text-[#F59E0B] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              ${totalPending.toLocaleString()}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <p className="text-[11px] text-[#767570] uppercase tracking-wider font-semibold mb-3">
              Late Payments
            </p>
            <h2 className="text-[38px] font-normal text-[#EF4444] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              ${totalLate.toLocaleString()}
            </h2>
          </motion.div>
        </div>

        {/* Payment Methods - Canadian Focus */}
        <div className="bg-gradient-to-br from-[#E5F4EE] to-[#F8F7F4] border border-[rgba(10,122,82,0.15)] rounded-xl p-8 mb-12">
          <h3 className="text-[24px] font-normal text-[#0E0F0C] mb-6" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Choose Your Collection Method
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Interac e-Transfer */}
            <button
              onClick={() => {
                setSelectedMethod("interac");
                setShowInteracInstructions(true);
              }}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedMethod === "interac"
                  ? "border-[#0A7A52] bg-white shadow-lg"
                  : "border-[rgba(0,0,0,0.07)] bg-white hover:border-[#0A7A52] hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#0A7A52] to-[#085D3D] flex items-center justify-center">
                  <Send className="size-6 text-white" strokeWidth={2.5} />
                </div>
                {selectedMethod === "interac" && (
                  <CheckCircle2 className="size-6 text-[#0A7A52]" strokeWidth={2.5} />
                )}
              </div>
              <h4 
                className="text-[16px] font-semibold text-[#0E0F0C] mb-2"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Interac e-Transfer
              </h4>
              <p 
                className="text-[13px] text-[#767570] mb-3"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Most popular in Canada. Direct bank-to-bank transfers with no fees.
              </p>
              <div 
                className="flex items-center gap-2 text-[11px] text-[#0A7A52] font-semibold uppercase tracking-wide"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                Recommended for Canada
              </div>
            </button>

            {/* Stripe */}
            <button
              onClick={() => setSelectedMethod("stripe")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedMethod === "stripe"
                  ? "border-[#0A7A52] bg-white shadow-lg"
                  : "border-[rgba(0,0,0,0.07)] bg-white hover:border-[#0A7A52] hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#635BFF] to-[#0A2540] flex items-center justify-center">
                  <CreditCard className="size-6 text-white" strokeWidth={2.5} />
                </div>
                {selectedMethod === "stripe" && (
                  <CheckCircle2 className="size-6 text-[#0A7A52]" strokeWidth={2.5} />
                )}
              </div>
              <h4 
                className="text-[16px] font-semibold text-[#0E0F0C] mb-2"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Stripe Payments
              </h4>
              <p 
                className="text-[13px] text-[#767570] mb-3"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Credit/debit cards. Instant deposits. 2.9% + $0.30 CAD per transaction.
              </p>
              <div 
                className="text-[11px] text-[#767570]"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Supports Visa, Mastercard, Amex
              </div>
            </button>

            {/* PAD */}
            <button
              onClick={() => setSelectedMethod("auto-pad")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedMethod === "auto-pad"
                  ? "border-[#0A7A52] bg-white shadow-lg"
                  : "border-[rgba(0,0,0,0.07)] bg-white hover:border-[#0A7A52] hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#0A7A52] to-[#085D3D] flex items-center justify-center">
                  <TrendingUp className="size-6 text-white" strokeWidth={2.5} />
                </div>
                {selectedMethod === "auto-pad" && (
                  <CheckCircle2 className="size-6 text-[#0A7A52]" strokeWidth={2.5} />
                )}
              </div>
              <h4 
                className="text-[16px] font-semibold text-[#0E0F0C] mb-2"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Pre-Authorized Debit
              </h4>
              <p 
                className="text-[13px] text-[#767570] mb-3"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Automatic monthly withdrawals. Set it and forget it.
              </p>
              <div 
                className="text-[11px] text-[#767570]"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Requires tenant bank authorization
              </div>
            </button>
          </div>
        </div>

        {/* Interac Instructions */}
        {showInteracInstructions && selectedMethod === "interac" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-8 mb-12 shadow-lg"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[24px] font-normal text-[#0E0F0C] mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Interac e-Transfer Setup
                </h3>
                <p className="text-[14px] text-[#767570]">
                  Share these instructions with your tenants
                </p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0A7A52] text-white text-[13px] font-semibold rounded-lg hover:bg-[#085D3D] transition-colors">
                <Mail className="size-4" />
                Email to All Tenants
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#F8F7F4] to-[#E5F4EE] rounded-xl p-6 border border-[rgba(0,0,0,0.05)]">
              <h4 className="text-[14px] font-semibold text-[#0E0F0C] mb-4">
                How to Send Rent via Interac e-Transfer:
              </h4>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-[#0A7A52] flex items-center justify-center text-white text-[14px] font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-[14px] text-[#0E0F0C] font-medium mb-1">
                      Log into your online banking
                    </p>
                    <p className="text-[13px] text-[#767570]">
                      RBC, TD, Scotiabank, BMO, CIBC, or any Canadian bank
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-[#0A7A52] flex items-center justify-center text-white text-[14px] font-semibold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-[#0E0F0C] font-medium mb-2">
                      Send Interac e-Transfer to:
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg">
                        <p className="text-[16px] font-mono text-[#0E0F0C]">rent@kaya.ca</p>
                      </div>
                      <button
                        onClick={copyInteracEmail}
                        className="px-4 py-3 bg-[#0A7A52] text-white text-[13px] font-semibold rounded-lg hover:bg-[#085D3D] transition-colors flex items-center gap-2"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="size-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            Copy Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-[#0A7A52] flex items-center justify-center text-white text-[14px] font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-[14px] text-[#0E0F0C] font-medium mb-1">
                      Enter your Unit Number in the message
                    </p>
                    <p className="text-[13px] text-[#767570]">
                      Example: "Unit 4A - March 2026 Rent"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-[#0A7A52] flex items-center justify-center text-white text-[14px] font-semibold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="text-[14px] text-[#0E0F0C] font-medium mb-1">
                      Auto-deposit enabled (no security question)
                    </p>
                    <p className="text-[13px] text-[#767570]">
                      Funds deposited automatically within 30 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#E5F4EE] border border-[rgba(10,122,82,0.2)] rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-[#0A7A52] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#0E0F0C] mb-1">
                    No Transaction Fees
                  </p>
                  <p className="text-[12px] text-[#767570]">
                    Interac e-Transfer is free for both you and your tenants with most Canadian banks.
                    Funds arrive instantly with auto-deposit.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment List */}
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.05)]">
            <h3 className="text-[20px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Current Payments
            </h3>
          </div>

          {loadingPayments ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
              <Loader2 size={24} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#767570", fontSize: 14 }}>
              No payments found. Add tenants to start collecting rent.
            </div>
          ) : null}

          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {payments.map((payment, idx) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="px-6 py-5 hover:bg-[#F8F7F4] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-full bg-gradient-to-br from-[#0A7A52] to-[#085D3D] flex items-center justify-center">
                      <Users className="size-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#0E0F0C]">
                        {payment.tenantName}
                      </p>
                      <p className="text-[13px] text-[#767570]">
                        Unit {payment.unit} • Due {payment.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[20px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        ${payment.amount.toLocaleString()}
                      </p>
                      {payment.method && (
                        <p className="text-[11px] text-[#767570] uppercase tracking-wider font-medium">
                          {payment.method === "interac" ? "Interac e-Transfer" : payment.method}
                        </p>
                      )}
                    </div>

                    <div
                      className={`px-4 py-2 rounded-full text-[12px] font-semibold flex items-center gap-2 uppercase tracking-wide ${
                        payment.status === "paid"
                          ? "bg-[#E5F4EE] text-[#0A7A52]"
                          : payment.status === "processing"
                          ? "bg-[#DBEAFE] text-[#3B82F6]"
                          : payment.status === "late"
                          ? "bg-[#FEE2E2] text-[#EF4444]"
                          : "bg-[#FEF3C7] text-[#F59E0B]"
                      }`}
                    >
                      {payment.status === "paid" && <CheckCircle2 className="size-4" />}
                      {payment.status === "processing" && <Clock className="size-4" />}
                      {payment.status === "late" && <AlertTriangle className="size-4" />}
                      {payment.status === "pending" && <Clock className="size-4" />}
                      <span className="capitalize">{payment.status}</span>
                    </div>

                    {payment.status === "pending" && (
                      <button className="px-4 py-2 bg-[#0A7A52] text-white text-[13px] font-semibold rounded-lg hover:bg-[#085D3D] transition-colors flex items-center gap-2">
                        <Send className="size-4" />
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-5 bg-white border border-[rgba(0,0,0,0.07)] rounded-xl hover:shadow-lg transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#E5F4EE] group-hover:bg-[#0A7A52] transition-colors">
                <Download className="size-5 text-[#0A7A52] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-[#0E0F0C]">Export Payments</h4>
            </div>
            <p className="text-[13px] text-[#767570]">Download CSV for accounting</p>
          </button>

          <button className="p-5 bg-white border border-[rgba(0,0,0,0.07)] rounded-xl hover:shadow-lg transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#E5F4EE] group-hover:bg-[#0A7A52] transition-colors">
                <Calendar className="size-5 text-[#0A7A52] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-[#0E0F0C]">Payment Schedule</h4>
            </div>
            <p className="text-[13px] text-[#767570]">View upcoming payments</p>
          </button>

          <button className="p-5 bg-white border border-[rgba(0,0,0,0.07)] rounded-xl hover:shadow-lg transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#E5F4EE] group-hover:bg-[#0A7A52] transition-colors">
                <ExternalLink className="size-5 text-[#0A7A52] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-[#0E0F0C]">Payment Portal</h4>
            </div>
            <p className="text-[13px] text-[#767570]">Share tenant payment link</p>
          </button>
        </div>

        </>}

        {/* CAM Reconciliation Tab */}
        {activeTab === "cam" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Info */}
            <div style={{ background: "#EBF2FB", border: "1px solid #BFDBFE", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 24 }}>
              <Info size={16} color="#1E5FA8" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#1E5FA8", margin: 0 }}>
                CAM (Common Area Maintenance) reconciliation compares estimated CAM charges billed to tenants against actual operating costs for the year.
                NNN tenants pay their proportionate share; Gross lease tenants pay fixed rent (CAM included). Issue annual reconciliation statements within 90–120 days of your fiscal year-end.
              </p>
            </div>

            {/* CAM Summary Cards */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              {[
                { label: "Total Estimated CAM Billed", value: `$${(camTenants.reduce((s, t) => s + t.estimatedCAM, 0)).toLocaleString()}`, color: "#0E0F0C" },
                { label: "Total Actual CAM Costs", value: `$${(camTenants.reduce((s, t) => s + t.actualCAM, 0)).toLocaleString()}`, color: "#0E0F0C" },
                { label: "Net CAM Adjustment", value: (() => { const diff = camTenants.reduce((s, t) => s + (t.actualCAM - t.estimatedCAM), 0); return `${diff >= 0 ? "+" : ""}$${diff.toLocaleString()}`; })(), color: camTenants.reduce((s, t) => s + (t.actualCAM - t.estimatedCAM), 0) >= 0 ? "#C0392B" : "#0A7A52" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: "20px 24px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#767570", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* CAM Tenant Table */}
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#0E0F0C", margin: 0 }}>Commercial Tenant CAM Reconciliation — 2025</h3>
              </div>
              <div style={{ padding: "0 24px" }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {["Tenant", "Lease Type", "Sq Ft", "Est. CAM/mo", "Actual CAM/mo", "Adjustment"].map(h => (
                    <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#767570", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>{h}</p>
                  ))}
                </div>
                {camTenants.map((t, i) => {
                  const diff = t.actualCAM - t.estimatedCAM;
                  const isGross = t.leaseType === "Gross";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 12, padding: "16px 0", borderBottom: i < camTenants.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0E0F0C", margin: 0 }}>{t.tenant}</p>
                        <p style={{ fontSize: 11, color: "#767570", margin: "2px 0 0" }}>{t.unit}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: isGross ? "#EBF2FB" : "#E5F4EE", color: isGross ? "#1E5FA8" : "#0A7A52", padding: "3px 10px", borderRadius: 20 }}>{t.leaseType}</span>
                      <p style={{ fontSize: 13, color: "#0E0F0C", margin: 0 }}>{t.sqft.toLocaleString()}</p>
                      <p style={{ fontSize: 13, color: "#0E0F0C", margin: 0 }}>{isGross ? "Included" : `$${t.estimatedCAM.toLocaleString()}`}</p>
                      <p style={{ fontSize: 13, color: "#0E0F0C", margin: 0 }}>{isGross ? "N/A" : `$${t.actualCAM.toLocaleString()}`}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isGross ? "#767570" : diff > 0 ? "#C0392B" : diff < 0 ? "#0A7A52" : "#0E0F0C", margin: 0 }}>
                        {isGross ? "—" : diff === 0 ? "$0" : `${diff > 0 ? "+" : ""}$${diff.toLocaleString()}`}
                        {!isGross && diff !== 0 && <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 4 }}>{diff > 0 ? "(owed by tenant)" : "(credit to tenant)"}</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CAM Components Breakdown */}
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: 24, marginTop: 16 }}>
              <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: "#0E0F0C", margin: "0 0 16px" }}>Annual CAM Cost Components</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { category: "Building Insurance", estimated: 28000, actual: 31200, Icon: Shield as LIcon },
                  { category: "Property Tax (common)", estimated: 42000, actual: 42000, Icon: Building2 as LIcon },
                  { category: "Landscaping / Snow", estimated: 8400, actual: 9100, Icon: Leaf as LIcon },
                  { category: "Cleaning / Janitorial", estimated: 14400, actual: 13800, Icon: Sparkles as LIcon },
                  { category: "HVAC Maintenance", estimated: 6000, actual: 8400, Icon: Wind as LIcon },
                  { category: "Parking Lot Repairs", estimated: 3600, actual: 2200, Icon: ParkingCircle as LIcon },
                ].map((c, i) => {
                  const diff = c.actual - c.estimated;
                  return (
                    <div key={i} style={{ padding: "14px", background: "#F8F7F4", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <c.Icon size={18} color={MU}/>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0E0F0C" }}>{c.category}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#767570" }}>Estimated</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0E0F0C" }}>${c.estimated.toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#767570" }}>Actual</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0E0F0C" }}>${c.actual.toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#767570" }}>Variance</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: diff > 0 ? "#C0392B" : "#0A7A52" }}>{diff > 0 ? "+" : ""}${diff.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => toast.success("CAM reconciliation statement generated", { description: "Annual CAM statement sent to all NNN tenants. Gross lease tenant excluded." })}
                style={{ padding: "12px 28px", background: "#0A7A52", color: "#fff", border: "none", borderRadius: 10, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Issue CAM Reconciliation Statements →
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}