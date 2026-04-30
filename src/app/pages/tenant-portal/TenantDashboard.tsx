import { Home, CreditCard, FileText, Wrench, Calendar, Bell, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { TenantApplicationProgress } from "../../components/TenantApplicationProgress";
import { GamificationBadge } from "../../components/GamificationBadge";
import { useAuth } from "../../contexts/AuthContext";
import { PaymentAPI } from "../../services/backend.service";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

export function TenantDashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const [leaseInfo, setLeaseInfo] = useState({
    unit: "—",
    address: "—",
    rent: 0,
    leaseStart: "—",
    leaseEnd: "—",
    daysRemaining: 0,
  });

  const [upcomingPayment, setUpcomingPayment] = useState({
    amount: 0,
    dueDate: "—",
    daysUntil: 0,
    autoPayEnabled: false,
  });

  useEffect(() => {
    PaymentAPI.getAll()
      .then(raw => {
        if (!raw.length) return;
        const next = raw
          .filter((p: any) => p.status !== "completed" && p.status !== "paid")
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
          ?? raw[raw.length - 1];
        if (!next) return;
        const due = new Date(next.dueDate);
        const daysLeft = Math.max(0, Math.ceil((due.getTime() - Date.now()) / 86400000));
        setUpcomingPayment({
          amount: next.amount ?? 0,
          dueDate: due.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }),
          daysUntil: daysLeft,
          autoPayEnabled: false,
        });
        setLeaseInfo(prev => ({ ...prev, rent: next.amount ?? prev.rent, unit: next.unitId ?? prev.unit }));
      })
      .catch(() => {});
  }, []);

  const quickActions = [
    { name: "Make Payment", icon: CreditCard, href: "/tenant/payments" },
    { name: "View Documents", icon: FileText, href: "/tenant/documents" },
    { name: "Maintenance", icon: Wrench, href: "/tenant/maintenance" },
  ];

  const tenantBadges = [
    { type: "perfect" as const, value: "5/5", label: "On-time payments" },
    { type: "streak" as const, value: "100%", label: "Payment streak" },
    { type: "achievement" as const, value: "⭐", label: "Model tenant" },
  ];

  return (
    <div style={{ fontFamily: SANS, background: "#F8F7F4", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 4 }}>Home</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: TX, letterSpacing: "-1px", lineHeight: 1 }}>Welcome back, {firstName}!</h1>
          <p style={{ fontSize: 14, color: MU, marginTop: 6 }}>Here's everything about your rental</p>
        </motion.div>

        {/* Gamification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {tenantBadges.map((badge, idx) => (
            <GamificationBadge key={idx} type={badge.type} value={badge.value} label={badge.label} />
          ))}
        </div>

        {/* Lease Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: `linear-gradient(135deg, ${G} 0%, #065E3C 100%)`, borderRadius: 20, padding: 24, color: "#fff", marginBottom: 20, boxShadow: `0 12px 40px ${G}30` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={20} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 20, color: "#fff", margin: 0 }}>{leaseInfo.unit}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>{leaseInfo.address}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Monthly Rent</p>
              <p style={{ fontFamily: SERIF, fontSize: 28, color: "#fff", margin: 0 }}>${leaseInfo.rent.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Lease Period</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{leaseInfo.leaseStart} – {leaseInfo.leaseEnd}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 11 }}>
            <Calendar size={16} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{leaseInfo.daysRemaining} days remaining in lease</span>
          </div>
        </motion.div>

        {/* Upcoming Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,0.07)", padding: 24, marginBottom: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: GL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={20} color={G} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: TX, margin: 0 }}>Upcoming Payment</p>
              <p style={{ fontSize: 13, color: MU, margin: 0 }}>Due on {upcomingPayment.dueDate}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: MU, fontWeight: 500, marginBottom: 4 }}>Amount Due</p>
              <p style={{ fontFamily: SERIF, fontSize: 28, color: TX, margin: 0 }}>${upcomingPayment.amount.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: MU, fontWeight: 500, marginBottom: 4 }}>Days Until Due</p>
              <p style={{ fontFamily: SERIF, fontSize: 28, color: TX, margin: 0 }}>{upcomingPayment.daysUntil}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", background: GL, borderRadius: 11, border: `1px solid ${G}20` }}>
            <Bell size={16} color={G} strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: "#085040" }}>Auto-pay is {upcomingPayment.autoPayEnabled ? "enabled" : "disabled"}</span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: `linear-gradient(135deg, #085040 0%, ${G} 100%)`, borderRadius: 20, padding: 24, boxShadow: `0 8px 28px ${G}25` }}
        >
          <p style={{ fontFamily: SERIF, fontSize: 22, color: "#fff", marginBottom: 16 }}>Quick Actions</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link key={idx} to={action.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)", textDecoration: "none", color: "#fff", transition: "all 0.15s" }}>
                  <Icon size={20} color="#fff" strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{action.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* AI Nudge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: GL, borderRadius: 14, padding: "18px 22px", border: `1px solid ${G}20`, cursor: "pointer", marginTop: 16 }}
          onClick={() => window.dispatchEvent(new CustomEvent("openAIWithQuery", { detail: { query: "What should I know about my current lease?" } }))}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
              <Sparkles size={16} color={G} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: TX, margin: "0 0 4px" }}>Have a question about your lease?</p>
              <p style={{ fontSize: 13, color: "#3D6B55", margin: 0, lineHeight: 1.5 }}>Kaya AI can explain your rights, upcoming rent increases, and more. Tap to ask.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
