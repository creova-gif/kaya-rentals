import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText, CheckCircle2, Download, Eye, Edit3,
  Calendar, DollarSign, MapPin, Shield, AlertCircle, Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

const G = "#0A7A52";
const GL = "#E5F4EE";
const TX = "#0E0F0C";
const MU = "#767570";
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Instrument Serif', Georgia, serif";

export function TenantLeaseSigning() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signature, setSignature] = useState("");
  const [initials, setInitials] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const tenantFullName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Tenant";

  const lease = {
    propertyTitle: "Modern Downtown 2BR Condo",
    propertyAddress: "123 King Street West, Toronto, ON M5H 2N2",
    monthlyRent: 2300,
    securityDeposit: 2300,
    leaseStart: "April 1, 2026",
    leaseEnd: "March 31, 2027",
    leaseTerm: "12 months",
    landlordName: "Premium Properties Inc.",
    tenantName: tenantFullName,
    generatedDate: new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }),
  };

  const leaseSections = [
    {
      title: "Property Details & Parties",
      content: [
        `This Residential Tenancy Agreement is made on ${lease.generatedDate}.`,
        `LANDLORD: ${lease.landlordName}`,
        `TENANT: ${lease.tenantName}`,
        `PROPERTY: ${lease.propertyAddress}`,
        `The Landlord agrees to rent the property to the Tenant, and the Tenant agrees to rent the property from the Landlord.`,
      ],
    },
    {
      title: "Term & Rent",
      content: [
        `LEASE TERM: ${lease.leaseTerm}`,
        `START DATE: ${lease.leaseStart}`,
        `END DATE: ${lease.leaseEnd}`,
        `MONTHLY RENT: $${lease.monthlyRent.toLocaleString()} CAD`,
        `SECURITY DEPOSIT: $${lease.securityDeposit.toLocaleString()} CAD`,
        `Rent is due on the 1st day of each month. Late payments may incur fees as permitted by Ontario's Residential Tenancies Act.`,
        `The security deposit will be held in accordance with Ontario law and returned within the required timeframe after lease termination, less any lawful deductions.`,
      ],
    },
    {
      title: "Tenant Obligations",
      content: [
        "1. Pay rent in full and on time",
        "2. Maintain the property in good condition",
        "3. Not cause damage beyond normal wear and tear",
        "4. Comply with all building rules and regulations",
        "5. Not disturb other residents",
        "6. Not sublet without written permission",
        "7. Allow landlord access for inspections with proper notice",
        "8. Report maintenance issues promptly",
      ],
    },
    {
      title: "Landlord Obligations",
      content: [
        "1. Provide a habitable property meeting all safety standards",
        "2. Make necessary repairs in a timely manner",
        "3. Provide 24 hours notice before entering (except emergencies)",
        "4. Comply with Ontario's Residential Tenancies Act",
        "5. Maintain common areas and building systems",
        "6. Provide working smoke detectors and carbon monoxide alarms",
        "7. Not harass or interfere with tenant's reasonable enjoyment",
      ],
    },
    {
      title: "Ontario LTB Compliance",
      content: [
        "This agreement complies with Ontario's Residential Tenancies Act, 2006.",
        "All disputes shall be resolved through the Landlord and Tenant Board (LTB).",
        "The tenant has the right to file applications with the LTB regarding:",
        "- Rent increases above the guideline",
        "- Maintenance and repair issues",
        "- Harassment or interference with reasonable enjoyment",
        "- Unlawful eviction",
        "The landlord may only terminate this tenancy for reasons permitted under the RTA.",
        "Proper notice periods must be followed for both parties as per the RTA.",
      ],
    },
    {
      title: "Additional Terms",
      content: [
        "UTILITIES: Tenant is responsible for electricity, internet, and cable. Landlord covers water and heat.",
        "PARKING: One parking spot included",
        "PETS: No pets allowed without written consent",
        "SMOKING: No smoking anywhere in the building",
        "INSURANCE: Tenant strongly encouraged to obtain renter's insurance",
        "NOTICE TO TERMINATE: Either party must provide 60 days written notice to terminate",
      ],
    },
  ];

  const handleSign = async () => {
    if (!signature || !initials || !agreedToTerms) return;
    setSigning(true);
    await new Promise(res => setTimeout(res, 1800));
    setSigning(false);
    setSigned(true);
    setTimeout(() => navigate("/tenant/applications"), 2500);
  };

  if (signed) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center", margin: 16 }}
        >
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={40} color={G} strokeWidth={2} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TX, margin: "0 0 10px" }}>Lease Signed!</h2>
          <p style={{ fontSize: 14, color: MU, marginBottom: 24, lineHeight: 1.6 }}>Your signed lease has been sent to the landlord. You'll receive a copy via email.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 24 }}>
            {["Lease agreement executed", "Copy sent to your email", "Landlord notified", "Move-in date confirmed"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={15} color={G} strokeWidth={2.5} />
                <span style={{ fontSize: 13, color: TX }}>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/tenant/applications")}
            style={{ width: "100%", padding: "13px 0", background: G, color: "#fff", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
          >
            Return to Applications
          </button>
        </motion.div>
      </div>
    );
  }

  if (signing) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 360, width: "100%", textAlign: "center", margin: 16 }}
        >
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${G}, #065E3C)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Sparkles size={36} color="#fff" strokeWidth={2} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: TX, margin: "0 0 8px" }}>Processing Signature</h2>
          <p style={{ fontSize: 14, color: MU }}>Finalizing your lease agreement...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: GL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} color={G} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: "0.7px", margin: 0 }}>Lease Signing</p>
              <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: TX, margin: 0, letterSpacing: "-0.5px" }}>Lease Agreement</h1>
            </div>
          </div>

          {/* Property hero */}
          <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${G} 0%, #065E3C 100%)`, boxShadow: `0 12px 40px ${G}30` }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { Icon: MapPin, label: "Property", value: lease.propertyAddress },
                { Icon: DollarSign, label: "Monthly Rent", value: `$${lease.monthlyRent.toLocaleString()}` },
                { Icon: Calendar, label: "Lease Term", value: lease.leaseTerm },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <item.Icon size={18} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                  <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TX, margin: 0 }}>Review Progress</p>
            <p style={{ fontSize: 12, color: MU, margin: 0 }}>Section {currentSection + 1} of {leaseSections.length}</p>
          </div>
          <div style={{ width: "100%", height: 6, background: "#F0EFEC", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, background: G,
              width: `${((currentSection + 1) / leaseSections.length) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table of contents */}
          <div className="lg:col-span-1">
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", padding: "22px 20px", position: "sticky", top: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: TX, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contents</h3>
              <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {leaseSections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSection(idx)}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                      background: currentSection === idx ? GL : "transparent",
                      color: currentSection === idx ? G : MU,
                    }}
                  >
                    {idx + 1}. {section.title}
                  </button>
                ))}
              </nav>

              <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 16px", border: "1px solid rgba(0,0,0,0.08)", color: MU, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff", fontFamily: SANS }}>
                  <Download size={13} strokeWidth={2.5} /> Download PDF
                </button>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 16px", border: "1px solid rgba(0,0,0,0.08)", color: MU, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff", fontFamily: SANS }}>
                  <Eye size={13} strokeWidth={2.5} /> Full Preview
                </button>
              </div>
            </div>
          </div>

          {/* Lease content */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", padding: "28px 30px", marginBottom: 20 }}
            >
              <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: TX, margin: "0 0 20px" }}>
                {leaseSections[currentSection].title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {leaseSections[currentSection].content.map((paragraph, idx) => (
                  <p key={idx} style={{ fontSize: 14, color: TX, margin: 0, lineHeight: 1.75, opacity: 0.85 }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Signature section — only on last section */}
              {currentSection === leaseSections.length - 1 && (
                <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  {/* LTB badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: GL, border: `1px solid ${G}20`, borderRadius: 12, marginBottom: 24 }}>
                    <Shield size={18} color={G} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: TX, margin: "0 0 4px" }}>Ontario LTB Compliant</h3>
                      <p style={{ fontSize: 12, color: "#3D6B55", margin: 0, lineHeight: 1.6 }}>
                        This lease has been generated to comply with Ontario's Residential Tenancies Act, 2006.
                      </p>
                    </div>
                  </div>

                  {/* Signature inputs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TX, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Full Name (Digital Signature) *
                      </label>
                      <input
                        type="text"
                        value={signature}
                        onChange={e => setSignature(e.target.value)}
                        placeholder="Type your full legal name"
                        style={{ width: "100%", padding: "12px 16px", border: `2px solid ${signature ? G : "rgba(0,0,0,0.08)"}`, borderRadius: 12, fontSize: 18, fontFamily: SERIF, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      />
                      <p style={{ fontSize: 11, color: MU, marginTop: 6, marginBottom: 0 }}>Your typed name serves as your legal digital signature</p>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TX, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Initials *
                      </label>
                      <input
                        type="text"
                        value={initials}
                        onChange={e => setInitials(e.target.value.toUpperCase())}
                        placeholder="e.g., JD"
                        maxLength={3}
                        style={{ width: 100, padding: "12px 16px", border: `2px solid ${initials ? G : "rgba(0,0,0,0.08)"}`, borderRadius: 12, fontSize: 18, fontFamily: SERIF, outline: "none", textTransform: "uppercase", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "#F8F7F4", borderRadius: 12 }}>
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={e => setAgreedToTerms(e.target.checked)}
                        style={{ marginTop: 2, accentColor: G, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
                      />
                      <label htmlFor="terms" style={{ fontSize: 13, color: TX, cursor: "pointer", lineHeight: 1.6 }}>
                        I have read and agree to all terms and conditions of this lease agreement. I understand this is a legally binding contract governed by Ontario's Residential Tenancies Act, 2006.
                      </label>
                    </div>

                    <button
                      onClick={handleSign}
                      disabled={!signature || !initials || !agreedToTerms}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                        padding: "15px 24px", borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: signature && initials && agreedToTerms ? "pointer" : "not-allowed", fontFamily: SANS, transition: "all 0.2s",
                        background: signature && initials && agreedToTerms ? G : "rgba(0,0,0,0.06)",
                        color: signature && initials && agreedToTerms ? "#fff" : "rgba(0,0,0,0.3)",
                        boxShadow: signature && initials && agreedToTerms ? `0 4px 16px ${G}40` : "none",
                      }}
                    >
                      <Edit3 size={18} strokeWidth={2.5} />
                      Sign Lease Agreement
                    </button>

                    {(!signature || !initials || !agreedToTerms) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#FEF3C7", borderRadius: 10, border: "1px solid rgba(180,83,9,0.15)" }}>
                        <AlertCircle size={16} color="#B45309" strokeWidth={2.5} />
                        <p style={{ fontSize: 13, color: "#B45309", margin: 0 }}>Please complete all required fields to sign the lease</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <button
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  style={{
                    padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontSize: 13, fontWeight: 600, cursor: currentSection === 0 ? "not-allowed" : "pointer", fontFamily: SANS, transition: "all 0.2s",
                    background: currentSection === 0 ? "#F8F7F4" : "#fff",
                    color: currentSection === 0 ? "rgba(0,0,0,0.3)" : MU,
                  }}
                >
                  Previous
                </button>

                {currentSection < leaseSections.length - 1 && (
                  <button
                    onClick={() => setCurrentSection(Math.min(leaseSections.length - 1, currentSection + 1))}
                    style={{ padding: "10px 22px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, background: G, color: "#fff", boxShadow: `0 4px 14px ${G}30` }}
                  >
                    Next Section
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
