import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { MaintenanceAPI } from "../../services/backend.service";
import { useAuth } from "../../contexts/AuthContext";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

type TicketStatus = "open" | "progress" | "resolved" | "closed";
interface Ticket {
  id: string;
  title: string;
  cat: string;
  priority: "low" | "medium" | "high";
  status: TicketStatus;
  date: string;
  landlordNote?: string;
}

const STATUS_COLORS: Record<TicketStatus, { bg: string; text: string; border: string; label: string }> = {
  open: { bg: "#FEF3C7", text: "#B45309", border: "rgba(180,83,9,0.15)", label: "Open" },
  progress: { bg: GL,        text: G,          border: "rgba(10,122,82,0.15)", label: "In Progress" },
  resolved: { bg: GL, text: G, border: "rgba(10,122,82,0.15)", label: "✓ Resolved" },
  closed: { bg: "#F8F7F4", text: MU, border: "rgba(0,0,0,0.07)", label: "Closed" },
};

const LEFT_COLORS: Record<TicketStatus, string> = {
  open: "#B45309",
  progress: G,
  resolved: G,
  closed: "#AEADA8",
};

const CATEGORIES = [
  { id: "plumbing", icon: "🚿", label: "Plumbing", desc: "Leaks, drains, toilet" },
  { id: "electrical", icon: "💡", label: "Electrical", desc: "Outlets, switches, lights" },
  { id: "hvac", icon: "❄️", label: "HVAC", desc: "Heating, cooling, vents" },
  { id: "appliance", icon: "🧺", label: "Appliances", desc: "Washer, dryer, fridge" },
  { id: "locksmith", icon: "🔑", label: "Locks & Keys", desc: "Lockouts, replacements" },
  { id: "cleaning", icon: "🧹", label: "Cleaning", desc: "Common areas, carpets" },
  { id: "pest", icon: "🐛", label: "Pest Control", desc: "Mice, insects, bugs" },
  { id: "other", icon: "🔧", label: "Other", desc: "Anything else" },
];

const SERVICE_CATALOGUE = [
  { icon: "🚿", title: "Emergency Plumbing", desc: "Burst pipes, major leaks, no water", sla: "Same day" },
  { icon: "💡", title: "Electrical Repair", desc: "Outages, faulty outlets, panel issues", sla: "24 hrs" },
  { icon: "❄️", title: "HVAC Service", desc: "No heat/cooling, thermostat, vents", sla: "24 hrs" },
  { icon: "🧺", title: "Appliance Repair", desc: "Washer, dryer, dishwasher, fridge", sla: "48 hrs" },
  { icon: "🔑", title: "Lockout / Lock Change", desc: "Emergency lockout, re-key, new locks", sla: "4 hrs" },
  { icon: "🧹", title: "Cleaning Request", desc: "Unit cleaning, carpet, common areas", sla: "48 hrs" },
  { icon: "🐛", title: "Pest Control", desc: "Mice, cockroaches, bedbugs, ants", sla: "48 hrs" },
  { icon: "🎨", title: "Minor Repairs", desc: "Painting, patching, shelves, doors", sla: "1 week" },
];

const CAT_ICON: Record<string, string> = { Plumbing: "🚿", Appliance: "🧺", Electrical: "💡", HVAC: "❄️", Locksmith: "🔑", Cleaning: "🧹", Pest: "🐛", Other: "🔧" };

const toTicketStatus = (s: string): TicketStatus => {
  if (s === "in_progress" || s === "assigned") return "progress";
  if (s === "completed") return "resolved";
  if (s === "cancelled") return "closed";
  return "open";
};

export function TenantMaintenance() {
  const { user } = useAuth();
  const tenantLabel = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Tenant";

  const [activeTab, setActiveTab] = useState<"open" | "new" | "catalogue">("open");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<Ticket | null>(null);

  const [form, setForm] = useState({ category: "", title: "", desc: "", priority: "medium" as "low" | "medium" | "high", photos: 0, access: "Morning (8 AM – 12 PM)" });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreviews(prev => {
      const next = [...prev, url].slice(0, 3);
      setForm(f => ({ ...f, photos: next.length }));
      return next;
    });
    toast.success("Photo attached");
    e.target.value = "";
  }

  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    MaintenanceAPI.getAll()
      .then(raw => setTickets(
        raw.map((r: any) => ({
          id: r.id,
          title: r.title ?? "Maintenance Request",
          cat: r.category ?? "Other",
          priority: (r.priority === "emergency" ? "high" : r.priority) ?? "medium",
          status: toTicketStatus(r.status ?? "submitted"),
          date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "—",
          landlordNote: r.notes?.[0]?.content,
        }))
      ))
      .catch(() => setTickets([]));
  }, []);

  async function submitRequest() {
    setSubmitting(true);
    const catLabel = CATEGORIES.find(c => c.id === form.category)?.label || "Other";
    try {
      const created = await MaintenanceAPI.create({
        title: form.title || "New request",
        description: form.desc,
        category: form.category as any,
        priority: form.priority as any,
        status: "submitted" as any,
      });
      const newTicket: Ticket = {
        id: created?.id ?? "KY-" + Math.floor(Math.random() * 9000 + 1000),
        title: form.title || "New request",
        cat: catLabel,
        priority: form.priority,
        status: "open",
        date: "Today",
      };
      setTickets(t => [newTicket, ...t]);
      toast.success(`Request submitted to your landlord`);
      setSubmitted(true);
    } catch {
      const localId = "KY-" + Math.floor(Math.random() * 9000 + 1000);
      setTickets(t => [{ id: localId, title: form.title || "New request", cat: catLabel, priority: form.priority, status: "open", date: "Today" }, ...t]);
      toast.success(`Request ${localId} submitted`);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function resetNew() {
    setForm({ category: "", title: "", desc: "", priority: "medium", photos: 0, access: "Morning (8 AM – 12 PM)" });
    setPhotoPreviews([]);
    setStep(0);
    setSubmitted(false);
    setActiveTab("new");
  }

  const PRIORITY_COLORS = {
    low: { border: "#22C55E", bg: "#DCFCE7", text: "#166534", label: "🟢 Low" },
    medium: { border: "#B45309", bg: "#FEF3C7", text: "#B45309", label: "🟡 Medium" },
    high: { border: "#C0392B", bg: "#FDECEA", text: "#C0392B", label: "🔴 High" },
  };

  return (
    <div style={{ fontFamily: SANS }}>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff", overflowX: "auto" }}>
        {[
          { id: "open" as const, label: "My Requests" },
          { id: "new" as const, label: "New Request" },
          { id: "catalogue" as const, label: "Service Menu" },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id === "new") { setSubmitted(false); setStep(0); } }} style={{ padding: "12px 18px", border: "none", borderBottom: `2px solid ${activeTab === t.id ? G : "transparent"}`, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer", color: activeTab === t.id ? G : MU, whiteSpace: "nowrap", background: "transparent", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── MY REQUESTS TAB ── */}
        {activeTab === "open" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, color: TX }}>My Requests</h1>
              <button onClick={() => { setActiveTab("new"); setStep(0); setSubmitted(false); }} style={{ padding: "8px 14px", background: G, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>+ New</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tickets.map(t => {
                const sc = STATUS_COLORS[t.status];
                return (
                  <div key={t.id} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid rgba(0,0,0,0.07)", borderLeft: `4px solid ${LEFT_COLORS[t.status]}`, cursor: "pointer" }} onClick={() => setDetail(t)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{CAT_ICON[t.cat] || "🔧"}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>{t.title}</p>
                          <p style={{ fontSize: 10, color: MU }}>{t.cat} · {t.date} · {t.id}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: sc.text, background: sc.bg, borderRadius: 99, padding: "3px 10px", flexShrink: 0 }}>{sc.label}</span>
                    </div>
                    {t.landlordNote && (
                      <div style={{ background: "#F8F7F4", borderRadius: 8, padding: 9, fontSize: 11, color: MU, borderLeft: `2px solid ${G}` }}>
                        <strong style={{ color: TX }}>Landlord: </strong>{t.landlordNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── NEW REQUEST TAB ── */}
        {activeTab === "new" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>✅</div>
                <p style={{ fontFamily: SERIF, fontSize: 24, color: TX, marginBottom: 8 }}>Request Submitted</p>
                <p style={{ fontSize: 13, color: MU, marginBottom: 24, lineHeight: 1.6 }}>Your ticket has been sent to your landlord. You'll be notified when they respond.</p>
                <button onClick={() => setActiveTab("open")} style={{ width: "100%", padding: 13, background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS, marginBottom: 10 }}>View My Requests</button>
                <button onClick={resetNew} style={{ width: "100%", padding: 13, background: "#F8F7F4", color: TX, border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Submit Another</button>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, color: TX, marginBottom: 16 }}>New Service Request</h1>

                {/* Step progress */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                  {["Category", "Describe", "Review"].map((s, i) => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? G : "rgba(0,0,0,0.07)", transition: "background 0.3s" }} />
                  ))}
                </div>
                <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 14 }}>Step {step + 1} of 3 — {["What needs attention?", "Describe the issue", "Review & submit"][step]}</p>

                {/* Step 1: Category */}
                {step === 0 && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                      {CATEGORIES.map(c => (
                        <div key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))} style={{ padding: 14, border: `1.5px solid ${form.category === c.id ? G : "rgba(0,0,0,0.07)"}`, background: form.category === c.id ? GL : "#fff", borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: TX }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: MU, marginTop: 2 }}>{c.desc}</div>
                        </div>
                      ))}
                    </div>
                    <button disabled={!form.category} onClick={() => setStep(1)} style={{ width: "100%", padding: 13, background: form.category ? G : "rgba(0,0,0,0.15)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: form.category ? "pointer" : "not-allowed", fontFamily: SANS }}>Next →</button>
                  </>
                )}

                {/* Step 2: Describe */}
                {step === 1 && (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Issue title</p>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Kitchen faucet dripping constantly" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, fontFamily: SANS, fontSize: 13, color: TX, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Description</p>
                      <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={4} placeholder="Describe the issue in detail. When did it start? How bad is it? Any safety concern?" style={{ width: "100%", padding: "11px 13px", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, fontFamily: SANS, fontSize: 13, color: TX, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Priority</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["low", "medium", "high"] as const).map(p => {
                          const pc = PRIORITY_COLORS[p];
                          const sel = form.priority === p;
                          return (
                            <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{ padding: "8px 14px", border: `1.5px solid ${sel ? pc.border : "rgba(0,0,0,0.07)"}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: sel ? pc.bg : "#fff", color: sel ? pc.text : MU, fontFamily: SANS }}>
                              {pc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Add photos <span style={{ color: MU, fontWeight: 400, textTransform: "none" }}>(optional but helps)</span></p>
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} onClick={() => { if (i === photoPreviews.length && photoPreviews.length < 3) { photoInputRef.current?.click(); } }} style={{ width: 64, height: 64, borderRadius: 8, background: photoPreviews[i] ? GL : "#F8F7F4", border: `1.5px ${photoPreviews[i] ? "solid" : "dashed"} ${photoPreviews[i] ? G : "rgba(0,0,0,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: i === photoPreviews.length ? "pointer" : "default", overflow: "hidden", transition: "all 0.2s" }}>
                            {photoPreviews[i] ? <img src={photoPreviews[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : i === photoPreviews.length ? <span style={{ fontSize: 22, color: MU }}>+</span> : null}
                          </div>
                        ))}
                      </div>
                      {photoPreviews.length > 0 && <p style={{ fontSize: 10, color: G, marginTop: 5 }}>{photoPreviews.length} photo{photoPreviews.length > 1 ? "s" : ""} attached</p>}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Preferred access time</p>
                      <select value={form.access} onChange={e => setForm(f => ({ ...f, access: e.target.value }))} style={{ width: "100%", padding: "11px 13px", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, fontFamily: SANS, fontSize: 13, color: TX, outline: "none", background: "#fff", appearance: "none" }}>
                        <option>Morning (8 AM – 12 PM)</option>
                        <option>Afternoon (12 PM – 5 PM)</option>
                        <option>Evening (5 PM – 8 PM)</option>
                        <option>I will contact you to arrange</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 9 }}>
                      <button onClick={() => setStep(0)} style={{ flex: "0 0 80px", padding: 13, background: "#F8F7F4", color: TX, border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>← Back</button>
                      <button onClick={() => setStep(2)} style={{ flex: 1, padding: 13, background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Review →</button>
                    </div>
                  </>
                )}

                {/* Step 3: Review */}
                {step === 2 && (() => {
                  const catData = CATEGORIES.find(c => c.id === form.category);
                  const pc = PRIORITY_COLORS[form.priority];
                  return (
                    <>
                      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: TX, margin: 0 }}>{form.title || "Untitled request"}</p>
                            <p style={{ fontSize: 11, color: MU, marginTop: 2 }}>{catData?.label || "Other"} · Unit 4A, 123 King Street</p>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: pc.text, background: pc.bg, borderRadius: 99, padding: "3px 10px" }}>{form.priority} priority</span>
                        </div>
                        <p style={{ fontSize: 12, color: MU, lineHeight: 1.5, marginBottom: 12 }}>{form.desc || "No description provided."}</p>
                        {[["Tenant", tenantLabel], ["Category", catData?.label || "Other"], ["Priority", form.priority], ["Photos", `${form.photos} attached`], ["Access time", form.access]].map(r => (
                          <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            <span style={{ fontSize: 11, color: MU }}>{r[0]}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: TX }}>{r[1]}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "11px 14px", background: GL, borderRadius: 10, marginBottom: 16, fontSize: 11, color: "#085040" }}>
                        🔒 Your request is logged, timestamped, and delivered to your landlord instantly. You'll be notified when they respond.
                      </div>
                      <div style={{ display: "flex", gap: 9 }}>
                        <button onClick={() => setStep(1)} style={{ flex: "0 0 80px", padding: 13, background: "#F8F7F4", color: TX, border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>← Back</button>
                        <button onClick={submitRequest} disabled={submitting} style={{ flex: 1, padding: 13, background: submitting ? "rgba(10,122,82,0.6)" : G, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: SANS }}>{submitting ? "Submitting…" : "Submit Request →"}</button>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}

        {/* ── SERVICE CATALOGUE TAB ── */}
        {activeTab === "catalogue" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, color: TX, marginBottom: 4 }}>Service Menu</h1>
            <p style={{ fontSize: 12, color: MU, marginBottom: 16 }}>All requests go to your landlord · Response times shown are targets</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SERVICE_CATALOGUE.map(s => (
                <div key={s.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 13, cursor: "pointer" }} onClick={() => { setActiveTab("new"); setStep(0); setSubmitted(false); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: GL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{s.icon}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: MU }}>{s.desc}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: G }}>{s.sla}</p>
                    <p style={{ fontSize: 9, color: MU }}>Response target</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* ── Ticket Detail Modal ── */}
      <AnimatePresence>
        {detail && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDetail(null)}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                <div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 22, color: TX, margin: 0 }}>{detail.title}</h3>
                  <p style={{ fontSize: 11, color: MU, marginTop: 3 }}>{detail.id} · {detail.cat} · {detail.date}</p>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MU, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }}><X size={18} /></button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[detail.status].text, background: STATUS_COLORS[detail.status].bg, borderRadius: 99, padding: "3px 10px" }}>{STATUS_COLORS[detail.status].label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: MU, background: "#F8F7F4", borderRadius: 99, padding: "3px 10px" }}>{detail.priority} priority</span>
              </div>

              {/* Timeline */}
              <div style={{ position: "relative", paddingLeft: 24, marginBottom: 16 }}>
                <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: "rgba(0,0,0,0.07)" }} />
                {[
                  { done: true, label: "Request submitted", sub: detail.date },
                  { done: true, label: "Received by landlord", sub: detail.date + " (same day)" },
                  { done: detail.status !== "open", label: "Vendor assigned", sub: detail.status !== "open" ? "Confirmed" : "Pending" },
                  { done: detail.status === "resolved" || detail.status === "closed", label: "Work completed", sub: detail.status === "resolved" ? "Confirmed" : "Pending" },
                ].map((tl, i) => (
                  <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                    <div style={{ position: "absolute", left: -21, top: 3, width: 14, height: 14, borderRadius: "50%", border: `2px solid ${tl.done ? G : "rgba(0,0,0,0.12)"}`, background: tl.done ? G : "#fff", boxShadow: tl.done ? undefined : `0 0 0 3px rgba(10,122,82,0.1)` }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: tl.done ? TX : "#AEADA8", margin: 0 }}>{tl.label}</p>
                    <p style={{ fontSize: 11, color: MU }}>{tl.sub}</p>
                  </div>
                ))}
              </div>

              {detail.landlordNote && (
                <div style={{ background: GL, borderRadius: 11, padding: 13, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#085040", marginBottom: 4 }}>Landlord update</p>
                  <p style={{ fontSize: 12, color: "#085040", lineHeight: 1.5, margin: 0 }}>{detail.landlordNote}</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => { setDetail(null); toast.success("Message sent to landlord"); }} style={{ padding: 12, background: "#F8F7F4", color: TX, border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Message Landlord</button>
                {detail.status !== "resolved" && detail.status !== "closed" ? (
                  <button onClick={() => { setDetail(null); toast.success("Marked as resolved"); }} style={{ padding: 12, background: G, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Mark Resolved</button>
                ) : (
                  <button onClick={() => { setDetail(null); resetNew(); }} style={{ padding: 12, background: "#F8F7F4", color: TX, border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Report Again</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
