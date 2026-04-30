import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { PropertyAPI, UnitAPI } from "../services/backend.service";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Home,
  Upload,
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Tag,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface PropertyFormData {
  // Step 1: Address
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Step 2: Property Type
  propertyType: string;
  
  // Step 3: Number of Units
  numberOfUnits: string;
  
  // Step 4: Unit Details
  units: {
    unitNumber: string;
    bedrooms: string;
    bathrooms: string;
    squareFeet: string;
    rent: string;
    availableDate: string;
    furnished: boolean;
    parking: boolean;
    petsAllowed: boolean;
  }[];
  
  // Step 5: Photos (mock)
  photosUploaded: boolean;
  
  // Step 6: Amenities
  amenities: string[];
  
  // Step 7: Lease Terms
  securityDeposit: string;
  utilitiesIncluded: string[];
  leaseLength: string;
  minimumIncome: string;
  
  // Step 8: Tenant Requirements
  guarantorAllowed: boolean;
  studentsAllowed: boolean;
  smokingAllowed: boolean;
}

const initialFormData: PropertyFormData = {
  street: "",
  city: "",
  province: "Ontario",
  postalCode: "",
  country: "Canada",
  propertyType: "",
  numberOfUnits: "",
  units: [],
  photosUploaded: false,
  amenities: [],
  securityDeposit: "",
  utilitiesIncluded: [],
  leaseLength: "12",
  minimumIncome: "",
  guarantorAllowed: true,
  studentsAllowed: true,
  smokingAllowed: false,
};

export function PropertyOnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);

  const totalSteps = 8;

  const steps = [
    { number: 1, title: "Property Address", icon: MapPin },
    { number: 2, title: "Property Type", icon: Building2 },
    { number: 3, title: "Number of Units", icon: Home },
    { number: 4, title: "Unit Details", icon: Bed },
    { number: 5, title: "Photos", icon: Upload },
    { number: 6, title: "Amenities", icon: Check },
    { number: 7, title: "Lease Terms", icon: DollarSign },
    { number: 8, title: "Requirements", icon: Shield },
  ];

  const propertyTypes = [
    { value: "apartment", label: "Apartment Building", icon: Building2 },
    { value: "single-family", label: "Single-Family Home", icon: Home },
    { value: "duplex", label: "Duplex / Triplex", icon: Home },
    { value: "condo", label: "Condo", icon: Building2 },
    { value: "student", label: "Student Housing", icon: Users },
    { value: "commercial", label: "Commercial Property", icon: Building2 },
  ];

  const amenitiesList = [
    "Laundry", "Parking", "Air Conditioning", "Heating", "Balcony", 
    "Gym", "Pool", "Elevator", "Security", "Storage", "Dishwasher"
  ];

  const utilitiesList = ["Water", "Heat", "Electricity", "Internet", "Gas"];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const typeMap: Record<string, string> = {
        "Single Family Home": "house",
        "Condominium": "apartment",
        "Apartment Building": "apartment",
        "Townhouse": "house",
        "Multi-Unit Residential": "apartment",
        "Commercial": "retail",
        "Mixed-Use": "mixed_use",
      };
      const property = await PropertyAPI.create({
        name: formData.street,
        address: formData.street,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        country: formData.country,
        propertyType: (typeMap[formData.propertyType] ?? "apartment") as any,
        totalUnits: formData.units.length,
        amenities: formData.amenities,
      });
      await Promise.all(
        formData.units.map(u =>
          UnitAPI.create(property.id, {
            unitNumber: u.unitNumber,
            bedrooms: parseInt(u.bedrooms) || 0,
            bathrooms: parseFloat(u.bathrooms) || 1,
            squareFootage: parseInt(u.squareFeet) || 0,
            rentPrice: parseInt(u.rent) || 0,
            deposit: Math.round((parseInt(u.rent) || 0)),
            status: "available",
            availabilityDate: u.availableDate ? new Date(u.availableDate) : undefined,
            features: [
              ...(u.furnished ? ["Furnished"] : []),
              ...(u.parking ? ["Parking"] : []),
              ...(u.petsAllowed ? ["Pets Allowed"] : []),
            ],
            utilitiesIncluded: formData.utilitiesIncluded,
          })
        )
      );
      toast.success("Property added successfully!");
      navigate("/app/properties");
    } catch {
      toast.error("Failed to save property. Please try again.");
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.street && formData.city && formData.postalCode;
      case 2:
        return formData.propertyType !== "";
      case 3:
        return formData.numberOfUnits !== "";
      case 4:
        return formData.units.length > 0;
      case 5:
        return true; // Photos optional
      case 6:
        return true; // Amenities optional
      case 7:
        return formData.securityDeposit && formData.minimumIncome;
      case 8:
        return true;
      default:
        return false;
    }
  };

  const addUnit = () => {
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          unitNumber: "",
          bedrooms: "",
          bathrooms: "",
          squareFeet: "",
          rent: "",
          availableDate: "",
          furnished: false,
          parking: false,
          petsAllowed: false,
        },
      ],
    });
  };

  const updateUnit = (index: number, field: string, value: any) => {
    const updatedUnits = [...formData.units];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setFormData({ ...formData, units: updatedUnits });
  };

  const toggleAmenity = (amenity: string) => {
    const amenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities });
  };

  const toggleUtility = (utility: string) => {
    const utilities = formData.utilitiesIncluded.includes(utility)
      ? formData.utilitiesIncluded.filter(u => u !== utility)
      : [...formData.utilitiesIncluded, utility];
    setFormData({ ...formData, utilitiesIncluded: utilities });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black/[0.08] bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-[#0A0A0A] tracking-tight">
                Add New Property
              </h1>
              <p className="text-[14px] text-[#9CA3AF] mt-1">
                Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
              </p>
            </div>

            <button
              onClick={() => navigate("/app/properties")}
              className="px-4 py-2.5 border border-black/[0.08] text-[#0A0A0A] text-[14px] font-medium rounded-lg hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0A0A0A] to-[#2A2A2A] transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Address */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <MapPin className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Property Address</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Enter the complete address. We'll automatically detect the jurisdiction for legal compliance.
                </p>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="123 King Street West"
                  className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px] text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Toronto"
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px] text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    Province *
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"
                  >
                    <option value="Ontario">Ontario</option>
                    <option value="Quebec">Quebec</option>
                    <option value="British Columbia">British Columbia</option>
                    <option value="Alberta">Alberta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="M5V 3A8"
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px] text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    disabled
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px] text-[#0A0A0A] bg-[#F5F5F5]"
                  />
                </div>
              </div>

              {formData.province && formData.city && (
                <div className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[14px] text-[#0A0A0A] mb-1">Jurisdiction Detected</p>
                    <p className="text-[13px] text-[#6B7280]">
                      Ontario lease template will be loaded with proper LTB compliance rules.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Property Type */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Building2 className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Property Type</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Select the type of property. This helps us customize lease templates and analytics.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, propertyType: type.value })}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      formData.propertyType === type.value
                        ? 'border-[#0A0A0A] bg-[#0A0A0A]/5'
                        : 'border-black/[0.08] hover:border-black/[0.2]'
                    }`}
                  >
                    <type.icon className={`size-8 mb-3 ${
                      formData.propertyType === type.value ? 'text-[#0A0A0A]' : 'text-[#9CA3AF]'
                    }`} />
                    <h3 className="font-semibold text-[16px] text-[#0A0A0A] mb-1">{type.label}</h3>
                    {formData.propertyType === type.value && (
                      <CheckCircle2 className="size-5 text-[#22C55E] mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Number of Units */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Home className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Number of Units</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  How many rental units does this property have?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['1', '2-5', '6-20', '20+'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setFormData({ ...formData, numberOfUnits: range })}
                    className={`p-8 border-2 rounded-xl transition-all ${
                      formData.numberOfUnits === range
                        ? 'border-[#0A0A0A] bg-[#0A0A0A]/5'
                        : 'border-black/[0.08] hover:border-black/[0.2]'
                    }`}
                  >
                    <h3 className="font-semibold text-[36px] text-[#0A0A0A] mb-2">{range}</h3>
                    <p className="text-[14px] text-[#9CA3AF]">
                      {range === '1' ? 'Single unit' : range === '2-5' ? 'Small building' : range === '6-20' ? 'Medium building' : 'Large portfolio'}
                    </p>
                    {formData.numberOfUnits === range && (
                      <CheckCircle2 className="size-5 text-[#22C55E] mt-3" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Unit Details */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Bed className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Unit Details</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  {formData.propertyType === "commercial"
                    ? "Add commercial unit details — sqft, lease type, base rent, and CAM estimate."
                    : "Add details for each unit in your property."}
                </p>
                {formData.propertyType === "commercial" && (
                  <div className="mt-4 px-4 py-3 bg-[#EBF2FB] border border-[#BFDBFE] rounded-lg flex items-center gap-2">
                    <Building2 className="size-4 text-[#1E5FA8]" />
                    <span className="text-[13px] text-[#1E5FA8] font-medium">Commercial mode — HST will apply to all rents. Use NNN, Gross, or Modified Gross lease types.</span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {formData.units.map((unit, idx) => (
                  <div key={idx} className="p-6 border border-black/[0.08] rounded-xl bg-[#F9FAFB]">
                    <h3 className="font-semibold text-[18px] text-[#0A0A0A] mb-4">
                      {formData.propertyType === "commercial" ? `Suite / Unit #${idx + 1}` : `Unit #${idx + 1}`}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">
                          {formData.propertyType === "commercial" ? "Suite / Unit Name" : "Unit Number"}
                        </label>
                        <input
                          type="text"
                          value={unit.unitNumber}
                          onChange={(e) => updateUnit(idx, 'unitNumber', e.target.value)}
                          placeholder={formData.propertyType === "commercial" ? "Suite 101" : "4A"}
                          className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">
                          {formData.propertyType === "commercial" ? "Monthly Base Rent ($)" : "Monthly Rent"}
                        </label>
                        <input
                          type="number"
                          value={unit.rent}
                          onChange={(e) => updateUnit(idx, 'rent', e.target.value)}
                          placeholder={formData.propertyType === "commercial" ? "5800" : "2300"}
                          className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                        />
                      </div>
                    </div>

                    {formData.propertyType === "commercial" ? (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">Total Sq Ft *</label>
                          <input
                            type="number"
                            value={unit.squareFeet}
                            onChange={(e) => updateUnit(idx, 'squareFeet', e.target.value)}
                            placeholder="1400"
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">Lease Type</label>
                          <select
                            value={unit.bedrooms}
                            onChange={(e) => updateUnit(idx, 'bedrooms', e.target.value)}
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          >
                            <option value="">Select</option>
                            <option value="NNN">NNN (Triple Net)</option>
                            <option value="Gross">Gross Lease</option>
                            <option value="Modified Gross">Modified Gross</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">CAM Estimate ($/mo)</label>
                          <input
                            type="number"
                            value={unit.bathrooms}
                            onChange={(e) => updateUnit(idx, 'bathrooms', e.target.value)}
                            placeholder="480"
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">Bedrooms</label>
                          <select
                            value={unit.bedrooms}
                            onChange={(e) => updateUnit(idx, 'bedrooms', e.target.value)}
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          >
                            <option value="">Select</option>
                            <option value="0">Studio</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4+</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">Bathrooms</label>
                          <select
                            value={unit.bathrooms}
                            onChange={(e) => updateUnit(idx, 'bathrooms', e.target.value)}
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          >
                            <option value="">Select</option>
                            <option value="1">1</option>
                            <option value="1.5">1.5</option>
                            <option value="2">2</option>
                            <option value="2.5">2.5</option>
                            <option value="3">3+</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#0A0A0A] mb-2">Sq Ft</label>
                          <input
                            type="number"
                            value={unit.squareFeet}
                            onChange={(e) => updateUnit(idx, 'squareFeet', e.target.value)}
                            placeholder="850"
                            className="w-full px-4 py-2.5 border border-black/[0.08] rounded-lg text-[14px]"
                          />
                        </div>
                      </div>
                    )}

                    {formData.propertyType !== "commercial" && (
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unit.parking}
                            onChange={(e) => updateUnit(idx, 'parking', e.target.checked)}
                            className="size-5 rounded border-black/[0.08]"
                          />
                          <span className="text-[14px] text-[#0A0A0A]">Parking</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unit.furnished}
                            onChange={(e) => updateUnit(idx, 'furnished', e.target.checked)}
                            className="size-5 rounded border-black/[0.08]"
                          />
                          <span className="text-[14px] text-[#0A0A0A]">Furnished</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unit.petsAllowed}
                            onChange={(e) => updateUnit(idx, 'petsAllowed', e.target.checked)}
                            className="size-5 rounded border-black/[0.08]"
                          />
                          <span className="text-[14px] text-[#0A0A0A]">Pets Allowed</span>
                        </label>
                      </div>
                    )}

                    {formData.propertyType === "commercial" && (
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unit.parking}
                            onChange={(e) => updateUnit(idx, 'parking', e.target.checked)}
                            className="size-5 rounded border-black/[0.08]"
                          />
                          <span className="text-[14px] text-[#0A0A0A]">Dedicated Parking</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unit.furnished}
                            onChange={(e) => updateUnit(idx, 'furnished', e.target.checked)}
                            className="size-5 rounded border-black/[0.08]"
                          />
                          <span className="text-[14px] text-[#0A0A0A]">Tenant Improvement Allowance (TIA)</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addUnit}
                  className="w-full px-6 py-4 border-2 border-dashed border-black/[0.2] rounded-xl text-[#0A0A0A] font-medium hover:border-black/[0.4] transition-colors"
                >
                  + Add {formData.propertyType === "commercial" ? "Commercial Suite" : "Unit"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Upload className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Upload Photos</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Add photos of your property. Quality photos attract better tenants.
                </p>
              </div>

              <div className="border-2 border-dashed border-black/[0.2] rounded-2xl p-12 text-center hover:border-black/[0.4] transition-colors cursor-pointer">
                <Upload className="size-12 text-[#9CA3AF] mx-auto mb-4" />
                <h3 className="font-semibold text-[18px] text-[#0A0A0A] mb-2">
                  Drag & drop photos here
                </h3>
                <p className="text-[14px] text-[#9CA3AF] mb-4">
                  or click to browse from your computer
                </p>
                <button
                  onClick={() => setFormData({ ...formData, photosUploaded: true })}
                  className="px-6 py-3 bg-[#0A0A0A] text-white text-[14px] font-medium rounded-lg hover:bg-[#1C1C1C] transition-colors"
                >
                  Select Photos
                </button>
              </div>

              {formData.photosUploaded && (
                <div className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-[#22C55E]" />
                  <p className="text-[14px] text-[#0A0A0A]">5 photos uploaded successfully</p>
                </div>
              )}

              <div className="p-4 bg-[#F9FAFB] rounded-lg">
                <p className="text-[13px] text-[#6B7280]">
                  <strong className="text-[#0A0A0A]">Tip:</strong> Properties with photos get 3× more applications. Include unit photos, building exterior, and amenities.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 6: Amenities */}
          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Check className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Amenities & Features</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Select all amenities available at this property.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      formData.amenities.includes(amenity)
                        ? 'border-[#0A0A0A] bg-[#0A0A0A]/5'
                        : 'border-black/[0.08] hover:border-black/[0.2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[14px] text-[#0A0A0A]">{amenity}</span>
                      {formData.amenities.includes(amenity) && (
                        <CheckCircle2 className="size-5 text-[#22C55E]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 7: Lease Terms */}
          {currentStep === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <DollarSign className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Rent & Lease Terms</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Set your rental terms and requirements.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    Security Deposit *
                  </label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    placeholder="2300"
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px]"
                  />
                  <p className="text-[12px] text-[#9CA3AF] mt-1">Ontario max: Last month's rent</p>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                    Minimum Income Required *
                  </label>
                  <input
                    type="number"
                    value={formData.minimumIncome}
                    onChange={(e) => setFormData({ ...formData, minimumIncome: e.target.value })}
                    placeholder="6900"
                    className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px]"
                  />
                  <p className="text-[12px] text-[#9CA3AF] mt-1">Recommended: 3× monthly rent</p>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
                  Lease Length (months)
                </label>
                <select
                  value={formData.leaseLength}
                  onChange={(e) => setFormData({ ...formData, leaseLength: e.target.value })}
                  className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-[14px]"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="month-to-month">Month-to-month</option>
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0A0A0A] mb-3">
                  Utilities Included
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {utilitiesList.map((utility) => (
                    <label key={utility} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.utilitiesIncluded.includes(utility)}
                        onChange={() => toggleUtility(utility)}
                        className="size-5 rounded border-black/[0.08]"
                      />
                      <span className="text-[14px] text-[#0A0A0A]">{utility}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 8: Requirements */}
          {currentStep === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#2A2A2A] flex items-center justify-center mb-4">
                  <Shield className="size-8 text-white" />
                </div>
                <h2 className="text-[32px] font-semibold text-[#0A0A0A] mb-2">Tenant Requirements</h2>
                <p className="text-[14px] text-[#9CA3AF]">
                  Set optional filters to help screen applicants.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-6 border border-black/[0.08] rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[16px] text-[#0A0A0A] mb-1">
                        Allow Guarantors
                      </h3>
                      <p className="text-[13px] text-[#9CA3AF]">
                        Accept applications with co-signers or guarantors (recommended for students)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={formData.guarantorAllowed}
                        onChange={(e) => setFormData({ ...formData, guarantorAllowed: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer peer-checked:bg-[#0A0A0A] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border border-black/[0.08] rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[16px] text-[#0A0A0A] mb-1">
                        Allow Students
                      </h3>
                      <p className="text-[13px] text-[#9CA3AF]">
                        Accept applications from students with valid enrollment
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={formData.studentsAllowed}
                        onChange={(e) => setFormData({ ...formData, studentsAllowed: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer peer-checked:bg-[#0A0A0A] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border border-black/[0.08] rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[16px] text-[#0A0A0A] mb-1">
                        Allow Smoking
                      </h3>
                      <p className="text-[13px] text-[#9CA3AF]">
                        Permit smoking inside the unit
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={formData.smokingAllowed}
                        onChange={(e) => setFormData({ ...formData, smokingAllowed: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer peer-checked:bg-[#0A0A0A] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-[#F9FAFB] to-white border border-black/[0.04] rounded-xl">
                <div className="flex items-start gap-4">
                  <Zap className="size-6 text-[#6366F1] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-[16px] text-[#0A0A0A] mb-2">Ready to Publish?</h3>
                    <p className="text-[14px] text-[#6B7280] mb-4 leading-relaxed">
                      Once published, your property will be visible to tenants and the AI screening system will automatically review applications.
                    </p>
                    <ul className="space-y-2 text-[13px] text-[#6B7280]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[#22C55E]" />
                        Property dashboard created
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[#22C55E]" />
                        Application inbox activated
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[#22C55E]" />
                        Payment ledger initialized
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-black/[0.08]">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 border border-black/[0.08] text-[#0A0A0A] text-[14px] font-medium rounded-lg flex items-center gap-2 transition-colors ${
              currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F5F5F5]'
            }`}
          >
            <ChevronLeft className="size-5" />
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-3 bg-[#0A0A0A] text-white text-[14px] font-medium rounded-lg flex items-center gap-2 transition-colors ${
                !canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1C1C1C]'
              }`}
            >
              Continue
              <ChevronRight className="size-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-[#22C55E] text-white text-[14px] font-medium rounded-lg flex items-center gap-2 hover:bg-[#16A34A] transition-colors"
            >
              <CheckCircle2 className="size-5" />
              Publish Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
