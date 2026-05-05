import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AnalyticsAPI, PaymentAPI } from "../services/backend.service";

const G = "#0A7A52", GL = "#E5F4EE";
const BG = "#F8F7F4", TEXT = "#0E0F0C", MUTED = "#767570";
const BORDER = "rgba(0,0,0,0.07)";

const styles = {
  card: { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16 } as React.CSSProperties,
  sectionTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, fontWeight: 400, color: TEXT, letterSpacing: "-0.4px" } as React.CSSProperties,
  label: { fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.7px" },
};

function Badge({ label, color = "green" }: { label: string; color?: "green" | "amber" | "red" | "blue" | "gray" }) {
  const c = { green: [GL, G], amber: ["#FEF3C7", "#B45309"], red: ["#FDECEA", "#C0392B"], blue: ["#EBF2FB", "#1E5FA8"], gray: [BG, MUTED] }[color];
  return <span style={{ background: c[0], color: c[1], fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{label}</span>;
}

export function Analytics() {
  const [revenueData, setRevenueData] = useState<{ month: string; actual: number | null; proj: number }[]>([]);
  const [occupancy, setOccupancy] = useState<{ month: string; rate: number }[]>([]);
  const [predictions, setPredictions] = useState([
    { title: "Late Payment Prob.", value: "—", change: "", up: false, desc: "Loading…" },
    { title: "Tenant Turnover Risk", value: "—", change: "", up: false, desc: "Loading…" },
    { title: "Revenue Forecast", value: "—", change: "", up: true, desc: "Loading…" },
    { title: "Maintenance Cost", value: "—", change: "", up: true, desc: "Loading…" },
  ]);

  useEffect(() => {
    PaymentAPI.getAll().then(payments => {
      const now = new Date();
      const months = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        const label = d.toLocaleString("default", { month: "short" });
        const isPast = d <= now;
        const total = payments
          .filter((p: any) => {
            const pd = p.paidDate ? new Date(p.paidDate) : null;
            return pd && pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && p.status === "completed";
          })
          .reduce((sum: number, p: any) => sum + p.amount, 0);
        const lastTotal = isPast && i > 0 ? total : total * 1.02;
        return { month: label, actual: isPast ? total : null, proj: Math.round(lastTotal) };
      });
      setRevenueData(months);
    }).catch(() => {});

    AnalyticsAPI.getPortfolio().then(portfolio => {
      const { overview, applications, maintenance } = portfolio;

      const lateRatio = applications.total > 0
        ? Math.round(((applications.total - applications.approved) / applications.total) * 100)
        : 0;
      const turnoverRisk = applications.total > 0
        ? Math.round((applications.rejected / applications.total) * 100)
        : 0;

      setPredictions([
        {
          title: "Late Payment Prob.",
          value: `${lateRatio}%`,
          change: "",
          up: lateRatio > 20,
          desc: `${applications.pending} application${applications.pending !== 1 ? "s" : ""} pending`,
        },
        {
          title: "Tenant Turnover Risk",
          value: `${turnoverRisk}%`,
          change: "",
          up: turnoverRisk > 15,
          desc: `${overview.vacantUnits} vacant unit${overview.vacantUnits !== 1 ? "s" : ""}`,
        },
        {
          title: "Revenue Forecast",
          value: `$${overview.monthlyRevenue.toLocaleString()}`,
          change: "",
          up: true,
          desc: `Monthly across ${overview.totalProperties} propert${overview.totalProperties !== 1 ? "ies" : "y"}`,
        },
        {
          title: "Maintenance Cost",
          value: `$${maintenance.totalCost.toLocaleString()}`,
          change: "",
          up: maintenance.totalCost > 1000,
          desc: `${maintenance.open} open request${maintenance.open !== 1 ? "s" : ""}`,
        },
      ]);

      setOccupancy(prev => {
        const last = { month: new Date().toLocaleString("default", { month: "short" }), rate: Math.round(overview.occupancyRate * 100) };
        return prev.length > 0 ? [...prev.slice(0, -1), last] : [last];
      });

      const placeholderOccupancy = [
        { month: "Nov", rate: 75 }, { month: "Dec", rate: 78 },
        { month: "Jan", rate: 80 }, { month: "Feb", rate: 82 },
        { month: "Mar", rate: 81 },
        { month: new Date().toLocaleString("default", { month: "short" }), rate: Math.round(overview.occupancyRate * 100) },
      ];
      setOccupancy(placeholderOccupancy);
    }).catch(() => {});
  }, []);

  const churn = [
    { tenant: "Bob Johnson", unit: "3A", risk: 78, reason: "Late payments" },
    { tenant: "Jason Lee", unit: "1C", risk: 65, reason: "Lease ending soon" },
    { tenant: "Michael Chen", unit: "2B", risk: 42, reason: "Maintenance issues" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: "#F8F7F4", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="mb-8">
          <p className="text-[10px] font-semibold text-[#767570] uppercase tracking-wider mb-2">Insights</p>
          <h1 className="text-[48px] font-normal text-[#0E0F0C] tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: "-1px" }}>Analytics</h1>
          <p className="mt-2 text-[14px] text-[#767570]">Detailed insights and performance metrics for your properties</p>
        </div>

        {/* Predictions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {predictions.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ ...styles.card, padding: "22px 24px" }} whileHover={{ boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Badge label="AI" color="green" />
                {p.change && (
                  <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: p.up ? "#C0392B" : G }}>
                    {p.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{p.change}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: TEXT, marginBottom: 4 }}>{p.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{p.title}</p>
              <p style={{ fontSize: 11, color: MUTED }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue + Occupancy */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...styles.card, padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <p style={styles.sectionTitle}>Revenue Trend</p>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: MUTED, alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: G }} />Actual</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9FD8C0" }} />Projected</span>
              </div>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="analyticsActGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={G} stopOpacity={0.15} /><stop offset="100%" stopColor={G} stopOpacity={0} /></linearGradient>
                    <linearGradient id="analyticsProjGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9FD8C0" stopOpacity={0.1} /><stop offset="100%" stopColor="#9FD8C0" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" stroke="none" tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis stroke="none" tick={{ fill: MUTED, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: TEXT, border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Area type="monotone" dataKey="actual" stroke={G} strokeWidth={2} fill="url(#analyticsActGrad)" name="Actual" connectNulls={false} />
                  <Area type="monotone" dataKey="proj" stroke="#9FD8C0" strokeWidth={2} strokeDasharray="5 5" fill="url(#analyticsProjGrad)" name="Projected" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 13 }}>Loading chart…</div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ ...styles.card, padding: "28px" }}>
            <p style={{ ...styles.sectionTitle, marginBottom: 24 }}>Occupancy Trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={occupancy} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="month" stroke="none" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis stroke="none" tick={{ fill: MUTED, fontSize: 11 }} domain={[60, 100]} />
                <Tooltip contentStyle={{ background: TEXT, border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Occupancy"]} />
                <Line type="monotone" dataKey="rate" stroke={G} strokeWidth={3} dot={{ fill: G, r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Churn risk */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...styles.card, padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={17} color="#B45309" />
            </div>
            <div>
              <p style={styles.sectionTitle}>AI Tenant Churn Risk</p>
              <p style={{ ...styles.label, marginTop: 2 }}>Tenants at risk of leaving or late payment</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {churn.map(t => (
              <div key={t.tenant} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: BG, borderRadius: 12, border: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#B45309" }}>
                    {t.tenant.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{t.tenant}</p>
                    <p style={{ fontSize: 12, color: MUTED }}>Unit {t.unit} · {t.reason}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 100, height: 6, background: BORDER, borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${t.risk}%`, background: t.risk > 70 ? "#C0392B" : t.risk > 50 ? "#B45309" : G }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: TEXT, minWidth: 36 }}>{t.risk}%</span>
                  <Badge label={t.risk > 70 ? "High Risk" : t.risk > 50 ? "Med Risk" : "Low Risk"} color={t.risk > 70 ? "red" : t.risk > 50 ? "amber" : "green"} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
