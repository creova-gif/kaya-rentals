import { Building2, Home, Users, DollarSign, Plus, MapPin, Bed, Bath, Edit, Trash2, Eye, X, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PropertyAPI, UnitAPI } from "../services/backend.service";
import { toast } from "sonner";
import type { Property, Unit } from "../types/database.types";

type LocalUnit = Unit & { tenant?: string | null };
type LocalProperty = Property & { units: LocalUnit[] };

export function Properties() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState<string | null>(null);
  const [newProperty, setNewProperty] = useState({
    address: "",
    city: "",
    province: "Ontario",
    postalCode: "",
    type: "apartment" as const,
  });
  const [newUnit, setNewUnit] = useState({
    number: "",
    bedrooms: 1,
    bathrooms: 1,
    rent: 0,
  });

  const [properties, setProperties] = useState<LocalProperty[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const props = await PropertyAPI.getAll();
        const withUnits: LocalProperty[] = await Promise.all(
          props.map(async (p) => {
            const units = await UnitAPI.getAll(p.id).catch(() => []);
            return { ...p, units };
          })
        );
        setProperties(withUnits);
      } catch {
        toast.error("Failed to load properties");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalUnits = properties.reduce((sum, prop) => sum + prop.units.length, 0);
  const occupiedUnits = properties.reduce((sum, prop) =>
    sum + prop.units.filter(u => u.status === "occupied").length, 0
  );
  const monthlyRevenue = properties.reduce((sum, prop) =>
    sum + prop.units.filter(u => u.status === "occupied").reduce((s, u) => s + (u.rentPrice ?? 0), 0), 0
  );

  const handleAddProperty = async () => {
    if (!newProperty.address || !newProperty.city) return;
    setSaving(true);
    try {
      const created = await PropertyAPI.create({
        name: newProperty.address,
        address: newProperty.address,
        city: newProperty.city,
        province: newProperty.province,
        postalCode: newProperty.postalCode,
        country: "Canada",
        propertyType: newProperty.type as any,
        totalUnits: 0,
      });
      setProperties(prev => [...prev, { ...created, units: [] }]);
      setNewProperty({ address: "", city: "", province: "Ontario", postalCode: "", type: "apartment" });
      setShowAddProperty(false);
      toast.success("Property added");
    } catch {
      toast.error("Failed to add property");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUnit = async (propertyId: string) => {
    if (!newUnit.number || !newUnit.rent) return;
    setSaving(true);
    try {
      const created = await UnitAPI.create(propertyId, {
        unitNumber: newUnit.number,
        bedrooms: newUnit.bedrooms,
        bathrooms: newUnit.bathrooms,
        rentPrice: newUnit.rent,
        status: "available",
      });
      setProperties(prev => prev.map(p =>
        p.id === propertyId ? { ...p, units: [...p.units, created] } : p
      ));
      setNewUnit({ number: "", bedrooms: 1, bathrooms: 1, rent: 0 });
      setShowAddUnit(null);
      toast.success("Unit added");
    } catch {
      toast.error("Failed to add unit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: '#F8F7F4', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold text-[#767570] uppercase tracking-wider mb-2">Portfolio Overview</p>
            <h1 className="text-[48px] font-normal text-[#0E0F0C] tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-1px' }}>
              Properties
            </h1>
            <p className="mt-2 text-[14px] text-[#767570]">Manage your rental properties and units</p>
          </div>
          <button 
            onClick={() => navigate("/app/properties/add")}
            className="flex items-center gap-2 px-5 py-3 bg-[#0A7A52] hover:bg-[#085D3D] text-white rounded-xl font-medium transition-all shadow-lg"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <Plus className="size-5" />
            Add Property
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.07)] p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#E5F4EE]">
                <Building2 className="size-5 text-[#0A7A52]" />
              </div>
              <span className="text-[11px] font-semibold text-[#767570] uppercase tracking-wide">Total Properties</span>
            </div>
            <p className="text-[38px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1 }}>{properties.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.07)] p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#E5F4EE]">
                <Home className="size-5 text-[#0A7A52]" />
              </div>
              <span className="text-[11px] font-semibold text-[#767570] uppercase tracking-wide">Occupancy Rate</span>
            </div>
            <p className="text-[38px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1 }}>
              {Math.round((occupiedUnits / totalUnits) * 100)}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.07)] p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#E5F4EE]">
                <DollarSign className="size-5 text-[#0A7A52]" />
              </div>
              <span className="text-[11px] font-semibold text-[#767570] uppercase tracking-wide">Monthly Revenue</span>
            </div>
            <p className="text-[38px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1 }}>${monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl border border-[rgba(0,0,0,0.07)] overflow-hidden hover:shadow-lg transition-all">
              <div className="p-6 border-b border-[rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[24px] font-normal text-[#0E0F0C] mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{property.address}</h3>
                    <div className="flex items-center gap-2 text-[13px] text-[#767570]">
                      <MapPin className="size-4" />
                      <span>{property.city}, {property.province}</span>
                      <span className="mx-2">•</span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                        property.type.toLowerCase().includes("commercial")
                          ? "bg-[#EBF2FB] text-[#1E5FA8]"
                          : "bg-[#E5F4EE] text-[#0A7A52]"
                      }`}>
                        {property.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-[#767570] uppercase tracking-wide mb-2">Units</p>
                    <p className="text-[32px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1 }}>{property.units.length}</p>
                  </div>
                </div>
              </div>

              {/* Units Grid */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#0E0F0C] text-[16px]">Units</h4>
                  <button
                    onClick={() => setShowAddUnit(property.id as any)}
                    className="flex items-center gap-1 px-4 py-2 text-[13px] bg-[#E5F4EE] hover:bg-[#0A7A52] text-[#0A7A52] hover:text-white rounded-lg font-semibold transition-all"
                  >
                    <Plus className="size-4" />
                    Add Unit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.units.map((unit) => (
                    <div
                      key={unit.number}
                      className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                        unit.status === "occupied"
                          ? "border-[#0A7A52] bg-[#E5F4EE]"
                          : "border-[rgba(0,0,0,0.1)] bg-[#F8F7F4]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-[#0E0F0C] text-[16px]">{(unit as any).unitNumber ?? (unit as any).number}</h4>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          unit.status === "occupied"
                            ? "bg-[#0A7A52] text-white"
                            : "bg-white text-[#767570] border border-[rgba(0,0,0,0.1)]"
                        }`}>
                          {unit.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3 text-[13px] text-[#767570]">
                        {unit.bedrooms === 0 && unit.bathrooms === 0 ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="size-4 text-[#1E5FA8]" />
                            <span className="text-[#1E5FA8] font-semibold text-[11px] uppercase tracking-wide">Commercial Suite</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <Bed className="size-4" />
                              <span>{unit.bedrooms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="size-4" />
                              <span>{unit.bathrooms}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#767570] font-medium">Monthly Rent</span>
                        <span className="font-semibold text-[#0E0F0C] text-[16px]">${((unit as any).rentPrice ?? (unit as any).rent ?? 0).toLocaleString()}</span>
                      </div>

                      {unit.tenant && (
                        <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.1)]">
                          <div className="flex items-center gap-2 text-[13px]">
                            <Users className="size-4 text-[#767570]" />
                            <span className="text-[#0E0F0C] font-medium">{unit.tenant}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0E0F0C]">Add New Property</h2>
              <button
                onClick={() => setShowAddProperty(false)}
                className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors"
              >
                <X className="size-5 text-[#767570]" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#767570] mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#767570] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                    placeholder="Toronto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#767570] mb-2">
                    Province *
                  </label>
                  <select
                    value={newProperty.province}
                    onChange={(e) => setNewProperty({ ...newProperty, province: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                  >
                    <option value="ON">Ontario</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="QC">Quebec</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#767570] mb-2">
                  Property Type *
                </label>
                <select
                  value={newProperty.type}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                >
                  <option value="Condo">Condo</option>
                  <option value="Apartment Building">Apartment Building</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="House">House</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddProperty(false)}
                className="flex-1 px-4 py-3 border border-[rgba(0,0,0,0.12)] text-[#767570] rounded-lg font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProperty}
                disabled={saving || !newProperty.address || !newProperty.city}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  newProperty.address && newProperty.city && !saving
                    ? "bg-[#0A7A52] hover:bg-[#085D3D] text-white"
                    : "bg-[#F8F7F4] text-[#767570] cursor-not-allowed"
                }`}
              >
                {saving ? "Saving…" : "Add Property"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnit !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0E0F0C]">Add New Unit</h2>
              <button
                onClick={() => setShowAddUnit(null)}
                className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors"
              >
                <X className="size-5 text-[#767570]" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#767570] mb-2">
                  Unit Number *
                </label>
                <input
                  type="text"
                  value={newUnit.number}
                  onChange={(e) => setNewUnit({ ...newUnit, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                  placeholder="4A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#767570] mb-2">
                    Bedrooms *
                  </label>
                  <select
                    value={newUnit.bedrooms}
                    onChange={(e) => setNewUnit({ ...newUnit, bedrooms: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                  >
                    <option value="0">Studio</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#767570] mb-2">
                    Bathrooms *
                  </label>
                  <select
                    value={newUnit.bathrooms}
                    onChange={(e) => setNewUnit({ ...newUnit, bathrooms: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                  >
                    <option value="1">1 Bath</option>
                    <option value="1.5">1.5 Baths</option>
                    <option value="2">2 Baths</option>
                    <option value="2.5">2.5 Baths</option>
                    <option value="3">3+ Baths</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#767570] mb-2">
                  Monthly Rent *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#767570]" />
                  <input
                    type="number"
                    value={newUnit.rent || ""}
                    onChange={(e) => setNewUnit({ ...newUnit, rent: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]"
                    placeholder="2300"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddUnit(null)}
                className="flex-1 px-4 py-3 border border-[rgba(0,0,0,0.12)] text-[#767570] rounded-lg font-medium hover:bg-[#F8F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showAddUnit && handleAddUnit(showAddUnit)}
                disabled={saving || !newUnit.number || !newUnit.rent}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  newUnit.number && newUnit.rent && !saving
                    ? "bg-[#0A7A52] hover:bg-[#085D3D] text-white"
                    : "bg-[#F8F7F4] text-[#767570] cursor-not-allowed"
                }`}
              >
                {saving ? "Saving…" : "Add Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}