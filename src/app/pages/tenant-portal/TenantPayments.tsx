import { Download, CheckCircle2, CreditCard, Sparkles, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PaymentAPI } from "../../services/backend.service";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

// Compute next rent due date dynamically (1st of next month)
const computeNextDue = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return {
    date: next,
    iso: `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-01`,
    label: `${monthShort[next.getMonth()]} 1`,
    fullLabel: `${monthNames[next.getMonth()]} 1, ${next.getFullYear()}`,
    monthYear: `${monthNames[next.getMonth()]} ${next.getFullYear()}`,
  };
};

type Modal = "pay" | "autopay" | "addmethod" | null;

export function TenantPayments() {
  const [modal, setModal] = useState<Modal>(null);
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<{ month: string; date: string; amount: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [nextRentAmount, setNextRentAmount] = useState(0);

  useEffect(() => {
    PaymentAPI.getAll()
      .then(raw => {
        const paid = raw
          .filter((p: any) => p.status === "completed" || p.status === "paid")
          .sort((a: any, b: any) => new Date(b.paidDate ?? b.dueDate).getTime() - new Date(a.paidDate ?? a.dueDate).getTime());
        setPaymentHistory(paid.map((p: any) => {
          const d = new Date(p.paidDate ?? p.dueDate);
          return {
            month: d.toLocaleDateString("en-CA", { month: "short", year: "numeric" }),
            date: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
            amount: p.amount ?? 0,
          };
        }));
        const upcoming = raw.find((p: any) => p.status !== "completed" && p.status !== "paid");
        if (upcoming) setNextRentAmount(upcoming.amount ?? 0);
        else if (raw.length) setNextRentAmount(raw[raw.length - 1].amount ?? 0);
      })
      .catch(() => setPaymentHistory([]))
      .finally(() => setLoadingHistory(false));
  }, []);

  const totalPaid = paymentHistory.reduce((s, p) => s + p.amount, 0);
  const rentAmount = nextRentAmount || (paymentHistory[0]?.amount ?? 0);
  const nextDue = computeNextDue();
  const daysLeft = daysUntil(nextDue.iso);

  return (
    <div style={{ fontFamily: SANS }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 4 }}>Payments</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: TX, letterSpacing: "-1px", lineHeight: 1 }}>Rent & Payments</h1>
        </motion.div>

        {/* Stats 3-up */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 16 }}>
          <div style={{ background: GL, borderRadius: 12, padding: 14, textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#085040", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>Total Paid</p>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: "#085040" }}>${(totalPaid / 1000).toFixed(1)}K</p>
            <p style={{ fontSize: 9, color: G }}>{paymentHistory.length} payments</p>
          </div>
          <div style={{ background: "#F8F7F4", borderRadius: 12, padding: 14, textAlign: "center", cursor: "pointer" }} onClick={() => setModal("autopay")}>
            <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>Auto-Pay</p>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: G }}>✓ On</p>
            <p style={{ fontSize: 9, color: MU }}>Visa ····4242</p>
          </div>
          <div style={{ background: "#F8F7F4", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>Next Due</p>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: TX }}>{nextDue.label}</p>
            <p style={{ fontSize: 9, color: G }}>{rentAmount ? `$${rentAmount.toLocaleString()}` : "—"}</p>
          </div>
        </div>

        {/* Pay now banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "linear-gradient(135deg,#0D5C3A,#0A7A52)", borderRadius: 16, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, cursor: "pointer" }}
          onClick={() => setModal("pay")}
        >
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 3 }}>{nextDue.monthYear}</p>
            <p style={{ fontFamily: SERIF, fontSize: 30, color: "#fff", lineHeight: 1 }}>{rentAmount ? `$${rentAmount.toLocaleString()}.00` : "—"}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>Due in {daysLeft} days</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setModal("pay"); }}
            style={{ padding: "10px 18px", background: "#fff", color: "#085040", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Pay Now
          </button>
        </motion.div>

        {/* Payment method cards horizontal scroll */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { icon: "💳", name: "Visa ····4242", tag: "Primary", primary: true },
            { icon: "🏦", name: "CIBC Chequing", tag: "Backup", primary: false },
          ].map((m, i) => (
            <div key={i} style={{ background: m.primary ? GL : "#fff", border: `1.5px solid ${m.primary ? G : "rgba(0,0,0,0.07)"}`, borderRadius: 12, padding: "11px 14px", flexShrink: 0, cursor: "pointer", minWidth: 120 }} onClick={() => toast.success(`${m.name} selected`)}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: TX }}>{m.name}</p>
              <p style={{ fontSize: 9, color: MU }}>{m.tag}</p>
            </div>
          ))}
          <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "11px 14px", flexShrink: 0, cursor: "pointer", minWidth: 120 }} onClick={() => setModal("addmethod")}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>➕</div>
            <p style={{ fontSize: 11, fontWeight: 600, color: TX }}>Add method</p>
            <p style={{ fontSize: 9, color: MU }}></p>
          </div>
        </motion.div>

        {/* Payment history */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", marginBottom: 16 }}>
          <div style={{ padding: "18px 22px 14px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px" }}>Payment History</p>
          </div>
          {loadingHistory && (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Loader2 size={20} color={G} style={{ animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {!loadingHistory && paymentHistory.length === 0 && (
            <p style={{ padding: "16px 22px", fontSize: 13, color: MU }}>No payment history yet.</p>
          )}
          {paymentHistory.map((p, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px", borderBottom: idx < paymentHistory.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", borderLeft: `3px solid ${G}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={14} color={G} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>{p.month}</p>
                  <p style={{ fontSize: 11, color: MU }}>Auto-pay · {p.date} · Receipt emailed</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: 16, color: TX }}>${p.amount.toLocaleString()}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: G, background: GL, borderRadius: 99, padding: "3px 10px" }}>PAID</span>
                <button style={{ width: 30, height: 30, borderRadius: 8, background: "#F8F7F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => toast.info(`${p.month} receipt downloading…`)}>
                  <Download size={13} color={MU} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Credit builder */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", borderLeft: `4px solid ${G}`, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: TX, marginBottom: 2 }}>Credit Builder</p>
              <p style={{ fontSize: 11, color: MU }}>Your on-time payments boost your credit score</p>
            </div>
            <span style={{ fontFamily: SERIF, fontSize: 22, color: G }}>+340</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 6, background: GL, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: `linear-gradient(90deg,${G},#2DA878)`, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: G }}>68%</span>
          </div>
          <p style={{ fontSize: 10, color: MU }}>Reported monthly to Equifax & TransUnion · Next report July 1</p>
        </motion.div>

        {/* AI insight */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ background: GL, borderRadius: 14, padding: "18px 22px", border: `1px solid ${G}20`, cursor: "pointer" }} onClick={() => window.dispatchEvent(new CustomEvent("openAIWithQuery", { detail: { query: "How is my payment record and credit building?" } }))}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={16} color={G} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: TX, margin: "0 0 4px" }}>Excellent Payment Record!</p>
              <p style={{ fontSize: 13, color: "#3D6B55", margin: 0, lineHeight: 1.5 }}>You've made all {paymentHistory.length} payments on time. This builds a strong rental history and credit score. Ask Kaya AI for rent credit reporting tips.</p>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>

              {modal === "pay" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <h3 style={{ fontFamily: SERIF, fontSize: 26, color: TX }}>Pay {nextDue.monthYear} Rent</h3>
                    <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%" }}><X size={18} /></button>
                  </div>
                  <div style={{ background: GL, borderRadius: 14, padding: 16, marginBottom: 18, textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5 }}>Amount due — {nextDue.fullLabel}</p>
                    <p style={{ fontFamily: SERIF, fontSize: 44, color: "#085040", lineHeight: 1 }}>${rentAmount.toLocaleString()}.00</p>
                    <p style={{ fontSize: 11, color: G, marginTop: 4 }}>{daysLeft} days remaining</p>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Payment method</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {[
                      { icon: "💳", name: "Visa ending 4242", sub: "Auto-pay active" },
                      { icon: "🏦", name: "CIBC Chequing", sub: "Backup method" },
                      { icon: "🔄", name: "Interac e-Transfer", sub: "rent@kaya.ca" },
                    ].map((m, i) => (
                      <label key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", border: `1.5px solid ${selectedMethod === i ? G : "rgba(0,0,0,0.07)"}`, borderRadius: 11, cursor: "pointer", background: selectedMethod === i ? GL : "#fff" }}>
                        <input type="radio" name="pm" checked={selectedMethod === i} onChange={() => setSelectedMethod(i)} style={{ accentColor: G }} />
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>{m.name}</p>
                          <p style={{ fontSize: 10, color: MU }}>{m.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ padding: "10px 14px", background: "#F8F7F4", borderRadius: 10, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MU }}><span>Rent</span><span style={{ color: TX, fontWeight: 600 }}>${rentAmount.toLocaleString()}.00</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MU, marginTop: 4 }}><span>Processing fee</span><span style={{ color: G, fontWeight: 600 }}>Free</span></div>
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: TX }}><span>Total</span><span>${rentAmount.toLocaleString()}.00</span></div>
                  </div>
                  <button onClick={() => { setModal(null); toast.success(`$${rentAmount.toLocaleString()} payment sent. Digital receipt emailed.`); }} style={{ width: "100%", padding: 13, background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Confirm Payment →</button>
                </>
              )}

              {modal === "autopay" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <h3 style={{ fontFamily: SERIF, fontSize: 26, color: TX }}>Auto-Pay Settings</h3>
                    <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MU, display: "flex" }}><X size={18} /></button>
                  </div>
                  <div style={{ background: GL, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#085040", marginBottom: 3 }}>✓ Auto-Pay is Active</p>
                    <p style={{ fontSize: 11, color: G }}>Rent is automatically charged on the 1st of each month</p>
                  </div>
                  {[["Payment card", "Visa ending 4242"], ["Charge date", "1st of every month"], ["Next charge", `${nextDue.fullLabel} · $${rentAmount.toLocaleString()}`], ["Notification", "24 hrs before charge"]].map(r => (
                    <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <span style={{ fontSize: 12, color: MU }}>{r[0]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TX }}>{r[1]}</span>
                    </div>
                  ))}
                  <button onClick={() => { setModal(null); toast.warning("Auto-pay paused"); }} style={{ width: "100%", marginTop: 16, padding: 13, background: "#F8F7F4", color: "#B45309", border: "1.5px solid rgba(180,83,9,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Pause Auto-Pay</button>
                </>
              )}

              {modal === "addmethod" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <h3 style={{ fontFamily: SERIF, fontSize: 26, color: TX }}>Add Payment Method</h3>
                    <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MU, display: "flex" }}><X size={18} /></button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                      { icon: "💳", name: "Credit / Debit Card", sub: "Visa, Mastercard, Amex" },
                      { icon: "🏦", name: "Bank Transfer", sub: "Interac e-Transfer" },
                      { icon: "📱", name: "Apple Pay / Google Pay", sub: "Tap to pay" },
                    ].map(m => (
                      <div key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 11, cursor: "pointer" }} onClick={() => { setModal(null); toast.success(`${m.name} added successfully`); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{m.icon}</div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>{m.name}</p>
                            <p style={{ fontSize: 11, color: MU }}>{m.sub}</p>
                          </div>
                        </div>
                        <span style={{ color: G }}>→</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
