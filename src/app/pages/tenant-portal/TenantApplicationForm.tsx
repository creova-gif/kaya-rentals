import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { ApplicationAPI } from "../../services/backend.service";
import {
  User,
  Briefcase,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  ChevronLeft,
  Shield,
  Sparkles,
} from "lucide-react";

interface ApplicationFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Current Address
  currentAddress: string;
  city: string;
  province: string;
  postalCode: string;
  moveInDate: string;
  
  // Employment
  employmentStatus: string;
  employer: string;
  jobTitle: string;
  employmentDuration: string;
  monthlyIncome: string;
  
  // Rental History
  previousLandlord: string;
  previousLandlordPhone: string;
  previousAddress: string;
  previousRent: string;
  reasonForLeaving: string;
  
  // References
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  
  // Additional
  pets: string;
  smoker: string;
  numberOfOccupants: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface UploadedDocuments {
  governmentId: File | null;
  proofOfIncome: File | null;
  creditReport: File | null;
  employmentLetter: File | null;
  references: File | null;
}

export function TenantApplicationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const property = location.state?.property;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    currentAddress: "",
    city: "",
    province: "ON",
    postalCode: "",
    moveInDate: "",
    employmentStatus: "full-time",
    employer: "",
    jobTitle: "",
    employmentDuration: "",
    monthlyIncome: "",
    previousLandlord: "",
    previousLandlordPhone: "",
    previousAddress: "",
    previousRent: "",
    reasonForLeaving: "",
    reference1Name: "",
    reference1Phone: "",
    reference1Relationship: "",
    reference2Name: "",
    reference2Phone: "",
    reference2Relationship: "",
    pets: "no",
    smoker: "no",
    numberOfOccupants: "1",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const [documents, setDocuments] = useState<UploadedDocuments>({
    governmentId: null,
    proofOfIncome: null,
    creditReport: null,
    employmentLetter: null,
    references: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  const totalSteps = 5;

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: keyof UploadedDocuments, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitProgress(0);

    const interval = setInterval(() => {
      setSubmitProgress(prev => Math.min(prev + 8, 85));
    }, 200);

    try {
      await ApplicationAPI.create({
        propertyId: property.id,
        unitId: property.unitId,
        monthlyIncome: parseFloat(formData.monthlyIncome) || 0,
        employmentStatus: formData.employmentStatus,
        employer: formData.employer,
        jobTitle: formData.jobTitle,
        yearsEmployed: parseFloat(formData.employmentDuration?.split("-")[0] ?? "0") || 0,
        previousAddress: formData.previousAddress,
        previousLandlord: formData.previousLandlord,
        previousLandlordPhone: formData.previousLandlordPhone,
        reasonForLeaving: formData.reasonForLeaving,
        pets: formData.pets !== "no",
        smoker: formData.smoker === "yes",
        documents: {
          governmentId: !!documents.governmentId,
          payStub: !!documents.proofOfIncome,
          creditReport: !!documents.creditReport,
          employmentLetter: !!documents.employmentLetter,
          references: !!documents.references,
        },
      } as any);
      clearInterval(interval);
      setSubmitProgress(100);
      setTimeout(() => navigate("/tenant/applications"), 1500);
    } catch {
      clearInterval(interval);
      setSubmitting(false);
      setSubmitProgress(0);
      toast.error("Failed to submit application. Please try again.");
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.dateOfBirth
        );
      case 2:
        return !!(
          formData.employmentStatus &&
          formData.employer &&
          formData.jobTitle &&
          formData.monthlyIncome
        );
      case 3:
        return !!(formData.previousLandlord && formData.previousAddress);
      case 4:
        return !!(documents.governmentId && documents.proofOfIncome);
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Property Selected</h2>
          <p className="text-slate-600 mb-6">Please select a property to apply for</p>
          <button
            onClick={() => navigate("/listings")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <div className="size-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="size-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Your Application</h2>
            <p className="text-slate-600">AI is analyzing your application...</p>
          </div>

          <div className="mb-6">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${submitProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{submitProgress}% Complete</p>
          </div>

          <div className="space-y-2 text-left text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-5 ${submitProgress >= 30 ? "text-green-600" : "text-slate-300"}`} />
              <span>Validating documents</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-5 ${submitProgress >= 60 ? "text-green-600" : "text-slate-300"}`} />
              <span>Running credit check</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-5 ${submitProgress >= 90 ? "text-green-600" : "text-slate-300"}`} />
              <span>Calculating risk score</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`size-5 ${submitProgress >= 100 ? "text-green-600" : "text-slate-300"}`} />
              <span>Notifying landlord</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ChevronLeft className="size-4" />
            Back to property
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Rental Application</h1>
          <p className="text-slate-600">Applying for: {property.title}</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`size-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step === currentStep
                      ? "bg-indigo-600 text-white"
                      : step < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="size-6" /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step < currentStep ? "bg-green-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={currentStep === 1 ? "text-indigo-600 font-medium" : "text-slate-500"}>
              Personal
            </span>
            <span className={currentStep === 2 ? "text-indigo-600 font-medium" : "text-slate-500"}>
              Employment
            </span>
            <span className={currentStep === 3 ? "text-indigo-600 font-medium" : "text-slate-500"}>
              Rental History
            </span>
            <span className={currentStep === 4 ? "text-indigo-600 font-medium" : "text-slate-500"}>
              Documents
            </span>
            <span className={currentStep === 5 ? "text-indigo-600 font-medium" : "text-slate-500"}>
              Review
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <User className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-600">Tell us about yourself</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="(416) 555-0123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Desired Move-in Date *
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => handleInputChange("moveInDate", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 size-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.currentAddress}
                    onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Toronto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Province *
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ON">Ontario</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="QC">Quebec</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="M5H 2N2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Occupants *
                  </label>
                  <select
                    value={formData.numberOfOccupants}
                    onChange={(e) => handleInputChange("numberOfOccupants", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4+ People</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pets *</label>
                  <select
                    value={formData.pets}
                    onChange={(e) => handleInputChange("pets", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="no">No Pets</option>
                    <option value="cat">Cat</option>
                    <option value="dog">Dog</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Smoker *</label>
                  <select
                    value={formData.smoker}
                    onChange={(e) => handleInputChange("smoker", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="no">Non-Smoker</option>
                    <option value="yes">Smoker</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <Briefcase className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Employment Information</h2>
                  <p className="text-sm text-slate-600">Your current employment details</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Employment Status *
                </label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => handleInputChange("employmentStatus", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="contract">Contract</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.employer}
                    onChange={(e) => handleInputChange("employer", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employment Duration *
                  </label>
                  <select
                    value={formData.employmentDuration}
                    onChange={(e) => handleInputChange("employmentDuration", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select duration</option>
                    <option value="0-6">0-6 months</option>
                    <option value="6-12">6-12 months</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Income (before tax) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>

              {formData.monthlyIncome && property && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Income-to-Rent Ratio</h3>
                  </div>
                  <p className="text-sm text-indigo-700 mb-2">
                    Your income is{" "}
                    <strong>
                      {(parseFloat(formData.monthlyIncome) / property.rent).toFixed(1)}x
                    </strong>{" "}
                    the monthly rent
                  </p>
                  {parseFloat(formData.monthlyIncome) / property.rent >= 3 ? (
                    <p className="text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="size-4" />
                      Excellent! This meets most landlord requirements (3x or higher)
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      Landlords typically prefer income at 3x rent or higher
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Rental History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <Building2 className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Rental History</h2>
                  <p className="text-sm text-slate-600">Information about your previous rental</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Previous Address *
                </label>
                <input
                  type="text"
                  value={formData.previousAddress}
                  onChange={(e) => handleInputChange("previousAddress", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="456 Previous Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Previous Landlord Name *
                  </label>
                  <input
                    type="text"
                    value={formData.previousLandlord}
                    onChange={(e) => handleInputChange("previousLandlord", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Landlord Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Landlord Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.previousLandlordPhone}
                    onChange={(e) => handleInputChange("previousLandlordPhone", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="(416) 555-0123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Previous Monthly Rent
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.previousRent}
                      onChange={(e) => handleInputChange("previousRent", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="2000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Leaving
                  </label>
                  <select
                    value={formData.reasonForLeaving}
                    onChange={(e) => handleInputChange("reasonForLeaving", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select reason</option>
                    <option value="relocation">Relocation</option>
                    <option value="bigger-space">Need bigger space</option>
                    <option value="closer-work">Closer to work</option>
                    <option value="purchase">Purchased home</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="font-semibold text-slate-900 mb-4">References</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reference 1 Name
                      </label>
                      <input
                        type="text"
                        value={formData.reference1Name}
                        onChange={(e) => handleInputChange("reference1Name", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.reference1Phone}
                        onChange={(e) => handleInputChange("reference1Phone", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="(416) 555-0123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.reference1Relationship}
                        onChange={(e) =>
                          handleInputChange("reference1Relationship", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        <option value="employer">Employer</option>
                        <option value="colleague">Colleague</option>
                        <option value="friend">Friend</option>
                        <option value="family">Family</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reference 2 Name
                      </label>
                      <input
                        type="text"
                        value={formData.reference2Name}
                        onChange={(e) => handleInputChange("reference2Name", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Bob Johnson"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.reference2Phone}
                        onChange={(e) => handleInputChange("reference2Phone", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="(416) 555-0123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.reference2Relationship}
                        onChange={(e) =>
                          handleInputChange("reference2Relationship", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        <option value="employer">Employer</option>
                        <option value="colleague">Colleague</option>
                        <option value="friend">Friend</option>
                        <option value="family">Family</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <FileText className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Upload Documents</h2>
                  <p className="text-sm text-slate-600">
                    Required documents for application verification
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries({
                  governmentId: "Government ID (Driver's License or Passport)",
                  proofOfIncome: "Proof of Income (Recent Pay Stubs)",
                  creditReport: "Credit Report (Optional)",
                  employmentLetter: "Employment Letter (Optional)",
                  references: "Reference Letters (Optional)",
                }).map(([key, label]) => {
                  const file = documents[key as keyof UploadedDocuments];
                  const isRequired = key === "governmentId" || key === "proofOfIncome";

                  return (
                    <div key={key} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">
                          {label} {isRequired && "*"}
                        </label>
                        {file && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="size-4" />
                            Uploaded
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        onChange={(e) =>
                          handleFileUpload(
                            key as keyof UploadedDocuments,
                            e.target.files?.[0] || null
                          )
                        }
                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {file && (
                        <p className="text-xs text-slate-500 mt-1">File: {file.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Privacy Notice:</strong> All documents are encrypted and stored securely.
                  Your information is only shared with the landlord for this application.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <CheckCircle2 className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Review & Submit</h2>
                  <p className="text-sm text-slate-600">
                    Please review your information before submitting
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Property Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Property</p>
                      <p className="font-medium text-slate-900">{property.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Monthly Rent</p>
                      <p className="font-medium text-slate-900">
                        ${property.rent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Name</p>
                      <p className="font-medium text-slate-900">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Move-in Date</p>
                      <p className="font-medium text-slate-900">{formData.moveInDate}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Employment</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Employer</p>
                      <p className="font-medium text-slate-900">{formData.employer}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Position</p>
                      <p className="font-medium text-slate-900">{formData.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Monthly Income</p>
                      <p className="font-medium text-slate-900">
                        ${parseFloat(formData.monthlyIncome).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Income Ratio</p>
                      <p className="font-medium text-green-600">
                        {(parseFloat(formData.monthlyIncome) / property.rent).toFixed(1)}x rent
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Documents Uploaded</h3>
                  <div className="space-y-2">
                    {Object.entries(documents).map(([key, file]) => (
                      file && (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="size-4 text-green-600" />
                          <span className="text-slate-900">{file.name}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-5 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">AI-Powered Review</h3>
                </div>
                <p className="text-sm text-indigo-700">
                  Once submitted, our AI will analyze your application and calculate your risk
                  score. The landlord will be notified immediately and you'll receive updates on
                  your application status.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 size-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="terms" className="text-sm text-slate-700">
                  I confirm that all information provided is accurate and I authorize the landlord
                  to verify this information. I understand that providing false information may
                  result in application rejection.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft className="size-5" />
            Previous
          </button>

          <div className="text-sm text-slate-600">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!isStepComplete(currentStep)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isStepComplete(currentStep)
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Next
              <ChevronRight className="size-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Sparkles className="size-5" />
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
