import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Moon, Sun, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "/src/lib/supabase";

/* ── Design tokens ── */
const G = "#0A7A52";
const GL = "#E5F4EE";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

/* ── Dark-mode theme helper ── */
function mkTheme(dark: boolean) {
  return {
    pageBg: dark ? "#111" : "#F8F7F4",
    heroBg: dark ? "linear-gradient(135deg,#062C20 0%,#085040 100%)" : "linear-gradient(135deg,#085040 0%,#0A7A52 100%)",
    cardBg: dark ? "#1E1E1E" : "#fff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    inputBg: dark ? "#2A2A2A" : "#fff",
    inputBorder: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    tx: dark ? "#F0EEEB" : "#0E0F0C",
    mu: dark ? "#888" : MU,
    sectionLabel: dark ? "#666" : MU,
    rowBorder: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
    chevron: dark ? "#555" : "#AEADA8",
    metaBg: dark ? "#2A2A2A" : "#F8F7F4",
    glBg: dark ? "rgba(10,122,82,0.15)" : GL,
    glBorder: dark ? "rgba(10,122,82,0.2)" : "rgba(10,122,82,0.15)",
  };
}

/* ── Password strength ── */
function calcStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const STRENGTH_COLOR = ["", "#C0392B", "#E67E22", "#F39C12", "#27AE60", G];

/* ── Modal types ── */
type ModalType =
  | "otp" | "password" | "devices" | "history" | "editprofile" | "passport"
  | "passportshare" | "signout" | "deleteaccount" | "downloaddata"
  | "moveout" | "equifax" | "passkey" | null;

interface Toggles { rent: boolean; maintenance: boolean; notices: boolean; renewal: boolean; passport: boolean; messages: boolean; }
type DeliveryMethod = "email" | "sms" | "both";

/* ── Score history for sparkline ── */
const SCORE_HISTORY = [72, 75, 78, 80, 83, 87];
const SCORE_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

/* ── Sparkline SVG ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((v - min) / (max - min)) * 100;
        return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 5 : 2.5} fill={i === data.length - 1 ? color : "#fff"} stroke={color} strokeWidth="2" />;
      })}
    </svg>
  );
}

export function TenantProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Derived user identity ── */
  const authName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tenant';
  const authEmail = user?.email || '';
  const authInitials = authName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  // Deterministic referral code from user id (first 8 chars uppercased)
  const authReferralCode = user?.id
    ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    : 'KAYA0000';
  const authReferralLink = `kaya.ca/join?ref=${authReferralCode}`;
  const authPassportSlug = authName.toLowerCase().replace(/\s+/g, '-') + '-' + authReferralCode.slice(0, 4).toLowerCase();
  const authPassportLink = `kaya.ca/passport/${authPassportSlug}`;

  /* ── State ── */
  const [modal, setModal] = useState<ModalType>(null);
  const [dark, setDark] = useState(false);
  const T = mkTheme(dark);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Toggles>({ rent: true, maintenance: true, notices: true, renewal: true, passport: false, messages: true });
  const [delivery, setDelivery] = useState<Record<keyof Toggles, DeliveryMethod>>({ rent: "email", maintenance: "email", notices: "both", renewal: "email", passport: "email", messages: "sms" });
  const [lang, setLang] = useState("English (Canada)");

  /* profile fields */
  const [profileName, setProfileName] = useState(() => authName);
  const [profileEmail, setProfileEmail] = useState(() => authEmail);
  const [profilePhone, setProfilePhone] = useState("+1 (416) 555-0123");
  const [emergencyName, setEmergencyName] = useState("James Kim");
  const [emergencyPhone, setEmergencyPhone] = useState("+1 (416) 555-0199");

  /* password */
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const pwStrength = calcStrength(pwNew);
  const pwMatch = pwNew === pwConfirm && pwNew.length > 0;

  /* delete account */
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteInput, setDeleteInput] = useState("");

  /* move-out */
  const [moveDate, setMoveDate] = useState("2026-09-30");
  const [moveReason, setMoveReason] = useState("end_of_lease");

  /* equifax */
  const [equifaxLinked, setEquifaxLinked] = useState(false);

  /* referral */
  const [referralCopied, setReferralCopied] = useState(false);

  /* plan */
  const plan = { name: "Starter", color: G, bg: GL, nextBilling: "Aug 1, 2026", amount: "$0/mo" };

  const flip = useCallback((key: keyof Toggles) => setToggles(t => ({ ...t, [key]: !t[key] })), []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setAvatarSrc(ev.target?.result as string); toast.success("Profile photo updated"); };
    reader.readAsDataURL(file);
  }

  function copyReferral() {
    navigator.clipboard.writeText(authReferralLink).then(() => { setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000); toast.success("Referral link copied!"); });
  }

  const closeModal = () => {
    setModal(null);
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setDeleteStep(0); setDeleteInput("");
  };

  /* ─────────────────────────────────── */
  return (
    <div style={{ fontFamily: SANS, background: T.pageBg, minHeight: "100vh", paddingBottom: 80, transition: "background 0.3s" }}>

      {/* ── Profile hero ── */}
      <div style={{ background: T.heroBg, padding: "28px 20px 24px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 600, margin: "0 auto" }}>
          {/* Avatar with upload */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{ width: 68, height: 68, borderRadius: "50%", background: avatarSrc ? "transparent" : "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
            >
              {avatarSrc
                ? <img src={avatarSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
                : <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{authInitials}</span>
              }
            </div>
            <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: G, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11 }}>📷</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <p style={{ fontFamily: SERIF, fontSize: 22, color: "#fff", margin: 0 }}>{profileName}</p>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 99, padding: "3px 10px" }}>✓ Verified</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0 }}>Tenant</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>{profileEmail} · {profilePhone}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button onClick={() => setModal("editprofile")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "7px 13px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
            <button onClick={() => setDark(d => !d)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "5px 10px", borderRadius: 9, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              {dark ? <Sun size={11} /> : <Moon size={11} />} {dark ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 20px" }}>

        {/* ── Tenant Passport Card ── */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `4px solid ${G}`, borderRadius: 16, padding: 16, marginBottom: 12, cursor: "pointer" }} onClick={() => setModal("passport")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.tx, margin: 0 }}>Tenant Passport</p>
              <p style={{ fontSize: 11, color: T.mu }}>Your portable rental reputation · ↑ +4 this month</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: SERIF, fontSize: 30, color: G, lineHeight: 1, margin: 0 }}>87</p>
              <p style={{ fontSize: 9, color: G, margin: 0 }}>/ 100</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
            {[["Payment", "100%", "On-time rate"], ["Identity", "✓", "Verified"], ["Tenancy", "14 mo", "Experience"]].map(m => (
              <div key={m[0]} style={{ background: T.metaBg, borderRadius: 9, padding: 9, textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.tx, margin: 0 }}>{m[1]}</p>
                <p style={{ fontSize: 9, color: T.mu, margin: 0 }}>{m[2]}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); setModal("passport"); }} style={{ flex: 1, padding: "7px", background: GL, color: G, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>View Breakdown</button>
            <button onClick={e => { e.stopPropagation(); setModal("passportshare"); }} style={{ flex: 1, padding: "7px", background: T.metaBg, color: T.tx, border: `1px solid ${T.cardBorder}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>🔗 Share Passport</button>
          </div>
        </div>

        {/* ── Equifax Credit Builder ── */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `4px solid ${G}`, borderRadius: 14, padding: "13px 16px", marginBottom: 12, cursor: "pointer" }} onClick={() => setModal("equifax")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.tx, margin: 0 }}>Credit Bureau Reporting</p>
              <p style={{ fontSize: 11, color: T.mu }}>{equifaxLinked ? "✓ Reporting to Equifax & TransUnion" : "Connect rent payments to your credit score"}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: equifaxLinked ? G : "#B45309", background: equifaxLinked ? GL : "#FEF3C7", borderRadius: 99, padding: "3px 10px" }}>{equifaxLinked ? "Active" : "Not linked"}</span>
              <span style={{ color: T.chevron }}>›</span>
            </div>
          </div>
        </div>

        {/* ── Identity Verifications ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: T.cardBg, borderRadius: 14, border: `1px solid ${T.cardBorder}`, padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Identity Verifications</p>
          {[
            { icon: "📞", label: "Phone", val: profilePhone, verified: true },
            { icon: "✉️", label: "Email", val: profileEmail, verified: true },
            { icon: "🪪", label: "Government ID", val: "Driver's Licence", verified: true },
            { icon: "🏦", label: "Bank Account", val: "Not linked", verified: false },
          ].map((v, i, arr) => (
            <div key={v.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: i < arr.length - 1 ? `1px solid ${T.rowBorder}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: v.verified ? T.glBg : T.metaBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{v.icon}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.tx, margin: 0 }}>{v.label}</p>
                  <p style={{ fontSize: 10, color: T.mu }}>{v.val}</p>
                </div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: v.verified ? G : "#B45309", background: v.verified ? T.glBg : "#FEF3C7", border: `1px solid ${v.verified ? "rgba(10,122,82,0.15)" : "rgba(180,83,9,0.15)"}`, borderRadius: 99, padding: "3px 10px", cursor: v.verified ? "default" : "pointer" }}
                onClick={() => !v.verified && toast.info("Bank linking coming soon — connects Plaid")}
              >{v.verified ? "✓ Verified" : "+ Link"}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Security & Login ── */}
        <SectionLabel color={T.sectionLabel}>Security & Login</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, marginBottom: 12 }}>
          {[
            { icon: "🔐", label: "Two-factor authentication", val: "✓ Active", bg: T.glBg, action: () => setModal("otp") },
            { icon: "🔒", label: "Change password", val: "Last changed 30 days ago", bg: T.metaBg, action: () => setModal("password") },
            { icon: "🫆", label: "Passkey / Face ID", val: "Sign in without a password", bg: T.metaBg, action: () => setModal("passkey") },
            { icon: "📱", label: "Trusted devices", val: "1 active device", bg: T.metaBg, action: () => setModal("devices") },
            { icon: "🕵️", label: "Login history", val: "View all sessions", bg: T.metaBg, action: () => setModal("history") },
          ].map((r, i) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < 4 ? `1px solid ${T.rowBorder}` : "none", cursor: "pointer" }} onClick={r.action}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{r.icon}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: T.mu }}>{r.val}</p>
                </div>
              </div>
              <span style={{ color: T.chevron, fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>

        {/* ── Emergency Contact ── */}
        <SectionLabel color={T.sectionLabel}>Emergency Contact</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "13px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>{emergencyName}</p>
              <p style={{ fontSize: 11, color: T.mu }}>Sibling · {emergencyPhone}</p>
            </div>
            <button onClick={() => setModal("editprofile")} style={{ fontSize: 11, color: G, background: T.glBg, border: "none", borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>Edit</button>
          </div>
        </div>

        {/* ── Notifications ── */}
        <SectionLabel color={T.sectionLabel}>Notifications</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, marginBottom: 12 }}>
          {([
            { key: "rent" as const, label: "Rent reminders", sub: "3 days before due date" },
            { key: "maintenance" as const, label: "Maintenance updates", sub: "Status changes on requests" },
            { key: "notices" as const, label: "Lease alerts", sub: "90, 60, 30 days before expiry" },
            { key: "passport" as const, label: "Passport score changes", sub: "When your score updates" },
            { key: "messages" as const, label: "Messages from landlord", sub: "Immediate notification" },
          ] as const).map((n, i) => (
            <div key={n.key} style={{ borderBottom: i < 4 ? `1px solid ${T.rowBorder}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>{n.label}</p>
                  <p style={{ fontSize: 11, color: T.mu }}>{n.sub}</p>
                </div>
                <div onClick={() => flip(n.key)} style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", position: "relative", background: toggles[n.key] ? G : "rgba(0,0,0,0.12)", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: toggles[n.key] ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
              {toggles[n.key] && (
                <div style={{ display: "flex", gap: 5, padding: "0 16px 10px" }}>
                  {(["email", "sms", "both"] as DeliveryMethod[]).map(m => (
                    <button key={m} onClick={() => setDelivery(d => ({ ...d, [n.key]: m }))} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: "pointer", border: `1px solid ${delivery[n.key] === m ? G : T.cardBorder}`, background: delivery[n.key] === m ? T.glBg : T.metaBg, color: delivery[n.key] === m ? G : T.mu, fontFamily: SANS }}>
                      {m === "email" ? "✉️ Email" : m === "sms" ? "📱 SMS" : "🔔 Both"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Account & Language ── */}
        <SectionLabel color={T.sectionLabel}>Account & Language</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, marginBottom: 12 }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.rowBorder}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Language</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["English (Canada)", "Français", "Punjabi", "हिंदी", "Filipino"].map(l => (
                <button key={l} onClick={() => { setLang(l); toast.info(`Language set to ${l.split(" ")[0]}`); }} style={{ padding: "6px 13px", borderRadius: 9, border: `1.5px solid ${lang === l ? G : T.cardBorder}`, background: lang === l ? T.glBg : T.metaBg, color: lang === l ? G : T.mu, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {[
            { icon: "🛡", label: "Privacy & Data", val: "AES-256 · ca-central-1 · PIPEDA", action: () => toast.info("Privacy settings") },
            { icon: "💬", label: "Help & Support", val: "Chat with Kaya support", action: () => toast.info("Support chat opening…") },
          ].map((r, i) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: i === 0 ? `1px solid ${T.rowBorder}` : "none", cursor: "pointer" }} onClick={r.action}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: T.metaBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{r.icon}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: T.mu }}>{r.val}</p>
                </div>
              </div>
              <span style={{ color: T.chevron, fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>

        {/* ── Subscription Plan Card ── */}
        <SectionLabel color={T.sectionLabel}>Subscription</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `4px solid ${plan.color}`, borderRadius: 14, padding: "13px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.tx, margin: 0 }}>Kaya {plan.name}</p>
                <span style={{ fontSize: 9, fontWeight: 700, color: plan.color, background: plan.bg, borderRadius: 99, padding: "2px 9px" }}>{plan.name.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 11, color: T.mu }}>Next billing: {plan.nextBilling} · {plan.amount}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <button onClick={() => toast.info("Manage billing →")} style={{ padding: "8px", background: T.metaBg, color: T.tx, border: `1px solid ${T.cardBorder}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Manage Billing</button>
            <button onClick={() => toast.info("Upgrade plans →")} style={{ padding: "8px", background: plan.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Upgrade Plan →</button>
          </div>
        </div>

        {/* ── Referral Card ── */}
        <SectionLabel color={T.sectionLabel}>Refer a Friend</SectionLabel>
        <div style={{ background: `linear-gradient(135deg,${G},#065E3C)`, borderRadius: 14, padding: "16px", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Give $25, Get $25</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 12, lineHeight: 1.5 }}>Refer a friend to Kaya. When they sign their first lease, you both get $25 credit.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "9px 13px", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "monospace", letterSpacing: "0.5px" }}>{authReferralLink}</span>
            </div>
            <button onClick={copyReferral} style={{ padding: "9px 13px", background: "#fff", color: G, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {referralCopied ? <Check size={13} /> : <Copy size={13} />} {referralCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── Move-out Notice ── */}
        <SectionLabel color={T.sectionLabel}>Lease Actions</SectionLabel>
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer" }} onClick={() => setModal("moveout")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>File a Move-Out Notice</p>
                <p style={{ fontSize: 11, color: T.mu }}>Ontario N9 form · 60 days notice required</p>
              </div>
            </div>
            <span style={{ color: T.chevron, fontSize: 16 }}>›</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", borderTop: `1px solid ${T.rowBorder}` }} onClick={() => setModal("downloaddata")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💾</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>Download My Data</p>
                <p style={{ fontSize: 11, color: T.mu }}>PIPEDA right to portability · includes all records</p>
              </div>
            </div>
            <span style={{ color: T.chevron, fontSize: 16 }}>›</span>
          </div>
        </div>

        {/* ── AI nudge ── */}
        <div style={{ background: T.glBg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.glBorder}`, cursor: "pointer", marginBottom: 14 }} onClick={() => window.dispatchEvent(new CustomEvent("openAIWithQuery", { detail: { query: "How does Kaya keep my data private?" } }))}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={13} color={G} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.tx, margin: "0 0 2px" }}>Your data is protected</p>
              <p style={{ fontSize: 11, color: "#3D6B55", margin: 0 }}>Encrypted, stored in Canada, PIPEDA compliant. Tap to learn more.</p>
            </div>
          </div>
        </div>

        {/* ── Sign Out / Delete ── */}
        <button onClick={() => setModal("signout")} style={{ width: "100%", padding: 13, background: "#FEF2F2", color: "#C0392B", border: "1.5px solid rgba(192,57,43,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, marginBottom: 8 }}>Sign Out</button>
        <button onClick={() => setModal("deleteaccount")} style={{ width: "100%", padding: 11, background: "transparent", color: T.mu, border: `1px solid ${T.cardBorder}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS, marginBottom: 10 }}>Delete Account</button>
        <p style={{ fontSize: 10, color: T.mu, textAlign: "center" }}>Kaya v2.1 · All data encrypted · PIPEDA compliant</p>

      </div>

      {/* ══════════════════════════════════════
          MODALS
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {modal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.cardBg, borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}
            >

              {/* ── OTP Modal ── */}
              {modal === "otp" && (
                <>
                  <MH title="Two-Factor Auth" onClose={closeModal} />
                  <div style={{ background: T.glBg, borderRadius: 12, padding: 14, marginBottom: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 32, margin: "0 0 6px" }}>🔐</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: G }}>2FA is active</p>
                    <p style={{ fontSize: 11, color: G }}>Every sign-in requires a one-time code</p>
                  </div>
                  <p style={{ fontSize: 12, color: T.mu, marginBottom: 14, lineHeight: 1.6 }}>OTP protects your account even if your password is stolen. We strongly recommend keeping this enabled.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <Pill icon="✉️" label="Email OTP" sub="s***@email.com · Active" />
                    <div onClick={() => { closeModal(); toast.info("SMS OTP setup started"); }} style={{ cursor: "pointer" }}>
                      <Pill icon="📱" label="Add SMS OTP" sub="Add your phone as backup" action />
                    </div>
                    <div onClick={() => { closeModal(); setModal("passkey"); }} style={{ cursor: "pointer" }}>
                      <Pill icon="🫆" label="Set up Passkey" sub="Sign in with Face ID or Touch ID" action />
                    </div>
                  </div>
                  <button onClick={() => { closeModal(); toast.warning("Contact support to disable OTP for security reasons"); }} style={btnDanger(SANS)}>Disable 2FA</button>
                </>
              )}

              {/* ── Password Modal ── */}
              {modal === "password" && (
                <>
                  <MH title="Change Password" onClose={closeModal} />
                  <Field label="Current password" type="password" value={pwCurrent} onChange={setPwCurrent} placeholder="Enter current password" T={T} SANS={SANS} />
                  <Field label="New password" type="password" value={pwNew} onChange={setPwNew} placeholder="At least 8 characters" T={T} SANS={SANS} />
                  {pwNew.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength ? STRENGTH_COLOR[pwStrength] : T.metaBg, transition: "background 0.2s" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 10, color: STRENGTH_COLOR[pwStrength], fontWeight: 600, margin: 0 }}>{STRENGTH_LABEL[pwStrength]}</p>
                    </div>
                  )}
                  <Field label="Confirm new password" type="password" value={pwConfirm} onChange={setPwConfirm} placeholder="Repeat new password" T={T} SANS={SANS} />
                  {pwConfirm.length > 0 && (
                    <p style={{ fontSize: 11, color: pwMatch ? G : "#C0392B", marginBottom: 12, fontWeight: 600 }}>
                      {pwMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                  <button
                    disabled={!pwMatch || pwStrength < 2 || !pwCurrent}
                    onClick={async () => {
                      const { error } = await supabase.auth.updateUser({ password: pwNew });
                      if (error) { toast.error("Failed to update password. Check your current password."); return; }
                      closeModal();
                      toast.success("Password updated. OTP required at next login.");
                    }}
                    style={{ width: "100%", padding: 13, background: (pwMatch && pwStrength >= 2 && pwCurrent) ? G : "rgba(0,0,0,0.12)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: (pwMatch && pwStrength >= 2 && pwCurrent) ? "pointer" : "not-allowed", fontFamily: SANS }}
                  >Update Password</button>
                </>
              )}

              {/* ── Passkey Modal ── */}
              {modal === "passkey" && (
                <>
                  <MH title="Passkey / Biometrics" onClose={closeModal} subtitle="Sign in without a password" />
                  <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
                    <p style={{ fontSize: 52, margin: "0 0 10px" }}>🫆</p>
                    <p style={{ fontSize: 13, color: T.mu, lineHeight: 1.6 }}>Passkeys use your device's Face ID or fingerprint to sign you in instantly — no password needed.</p>
                  </div>
                  {[
                    { icon: "🍎", label: "Face ID / Touch ID", sub: "iPhone, MacBook Pro, iPad" },
                    { icon: "🤖", label: "Android Fingerprint", sub: "Google Pixel, Samsung Galaxy" },
                    { icon: "🔑", label: "Hardware Security Key", sub: "YubiKey, Google Titan" },
                  ].map(p => (
                    <div key={p.label} onClick={() => { closeModal(); toast.success(`${p.label} passkey registered`); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1.5px solid ${T.cardBorder}`, borderRadius: 11, marginBottom: 8, cursor: "pointer" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.metaBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{p.icon}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: T.mu }}>{p.sub}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ── Trusted Devices Modal ── */}
              {modal === "devices" && (
                <>
                  <MH title="Trusted Devices" onClose={closeModal} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", border: `1px solid ${T.cardBorder}`, borderRadius: 11, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.glBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💻</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.tx, margin: 0 }}>Chrome on macOS</p>
                        <p style={{ fontSize: 11, color: T.mu }}>Toronto, ON · Last active today · 🟢 Current</p>
                      </div>
                    </div>
                    <button onClick={() => { closeModal(); toast.warning("Device removed"); }} style={{ background: "#FDECEA", color: "#C0392B", border: "none", borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "4px 10px", cursor: "pointer", fontFamily: SANS }}>Remove</button>
                  </div>
                  <div style={{ padding: "11px 14px", background: T.metaBg, borderRadius: 10, marginBottom: 14, fontSize: 11, color: T.mu }}>No other active devices</div>
                  <button onClick={() => { closeModal(); toast.warning("All other sessions signed out"); }} style={btnDanger(SANS)}>Sign Out All Other Devices</button>
                </>
              )}

              {/* ── Login History Modal ── */}
              {modal === "history" && (
                <>
                  <MH title="Login History" onClose={closeModal} />
                  {[
                    { time: "Today 9:02 AM", browser: "Chrome, macOS", location: "Toronto, ON", current: true },
                    { time: "Yesterday 7:31 PM", browser: "Safari, iPhone", location: "Toronto, ON", current: false },
                    { time: "Mar 20 12:14 PM", browser: "Chrome, macOS", location: "Toronto, ON", current: false },
                    { time: "Mar 15 8:44 AM", browser: "Chrome, macOS", location: "Toronto, ON", current: false },
                  ].map((e, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 0", borderBottom: i < 3 ? `1px solid ${T.rowBorder}` : "none" }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.tx, margin: 0 }}>{e.browser} · {e.location}</p>
                        <p style={{ fontSize: 11, color: T.mu }}>{e.time}</p>
                      </div>
                      {e.current
                        ? <span style={{ fontSize: 9, fontWeight: 700, color: G, background: T.glBg, borderRadius: 99, padding: "3px 10px" }}>Current</span>
                        : <button onClick={() => toast.info("Session revoked")} style={{ fontSize: 10, color: "#C0392B", background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}>Sign out</button>
                      }
                    </div>
                  ))}
                  <button onClick={() => { closeModal(); toast.warning("All other sessions signed out"); }} style={{ ...btnDanger(SANS), marginTop: 14 }}>Sign Out All Sessions</button>
                </>
              )}

              {/* ── Edit Profile Modal ── */}
              {modal === "editprofile" && (
                <>
                  <MH title="Edit Profile" onClose={closeModal} />
                  {/* Avatar in modal */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, padding: "13px", background: T.metaBg, borderRadius: 11 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarSrc ? "transparent" : T.glBg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: G, flexShrink: 0 }}>
                      {avatarSrc ? <img src={avatarSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" /> : authInitials}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.tx, margin: 0 }}>Profile photo</p>
                      <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, color: G, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: SANS }}>📷 Change photo</button>
                    </div>
                  </div>
                  <Field label="Full Name" value={profileName} onChange={setProfileName} placeholder="Your full name" T={T} SANS={SANS} />
                  <Field label="Email" type="email" value={profileEmail} onChange={setProfileEmail} placeholder="you@email.com" T={T} SANS={SANS} />
                  <Field label="Phone" type="tel" value={profilePhone} onChange={setProfilePhone} placeholder="+1 (416) 555-0123" T={T} SANS={SANS} />
                  <div style={{ borderTop: `1px solid ${T.rowBorder}`, marginBottom: 12, marginTop: 6, paddingTop: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Emergency Contact</p>
                    <Field label="Contact Name" value={emergencyName} onChange={setEmergencyName} placeholder="James Kim" T={T} SANS={SANS} />
                    <Field label="Contact Phone" type="tel" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+1 (416) 555-0199" T={T} SANS={SANS} />
                  </div>
                  <button onClick={async () => {
                    await supabase.auth.updateUser({ data: { full_name: profileName } });
                    closeModal();
                    toast.success("Profile saved successfully");
                  }} style={{ width: "100%", padding: 13, background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Save Changes</button>
                </>
              )}

              {/* ── Passport Detail Modal ── */}
              {modal === "passport" && (
                <>
                  <MH title="Tenant Passport" subtitle="Your portable rental reputation" onClose={closeModal} />
                  <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg,${G},#065E3C)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <p style={{ fontFamily: SERIF, fontSize: 36, color: "#fff", lineHeight: 1, margin: 0 }}>87</p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700, margin: 0 }}>/ 100</p>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: G }}>↑ +4 points this month</p>
                  </div>
                  {/* Score history graph */}
                  <div style={{ background: GL, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: G, marginBottom: 4 }}>6-MONTH SCORE HISTORY</p>
                    <Sparkline data={SCORE_HISTORY} color={G} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      {SCORE_MONTHS.map((m, i) => <span key={m} style={{ fontSize: 9, color: "#3D6B55", fontWeight: i === SCORE_MONTHS.length - 1 ? 700 : 400 }}>{m}</span>)}
                    </div>
                  </div>
                  {[
                    { label: "Payment history", score: 40, max: 40, desc: "14 consecutive on-time payments" },
                    { label: "Identity verification", score: 25, max: 25, desc: "Government ID verified" },
                    { label: "Tenancy duration", score: 14, max: 30, desc: "14 months in current unit" },
                    { label: "Maintenance cooperation", score: 8, max: 10, desc: "Quick response & access" },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{s.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{s.score}/{s.max}</span>
                      </div>
                      <div style={{ height: 6, background: GL, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.round(s.score / s.max * 100)}%`, height: "100%", background: `linear-gradient(90deg,${G},#2DA878)`, borderRadius: 3 }} />
                      </div>
                      <p style={{ fontSize: 10, color: T.mu, marginTop: 2 }}>{s.desc}</p>
                    </div>
                  ))}
                  <div style={{ background: T.glBg, borderRadius: 11, padding: 12, marginBottom: 14 }}>
                    <p style={{ fontSize: 11, color: G, lineHeight: 1.5, margin: 0 }}>💡 Reach 95+ by extending your tenancy to 24 months. Keep paying on time to maintain a perfect payment score.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={closeModal} style={{ padding: 12, background: T.metaBg, color: T.tx, border: `1.5px solid ${T.cardBorder}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Close</button>
                    <button onClick={() => { closeModal(); setModal("passportshare"); }} style={{ padding: 12, background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>🔗 Share</button>
                  </div>
                </>
              )}

              {/* ── Passport Share Modal ── */}
              {modal === "passportshare" && (
                <>
                  <MH title="Share Your Passport" subtitle="Send to prospective landlords" onClose={closeModal} />
                  <div style={{ background: `linear-gradient(135deg,${G},#065E3C)`, borderRadius: 14, padding: 16, marginBottom: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 28, margin: "0 0 6px" }}>⭐</p>
                    <p style={{ fontFamily: SERIF, fontSize: 20, color: "#fff", margin: 0 }}>{profileName}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Tenant Score: 87/100</p>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {["100% on-time", "✓ ID verified", "14 mo experience"].map(b => <span key={b} style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "3px 9px" }}>{b}</span>)}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Shareable link</p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: T.metaBg, border: `1px solid ${T.cardBorder}`, borderRadius: 9, padding: "10px 13px", fontSize: 12, color: T.mu, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {authPassportLink}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(authPassportLink); toast.success("Passport link copied!"); }} style={{ padding: "10px 14px", background: G, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Copy</button>
                  </div>
                  <div style={{ padding: "11px 14px", background: T.metaBg, borderRadius: 10, marginBottom: 14, fontSize: 11, color: T.mu }}>
                    🔒 The link expires after 30 days · Only shows verified data · You can revoke access at any time
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["Email to landlord", "Share via WhatsApp", "Download PDF report"].map(a => (
                      <button key={a} onClick={() => { closeModal(); toast.success(`${a} — sent!`); }} style={{ padding: 11, background: T.metaBg, color: T.tx, border: `1.5px solid ${T.cardBorder}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>
                        {a === "Email to landlord" ? "✉️" : a === "Share via WhatsApp" ? "💬" : "📄"} {a}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Equifax Modal ── */}
              {modal === "equifax" && (
                <>
                  <MH title="Credit Bureau Reporting" onClose={closeModal} subtitle="Report rent payments to boost your credit" />
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    {[{ name: "Equifax", logo: "🏛" }, { name: "TransUnion", logo: "🔵" }].map(b => (
                      <div key={b.name} style={{ flex: 1, padding: 12, background: T.metaBg, border: `1.5px solid ${equifaxLinked ? G : T.cardBorder}`, borderRadius: 11, textAlign: "center" }}>
                        <p style={{ fontSize: 22, margin: "0 0 4px" }}>{b.logo}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{b.name}</p>
                        <p style={{ fontSize: 9, color: equifaxLinked ? G : T.mu }}>{equifaxLinked ? "✓ Reporting" : "Not linked"}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: T.mu, lineHeight: 1.6, marginBottom: 14 }}>When enabled, Kaya reports your on-time rent payments monthly to Equifax and TransUnion. This can add 20–60+ points to your credit score within 6 months.</p>
                  {[["Monthly fee", "$9.99/mo (includes both bureaus)"], ["First report", "~30 days after linking"], ["Your info shared", "Name, address, payment history only"]].map(r => (
                    <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.rowBorder}` }}>
                      <span style={{ fontSize: 12, color: T.mu }}>{r[0]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{r[1]}</span>
                    </div>
                  ))}
                  <button onClick={() => { setEquifaxLinked(v => !v); closeModal(); toast.success(equifaxLinked ? "Credit reporting stopped" : "Credit reporting linked! First report in ~30 days"); }} style={{ width: "100%", marginTop: 16, padding: 13, background: equifaxLinked ? "#FEF2F2" : G, color: equifaxLinked ? "#C0392B" : "#fff", border: equifaxLinked ? "1.5px solid rgba(192,57,43,0.2)" : "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
                    {equifaxLinked ? "Stop Reporting" : "Enable Credit Reporting"}
                  </button>
                </>
              )}

              {/* ── Move-Out Notice Modal ── */}
              {modal === "moveout" && (
                <>
                  <MH title="Move-Out Notice" subtitle="Ontario Form N9 — Notice to Terminate Tenancy" onClose={closeModal} />
                  <div style={{ background: "#FEF3C7", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <p style={{ fontSize: 12, color: "#B45309", fontWeight: 600, margin: "0 0 3px" }}>⚠️ 60 days minimum notice required</p>
                    <p style={{ fontSize: 11, color: "#92400E" }}>Your lease ends Dec 31, 2026. Earliest move-out: Aug 31, 2026 (60-day notice from today).</p>
                  </div>
                  <div style={{ marginBottom: 13 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Termination date</p>
                    <input type="date" value={moveDate} onChange={e => setMoveDate(e.target.value)} min="2026-08-31" style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${T.inputBorder}`, borderRadius: 10, fontFamily: SANS, fontSize: 13, color: T.tx, background: T.inputBg, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Reason for terminating</p>
                    <select value={moveReason} onChange={e => setMoveReason(e.target.value)} style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${T.inputBorder}`, borderRadius: 10, fontFamily: SANS, fontSize: 13, color: T.tx, background: T.inputBg, outline: "none" }}>
                      <option value="end_of_lease">End of lease term</option>
                      <option value="purchased_home">Purchased a home</option>
                      <option value="relocating">Relocating (job / personal)</option>
                      <option value="landlord_breach">Landlord breach of obligations</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ padding: "11px 14px", background: T.metaBg, borderRadius: 10, marginBottom: 14 }}>
                    {[["Tenant", profileName], ["Notice date", new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })], ["Termination date", new Date(moveDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })]].map(r => (
                      <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.rowBorder}` }}>
                        <span style={{ fontSize: 11, color: T.mu }}>{r[0]}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.tx }}>{r[1]}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { closeModal(); toast.success("N9 notice filed and emailed to your landlord. Digital signature required."); }} style={{ width: "100%", padding: 13, background: "#B45309", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>File Notice to Vacate</button>
                </>
              )}

              {/* ── Download Data Modal ── */}
              {modal === "downloaddata" && (
                <>
                  <MH title="Download My Data" subtitle="PIPEDA right to data portability" onClose={closeModal} />
                  <p style={{ fontSize: 12, color: T.mu, lineHeight: 1.6, marginBottom: 14 }}>Download a complete export of your Kaya account data. Your file will be prepared within 24 hours and emailed to {profileEmail}.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                    {[
                      ["📋", "Lease agreements & documents", "PDF, signed copies"],
                      ["💳", "Complete payment history", "CSV, all transactions"],
                      ["🔧", "Maintenance requests", "JSON, all tickets + timeline"],
                      ["⭐", "Tenant Passport history", "Score changes, badges"],
                      ["👤", "Profile & identity data", "Personal info, verifications"],
                    ].map(r => (
                      <div key={r[0]} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.metaBg, borderRadius: 10 }}>
                        <span style={{ fontSize: 16 }}>{r[0]}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.tx, margin: 0 }}>{r[1]}</p>
                          <p style={{ fontSize: 10, color: T.mu }}>{r[2]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { closeModal(); toast.success("Export requested. Your data will be emailed within 24 hours."); }} style={{ width: "100%", padding: 13, background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Request Data Export</button>
                </>
              )}

              {/* ── Sign Out Modal ── */}
              {modal === "signout" && (
                <>
                  <MH title="Sign Out" onClose={closeModal} />
                  <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
                    <p style={{ fontSize: 42, margin: "0 0 12px" }}>👋</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.tx, marginBottom: 6 }}>See you soon, {profileName.split(" ")[0]}!</p>
                    <p style={{ fontSize: 12, color: T.mu, lineHeight: 1.6 }}>You'll be signed out of this device. Auto-pay will continue to run on scheduled dates.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={closeModal} style={{ padding: 13, background: T.metaBg, color: T.tx, border: `1.5px solid ${T.cardBorder}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
                    <button onClick={async () => { await signOut(); navigate("/login"); }} style={{ padding: 13, background: "#C0392B", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Sign Out</button>
                  </div>
                </>
              )}

              {/* ── Delete Account Modal ── */}
              {modal === "deleteaccount" && (
                <>
                  <MH title={deleteStep === 0 ? "Delete Account" : "Final Confirmation"} onClose={() => { closeModal(); setDeleteStep(0); setDeleteInput(""); }} />
                  {deleteStep === 0 ? (
                    <>
                      <div style={{ background: "#FDECEA", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#C0392B", margin: "0 0 6px" }}>⚠️ This action is permanent</p>
                        <p style={{ fontSize: 12, color: "#C0392B", lineHeight: 1.5 }}>Your account, documents, payment history, and Tenant Passport will be permanently deleted after a 30-day grace period.</p>
                      </div>
                      {[["Active lease", "Until Dec 31, 2026"], ["Payments", "$32,200 in records"], ["Passport score", "87/100 — will be lost"]].map(r => (
                        <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.rowBorder}` }}>
                          <span style={{ fontSize: 12, color: T.mu }}>{r[0]}</span>
                          <span style={{ fontSize: 12, color: "#C0392B", fontWeight: 600 }}>{r[1]}</span>
                        </div>
                      ))}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                        <button onClick={closeModal} style={{ padding: 12, background: T.metaBg, color: T.tx, border: `1.5px solid ${T.cardBorder}`, borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
                        <button onClick={() => setDeleteStep(1)} style={btnDanger(SANS)}>Continue →</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, color: T.mu, marginBottom: 14, lineHeight: 1.6 }}>Type <strong style={{ color: "#C0392B" }}>DELETE</strong> to confirm account deletion. This cannot be undone.</p>
                      <input
                        value={deleteInput}
                        onChange={e => setDeleteInput(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${deleteInput === "DELETE" ? "#C0392B" : T.inputBorder}`, borderRadius: 10, fontFamily: SANS, fontSize: 13, color: T.tx, background: T.inputBg, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
                      />
                      <button
                        disabled={deleteInput !== "DELETE"}
                        onClick={() => { navigate("/login"); toast.error("Account scheduled for deletion. 30-day grace period starts now."); }}
                        style={{ width: "100%", padding: 13, background: deleteInput === "DELETE" ? "#C0392B" : "rgba(0,0,0,0.1)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: deleteInput === "DELETE" ? "pointer" : "not-allowed", fontFamily: SANS }}
                      >Delete My Account Permanently</button>
                    </>
                  )}
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared small components ── */
function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.6px", margin: "16px 0 8px" }}>{children}</p>;
}

function MH({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const SERIF_ = "'Instrument Serif', Georgia, serif";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <h3 style={{ fontFamily: SERIF_, fontSize: 26, color: "#0E0F0C", margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: MU, marginTop: 3, margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MU, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }}><X size={18} /></button>
    </div>
  );
}

function Pill({ icon, label, sub, action }: { icon: string; label: string; sub: string; action?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 11 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#0E0F0C", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 10, color: MU, margin: 0 }}>{sub}</p>
      </div>
      {action && <span style={{ color: "#AEADA8" }}>›</span>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", T, SANS }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
  T: ReturnType<typeof mkTheme>; SANS: string;
}) {
  return (
    <div style={{ marginBottom: 13 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: T.mu, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{label}</p>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${T.inputBorder}`, borderRadius: 10, fontFamily: SANS, fontSize: 13, color: T.tx, background: T.inputBg, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}

function btnDanger(SANS: string): React.CSSProperties {
  return { width: "100%", padding: 13, background: "#FDECEA", color: "#C0392B", border: "1.5px solid rgba(192,57,43,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS };
}
