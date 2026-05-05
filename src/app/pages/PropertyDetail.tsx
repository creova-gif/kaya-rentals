import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Building2, MapPin, Edit, Trash2, Plus, Bed, Bath, Ruler, DollarSign,
  Users, Calendar, CheckCircle, Camera, FileText, Upload, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PropertyAPI, UnitAPI } from "../services/backend.service";
import type { Property, Unit } from "../types/database.types";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      PropertyAPI.getById(id),
      UnitAPI.getAll(id).catch(() => [] as Unit[]),
    ])
      .then(([prop, unitList]) => {
        setProperty(prop);
        setUnits(unitList);
      })
      .catch(() => toast.error("Failed to load property"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <Loader2 size={28} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <Building2 size={40} color="#767570" style={{ marginBottom: 16 }} />
        <p style={{ color: "#767570", fontSize: 15 }}>Property not found.</p>
        <button onClick={() => navigate("/app/properties")} style={{ marginTop: 12, color: "#0A7A52", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>← Back to Properties</button>
      </div>
    );
  }

  const occupiedUnits = units.filter(u => u.status === "occupied");
  const totalRevenue = occupiedUnits.reduce((sum, u) => sum + (u.rentPrice ?? 0), 0);
  const occupancyPct = units.length > 0 ? Math.round((occupiedUnits.length / units.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: "#F8F7F4", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/app/properties")}
            className="flex items-center gap-2 text-[#767570] hover:text-[#0E0F0C] mb-4 text-[13px] font-medium"
          >
            ← Back to Properties
          </button>
          <p className="text-[10px] font-semibold text-[#767570] uppercase tracking-wider mb-2">Property Management</p>
          <h1 className="text-[48px] font-normal text-[#0E0F0C] tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: "-1px" }}>
            {property.address}
          </h1>
          <p className="mt-2 text-[14px] text-[#767570]">{property.city}, {property.province} · {property.propertyType.replace(/_/g, " ")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Building2 className="size-5 text-[#0A7A52]" />, label: "Total Units", value: units.length },
            { icon: <Users className="size-5 text-[#0A7A52]" />, label: "Occupancy", value: `${occupancyPct}%` },
            { icon: <DollarSign className="size-5 text-[#0A7A52]" />, label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}` },
            { icon: <Calendar className="size-5 text-[#0A7A52]" />, label: "Occupied Units", value: `${occupiedUnits.length} / ${units.length}` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#E5F4EE]">{s.icon}</div>
                <span className="text-sm text-[#767570]">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-[#0E0F0C]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-[rgba(0,0,0,0.08)] mb-6">
          <nav className="flex gap-8">
            {["overview", "units", "amenities"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-[#0A7A52] text-[#0A7A52]"
                    : "border-transparent text-[#767570] hover:text-[#0E0F0C]"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0E0F0C]">Property Photos</h3>
                <button onClick={() => toast.info("Photo upload coming soon")} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#E5F4EE] hover:bg-[#D1EDE0] text-[#0A7A52] rounded-lg font-medium transition-colors">
                  <Upload className="size-4" />Upload Photos
                </button>
              </div>
              {(property.photos ?? []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(property.photos ?? []).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                      <img src={img} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#767570] border-2 border-dashed border-[rgba(0,0,0,0.08)] rounded-lg">
                  <Camera className="size-8 mb-3 text-[#AEADA8]" />
                  <p className="text-sm">No photos yet. Upload photos to attract tenants.</p>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
              <h3 className="text-lg font-semibold text-[#0E0F0C] mb-4">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Address", property.address],
                  ["City", `${property.city}, ${property.province}`],
                  ["Postal Code", property.postalCode],
                  ["Type", property.propertyType.replace(/_/g, " ")],
                  ["Total Units", String(property.totalUnits)],
                  ["Country", property.country],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-3 border-b border-[rgba(0,0,0,0.06)]">
                    <span className="text-[#767570]">{l}</span>
                    <span className="font-medium text-[#0E0F0C] capitalize">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === "units" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0E0F0C]">Units ({units.length})</h3>
            </div>
            {units.length === 0 ? (
              <div className="text-center py-16 text-[#767570]">
                <Building2 className="size-10 mx-auto mb-4 text-[#AEADA8]" />
                <p>No units yet. Add units from the Properties page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {units.map(unit => (
                  <div key={unit.id} className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-[#0E0F0C] mb-2">{unit.unitNumber}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          unit.status === "occupied" ? "bg-[#E5F4EE] text-[#0A7A52]" :
                          unit.status === "available" ? "bg-[#F8F7F4] text-[#767570]" :
                          "bg-[#FEF3C7] text-[#B45309]"
                        }`}>{unit.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-[rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2">
                        <Bed className="size-5 text-[#767570]" />
                        <div>
                          <p className="text-sm text-[#767570]">Beds</p>
                          <p className="font-semibold text-[#0E0F0C]">{unit.bedrooms}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="size-5 text-[#767570]" />
                        <div>
                          <p className="text-sm text-[#767570]">Baths</p>
                          <p className="font-semibold text-[#0E0F0C]">{unit.bathrooms}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="size-5 text-[#767570]" />
                        <div>
                          <p className="text-sm text-[#767570]">Sq Ft</p>
                          <p className="font-semibold text-[#0E0F0C]">{unit.squareFootage ?? "—"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#767570]">Monthly Rent</span>
                        <span className="text-xl font-bold text-[#0E0F0C]">${(unit.rentPrice ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#767570]">Security Deposit</span>
                        <span className="font-medium text-[#0E0F0C]">${(unit.deposit ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {(unit.features ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(unit.features ?? []).map((f, i) => (
                          <span key={i} className="px-2 py-1 bg-[#F8F7F4] text-[#767570] rounded text-xs font-medium">{f}</span>
                        ))}
                      </div>
                    )}

                    {unit.availabilityDate && unit.status !== "occupied" && (
                      <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center gap-2 text-sm text-[#767570]">
                        <Calendar className="size-4" />
                        <span>Available {new Date(unit.availabilityDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === "amenities" && (
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
            <h3 className="text-lg font-semibold text-[#0E0F0C] mb-6">Building Amenities</h3>
            {(property.amenities ?? []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(property.amenities ?? []).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg">
                    <CheckCircle className="size-5 text-[#0A7A52] flex-shrink-0" />
                    <span className="font-medium text-[#0E0F0C]">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#767570] text-sm">No amenities listed for this property.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
