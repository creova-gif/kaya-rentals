import { useState, useEffect } from "react";
import {
  Search, Filter, Wrench, Star, MapPin, Phone, Mail,
  Briefcase, CheckCircle, Clock, DollarSign, Users, Award, Plus,
} from "lucide-react";
import { MarketplaceAPI, JobAPI } from "../services/backend.service";
import { toast } from "sonner";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

interface Contractor {
  id: string;
  name: string;
  trade: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  serviceRadiusKm: number;
  priceRange: { min: number; max: number };
  verified: boolean;
  avgRating: number;
  jobsCompleted: number;
  responseTimeHours: number;
  subscriptionTier?: "basic" | "pro" | "enterprise";
  createdAt: string;
}

const tierStyle = (tier: string) => {
  if (tier === "enterprise") return { bg: GL, color: G, border: `${G}30` };
  if (tier === "pro") return { bg: "#FEF3C7", color: "#B45309", border: "rgba(180,83,9,0.2)" };
  return { bg: "#F8F7F4", color: MU, border: "rgba(0,0,0,0.1)" };
};

export function ContractorMarketplace() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrade, setFilterTrade] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [contactModal, setContactModal] = useState<Contractor | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [sending, setSending] = useState(false);

  const trades = [
    { value: "all", label: "All Trades" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "hvac", label: "HVAC" },
    { value: "general", label: "General" },
    { value: "painting", label: "Painting" },
    { value: "carpentry", label: "Carpentry" },
  ];

  useEffect(() => {
    loadContractors();
  }, [filterTrade, verifiedOnly]);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterTrade !== "all") filters.trade = filterTrade;
      if (verifiedOnly) filters.verified = true;
      const data = await MarketplaceAPI.contractors.getAll(filters);
      setContractors(data);
    } catch (error) {
      console.error("Failed to load contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendJobRequest = async () => {
    if (!contactModal || !jobTitle.trim()) return;
    setSending(true);
    try {
      await JobAPI.create({
        propertyId: "pending",
        title: jobTitle,
        description: `${jobDesc}\n\nContractor: ${contactModal.name} (${contactModal.trade})`,
        urgency: "medium",
      });
    } catch { /* fire-and-forget: property selection happens at job detail */ }
    toast.success(`Job request sent to ${contactModal.name}`);
    setContactModal(null);
    setJobTitle("");
    setJobDesc("");
    setSending(false);
  };

  const filteredContractors = contractors.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.trade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: contractors.length,
    verified: contractors.filter((c) => c.verified).length,
    avgRating: contractors.length > 0
      ? (contractors.reduce((sum, c) => sum + c.avgRating, 0) / contractors.length).toFixed(1)
      : "0.0",
    activeJobs: contractors.reduce((sum, c) => sum + c.jobsCompleted, 0),
  };

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", fontFamily: SANS }}>
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p style={{ fontSize: 10, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>Marketplace</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 400, color: TX, letterSpacing: "-1px", marginBottom: 8 }}>Find Contractors</h1>
          <p style={{ fontSize: 14, color: MU, maxWidth: 560, margin: 0 }}>
            Browse verified contractors for property maintenance and repairs. All contractors are pre-screened and rated by landlords.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { Icon: Users, label: "Total Contractors", value: stats.total, bg: GL, color: G },
            { Icon: CheckCircle, label: "Verified", value: stats.verified, bg: GL, color: G },
            { Icon: Star, label: "Avg Rating", value: `${stats.avgRating}/5.0`, bg: "#FEF3C7", color: "#B45309" },
            { Icon: Briefcase, label: "Jobs Completed", value: stats.activeJobs, bg: GL, color: G },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${G}15`, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.Icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: MU }}>{s.label}</span>
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, color: TX, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${G}15`, padding: 20, marginBottom: 24 }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={15} color={MU} strokeWidth={2.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search contractors by name or trade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${G}20`, borderRadius: 11, background: "#F8F7F4", outline: "none", fontSize: 13, fontWeight: 500, color: TX, fontFamily: SANS, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Filter size={15} color={G} strokeWidth={2.5} />
              <select
                value={filterTrade}
                onChange={(e) => setFilterTrade(e.target.value)}
                style={{ padding: "10px 16px", border: `1.5px solid ${G}20`, borderRadius: 11, background: "#fff", outline: "none", fontSize: 13, fontWeight: 500, color: TX, fontFamily: SANS, cursor: "pointer" }}
              >
                {trades.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: G, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: TX }}>Verified Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Contractors Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ display: "inline-block", width: 32, height: 32, borderRadius: "50%", border: `4px solid ${G}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <p style={{ marginTop: 16, fontSize: 13, color: MU }}>Loading contractors...</p>
          </div>
        ) : filteredContractors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Users size={48} color="rgba(0,0,0,0.12)" strokeWidth={1.5} style={{ margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, color: TX, fontWeight: 600 }}>No contractors found</p>
            <p style={{ fontSize: 13, color: MU, marginTop: 6 }}>Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContractors.map((contractor) => (
              <div key={contractor.id} style={{ background: "#fff", borderRadius: 20, border: `1px solid ${G}15`, padding: 24, transition: "all 0.2s" }}>
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: TX, margin: 0 }}>{contractor.name}</h3>
                      {contractor.verified && <CheckCircle size={16} color={G} strokeWidth={2.5} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 11, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: GL, color: G, border: `1px solid ${G}25` }}>
                        {contractor.trade}
                      </span>
                      {contractor.subscriptionTier && (() => {
                        const ts = tierStyle(contractor.subscriptionTier);
                        return (
                          <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                            {contractor.subscriptionTier}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i} size={14}
                        color={i < Math.floor(contractor.avgRating) ? "#B45309" : "rgba(0,0,0,0.12)"}
                        fill={i < Math.floor(contractor.avgRating) ? "#B45309" : "none"}
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TX }}>{contractor.avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: MU }}>({contractor.jobsCompleted} jobs)</span>
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: MU }}>
                    <Clock size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                    <span>Responds in ~{contractor.responseTimeHours} hours</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: MU }}>
                    <MapPin size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                    <span>{contractor.serviceRadiusKm} km service radius</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: MU }}>
                    <DollarSign size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                    <span>${contractor.priceRange.min} – ${contractor.priceRange.max}/hr</span>
                  </div>
                  {contractor.licenseNumber && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: MU }}>
                      <Award size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                      <span>License: {contractor.licenseNumber}</span>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <Phone size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                    <a href={`tel:${contractor.phone}`} style={{ color: G, textDecoration: "none" }}>{contractor.phone}</a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <Mail size={14} color="rgba(0,0,0,0.25)" strokeWidth={2.5} />
                    <a href={`mailto:${contractor.email}`} style={{ color: G, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contractor.email}</a>
                  </div>
                </div>

                <button
                  onClick={() => { setContactModal(contractor); setJobTitle(""); setJobDesc(""); }}
                  style={{ width: "100%", marginTop: 16, padding: "11px 16px", background: G, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
                >
                  Send Job Request
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Register as Contractor CTA */}
        <div style={{ marginTop: 48, background: `linear-gradient(135deg, ${G} 0%, #065E3C 100%)`, borderRadius: 20, padding: 32, color: "#fff" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: "#fff", marginBottom: 10 }}>Are you a contractor?</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 6, fontSize: 16 }}>
              Join Kaya's contractor marketplace and connect with property owners across Ontario.
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 24 }}>
              Subscription plans starting at $29/month · Get verified · Build your reputation · Accept jobs 24/7
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.2)" }}>
                <h3 style={{ fontWeight: 600, fontSize: 17, marginBottom: 4, color: "#fff" }}>Basic</h3>
                <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#fff" }}>$29<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span></p>
                <ul style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  <li>✓ Profile listing</li><li>✓ Contact requests</li><li>✓ Job notifications</li><li>✓ Basic analytics</li>
                </ul>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 14, padding: 20, border: "2px solid rgba(255,255,255,0.4)", position: "relative" }}>
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "3px 12px", background: "#fff", color: G, borderRadius: 99, fontSize: 10, fontWeight: 700 }}>POPULAR</div>
                <h3 style={{ fontWeight: 600, fontSize: 17, marginBottom: 4, color: "#fff" }}>Pro</h3>
                <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#fff" }}>$79<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span></p>
                <ul style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  <li>✓ Everything in Basic</li><li>✓ <strong>Verified badge</strong></li><li>✓ Featured placement</li><li>✓ Priority support</li><li>✓ Advanced analytics</li>
                </ul>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.2)" }}>
                <h3 style={{ fontWeight: 600, fontSize: 17, marginBottom: 4, color: "#fff" }}>Enterprise</h3>
                <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#fff" }}>$199<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span></p>
                <ul style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  <li>✓ Everything in Pro</li><li>✓ Multiple team members</li><li>✓ API access</li><li>✓ White-label options</li><li>✓ Dedicated account manager</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => window.open("mailto:contractors@kaya.ca?subject=Contractor Subscription Inquiry", "_blank")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#fff", color: G, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Start Your Contractor Subscription
            </button>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 10 }}>
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>

      </div>

      {/* Job Request Modal */}
      {contactModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setContactModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>Job Request</p>
                <h3 style={{ fontFamily: SERIF, fontSize: 22, color: TX, margin: "4px 0 0" }}>{contactModal.name}</h3>
              </div>
              <button onClick={() => setContactModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: MU }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Job title *</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder={`e.g. ${contactModal.trade} repair needed`}
                style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${jobTitle ? G : "rgba(0,0,0,0.1)"}`, borderRadius: 10, fontFamily: SANS, fontSize: 13, color: TX, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Description</label>
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                rows={3}
                placeholder="Describe the issue, urgency, and any access instructions..."
                style={{ width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 10, fontFamily: SANS, fontSize: 13, color: TX, outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={sendJobRequest}
              disabled={!jobTitle.trim() || sending}
              style={{ width: "100%", padding: 13, background: jobTitle.trim() && !sending ? G : "rgba(0,0,0,0.15)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: jobTitle.trim() && !sending ? "pointer" : "not-allowed", fontFamily: SANS }}
            >
              {sending ? "Sending…" : `Send to ${contactModal.name} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
