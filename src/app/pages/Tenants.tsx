import { Users, MapPin, Phone, Mail, Calendar, DollarSign, AlertTriangle, CheckCircle2, Search, Filter, Award, TrendingUp, Clock, Send, Shield, Star, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TenantAPI } from "../services/backend.service";

export function Tenants() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TenantAPI.getAll()
      .then(setTenants)
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  const filteredTenants = tenants.filter(tenant => {
    if (filterStatus === "all") {
      return tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return tenant.paymentStatus === filterStatus && tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12" style={{ background: '#F8F7F4', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-[10px] font-semibold text-[#767570] uppercase tracking-wider mb-2">Tenant Management</p>
          <h1 className="text-[48px] font-normal text-[#0E0F0C] tracking-tight mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-1px' }}>
            Tenants
          </h1>
          <p className="text-[14px] text-[#767570]">
            Manage your current tenants and view their profiles
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6"
          >
            <p className="text-[12px] text-[#767570] uppercase tracking-wider mb-2">
              Total Tenants
            </p>
            <h2 className="text-[36px] font-normal text-[#0E0F0C] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {tenants.length}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6"
          >
            <p className="text-[12px] text-[#767570] uppercase tracking-wider mb-2">
              On-Time Payments
            </p>
            <h2 className="text-[36px] font-normal text-[#0A7A52] leading-none mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {tenants.filter(t => t.paymentStatus === "current").length}
            </h2>
            <p className="text-[13px] text-[#767570]">
              {((tenants.filter(t => t.paymentStatus === "current").length / (tenants.length || 1)) * 100).toFixed(0)}% success rate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6"
          >
            <p className="text-[12px] text-[#767570] uppercase tracking-wider mb-2">
              Late Payments
            </p>
            <h2 className="text-[36px] font-normal text-[#F59E0B] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {tenants.filter(t => t.paymentStatus === "late").length}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6"
          >
            <p className="text-[12px] text-[#767570] uppercase tracking-wider mb-2">
              Avg Trust Score
            </p>
            <h2 className="text-[36px] font-normal text-[#0E0F0C] leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {tenants.length > 0 ? Math.round(tenants.reduce((sum, t) => sum + (t.creditScore ?? 0), 0) / tenants.length / 10) : "—"}
            </h2>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#767570]" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[rgba(0,0,0,0.07)] rounded-lg text-[14px] text-[#0E0F0C] placeholder:text-[#767570] focus:outline-none focus:ring-2 focus:ring-[#0A7A52]/20"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-3 border border-[rgba(0,0,0,0.07)] rounded-lg bg-white">
            <Filter className="size-5 text-[#767570]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-[14px] text-[#0E0F0C] bg-transparent focus:outline-none"
            >
              <option value="all">All Tenants</option>
              <option value="current">Current Only</option>
              <option value="late">Late Only</option>
            </select>
          </div>

          <p className="text-[14px] text-[#767570]">
            Showing {filteredTenants.length} of {tenants.length} tenants
          </p>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTenants.map((tenant, idx) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate("/tenant-passport")}
              className="bg-white border border-[rgba(0,0,0,0.07)] rounded-xl p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-full bg-gradient-to-br from-[#0A7A52] to-[#0D9B68] flex items-center justify-center">
                    <Users className="size-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-normal text-[#0E0F0C] mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {tenant.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[13px] text-[#767570]">
                      <MapPin className="size-4" />
                      <span>{tenant.unit} • {tenant.address}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  tenant.paymentStatus === "current"
                    ? "bg-[#E5F4EE] border border-[#0A7A52]/20"
                    : "bg-[#FEF3E2] border border-[#F59E0B]/20"
                }`}>
                  {tenant.paymentStatus === "current" ? (
                    <CheckCircle2 className="size-4 text-[#0A7A52]" />
                  ) : (
                    <Clock className="size-4 text-[#F59E0B]" />
                  )}
                  <span className={`text-[12px] font-semibold ${
                    tenant.paymentStatus === "current" ? "text-[#0A7A52]" : "text-[#F59E0B]"
                  }`}>
                    {tenant.paymentStatus === "current" ? "Current" : "Late"}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6 pb-6 border-b border-[rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-[#767570]" />
                  <a href={`mailto:${tenant.email}`} className="text-[14px] text-[#767570] hover:text-[#0E0F0C] transition-colors">
                    {tenant.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-[#767570]" />
                  <a href={`tel:${tenant.phone}`} className="text-[14px] text-[#767570] hover:text-[#0E0F0C] transition-colors">
                    {tenant.phone}
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[11px] text-[#767570] uppercase tracking-wider mb-1">Monthly Rent</p>
                  <div className="flex items-baseline gap-1">
                    <DollarSign className="size-4 text-[#0E0F0C] mt-1" />
                    <span className="text-[20px] font-normal text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {tenant.rent.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-[#767570] uppercase tracking-wider mb-1">Credit Score</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[20px] font-normal ${
                      tenant.creditScore >= 740 ? "text-[#0A7A52]" : 
                      tenant.creditScore >= 670 ? "text-[#F59E0B]" : 
                      "text-[#EF4444]"
                    }`} style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {tenant.creditScore}
                    </span>
                    <span className="text-[12px] text-[#767570]">
                      {tenant.creditScore >= 740 ? "Excellent" : tenant.creditScore >= 670 ? "Good" : "Fair"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-[rgba(0,0,0,0.04)]">
                <div>
                  <p className="text-[11px] text-[#767570] uppercase tracking-wider mb-1">Lease Start</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#767570]" />
                    <span className="text-[14px] text-[#0E0F0C] font-medium">{tenant.leaseStart}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-[#767570] uppercase tracking-wider mb-1">Lease End</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#767570]" />
                    <span className="text-[14px] text-[#0E0F0C] font-medium">{tenant.leaseEnd}</span>
                  </div>
                </div>
              </div>

              {/* Risk Level & Trust Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-[#767570]" />
                  <span className="text-[13px] text-[#767570]">Risk Level:</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    tenant.risk === "low" ? "bg-[#E5F4EE] text-[#0A7A52] border border-[#0A7A52]/20" :
                    tenant.risk === "medium" ? "bg-[#FEF3E2] text-[#F59E0B] border border-[#F59E0B]/20" :
                    "bg-[#FEE2E2] text-[#EF4444] border border-[#EF4444]/20"
                  }`}>
                    {tenant.risk}
                  </span>
                </div>

                {tenant.creditScore >= 720 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E5F4EE] border border-[#0A7A52]/20 rounded-full">
                    <Award className="size-4 text-[#0A7A52]" />
                    <span className="text-[11px] font-semibold text-[#0A7A52]">Verified</span>
                  </div>
                )}
              </div>

              {/* Quick Actions (visible on hover) */}
              <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.04)] opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-[#0A7A52] text-white text-[13px] font-semibold rounded-lg hover:bg-[#096A46] transition-colors flex items-center justify-center gap-2">
                    <Award className="size-4" />
                    View Passport
                  </button>
                  <button className="px-4 py-2 border border-[rgba(0,0,0,0.07)] text-[#0E0F0C] text-[13px] font-semibold rounded-lg hover:bg-[#F8F7F4] transition-colors flex items-center justify-center gap-2">
                    <Send className="size-4" />
                    Message
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div className="text-center py-16">
            <div className="size-16 rounded-full bg-white border border-[rgba(0,0,0,0.07)] flex items-center justify-center mx-auto mb-4">
              <Search className="size-8 text-[#767570]" />
            </div>
            <h3 className="text-[20px] font-normal text-[#0E0F0C] mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              No tenants found
            </h3>
            <p className="text-[14px] text-[#767570]">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}