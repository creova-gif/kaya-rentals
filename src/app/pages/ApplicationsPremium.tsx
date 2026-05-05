import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Search, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Brain, Building2, Briefcase, Users, Star, Clock, Loader2 } from "lucide-react";
import { AIContextualHelper } from "../components/AIContextualHelper";
import { toast } from "sonner";
import { ApplicationAPI } from "../services/backend.service";

const G = "#0A7A52";
const GL = "#E5F4EE";
const BG = "#F8F7F4";
const BORDER = "rgba(0,0,0,0.07)";
const TEXT = "#0E0F0C";
const MUTED = "#767570";

interface Application {
  id: string;
  name: string;
  unit: string;
  rent: number;
  aiScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendation: "approve" | "review" | "reject";
  creditScore: number;
  income: number;
  rentToIncomeRatio: number;
  employmentYears: number;
  appliedDate: string;
}


interface BusinessApplication {
  id: string;
  companyName: string;
  contactName: string;
  unit: string;
  baseRent: number;
  aiScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendation: "approve" | "review" | "reject";
  businessCreditScore: number;
  annualRevenue: number;
  incorporationYear: number;
  hasPersonalGuarantee: boolean;
  leaseType: string;
  appliedDate: string;
  incorporationNo: string;
}

const businessApplications: BusinessApplication[] = [
  { id: "b1", companyName: "Maple Leaf Café Inc.", contactName: "Priya Anand (Director)", unit: "Suite 101 — 1,200 sqft Retail", baseRent: 4800, aiScore: 88, riskLevel: "low", recommendation: "approve", businessCreditScore: 72, annualRevenue: 420000, incorporationYear: 2019, hasPersonalGuarantee: true, leaseType: "NNN", appliedDate: "Mar 12", incorporationNo: "ON-3847201" },
  { id: "b2", companyName: "TechNest Solutions Ltd.", contactName: "Jordan Wu (CEO)", unit: "Suite 305 — 2,400 sqft Office", baseRent: 9200, aiScore: 94, riskLevel: "low", recommendation: "approve", businessCreditScore: 81, annualRevenue: 1850000, incorporationYear: 2017, hasPersonalGuarantee: true, leaseType: "Gross", appliedDate: "Mar 14", incorporationNo: "ON-2194830" },
  { id: "b3", companyName: "Northview Fitness Co.", contactName: "Marcus Osei (Owner)", unit: "Suite 200 — 3,800 sqft", baseRent: 12400, aiScore: 61, riskLevel: "medium", recommendation: "review", businessCreditScore: 54, annualRevenue: 280000, incorporationYear: 2022, hasPersonalGuarantee: false, leaseType: "Modified Gross", appliedDate: "Mar 10", incorporationNo: "ON-4921047" },
  { id: "b4", companyName: "GreenByte Digital Inc.", contactName: "Sophie Tremblay (COO)", unit: "Suite 410 — 1,600 sqft Office", baseRent: 5600, aiScore: 79, riskLevel: "low", recommendation: "approve", businessCreditScore: 68, annualRevenue: 740000, incorporationYear: 2020, hasPersonalGuarantee: true, leaseType: "NNN", appliedDate: "Mar 15", incorporationNo: "ON-3310482" },
];

function ScoreRing({ score, risk }: { score: number; risk: string }) {
  const color = risk === "low" ? G : risk === "medium" ? "#B45309" : "#C0392B";
  const bg = risk === "low" ? GL : risk === "medium" ? "#FEF3C7" : "#FDECEA";
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  return (
    <div style={{ width: 64, height: 64, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={64} height={64} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx={32} cy={32} r={radius} fill="none" stroke={bg} strokeWidth={5} />
        <circle cx={32} cy={32} r={radius} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1, display: "block" }}>{score}</span>
        <span style={{ fontSize: 8, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI</span>
      </div>
    </div>
  );
}

function RiskBadge({ rec }: { rec: string }) {
  const map = {
    approve: { bg: GL, color: G, icon: <CheckCircle2 size={11} />, label: "Approve" },
    review:  { bg: "#FEF3C7", color: "#B45309", icon: <AlertTriangle size={11} />, label: "Review" },
    reject:  { bg: "#FDECEA", color: "#C0392B", icon: <XCircle size={11} />, label: "Reject" },
  };
  const c = map[rec as keyof typeof map];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.2px" }}>
      {c.icon}{c.label}
    </span>
  );
}

function StatCell({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: warn ? "#B45309" : TEXT }}>{value}</span>
      <span style={{ fontSize: 10, color: MUTED, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
    </div>
  );
}

const RISK_BORDER: Record<string, string> = {
  low: G,
  medium: "#B45309",
  high: "#C0392B",
};

function toRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

export function ApplicationsPremium() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tenantType, setTenantType] = useState<"residential" | "business">("residential");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    ApplicationAPI.getAll('landlord')
      .then(data => {
        const mapped: Application[] = data.map((a: any) => ({
          id: a.id,
          name: a.employer || a.employmentStatus || 'Applicant',
          unit: a.unitId ? `Unit ${a.unitId.slice(0, 8)}` : 'TBD',
          rent: a.monthlyIncome ? Math.round(a.monthlyIncome * 0.3) : 0,
          aiScore: a.aiRiskScore ?? 0,
          riskLevel: toRiskLevel(a.aiRiskScore ?? 0),
          recommendation: (a.aiRecommendation ?? 'review') as Application['recommendation'],
          creditScore: 0,
          income: a.monthlyIncome ?? 0,
          rentToIncomeRatio: a.monthlyIncome
            ? Math.round((a.monthlyIncome * 0.3 / a.monthlyIncome) * 100)
            : 0,
          employmentYears: a.yearsEmployed ?? 0,
          appliedDate: a.createdAt
            ? new Date(a.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
            : '—',
        }));
        setApplications(mapped);
      })
      .catch(() => {})
      .finally(() => setLoadingApps(false));
  }, []);

  const filtered = applications.filter(a =>
    (filter === "all" || a.riskLevel === filter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.unit.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredBusiness = businessApplications.filter(a =>
    (filter === "all" || a.riskLevel === filter) &&
    (a.companyName.toLowerCase().includes(search.toLowerCase()) || a.unit.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = tenantType === "residential" ? [
    { label: "Total", val: applications.length, icon: <Users size={18} color={G} />, color: TEXT },
    { label: "Pending Review", val: applications.length, icon: <Clock size={18} color={MUTED} />, color: TEXT },
    { label: "High AI Score", val: applications.filter(a => a.aiScore >= 85).length, icon: <Star size={18} color={G} />, color: G },
    { label: "Needs Attention", val: applications.filter(a => a.riskLevel !== "low").length, icon: <AlertTriangle size={18} color="#B45309" />, color: "#B45309" },
  ] : [
    { label: "Total", val: businessApplications.length, icon: <Building2 size={18} color={G} />, color: TEXT },
    { label: "Pending Review", val: businessApplications.length, icon: <Clock size={18} color={MUTED} />, color: TEXT },
    { label: "High AI Score", val: businessApplications.filter(a => a.aiScore >= 85).length, icon: <Star size={18} color={G} />, color: G },
    { label: "Needs Attention", val: businessApplications.filter(a => a.riskLevel !== "low").length, icon: <AlertTriangle size={18} color="#B45309" />, color: "#B45309" },
  ];

  const displayCount = tenantType === "residential" ? filtered.length : filteredBusiness.length;
  const totalCount = tenantType === "residential" ? applications.length : businessApplications.length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <AIContextualHelper
        context="Application Review"
        suggestions={["Screen Sarah Kim with AI", "Compare all high-score applicants", "Check income verification requirements", "Generate approval letter"]}
        position="top-right"
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 10 }}>
            Tenant Screening
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Brain size={22} color={G} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 44, fontWeight: 400, color: TEXT, lineHeight: 1, letterSpacing: "-1px", margin: 0 }}>
                  Smart Screening
                </h1>
                <p style={{ fontSize: 13, color: MUTED, margin: "6px 0 0" }}>
                  {tenantType === "residential" ? "AI-powered residential tenant analysis" : "Corporate entity & business credit screening"} · {totalCount} applications
                </p>
              </div>
            </div>

            {/* Tenant type toggle */}
            <div style={{ display: "flex", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 4, gap: 3, flexShrink: 0 }}>
              <button
                onClick={() => { setTenantType("residential"); setFilter("all"); setSearch(""); }}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: tenantType === "residential" ? TEXT : "transparent",
                  color: tenantType === "residential" ? "#fff" : MUTED,
                  transition: "all .2s" }}
              >
                Residential
              </button>
              <button
                onClick={() => { setTenantType("business"); setFilter("all"); setSearch(""); }}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: tenantType === "business" ? TEXT : "transparent",
                  color: tenantType === "business" ? "#fff" : MUTED,
                  transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Building2 size={13} />Business
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.7px", margin: 0 }}>{s.label}</p>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </div>
              </div>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, color: s.color, lineHeight: 1, margin: 0 }}>{s.val}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Business tenant notice ── */}
        {tenantType === "business" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: GL, border: `1px solid rgba(10,122,82,0.2)`, borderRadius: 12, padding: "13px 18px", marginBottom: 22, display: "flex", gap: 11, alignItems: "center" }}
          >
            <Briefcase size={15} color={G} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: G, fontWeight: 500, lineHeight: 1.4 }}>
              Business screening includes corporate credit score, incorporation status, personal guarantee, and annual revenue verification.
            </span>
          </motion.div>
        )}

        {/* ── Search & Filter bar ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", width: 320, flexShrink: 0 }}>
            <Search size={15} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tenantType === "residential" ? "Search applicants..." : "Search companies..."}
              style={{ width: "100%", padding: "11px 14px 11px 40px", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff", color: TEXT, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Risk filter pills */}
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {[
              { val: "all", label: "All" },
              { val: "low", label: "Low risk" },
              { val: "medium", label: "Medium risk" },
              { val: "high", label: "High risk" },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                style={{
                  padding: "9px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", border: "1px solid",
                  background: filter === f.val ? TEXT : "#fff",
                  color: filter === f.val ? "#fff" : MUTED,
                  borderColor: filter === f.val ? TEXT : BORDER,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <span style={{ fontSize: 12, color: MUTED, flexShrink: 0, whiteSpace: "nowrap" }}>
            {displayCount} of {totalCount}
          </span>
        </div>

        {/* ── Residential Application Cards ── */}
        {tenantType === "residential" && loadingApps && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={28} color={G} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {tenantType === "residential" && !loadingApps && (
          <>
            <AnimatePresence>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 3 }}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    style={{
                      background: "#fff",
                      border: `1px solid ${BORDER}`,
                      borderLeft: `4px solid ${RISK_BORDER[app.riskLevel]}`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    {/* AI Score ring */}
                    <ScoreRing score={app.aiScore} risk={app.riskLevel} />

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{app.name}</p>
                        <RiskBadge rec={app.recommendation} />
                      </div>
                      <p style={{ fontSize: 12, color: MUTED, margin: "0 0 14px" }}>{app.unit} &middot; Applied {app.appliedDate}</p>

                      {/* Stats row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        {[
                          { label: "Monthly income", value: `$${app.income.toLocaleString()}`, warn: false },
                          { label: "Rent / income", value: `${app.rentToIncomeRatio}%`, warn: app.rentToIncomeRatio > 35 },
                          { label: "Credit score", value: String(app.creditScore), warn: app.creditScore < 650 },
                          { label: "Employment", value: `${app.employmentYears} yrs`, warn: app.employmentYears < 1 },
                        ].map((stat, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                            {idx > 0 && <div style={{ width: 1, height: 28, background: BORDER, margin: "0 20px" }} />}
                            <StatCell label={stat.label} value={stat.value} warn={stat.warn} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flexShrink: 0, minWidth: 110 }}>
                      {app.recommendation === "approve" && (
                        <button
                          onClick={e => { e.stopPropagation(); toast.success(`Approval started for ${app.name}`); }}
                          style={{ padding: "9px 0", background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/applications/${app.id}`); }}
                        style={{ padding: "9px 0", background: BG, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      >
                        View details <ChevronRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <Users size={36} color={BORDER} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, color: MUTED, margin: 0 }}>No applications match your filter.</p>
              </div>
            )}
          </>
        )}

        {/* ── Business Tenant Application Cards ── */}
        {tenantType === "business" && (
          <>
            <AnimatePresence>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredBusiness.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 3 }}
                    style={{
                      background: "#fff",
                      border: `1px solid ${BORDER}`,
                      borderLeft: `4px solid ${RISK_BORDER[app.riskLevel]}`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    {/* AI Score ring */}
                    <ScoreRing score={app.aiScore} risk={app.riskLevel} />

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{app.companyName}</p>
                        <RiskBadge rec={app.recommendation} />
                        {app.hasPersonalGuarantee ? (
                          <span style={{ fontSize: 10, fontWeight: 700, background: GL, color: G, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>✓ Personal Guarantee</span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#B45309", padding: "3px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>⚠ No Guarantee</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: MUTED, margin: "0 0 14px" }}>
                        {app.contactName} &middot; {app.unit} &middot; {app.leaseType} lease &middot; Applied {app.appliedDate}
                      </p>

                      {/* Stats row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        {[
                          { label: "Business credit", value: `${app.businessCreditScore}/100`, warn: app.businessCreditScore < 60 },
                          { label: "Annual revenue", value: `$${(app.annualRevenue / 1000).toFixed(0)}K` },
                          { label: "Inc. year", value: String(app.incorporationYear), warn: app.incorporationYear >= 2023 },
                          { label: "Monthly rent", value: `$${app.baseRent.toLocaleString()}` },
                        ].map((stat, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                            {idx > 0 && <div style={{ width: 1, height: 28, background: BORDER, margin: "0 20px" }} />}
                            <StatCell label={stat.label} value={stat.value} warn={stat.warn} />
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 10, color: MUTED, margin: "10px 0 0", fontWeight: 500 }}>Corp. No: {app.incorporationNo}</p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flexShrink: 0, minWidth: 110 }}>
                      {app.recommendation === "approve" && (
                        <button
                          onClick={e => { e.stopPropagation(); toast.success(`Approval started for ${app.companyName}`); }}
                          style={{ padding: "9px 0", background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); toast.info(`Opening Letter of Intent for ${app.companyName}`); }}
                        style={{ padding: "9px 0", background: BG, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      >
                        View LOI <ChevronRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            {filteredBusiness.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <Building2 size={36} color={BORDER} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, color: MUTED, margin: 0 }}>No business applications match your filter.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
