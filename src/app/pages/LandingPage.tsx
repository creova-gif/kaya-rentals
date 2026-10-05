import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { 
  Sparkles, Shield, TrendingUp, Zap, Brain, Lock, 
  CheckCircle, ArrowRight, ChevronRight, Building2, Users, FileText,
  Search, UserCheck, CreditCard
} from "lucide-react";
import { PublicNav } from "../components/PublicNav";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TEXT = "#0E0F0C";
const MUTED = "#767570";

export function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: <Brain size={22} />,
      title: "AI-Powered Screening",
      description: "Intelligent tenant evaluation with 92% accuracy. Pre-screen applications in seconds, not hours.",
      cta: "See how it works"
    },
    {
      icon: <Shield size={22} />,
      title: "LTB Compliance",
      description: "Ontario-specific legal compliance built-in. Auto-generated notices, lease templates, and forms.",
      cta: "View compliance"
    },
    {
      icon: <TrendingUp size={22} />,
      title: "Rent Intelligence",
      description: "Real-time market data and pricing recommendations. Maximize revenue with AI-driven insights.",
      cta: "Explore insights"
    },
    {
      icon: <Zap size={22} />,
      title: "Automated Workflows",
      description: "From application to move-in, fully automated. Save 15+ hours per week on property management.",
      cta: "See automation"
    },
    {
      icon: <Lock size={22} />,
      title: "Trust & Safety",
      description: "Identity verification and fraud detection. Multi-layer security for landlords and tenants.",
      cta: "Security details"
    },
    {
      icon: <FileText size={22} />,
      title: "Document Vault",
      description: "Centralized document management with e-signatures. Digital lease signing in under 5 minutes.",
      cta: "Manage documents"
    }
  ];

  const stats = [
    { value: "AI", label: "Tenant screening" },
    { value: "ON", label: "Built for Ontario law" },
    { value: "24/7", label: "AI assistant access" },
    { value: "Early", label: "Access — building now" }
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <PublicNav />

      {/* Hero Section */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "90px 48px 64px", textAlign: "center",
        position: "relative", overflow: "hidden",
        background: TEXT
      }}>
        {/* Grid Pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px", pointerEvents: "none"
        }} />

        {/* Glow Effect */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(10,122,82,0.18) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -60%)", pointerEvents: "none"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 40, padding: "6px 16px 6px 8px",
            fontSize: 12, fontWeight: 600, color: GL, marginBottom: 32
          }}>
            <div style={{ width: 22, height: 22, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              <Sparkles size={12} color="#fff" />
            </div>
            Now with AI Co-Pilot
          </div>

          {/* Hero Title */}
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(52px, 8vw, 96px)",
            fontWeight: 400,
            color: "#fff",
            lineHeight: 0.95,
            letterSpacing: "-2px",
            marginBottom: 28,
            maxWidth: 900
          }}>
            Ontario's <em style={{ fontStyle: "italic", color: G }}>smartest</em><br />
            landlord platform
          </h1>

          {/* Hero Subtitle */}
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 500,
            lineHeight: 1.7,
            marginBottom: 44,
            fontWeight: 400
          }}>
            AI-powered tenant screening, automated compliance, and intelligent property management. Built for modern landlords.
          </p>

          {/* Hero Actions */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            <button
              onClick={() => navigate("/signup")}
              style={{ padding: "14px 32px", background: G, color: "#fff", border: "none", borderRadius: 40, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Request early access
            </button>
            <button 
              onClick={() => navigate("/features")}
              style={{ padding: "14px 32px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 40, fontSize: 15, fontWeight: 500, cursor: "pointer" }}
            >
              Watch demo
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map((stat, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Strip */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "center", gap: 44, flexWrap: "wrap"
        }}>
          {["LTB Compliant", "Bank-level security", "24/7 Support", "Ontario-focused"].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              <CheckCircle size={14} color={G} />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ background: "#F8F7F4", padding: "96px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 64px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: G, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1.5, background: G }} />
              HOW IT WORKS
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(34px, 5vw, 52px)",
              color: TEXT, letterSpacing: "-1px", lineHeight: 1.05, marginBottom: 12
            }}>
              Up and running in <em style={{ fontStyle: "italic", color: G }}>three steps</em>
            </h2>
            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.65, fontWeight: 400 }}>
              No long onboarding. No training required. Most landlords are collecting rent within the first day.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, position: "relative" }}>
            {[
              {
                step: "01",
                Icon: Search,
                title: "Add your property",
                body: "Import your units and existing tenants in minutes. Kaya syncs with common spreadsheets and syncs all lease data automatically.",
                highlight: "Takes under 10 minutes"
              },
              {
                step: "02",
                Icon: UserCheck,
                title: "Screen & onboard tenants",
                body: "Post listings, collect applications, and run AI-powered credit + background checks — all from one dashboard.",
                highlight: "92% screening accuracy"
              },
              {
                step: "03",
                Icon: CreditCard,
                title: "Automate rent & compliance",
                body: "Set up Interac or Stripe auto-pay, generate LTB-compliant forms, and let Kaya handle reminders and receipts.",
                highlight: "15+ hrs saved per week"
              }
            ].map(({ step, Icon, title, body, highlight }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 20, padding: "32px 28px",
                  position: "relative", overflow: "hidden"
                }}
              >
                <div style={{
                  position: "absolute", top: 20, right: 24,
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 72, lineHeight: 1, color: "rgba(0,0,0,0.04)",
                  fontWeight: 400, pointerEvents: "none", userSelect: "none"
                }}>
                  {step}
                </div>
                <div style={{
                  width: 48, height: 48, background: GL, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20, color: G
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: TEXT, lineHeight: 1.3 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, marginBottom: 18 }}>
                  {body}
                </p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, color: G,
                  background: GL, borderRadius: 40, padding: "4px 12px"
                }}>
                  <CheckCircle size={12} />
                  {highlight}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ background: "#fff", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Section Header */}
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 64px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: G, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1.5, background: G }} />
              PLATFORM FEATURES
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(36px, 5vw, 56px)",
              color: TEXT,
              letterSpacing: "-1px",
              lineHeight: 1.05,
              marginBottom: 14
            }}>
              Everything you need in <em style={{ fontStyle: "italic", color: G }}>one place</em>
            </h2>
            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, fontWeight: 400 }}>
              From tenant screening to lease signing, Kaya handles it all with AI-powered automation.
            </p>
          </div>

          {/* Feature Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.08)" }}
                style={{
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 20,
                  padding: 28,
                  cursor: "pointer",
                  transition: "all 0.25s"
                }}
              >
                <div style={{ width: 44, height: 44, background: GL, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: G }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: TEXT }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, fontWeight: 400, marginBottom: 16 }}>
                  {feature.description}
                </p>
                <div style={{ fontSize: 12, fontWeight: 600, color: G, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  {feature.cta} <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section style={{ background: "#F8F7F4", padding: "80px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            color: TEXT,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            marginBottom: 48
          }}>
            Built for <em style={{ fontStyle: "italic", color: G }}>Ontario landlords</em>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {[
              { icon: <Building2 size={20} />, stat: "AI-scored", label: "Applicant screening" },
              { icon: <Users size={20} />, stat: "Ontario", label: "N4/N5 notice generation" },
              { icon: <FileText size={20} />, stat: "100%", label: "Digital lease signing" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 16,
                  padding: "32px 24px",
                  textAlign: "center"
                }}
              >
                <div style={{ width: 48, height: 48, background: GL, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: G }}>
                  {item.icon}
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, color: TEXT, lineHeight: 1, marginBottom: 8 }}>
                  {item.stat}
                </div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: G,
        padding: "96px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 80% at 20% 50%, rgba(255,255,255,0.04), transparent), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,0,0,0.08), transparent)",
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(40px, 6vw, 70px)",
            color: "#fff",
            letterSpacing: "-1.5px",
            lineHeight: 1,
            marginBottom: 14
          }}>
            Start managing smarter
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 420, margin: "0 auto 36px", lineHeight: 1.65, fontWeight: 400 }}>
            Join thousands of landlords already using Kaya to streamline their operations.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 500, margin: "0 auto 18px" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                flex: 1,
                minWidth: 240,
                padding: "14px 20px",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 40,
                background: "rgba(255,255,255,0.1)",
                fontSize: 14,
                color: "#fff",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: "14px 32px",
                background: "#fff",
                color: G,
                border: "none",
                borderRadius: 40,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              Request early access <ArrowRight size={16} />
            </button>
          </div>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            Pre-launch · join the early-access waitlist
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: TEXT, color: "rgba(255,255,255,0.5)", padding: "48px 48px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: "#fff", marginBottom: 12 }}>
                Kaya<span style={{ color: G }}>.</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
                The AI-powered property management platform built for Ontario landlords.
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "Updates"] },
              { title: "Resources", links: ["Documentation", "Blog", "Support", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] }
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                  {col.title}
                </div>
                {col.links.map((link, j) => (
                  <div key={j} style={{ fontSize: 14, marginBottom: 10, cursor: "pointer" }}>
                    {link}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <div>© 2026 Kaya. All rights reserved.</div>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ cursor: "pointer" }}>Twitter</span>
              <span style={{ cursor: "pointer" }}>LinkedIn</span>
              <span style={{ cursor: "pointer" }}>GitHub</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}