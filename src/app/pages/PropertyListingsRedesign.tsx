import { useState } from "react";
import { Heart, Check, MapPin, ArrowRight, Sparkles, X, Loader2, TrendingUp, AlertCircle, Building2, Home, Layers, Building, Search, BedDouble, Bath, Ruler, Map, Lock, Lightbulb } from "lucide-react";
import { postAiRoute } from "../services/ai-client";
import { useNavigate } from "react-router";
import { PublicNav } from "../components/PublicNav";
import { PublicFooter } from "../components/PublicFooter";
import { GlobalAIAssistant } from "../components/GlobalAIAssistant";
import { AICommandPalette } from "../components/AICommandPalette";

interface Listing {
  id: string;
  price: number;
  title: string;
  address: string;
  city: string;
  beds: number | string;
  baths: number;
  sqft: number;
  tags: { label: string; color: "green" | "blue" | "amber" | "gray" }[];
  agentName: string;
  agentInitials: string;
  agentColor: string;
  photos: number;
  verified: boolean;
  icon: React.ComponentType<{size?:number;color?:string}>;
  gradientFrom: string;
  gradientTo: string;
  favorited?: boolean;
}

interface RentEstimate {
  estimatedRent: { low: number; high: number };
  averageRent: number;
  confidence: "high" | "medium" | "low";
  factors: string[];
  marketInsights: string;
  recommendations: string;
}

interface Comparison {
  bestValue: number;
  comparisons: Array<{
    listingIndex: number;
    pros: string[];
    cons: string[];
    valueScore: number;
  }>;
  recommendations: {
    budgetConscious?: number;
    luxurySeeking?: number;
    family?: number;
  };
  redFlags: string[];
  summary: string;
}

interface LeaseGuide {
  explanation: string;
  keyTerms: Array<{ term: string; definition: string }>;
  tenantRights: string[];
  landlordObligations: string[];
  redFlags: string[];
  tips: string[];
}

export function PropertyListingsRedesign() {
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [showRentEstimate, setShowRentEstimate] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showLeaseGuide, setShowLeaseGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rentEstimate, setRentEstimate] = useState<RentEstimate | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [leaseGuide, setLeaseGuide] = useState<LeaseGuide | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const listings: Listing[] = [
    {
      id: "1",
      price: 2100,
      title: "Bright 2-bed apartment, Georgetown",
      address: "143 Mountainview Rd N, Halton Hills, ON",
      city: "Halton Hills",
      beds: 2,
      baths: 1,
      sqft: 850,
      tags: [
        { label: "Verified", color: "green" },
        { label: "Parking incl.", color: "blue" },
        { label: "Available now", color: "gray" },
      ],
      agentName: "A. Singh",
      agentInitials: "AS",
      agentColor: "#E1F5EE",
      photos: 12,
      verified: true,
      icon: Home,
      gradientFrom: "#E6F1FB",
      gradientTo: "#B5D4F4",
    },
    {
      id: "2",
      price: 2650,
      title: "Spacious detached house w/ backyard",
      address: "57 Maple Ave, Acton, ON",
      city: "Acton",
      beds: 3,
      baths: 2,
      sqft: 1400,
      tags: [
        { label: "Verified", color: "green" },
        { label: "Pets allowed", color: "amber" },
        { label: "Garage", color: "blue" },
      ],
      agentName: "M. Osei",
      agentInitials: "MO",
      agentColor: "#FAEEDA",
      photos: 8,
      verified: true,
      icon: Building,
      gradientFrom: "#FAEEDA",
      gradientTo: "#FAC775",
      favorited: true,
    },
    {
      id: "3",
      price: 1475,
      title: "Cozy studio — utilities included",
      address: "22 Guelph St, Georgetown, ON",
      city: "Georgetown",
      beds: "Studio",
      baths: 1,
      sqft: 480,
      tags: [
        { label: "Utilities incl.", color: "green" },
        { label: "Laundry on-site", color: "gray" },
      ],
      agentName: "L. Kim",
      agentInitials: "LK",
      agentColor: "#FBEAF0",
      photos: 6,
      verified: true,
      icon: Building2,
      gradientFrom: "#FBEAF0",
      gradientTo: "#F4C0D1",
    },
    {
      id: "4",
      price: 1950,
      title: "Modern 1-bed near transit",
      address: "88 Main St S, Georgetown, ON",
      city: "Georgetown",
      beds: 1,
      baths: 1,
      sqft: 650,
      tags: [
        { label: "Verified", color: "green" },
        { label: "Furnished", color: "blue" },
      ],
      agentName: "R. Chen",
      agentInitials: "RC",
      agentColor: "#E1F5EE",
      photos: 10,
      verified: true,
      icon: Layers,
      gradientFrom: "#E1F5EE",
      gradientTo: "#9FE1CB",
    },
  ];

  const handleGetRentEstimate = async () => {
    setLoading(true);
    setAiNotice(null);
    setShowRentEstimate(true);
    
    try {
      const firstListing = listings[0];
      const data = await postAiRoute('rent-estimate', {
        address: firstListing.address,
        city: firstListing.city,
        province: 'ON',
        bedrooms: firstListing.beds,
        bathrooms: firstListing.baths,
        sqft: firstListing.sqft,
        amenities: firstListing.tags.map(t => t.label),
      });
      if (data.success) {
        setRentEstimate(data.analysis);
      } else {
        setAiNotice(data.error || 'Failed to generate rent estimate');
      }
    } catch (error) {
      console.error('Error getting rent estimate:', error);
      setAiNotice('Failed to generate rent estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareListings = async () => {
    setLoading(true);
    setAiNotice(null);
    setShowComparison(true);
    
    try {
      const data = await postAiRoute('compare-listings', {
        listings: listings.slice(0, 3),
      });
      if (data.success) {
        setComparison(data.comparison);
      } else {
        setAiNotice(data.error || 'Failed to compare listings');
      }
    } catch (error) {
      console.error('Error comparing listings:', error);
      setAiNotice('Failed to compare listings');
    } finally {
      setLoading(false);
    }
  };

  const handleExplainLease = async () => {
    setLoading(true);
    setAiNotice(null);
    setShowLeaseGuide(true);
    
    try {
      const data = await postAiRoute('explain-lease', {
        province: 'ON',
      });
      if (data.success) {
        setLeaseGuide(data.leaseGuide);
      } else {
        setAiNotice(data.error || 'Failed to explain lease terms');
      }
    } catch (error) {
      console.error('Error explaining lease:', error);
      setAiNotice('Failed to explain lease terms');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "all", label: "All rentals" },
    { id: "apartments", label: "Apartments" },
    { id: "houses", label: "Houses" },
    { id: "condos", label: "Condos" },
    { id: "rooms", label: "Rooms" },
  ];

  const filters = [
    { id: "all", label: "All prices" },
    { id: "under-1500", label: "Under $1,500" },
    { id: "1500-2500", label: "$1,500 – $2,500" },
    { id: "2500+", label: "$2,500+" },
    { id: "pets", label: "Pets OK" },
    { id: "furnished", label: "Furnished" },
    { id: "parking", label: "Parking" },
  ];

  const tagStyles = {
    green: "bg-[#E1F5EE] text-[#0F6E56]",
    blue: "bg-[#E6F1FB] text-[#185FA5]",
    amber: "bg-[#FAEEDA] text-[#854F0B]",
    gray: "bg-[#F3F4F6] text-[#6B7280]",
  };

  const navigate = useNavigate();

  // Filter listings based on activeFilter
  const filteredListings = listings.filter(listing => {
    if (activeFilter === "all") return true;
    if (activeFilter === "under-1500") return listing.price < 1500;
    if (activeFilter === "1500-2500") return listing.price >= 1500 && listing.price <= 2500;
    if (activeFilter === "2500+") return listing.price > 2500;
    if (activeFilter === "pets") return listing.tags.some(tag => tag.label.toLowerCase().includes("pet"));
    if (activeFilter === "furnished") return listing.tags.some(tag => tag.label.toLowerCase().includes("furnished"));
    if (activeFilter === "parking") return listing.tags.some(tag => tag.label.toLowerCase().includes("parking") || tag.label.toLowerCase().includes("garage"));
    return true;
  });

  // Sort filtered listings based on sortBy
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "price-low-high") return a.price - b.price;
    if (sortBy === "newest") return 0; // In real app, would sort by date
    return 0; // "recommended" uses default order
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-['DM_Sans']">
      {/* Global AI Components - Always available */}
      <GlobalAIAssistant 
        pageContext="Property Listings - Tenant Search"
        userContext="Potential tenant searching for rental properties"
        userId="tenant-guest"
      />
      <AICommandPalette userId="tenant-guest" />

      {/* NAV */}
      <PublicNav />

      {/* HERO */}
      <section className="bg-white px-6 py-16 text-center border-b border-[rgba(0,0,0,0.05)] mt-[74px]">
        <div className="inline-flex items-center gap-1.5 bg-[#E1F5EE] text-[#0F6E56] px-3 py-1.5 rounded-[20px] text-xs font-medium mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
          AI-powered property matching
        </div>
        <h1 className="font-['Playfair_Display'] text-[42px] font-semibold leading-[1.15] tracking-tight mb-3.5 text-[#1A1A1A]">
          Find your next home
          <br />
          with <em className="italic text-[#1D9E75]">confidence</em>
        </h1>
        <p className="text-[15px] text-[#6B7280] max-w-[480px] mx-auto mb-8 leading-relaxed">
          Kaya uses AI to match you with verified listings, connect you with trusted landlords, and simplify every step of renting.
        </p>

        {/* SEARCH BAR */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[14px] flex items-center max-w-[680px] mx-auto mb-3 overflow-hidden">
          <div className="flex-1 px-[18px] py-3.5 border-r border-[rgba(0,0,0,0.05)] cursor-pointer hover:bg-[#F9FAFB] transition">
            <div className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-0.5">Location</div>
            <div className="text-sm text-[#1A1A1A]">Halton Hills, ON</div>
          </div>
          <div className="flex-1 px-[18px] py-3.5 border-r border-[rgba(0,0,0,0.05)] cursor-pointer hover:bg-[#F9FAFB] transition">
            <div className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-0.5">Price range</div>
            <div className="text-sm text-[#1A1A1A]">$1,200 – $2,800</div>
          </div>
          <div className="flex-1 px-[18px] py-3.5 border-r border-[rgba(0,0,0,0.05)] cursor-pointer hover:bg-[#F9FAFB] transition">
            <div className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-0.5">Type</div>
            <div className="text-sm text-[#1A1A1A]">Any type</div>
          </div>
          <button className="m-2 px-5 py-3 bg-[#1D9E75] border-none rounded-[10px] text-white text-sm font-medium hover:bg-[#0F6E56] transition whitespace-nowrap">
            Search
          </button>
        </div>

        <div className="flex justify-center gap-5 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
            2,400+ verified listings
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
            No hidden fees
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
            Secure payments
          </span>
        </div>
      </section>

      {/* TABS */}
      <div className="bg-white px-6 border-b border-[rgba(0,0,0,0.05)] flex gap-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm cursor-pointer border-b-2 transition ${
              activeTab === tab.id
                ? "text-[#1D9E75] border-[#1D9E75] font-medium"
                : "text-[#6B7280] border-transparent hover:text-[#1A1A1A]"
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white px-6 py-3 flex gap-2.5 items-center border-b border-[rgba(0,0,0,0.05)] flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3.5 py-1.5 border rounded-[20px] text-[13px] transition ${
              activeFilter === filter.id
                ? "bg-[#E1F5EE] border-[#5DCAA5] text-[#0F6E56] font-medium"
                : "border-[rgba(0,0,0,0.08)] bg-transparent text-[#1A1A1A] hover:bg-[#F9FAFB]"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <div className="ml-auto text-[13px] text-[#6B7280]">
          Sort:{" "}
          <select className="border-none bg-transparent text-[#6B7280] cursor-pointer outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="price-low-high">Price: Low–High</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* LISTINGS */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-[#6B7280]">
              <strong className="text-[#1A1A1A]">{sortedListings.length} rental{sortedListings.length !== 1 ? 's' : ''}</strong> in Halton Hills & area
              {activeFilter !== "all" && (
                <span className="ml-2 text-[11px] bg-[#E1F5EE] text-[#0F6E56] px-2 py-0.5 rounded-[20px] font-medium">
                  Filtered
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button className="px-2.5 py-1.5 border border-[rgba(0,0,0,0.05)] bg-[#F9FAFB] rounded-[10px] text-[13px] text-[#1A1A1A]">
                List
              </button>
              <button className="px-2.5 py-1.5 border border-[rgba(0,0,0,0.05)] bg-transparent rounded-[10px] text-[13px] text-[#6B7280]">
                Map
              </button>
            </div>
          </div>

          {sortedListings.length === 0 ? (
            <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[14px] p-12 text-center">
              <div className="mb-4"><Search size={40} color="#9CA3AF"/></div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No listings found</h3>
              <p className="text-sm text-[#6B7280] mb-4">Try adjusting your filters to see more results</p>
              <button 
                onClick={() => setActiveFilter("all")}
                className="px-4 py-2 bg-[#1D9E75] text-white border-none rounded-[10px] text-[13px] font-medium hover:bg-[#0F6E56] transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[14px] overflow-hidden flex cursor-pointer hover:border-[rgba(0,0,0,0.12)] transition"
                >
                  {/* IMAGE */}
                  <div className="w-[200px] min-h-[160px] bg-[#F9FAFB] flex-shrink-0 relative overflow-hidden">
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${listing.gradientFrom} 0%, ${listing.gradientTo} 100%)` }}
                    >
                      {(()=>{const LIcon=listing.icon;return<LIcon size={40} color="rgba(0,0,0,0.3)"/>;})()}
                    </div>
                    <div className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-[20px]">
                      {listing.photos} photos
                    </div>
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm cursor-pointer border border-[rgba(0,0,0,0.05)]">
                      {listing.favorited ? "♥" : "♡"}
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xl font-semibold text-[#1A1A1A] mb-0.5">
                        ${listing.price.toLocaleString()} <span className="text-[13px] font-normal text-[#6B7280]">/ month</span>
                      </div>
                      <div className="text-[15px] font-medium mb-1 text-[#1A1A1A]">{listing.title}</div>
                      <div className="text-[13px] text-[#6B7280] mb-2.5">{listing.address}</div>
                      <div className="flex gap-3.5 text-[13px] text-[#6B7280] mb-3">
                        <span className="flex items-center gap-1"><BedDouble size={13}/> {listing.beds} {typeof listing.beds === "number" ? "beds" : ""}</span>
                        <span className="flex items-center gap-1"><Bath size={13}/> {listing.baths} bath</span>
                        <span className="flex items-center gap-1"><Ruler size={13}/> {listing.sqft} sqft</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {listing.tags.map((tag, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-[20px] text-[11px] font-medium ${tagStyles[tag.color]}`}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 pt-3 border-t border-[rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <div
                          className="w-6 h-6 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[10px] font-medium text-[#0F6E56]"
                          style={{ background: listing.agentColor }}
                        >
                          {listing.agentInitials}
                        </div>
                        <span>Listed by {listing.agentName}</span>
                        {listing.verified && (
                          <span className="flex items-center gap-0.5 text-[11px] text-[#1D9E75] font-medium ml-1">
                            <Check className="w-3 h-3" /> ID verified
                          </span>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-[#1D9E75] text-white border-none rounded-[10px] text-[13px] font-medium hover:bg-[#0F6E56] transition">
                        Book a tour
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          {/* AI WIDGET */}
          <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[14px] p-[18px] mb-4">
            <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
              Kaya AI assistant
            </div>
            <div className="text-sm leading-relaxed text-[#1A1A1A] mb-3.5">
              Based on your search, I found 12 listings that match your needs — including 3 with same-day viewings available.
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleGetRentEstimate}
                className="w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-[#F9FAFB] text-left text-[13px] text-[#1A1A1A] flex justify-between items-center hover:border-[#5DCAA5] hover:bg-[#E1F5EE] hover:text-[#0F6E56] transition"
              >
                Get AI rent estimate <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleCompareListings}
                className="w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-[#F9FAFB] text-left text-[13px] text-[#1A1A1A] flex justify-between items-center hover:border-[#5DCAA5] hover:bg-[#E1F5EE] hover:text-[#0F6E56] transition"
              >
                Compare these listings <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleExplainLease}
                className="w-full px-3.5 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-[#F9FAFB] text-left text-[13px] text-[#1A1A1A] flex justify-between items-center hover:border-[#5DCAA5] hover:bg-[#E1F5EE] hover:text-[#0F6E56] transition"
              >
                Explain lease terms <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAP */}
          <div className="bg-[#F9FAFB] border border-[rgba(0,0,0,0.05)] rounded-[14px] h-[180px] flex items-center justify-center flex-col gap-2 mb-4 text-[13px] text-[#6B7280] cursor-pointer hover:border-[rgba(0,0,0,0.12)] transition">
            <Map size={28} color="#9CA3AF"/>
            <div>View listings on map</div>
          </div>

          {/* STATS */}
          <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[14px] p-[18px] mb-4">
            <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
              Area market snapshot
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F9FAFB] rounded-[10px] p-3">
                <div className="text-xl font-medium text-[#1A1A1A]">$1,980</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">Avg. rent / mo</div>
              </div>
              <div className="bg-[#F9FAFB] rounded-[10px] p-3">
                <div className="text-xl font-medium text-[#1A1A1A]">148</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">Active listings</div>
              </div>
              <div className="bg-[#F9FAFB] rounded-[10px] p-3">
                <div className="text-xl font-medium text-[#1A1A1A]">4.2d</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">Avg. days listed</div>
              </div>
              <div className="bg-[#F9FAFB] rounded-[10px] p-3">
                <div className="text-xl font-medium text-[#1A1A1A]">94%</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">Landlord response</div>
              </div>
            </div>
          </div>

          {/* TRUST */}
          <div className="bg-white border border-[rgba(0,0,0,0.05)] rounded-[14px] p-[18px]">
            <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
              Why renters trust Kaya
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#E1F5EE] flex items-center justify-center text-sm flex-shrink-0">✓</div>
                <div>
                  <h4 className="text-[13px] font-medium text-[#1A1A1A]">All listings verified</h4>
                  <p className="text-xs text-[#6B7280] leading-snug mt-0.5">
                    Every landlord completes ID and property verification before listing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#E1F5EE] flex items-center justify-center flex-shrink-0"><Lock size={14} color="#0A7A52"/></div>
                <div>
                  <h4 className="text-[13px] font-medium text-[#1A1A1A]">Secure payments</h4>
                  <p className="text-xs text-[#6B7280] leading-snug mt-0.5">
                    Pay deposit and rent through Kaya's encrypted payment system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#E1F5EE] flex items-center justify-center text-sm flex-shrink-0">⚠</div>
                <div>
                  <h4 className="text-[13px] font-medium text-[#1A1A1A]">Scam protection</h4>
                  <p className="text-xs text-[#6B7280] leading-snug mt-0.5">
                    AI flags suspicious listings and risky activity automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RENT ESTIMATE MODAL */}
      {showRentEstimate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(0,0,0,0.05)] flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1D9E75]" />
                <h2 className="text-xl font-semibold text-[#1A1A1A]">AI Rent Estimate</h2>
              </div>
              <button
                onClick={() => setShowRentEstimate(false)}
                className="p-2 hover:bg-[#F9FAFB] rounded-[10px] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1D9E75] animate-spin mb-3" />
                  <p className="text-sm text-[#6B7280]">Analyzing market data with Claude AI...</p>
                </div>
              ) : aiNotice ? (
                <p className="text-sm text-[#6B7280]">{aiNotice}</p>
              ) : rentEstimate ? (
                <div className="space-y-6">
                  <div className="bg-[#E1F5EE] rounded-[14px] p-6">
                    <div className="text-sm text-[#0F6E56] mb-2">Estimated Monthly Rent</div>
                    <div className="text-3xl font-bold text-[#1A1A1A] mb-1">
                      ${rentEstimate.estimatedRent.low.toLocaleString()} - ${rentEstimate.estimatedRent.high.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      Average: ${rentEstimate.averageRent.toLocaleString()} · Confidence: {rentEstimate.confidence}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A] mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#1D9E75]" />
                      Key Factors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {rentEstimate.factors.map((factor, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F9FAFB] rounded-[10px] text-[13px] text-[#6B7280]">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">Market Insights</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{rentEstimate.marketInsights}</p>
                  </div>

                  <div className="bg-[#E6F1FB] rounded-[14px] p-4">
                    <h3 className="text-sm font-medium text-[#185FA5] mb-2">Recommendations</h3>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{rentEstimate.recommendations}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showComparison && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(0,0,0,0.05)] flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1D9E75]" />
                <h2 className="text-xl font-semibold text-[#1A1A1A]">AI Listing Comparison</h2>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="p-2 hover:bg-[#F9FAFB] rounded-[10px] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1D9E75] animate-spin mb-3" />
                  <p className="text-sm text-[#6B7280]">Comparing listings with Claude AI...</p>
                </div>
              ) : aiNotice ? (
                <p className="text-sm text-[#6B7280]">{aiNotice}</p>
              ) : comparison ? (
                <div className="space-y-6">
                  <div className="bg-[#E1F5EE] rounded-[14px] p-4">
                    <h3 className="text-sm font-medium text-[#0F6E56] mb-2">Summary</h3>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{comparison.summary}</p>
                  </div>

                  {comparison.comparisons.map((comp, i) => (
                    <div key={i} className="border border-[rgba(0,0,0,0.05)] rounded-[14px] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-[#1A1A1A]">Listing {comp.listingIndex + 1}</h4>
                        <div className="bg-[#E1F5EE] text-[#0F6E56] px-3 py-1 rounded-[20px] text-xs font-medium">
                          Value Score: {comp.valueScore}/10
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-xs font-medium text-[#1D9E75] mb-2">✓ Pros</h5>
                          <ul className="space-y-1">
                            {comp.pros.map((pro, j) => (
                              <li key={j} className="text-sm text-[#6B7280] leading-snug">• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-[#854F0B] mb-2">✗ Cons</h5>
                          <ul className="space-y-1">
                            {comp.cons.map((con, j) => (
                              <li key={j} className="text-sm text-[#6B7280] leading-snug">• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}

                  {comparison.redFlags.length > 0 && (
                    <div className="bg-[#FAEEDA] rounded-[14px] p-4">
                      <h3 className="text-sm font-medium text-[#854F0B] mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Red Flags
                      </h3>
                      <ul className="space-y-1">
                        {comparison.redFlags.map((flag, i) => (
                          <li key={i} className="text-sm text-[#1A1A1A] leading-snug">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* LEASE GUIDE MODAL */}
      {showLeaseGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgba(0,0,0,0.05)] flex items-center justify-between sticky top-0 bg-white rounded-t-[20px]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1D9E75]" />
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Lease Terms Explained</h2>
              </div>
              <button
                onClick={() => setShowLeaseGuide(false)}
                className="p-2 hover:bg-[#F9FAFB] rounded-[10px] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1D9E75] animate-spin mb-3" />
                  <p className="text-sm text-[#6B7280]">Getting lease insights from Claude AI...</p>
                </div>
              ) : aiNotice ? (
                <p className="text-sm text-[#6B7280]">{aiNotice}</p>
              ) : leaseGuide ? (
                <div className="space-y-6">
                  <div className="bg-[#E1F5EE] rounded-[14px] p-4">
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{leaseGuide.explanation}</p>
                  </div>

                  {leaseGuide.keyTerms.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">Key Terms</h3>
                      <div className="space-y-2">
                        {leaseGuide.keyTerms.map((term, i) => (
                          <div key={i} className="bg-[#F9FAFB] rounded-[10px] p-3">
                            <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{term.term}</h4>
                            <p className="text-sm text-[#6B7280]">{term.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {leaseGuide.tenantRights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#1D9E75] mb-2">Your Rights as a Tenant</h3>
                      <ul className="space-y-1.5">
                        {leaseGuide.tenantRights.map((right, i) => (
                          <li key={i} className="text-sm text-[#6B7280] leading-snug flex items-start gap-2">
                            <span className="text-[#1D9E75]">✓</span>
                            <span>{right}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {leaseGuide.redFlags.length > 0 && (
                    <div className="bg-[#FAEEDA] rounded-[14px] p-4">
                      <h3 className="text-sm font-medium text-[#854F0B] mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Red Flags to Watch For
                      </h3>
                      <ul className="space-y-1.5">
                        {leaseGuide.redFlags.map((flag, i) => (
                          <li key={i} className="text-sm text-[#1A1A1A] leading-snug">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {leaseGuide.tips.length > 0 && (
                    <div className="bg-[#E6F1FB] rounded-[14px] p-4">
                      <h3 className="text-sm font-medium text-[#185FA5] mb-2">Tips for First-Time Renters</h3>
                      <ul className="space-y-1.5">
                        {leaseGuide.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-[#1A1A1A] leading-snug flex items-start gap-1.5"><Lightbulb size={13} className="mt-0.5 flex-shrink-0" color="#B45309"/> {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <PublicFooter />
    </div>
  );
}