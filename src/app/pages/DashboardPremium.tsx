import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Building2, CheckCircle2, ArrowUpRight, Clock, Zap, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AIContextualHelper } from "../components/AIContextualHelper";
import { useAuth } from "../contexts/AuthContext";
import { PropertyAPI, ApplicationAPI, AnalyticsAPI, PaymentAPI } from "../services/backend.service";
import type { Property, Application, Payment } from "../types/database.types";

// ─── Design tokens ────────────────────────────────────────────
const G = "#0A7A52";        // Kaya green
const GL = "#E5F4EE";       // green light
const BG = "#F8F7F4";       // warm off-white
const BORDER = "rgba(0,0,0,0.07)";
const TEXT = "#0E0F0C";
const MUTED = "#767570";

// ─── Sub-components ───────────────────────────────────────────
function KayaBadge({ label, color = "green" }: { label: string; color?: "green" | "amber" | "red" | "blue" }) {
  const map = {
    green: { bg: GL, text: "#0A7A52" },
    amber: { bg: "#FEF3C7", text: "#B45309" },
    red: { bg: "#FDECEA", text: "#C0392B" },
    blue: { bg: "#EBF2FB", text: "#1E5FA8" },
  };
  const c = map[color];
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.2px" }}>
      {label}
    </span>
  );
}

function MetricCard({ label, value, sub, trend, delay = 0 }: { label: string; value: string; sub?: string; trend?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "24px 28px",
        cursor: "default",
        transition: "box-shadow 0.2s",
      }}
      whileHover={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 12 }}>{label}</p>
      <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 38, fontWeight: 400, color: TEXT, lineHeight: 1, marginBottom: 6 }}>{value}</p>
      {(sub || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          {trend && <span style={{ fontSize: 12, color: trend.startsWith("+") ? G : "#C0392B", fontWeight: 600 }}>{trend}</span>}
          {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────
export function DashboardPremium() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalProperties: number;
    totalUnits: number;
    totalApplications: number;
    pendingApplications: number;
    totalRevenue: number;
    pendingPayments: number;
  } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsData, propertiesData, applicationsData, paymentsData] = await Promise.allSettled([
          AnalyticsAPI.getDashboard(),
          PropertyAPI.getAll(),
          ApplicationAPI.getAll('landlord'),
          PaymentAPI.getAll(),
        ]);
        if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
        if (propertiesData.status === 'fulfilled') setProperties(propertiesData.value);
        if (applicationsData.status === 'fulfilled') setApplications(applicationsData.value.slice(0, 3));
        if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build revenue chart from payment history (last 6 months)
  const revenueData = (() => {
    const months: { month: string; v: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const total = payments
        .filter(p => {
          const pd = p.paidDate ? new Date(p.paidDate) : null;
          return pd && pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && p.status === 'completed';
        })
        .reduce((sum, p) => sum + p.amount, 0);
      months.push({ month: label, v: total });
    }
    return months;
  })();

  const overduePayments = payments.filter(p => p.status === 'overdue' || p.status === 'late');
  const paidPayments = payments.filter(p => p.status === 'completed');

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  const alerts = [
    overduePayments.length > 0
      ? { type: "warning", msg: `${overduePayments.length} overdue payment${overduePayments.length > 1 ? 's' : ''} need attention`, time: "now" }
      : null,
    applications.length > 0
      ? { type: "success", msg: `${applications.length} application${applications.length > 1 ? 's' : ''} pending review`, time: "now" }
      : null,
    { type: "info", msg: "Your dashboard is connected to live data", time: "live" },
  ].filter(Boolean) as { type: string; msg: string; time: string }[];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', system-ui, sans-serif", position: "relative" }}>
      {/* AI Contextual Helper - Proactive Suggestions */}
      <AIContextualHelper
        context="Dashboard Insights"
        suggestions={[
          "Analyze my pending applications",
          "Show me overdue rent payments",
          "Predict vacancy for next month",
          "Generate N4 notice",
        ]}
        position="top-right"
      />

      {/* ── Top bar ── */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: TEXT }}>Kaya<span style={{ color: G }}>.</span></span>
          {["Dashboard", "Properties", "Applications", "Documents", "Analytics"].map(n => (
            <a key={n} style={{ fontSize: 13, color: n === "Dashboard" ? TEXT : MUTED, fontWeight: n === "Dashboard" ? 600 : 400, textDecoration: "none", cursor: "pointer", transition: "color 0.15s" }}>{n}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: G }} />
          <span style={{ fontSize: 13, color: MUTED }}>{user?.name ?? '—'}</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: G }}>
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Loader2 size={32} color={G} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {!loading && (
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 8 }}>{todayLabel}</p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, fontWeight: 400, color: TEXT, lineHeight: 1.05, letterSpacing: "-1px" }}>
            {greeting},<br /><em style={{ fontStyle: "italic", color: G }}>{firstName}.</em>
          </h1>
          <p style={{ fontSize: 15, color: MUTED, marginTop: 10 }}>
            {analytics?.pendingApplications
              ? `${analytics.pendingApplications} application${analytics.pendingApplications > 1 ? 's' : ''} need${analytics.pendingApplications === 1 ? 's' : ''} review`
              : 'No pending applications'}
            {overduePayments.length > 0 ? ` · ${overduePayments.length} overdue payment${overduePayments.length > 1 ? 's' : ''}` : ''}
          </p>
        </motion.div>

        {/* ── Action banner ── */}
        {(analytics?.pendingApplications ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ background: TEXT, borderRadius: 16, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, cursor: "pointer" }}
            whileHover={{ opacity: 0.95 }}
            onClick={() => navigate("/app/applications")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: G, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="#fff" />
              </div>
              <div>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  AI has pre-screened {analytics?.pendingApplications} new applicant{(analytics?.pendingApplications ?? 0) > 1 ? 's' : ''}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Review and approve or reject from your applications page</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>Review now</span>
              <ArrowUpRight size={16} color="#fff" />
            </div>
          </motion.div>
        )}

        {/* ── Metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <MetricCard
            label="Monthly Revenue"
            value={`$${(analytics?.totalRevenue ?? 0).toLocaleString()}`}
            sub="collected to date"
            delay={0.1}
          />
          <MetricCard
            label="Total Units"
            value={`${analytics?.totalUnits ?? 0}`}
            sub={`across ${analytics?.totalProperties ?? 0} propert${(analytics?.totalProperties ?? 0) === 1 ? 'y' : 'ies'}`}
            delay={0.15}
          />
          <MetricCard
            label="Applications"
            value={`${analytics?.totalApplications ?? 0}`}
            sub={`${analytics?.pendingApplications ?? 0} pending review`}
            delay={0.2}
          />
          <MetricCard
            label="Properties"
            value={`${analytics?.totalProperties ?? 0}`}
            sub={`${analytics?.totalUnits ?? 0} units total`}
            delay={0.25}
          />
        </div>

        {/* ── Chart + Alerts ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 32 }}>
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 28px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 6 }}>Revenue trend</p>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: TEXT }}>$27,600 <span style={{ fontSize: 14, color: MUTED, fontFamily: "inherit" }}>/ Mar</span></p>
              </div>
              <KayaBadge label="↑ 12% vs last month" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashPremiumRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={G} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={G} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="none" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis stroke="none" tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: TEXT, border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                  cursor={{ stroke: BORDER, strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="v" stroke={G} strokeWidth={2} fill="url(#dashPremiumRevGrad)" dot={false} activeDot={{ r: 4, fill: G }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px" }}
          >
            <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 20 }}>AI Insights</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: i < alerts.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: a.type === "warning" ? "#B45309" : a.type === "success" ? G : "#1E5FA8"
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{a.msg}</p>
                    <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{ width: "100%", marginTop: 20, padding: "10px", background: GL, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: G, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => navigate("/ai-assistant")}
            >
              Ask Kaya AI →
            </button>
          </motion.div>
        </div>

        {/* ── Applications ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: TEXT }}>Applications</h2>
            <button onClick={() => navigate("/app/applications")} style={{ fontSize: 13, color: G, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              View all →
            </button>
          </div>
          {applications.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px", textAlign: "center" }}>
              <p style={{ color: MUTED, fontSize: 14 }}>No applications yet. Add a property and list a unit to start receiving applications.</p>
              <button onClick={() => navigate("/app/properties/add")} style={{ marginTop: 16, padding: "10px 20px", background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Add your first property →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.06 }}
                  onClick={() => navigate(`/app/applications/${app.id}`)}
                  whileHover={{ x: 4 }}
                  style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: (app.aiRiskScore ?? 0) >= 85 ? GL : (app.aiRiskScore ?? 0) >= 70 ? "#FEF3C7" : "#FDECEA",
                      fontSize: 16, fontWeight: 700,
                      color: (app.aiRiskScore ?? 0) >= 85 ? G : (app.aiRiskScore ?? 0) >= 70 ? "#B45309" : "#C0392B"
                    }}>
                      {app.aiRiskScore ?? '—'}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
                        {app.employer || app.employmentStatus || 'Applicant'}
                      </p>
                      <p style={{ fontSize: 12, color: MUTED }}>
                        Income ${(app.monthlyIncome ?? 0).toLocaleString()}/mo · {app.status}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <KayaBadge
                      label={app.aiRecommendation === "approve" ? "Approve" : app.aiRecommendation === "reject" ? "Reject" : "Review"}
                      color={app.aiRecommendation === "approve" ? "green" : app.aiRecommendation === "reject" ? "red" : "amber"}
                    />
                    <ChevronRight size={16} color={MUTED} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Properties ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: TEXT, marginBottom: 16 }}>Properties</h2>
          {properties.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "48px", textAlign: "center" }}>
              <Building2 size={40} color={MUTED} style={{ marginBottom: 16 }} />
              <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>No properties yet. Add your first property to get started.</p>
              <button onClick={() => navigate("/app/properties/add")} style={{ padding: "12px 24px", background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Add property →
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                  onClick={() => navigate(`/app/properties/${p.id}`)}
                  style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px", cursor: "pointer", transition: "box-shadow 0.2s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={18} color={G} />
                    </div>
                    <KayaBadge label="Active" color="green" />
                  </div>
                  <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: TEXT, marginBottom: 4 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>{p.address}, {p.city}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Total Units", `${p.totalUnits}`],
                      ["Type", p.propertyType.replace('_', ' ')],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: MUTED }}>{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, textTransform: "capitalize" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Rent status ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: TEXT, marginBottom: 16 }}>
            Rent status — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Paid", val: paidPayments.length, color: G, bg: GL, icon: <CheckCircle2 size={22} color={G} /> },
              { label: "Overdue", val: overduePayments.length, color: "#B45309", bg: "#FEF3C7", icon: <Clock size={22} color="#B45309" /> },
              { label: "Pending", val: payments.filter(p => p.status === 'pending').length, color: MUTED, bg: BG, icon: <Building2 size={22} color={MUTED} /> },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "24px", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 16 }}>
                {s.icon}
                <div>
                  <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, color: s.color, lineHeight: 1 }}>{s.val}</p>
                  <p style={{ fontSize: 12, color: s.color, fontWeight: 500, marginTop: 4 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
      )}
    </div>
  );
}