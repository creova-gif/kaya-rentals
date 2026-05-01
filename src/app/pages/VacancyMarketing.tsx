import { useState, useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import { PropertyAPI, UnitAPI } from "../services/backend.service";

const G="#0A7A52",GL="#E5F4EE",BG="#F8F7F4",TX="#0E0F0C",MU="#767570";
const BD="rgba(0,0,0,0.07)";
const SERIF="'Instrument Serif',Georgia,serif",SANS="'DM Sans',system-ui,sans-serif";
const cd:CSSProperties={background:"#fff",border:`1px solid ${BD}`,borderRadius:16};

interface VacantUnit {
  unit: string;
  addr: string;
  beds: number;
  baths: number;
  sqft: number;
  aiPrice: number;
  yourPrice: number;
  copy: string;
  tags: string[];
  score: number;
  published: boolean;
}

interface CommercialUnit {
  unit: string;
  addr: string;
  sqft: number;
  leaseType: "NNN" | "Gross" | "Modified Gross";
  useClass: string;
  aiPricePerSqft: number;
  yourPricePerSqft: number;
  copy: string;
  tags: string[];
  score: number;
  published: boolean;
  camEstimate: number;
}

const initCommercialUnits: CommercialUnit[] = [
  {
    unit: "Suite 101",
    addr: "200 Bay St",
    sqft: 1400,
    leaseType: "NNN",
    useClass: "Retail",
    aiPricePerSqft: 38,
    yourPricePerSqft: 38,
    copy: "Prime ground-floor retail space at 200 Bay St, Toronto Financial District. 1,400 sqft with exposed concrete, 14-ft ceilings, and full glass frontage. Dedicated loading zone. NNN lease — ideal for boutique, café, or financial services. HVAC, separate electrical panel, and fibre-ready.",
    tags: ["Ground Floor", "Glass Frontage", "14ft Ceilings", "Loading Zone"],
    score: 91,
    published: false,
    camEstimate: 12,
  },
  {
    unit: "Suite 308",
    addr: "450 Front St W",
    sqft: 2800,
    leaseType: "Gross",
    useClass: "Office",
    aiPricePerSqft: 28,
    yourPricePerSqft: 27,
    copy: "Modern open-plan office on the 3rd floor at 450 Front St W. 2,800 sqft of column-free space with 12 workstations, private boardroom, kitchenette, and 2 private offices. Gross lease — all utilities and CAM included. Steps from King streetcar and Gardiner on-ramp. Available May 1.",
    tags: ["Gross Lease — All Inclusive", "Boardroom", "Fibre Internet", "Parking Available"],
    score: 86,
    published: false,
    camEstimate: 0,
  },
];

const initUnits: VacantUnit[] = [
  {
    unit: "Unit 5A",
    addr: "123 King St",
    beds: 2, baths: 1, sqft: 975,
    aiPrice: 2420, yourPrice: 2400,
    copy: "Modern 2-bedroom condo in the heart of Downtown Toronto. Bright south-facing unit with floor-to-ceiling windows, updated kitchen with quartz counters, in-suite laundry, and a dedicated parking spot. Steps from King Station. Perfect for young professionals.",
    tags: ["Parking Included", "In-Suite Laundry", "Pet Friendly"],
    score: 94,
    published: false,
  },
  {
    unit: "Unit 2B",
    addr: "456 Queen St W",
    beds: 1, baths: 1, sqft: 650,
    aiPrice: 1975, yourPrice: 1950,
    copy: "Stylish 1-bedroom unit in vibrant Queen West. Recently renovated bathroom and kitchen, hardwood floors throughout, bright east-facing exposure. Rooftop terrace access. Walkable to cafes, shops, and transit.",
    tags: ["Rooftop Access", "Recently Renovated", "Transit Nearby"],
    score: 88,
    published: false,
  },
];

const PLATFORMS = ["Zumper", "Realtor.ca", "PadMapper", "Kijiji", "Rentals.ca"];

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 90 ? G : score >= 75 ? "#B45309" : "#DC2626";
  return (
    <div style={{ textAlign: "right" }}>
      <p style={{ fontSize: 10, color: MU, marginBottom: 3, fontFamily: SANS }}>AI Listing Score</p>
      <p style={{ fontFamily: SERIF, fontSize: 32, color, lineHeight: 1 }}>{score}<span style={{ fontSize: 14, color: MU }}>/100</span></p>
      <div style={{ width: 80, height: 4, background: BG, borderRadius: 4, marginTop: 5, marginLeft: "auto" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s" }} />
      </div>
    </div>
  );
}

export function VacancyMarketing() {
  const [units, setUnits] = useState(initUnits);
  const [commUnits, setCommUnits] = useState(initCommercialUnits);

  useEffect(() => {
    PropertyAPI.getAll().then(async properties => {
      const allUnits = await Promise.all(
        properties.map(p => UnitAPI.getAll(p.id).then(us => us.map(u => ({ ...u, property: p }))))
      );
      const flat = allUnits.flat();
      const vacant = flat.filter(u => u.status === 'available');
      if (vacant.length === 0) return;

      const COMMERCIAL_TYPES = ['retail', 'office', 'industrial'];
      const res: typeof initUnits = [];
      const com: typeof initCommercialUnits = [];

      vacant.forEach(u => {
        const isCommercial = COMMERCIAL_TYPES.includes(u.property.propertyType);
        if (isCommercial) {
          com.push({
            unit: u.unitNumber,
            addr: u.property.address,
            sqft: u.squareFootage,
            leaseType: "NNN",
            useClass: u.property.propertyType.charAt(0).toUpperCase() + u.property.propertyType.slice(1),
            aiPricePerSqft: Math.round(u.rentPrice * 12 / u.squareFootage),
            yourPricePerSqft: Math.round(u.rentPrice * 12 / u.squareFootage),
            copy: `${u.squareFootage.toLocaleString()} sqft ${u.property.propertyType} space at ${u.property.address}. Available now.`,
            tags: (u.features ?? []).slice(0, 4),
            score: 80,
            published: false,
            camEstimate: 0,
          });
        } else {
          res.push({
            unit: u.unitNumber,
            addr: u.property.address,
            beds: u.bedrooms,
            baths: u.bathrooms,
            sqft: u.squareFootage,
            aiPrice: u.rentPrice,
            yourPrice: u.rentPrice,
            copy: `${u.bedrooms}-bedroom unit at ${u.property.address}. ${u.squareFootage} sqft. Available now.`,
            tags: (u.features ?? []).slice(0, 4),
            score: 80,
            published: false,
          });
        }
      });

      if (res.length > 0) setUnits(res);
      if (com.length > 0) setCommUnits(com);
    }).catch(() => {});
  }, []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editCopy, setEditCopy] = useState("");
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<"residential" | "commercial">("residential");

  const activeUnits = mode === "residential" ? units : commUnits;
  const totalVacant = activeUnits.length;
  const published = activeUnits.filter(u => u.published).length;
  const avgScore = Math.round(activeUnits.reduce((s, u) => s + u.score, 0) / activeUnits.length);

  function handlePublish(idx: number) {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, published: true } : u));
    toast.success(`${units[idx].unit} published to ${PLATFORMS.length} platforms!`);
  }

  function handleEditCopy(idx: number) {
    setEditingIdx(idx);
    setEditCopy(units[idx].copy);
  }

  function handleSaveCopy(idx: number) {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, copy: editCopy, score: Math.min(100, u.score + 2) } : u));
    setEditingIdx(null);
    toast.success("Listing copy updated");
  }

  function handleEditPrice(idx: number) {
    setEditingPriceIdx(idx);
    setEditPrice(units[idx].yourPrice);
  }

  function handleSavePrice(idx: number) {
    if (editPrice === null) return;
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, yourPrice: editPrice } : u));
    setEditingPriceIdx(null);
    toast.success("Price updated");
  }

  return (
    <div style={{ fontFamily: SANS, background: BG, minHeight: "100vh", padding: "28px 32px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>AI Marketing</p>
        <h1 style={{ fontFamily: SERIF, fontSize: 36, color: TX, lineHeight: 1.05, margin: 0 }}>
          Vacancy <em style={{ fontStyle: "italic" }}>Marketing</em>
        </h1>
        <p style={{ fontSize: 14, color: MU, marginTop: 8, lineHeight: 1.6 }}>
          AI writes your listing, picks the price, and publishes everywhere in minutes
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          ["Vacant Units", String(totalVacant)],
          ["Published", String(published)],
          ["Avg Price Accuracy", "98%"],
          ["Days to Lease", "4.2d"],
        ].map(([label, val]) => (
          <div key={label} style={{ ...cd, padding: "16px 20px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{label}</p>
            <p style={{ fontFamily: SERIF, fontSize: 28, color: TX, lineHeight: 1 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Mode Toggle + Platform pills row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".5px" }}>Syndicates to:</span>
          {PLATFORMS.map(p => (
            <span key={p} style={{ fontSize: 11, fontWeight: 600, color: G, background: GL, borderRadius: 20, padding: "4px 12px" }}>{p}</span>
          ))}
        </div>
        <div style={{ display: "flex", background: "#fff", border: `1px solid ${BD}`, borderRadius: 10, padding: 4, gap: 4 }}>
          {(["residential", "commercial"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setEditingIdx(null); setEditingPriceIdx(null); }}
              style={{ padding: "7px 16px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: mode === m ? TX : "transparent", color: mode === m ? "#fff" : MU, fontFamily: SANS, transition: "all .2s" }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Residential Vacant Unit Cards */}
      {mode === "residential" && units.map((v, idx) => (
        <div key={v.unit} style={{ ...cd, padding: 24, marginBottom: 16 }}>
          {/* Unit header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: SERIF, fontSize: 22, color: TX }}>{v.unit}</span>
                {v.published
                  ? <span style={{ fontSize: 10, fontWeight: 700, color: G, background: GL, borderRadius: 20, padding: "3px 10px" }}>✓ Published</span>
                  : <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", borderRadius: 20, padding: "3px 10px" }}>Vacant</span>
                }
              </div>
              <p style={{ fontSize: 12, color: MU }}>{v.addr} · {v.beds}bd/{v.baths}ba · {v.sqft} sqft</p>
            </div>
            <ScoreMeter score={v.score} />
          </div>

          {/* Content grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Copy */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>AI-Generated Listing Copy</p>
              {editingIdx === idx ? (
                <div>
                  <textarea
                    value={editCopy}
                    onChange={e => setEditCopy(e.target.value)}
                    rows={5}
                    style={{ width: "100%", borderRadius: 9, border: `1px solid ${BD}`, padding: 10, fontFamily: SANS, fontSize: 12, color: TX, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => handleSaveCopy(idx)} style={{ padding: "7px 16px", background: G, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingIdx(null)} style={{ padding: "7px 12px", background: BG, border: `1px solid ${BD}`, borderRadius: 8, fontFamily: SANS, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: BG, borderRadius: 9, padding: 12, fontSize: 12, color: TX, lineHeight: 1.65 }}>{v.copy}</div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {v.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, color: MU, background: BG, border: `1px solid ${BD}`, borderRadius: 20, padding: "3px 10px" }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>Pricing Analysis</p>
              <div style={{ background: BG, borderRadius: 9, padding: 12 }}>
                {[
                  ["AI Suggested Price", `$${v.aiPrice.toLocaleString()}/mo`, G],
                  ["Your Price", `$${v.yourPrice.toLocaleString()}/mo`, TX],
                  ["Market Avg", "$2,450/mo", MU],
                  ["Est. Days to Lease", "4–7 days", G],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BD}` }}>
                    <span style={{ fontSize: 11, color: MU }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
                  </div>
                ))}
                {editingPriceIdx === idx ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: MU }}>$</span>
                      <input
                        type="number"
                        value={editPrice ?? ""}
                        onChange={e => setEditPrice(Number(e.target.value))}
                        style={{ flex: 1, border: `1px solid ${BD}`, borderRadius: 7, padding: "6px 10px", fontFamily: SANS, fontSize: 12, outline: "none" }}
                      />
                      <button onClick={() => handleSavePrice(idx)} style={{ padding: "6px 12px", background: G, color: "#fff", border: "none", borderRadius: 7, fontFamily: SANS, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditingPriceIdx(null)} style={{ padding: "6px 10px", background: BG, border: `1px solid ${BD}`, borderRadius: 7, fontFamily: SANS, fontSize: 11, cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {v.published ? (
              <button
                onClick={() => { setUnits(prev => prev.map((u, i) => i === idx ? { ...u, published: false } : u)); toast.success("Listing unpublished"); }}
                style={{ flex: 1, padding: "10px 0", background: "#FEF3C7", color: "#92400E", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => handlePublish(idx)}
                style={{ flex: 1, padding: "10px 0", background: G, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Publish Now →
              </button>
            )}
            <button
              onClick={() => handleEditCopy(idx)}
              style={{ padding: "10px 16px", background: "#fff", border: `1px solid ${BD}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, cursor: "pointer", color: TX }}
            >
              Edit Copy
            </button>
            <button
              onClick={() => handleEditPrice(idx)}
              style={{ padding: "10px 16px", background: "#fff", border: `1px solid ${BD}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, cursor: "pointer", color: TX }}
            >
              Adjust Price
            </button>
          </div>
        </div>
      ))}

      {/* Commercial Vacant Unit Cards */}
      {mode === "commercial" && commUnits.map((v, idx) => (
        <div key={v.unit} style={{ ...cd, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: SERIF, fontSize: 22, color: TX }}>{v.unit}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1E5FA8", background: "#EBF2FB", borderRadius: 20, padding: "3px 10px" }}>{v.leaseType}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: MU, background: BG, borderRadius: 20, padding: "3px 10px", border: `1px solid ${BD}` }}>{v.useClass}</span>
                {v.published
                  ? <span style={{ fontSize: 10, fontWeight: 700, color: G, background: GL, borderRadius: 20, padding: "3px 10px" }}>✓ Published</span>
                  : <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", borderRadius: 20, padding: "3px 10px" }}>Vacant</span>
                }
              </div>
              <p style={{ fontSize: 12, color: MU }}>{v.addr} · {v.sqft.toLocaleString()} sqft{v.camEstimate > 0 ? ` · CAM ~$${v.camEstimate}/sqft` : ""}</p>
            </div>
            <ScoreMeter score={v.score} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>AI-Generated Listing Copy</p>
              {editingIdx === idx && mode === "commercial" ? (
                <div>
                  <textarea value={editCopy} onChange={e => setEditCopy(e.target.value)} rows={5}
                    style={{ width: "100%", borderRadius: 9, border: `1px solid ${BD}`, padding: 10, fontFamily: SANS, fontSize: 12, color: TX, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setCommUnits(prev => prev.map((u, i) => i === idx ? { ...u, copy: editCopy, score: Math.min(100, u.score + 2) } : u)); setEditingIdx(null); toast.success("Commercial listing copy updated"); }}
                      style={{ padding: "7px 16px", background: G, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingIdx(null)}
                      style={{ padding: "7px 12px", background: BG, border: `1px solid ${BD}`, borderRadius: 8, fontFamily: SANS, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: BG, borderRadius: 9, padding: 12, fontSize: 12, color: TX, lineHeight: 1.65 }}>{v.copy}</div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {v.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, color: MU, background: BG, border: `1px solid ${BD}`, borderRadius: 20, padding: "3px 10px" }}>{t}</span>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: MU, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>Commercial Pricing (per sqft / year)</p>
              <div style={{ background: BG, borderRadius: 9, padding: 12 }}>
                {[
                  ["AI Suggested", `$${v.aiPricePerSqft}/sqft/yr`, G],
                  ["Your Ask Price", `$${v.yourPricePerSqft}/sqft/yr`, TX],
                  ["Monthly Base Rent", `$${Math.round(v.sqft * v.yourPricePerSqft / 12).toLocaleString()}/mo`, TX],
                  ["Annual Base Rent", `$${(v.sqft * v.yourPricePerSqft).toLocaleString()}/yr`, G],
                  ...(v.camEstimate > 0 ? [["Est. CAM", `$${v.camEstimate}/sqft/yr`, MU] as [string, string, string]] : []),
                  ["Est. Days to Lease", "14–30 days", G],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BD}` }}>
                    <span style={{ fontSize: 11, color: MU }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {v.published ? (
              <button onClick={() => { setCommUnits(prev => prev.map((u, i) => i === idx ? { ...u, published: false } : u)); toast.success("Commercial listing unpublished"); }}
                style={{ flex: 1, padding: "10px 0", background: "#FEF3C7", color: "#92400E", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Unpublish
              </button>
            ) : (
              <button onClick={() => { setCommUnits(prev => prev.map((u, i) => i === idx ? { ...u, published: true } : u)); toast.success(`${v.unit} published to commercial platforms!`); }}
                style={{ flex: 1, padding: "10px 0", background: G, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Publish Commercial Listing →
              </button>
            )}
            <button onClick={() => { setEditingIdx(idx); setEditCopy(v.copy); }}
              style={{ padding: "10px 16px", background: "#fff", border: `1px solid ${BD}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, cursor: "pointer", color: TX }}>
              Edit Copy
            </button>
          </div>
        </div>
      ))}

      {/* AI Tips Banner */}
      <div style={{ background: TX, borderRadius: 14, padding: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 8 }}>
        <div>
          <p style={{ fontFamily: SERIF, fontSize: 20, color: "#fff", marginBottom: 4 }}>
            {mode === "commercial" ? "Generate your LOI template" : "Boost your listing score"}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>
            {mode === "commercial"
              ? "AI-generated Letter of Intent templates for commercial tenants — customized by lease type and sqft."
              : "Add professional photos to reach a score of 100 — units with photos lease 60% faster."}
          </p>
        </div>
        <button
          onClick={() => toast.success(mode === "commercial" ? "LOI generator coming soon!" : "Photo upload feature coming soon!")}
          style={{ padding: "11px 24px", background: G, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {mode === "commercial" ? "Generate LOI →" : "Upload Photos →"}
        </button>
      </div>
    </div>
  );
}
