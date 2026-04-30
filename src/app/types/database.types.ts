/**
 * YourPropertyAI Database Schema Types
 * Complete type definitions matching the architecture specification
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export type UserRole = "tenant" | "landlord" | "property_manager" | "contractor" | "admin";
export type VerificationStatus = "unverified" | "email_verified" | "phone_verified" | "id_verified" | "fully_verified";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  profilePhoto?: string;
  governmentId?: string;
  dateOfBirth?: string;
}

// ============================================================================
// PROPERTIES & UNITS
// ============================================================================

export type PropertyType = "apartment" | "house" | "student_housing" | "retail" | "office" | "industrial" | "mixed_use";
export type UnitStatus = "available" | "reserved" | "occupied" | "maintenance" | "unlisted";

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  propertyType: PropertyType;
  totalUnits: number;
  createdAt: Date;
  updatedAt: Date;
  amenities?: string[];
  photos?: string[];
  documents?: string[];
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  rentPrice: number;
  deposit: number;
  status: UnitStatus;
  floor?: number;
  parkingSpaces?: number;
  utilitiesIncluded?: string[];
  availabilityDate?: Date;
  features?: string[];
  photos?: string[];
}

// ============================================================================
// APPLICATIONS
// ============================================================================

export type ApplicationStatus = "submitted" | "documents_verified" | "ai_screening" | "landlord_review" | "approved" | "rejected" | "withdrawn";
export type RiskLevel = "low" | "medium" | "high";

export interface Application {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  status: ApplicationStatus;
  
  // Financial Information
  monthlyIncome: number;
  employmentStatus: string;
  employer: string;
  jobTitle: string;
  yearsEmployed: number;
  
  // AI Analysis
  aiRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  aiRecommendation: "approve" | "review" | "reject";
  aiInsights: string[];
  
  // Documents
  documents: {
    governmentId: boolean;
    payStub: boolean;
    creditReport: boolean;
    employmentLetter: boolean;
    references: boolean;
    bankStatement?: boolean;
  };
  documentUrls?: {
    governmentId?: string;
    payStub?: string;
    creditReport?: string;
    employmentLetter?: string;
    references?: string;
    bankStatement?: string;
  };
  
  // References
  references?: Reference[];
  
  // Rental History
  previousAddress?: string;
  previousLandlord?: string;
  previousLandlordPhone?: string;
  yearsAtPreviousAddress?: number;
  reasonForLeaving?: string;
  
  // Additional Info
  pets?: boolean;
  petDetails?: string;
  vehicleInfo?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Metadata
  submittedAt: Date;
  reviewedAt?: Date;
  decidedAt?: Date;
  currentStep: number; // 0-4 for timeline
  rejectionReason?: string;
}

export interface Reference {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  verified: boolean;
  verifiedAt?: Date;
  notes?: string;
}

// ============================================================================
// LEASES
// ============================================================================

export type LeaseStatus = "draft" | "awaiting_signature" | "active" | "expiring_soon" | "expired" | "terminated";
export type LeaseTemplate = "ontario_standard" | "bc_residential" | "alberta_residential" | "quebec_residential" | "california_residential" | "generic";

export interface Lease {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  applicationId: string;
  
  // Lease Terms
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  deposit: number;
  dueDay: number; // 1-31
  
  // Legal
  jurisdiction: string; // "Ontario, Canada"
  legalTemplate: LeaseTemplate;
  templateVersion: string;
  mandatoryClauses: LeaseClause[];
  optionalClauses: LeaseClause[];
  
  // Signatures
  landlordSigned: boolean;
  landlordSignedAt?: Date;
  landlordSignature?: string;
  tenantSigned: boolean;
  tenantSignedAt?: Date;
  tenantSignature?: string;
  
  // Status
  status: LeaseStatus;
  generatedAt: Date;
  activatedAt?: Date;
  terminatedAt?: Date;
  terminationReason?: string;
  
  // Documents
  pdfUrl?: string;
  documentHash?: string; // For blockchain verification
  
  // Additional Terms
  utilitiesIncluded: string[];
  petsAllowed: boolean;
  petPolicy?: string;
  smokingAllowed: boolean;
  parkingSpaces: number;
  additionalTerms?: string;
}

export interface LeaseClause {
  id: string;
  section: string;
  title: string;
  content: string;
  mandatory: boolean;
  editable: boolean;
}

// ============================================================================
// PAYMENTS
// ============================================================================

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "overdue";
export type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "check" | "cash" | "other";

export interface Payment {
  id: string;
  tenantId: string;
  landlordId: string;
  leaseId: string;
  unitId: string;
  
  // Amount Details
  amount: number;
  currency: string;
  type: "rent" | "deposit" | "late_fee" | "maintenance" | "utility" | "other";
  
  // Payment Info
  dueDate: Date;
  paidDate?: Date;
  method?: PaymentMethod;
  transactionId?: string;
  
  // Status
  status: PaymentStatus;
  
  // Receipts
  receiptUrl?: string;
  receiptNumber?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  lateDays?: number;
  lateFeeAmount?: number;
}

// ============================================================================
// MAINTENANCE
// ============================================================================

export type MaintenanceStatus = "submitted" | "assigned" | "in_progress" | "completed" | "cancelled";
export type MaintenancePriority = "low" | "medium" | "high" | "emergency";
export type MaintenanceCategory = "plumbing" | "electrical" | "hvac" | "appliance" | "structural" | "pest_control" | "cleaning" | "other";

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  
  // Issue Details
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  
  // Status
  status: MaintenanceStatus;
  
  // Assignment
  assignedTo?: string; // Contractor ID
  assignedAt?: Date;
  completedAt?: Date;
  
  // Photos
  photos?: string[];
  
  // Cost
  estimatedCost?: number;
  actualCost?: number;
  
  // Timeline
  submittedAt: Date;
  updatedAt: Date;
  
  // Communication
  notes?: MaintenanceNote[];
}

export interface MaintenanceNote {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  timestamp: Date;
  photos?: string[];
}

// ============================================================================
// MESSAGES
// ============================================================================

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  
  // Content
  subject?: string;
  body: string;
  attachments?: string[];
  
  // Status
  status: MessageStatus;
  
  // Metadata
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Context
  relatedPropertyId?: string;
  relatedUnitId?: string;
  relatedMaintenanceId?: string;
  relatedApplicationId?: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType = "application" | "payment" | "maintenance" | "lease" | "message" | "system";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  
  // Content
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  
  // Status
  read: boolean;
  readAt?: Date;
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  
  // Context
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface PropertyAnalytics {
  propertyId: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate: Date;
  
  // Financial
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  averageRent: number;
  
  // Operations
  applicationsReceived: number;
  applicationsApproved: number;
  maintenanceRequests: number;
  averageMaintenanceCost: number;
  
  // AI Insights
  aiPropertyScore: number;
  aiRecommendations: string[];
  marketComparison: {
    averageMarketRent: number;
    yourRent: number;
    pricingPosition: "below_market" | "at_market" | "above_market";
  };
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

export type FraudFlag = "duplicate_identity" | "fake_document" | "suspicious_income" | "multiple_applications" | "address_mismatch" | "unusual_pattern";

export interface FraudAlert {
  id: string;
  applicationId: string;
  tenantId: string;
  
  // Alert Details
  flagType: FraudFlag;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  
  // Description
  description: string;
  evidence: string[];
  aiAnalysis: string;
  
  // Status
  status: "open" | "investigating" | "resolved" | "false_positive";
  investigatedBy?: string;
  investigatedAt?: Date;
  resolution?: string;
  
  // Metadata
  detectedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AI MODELS
// ============================================================================

export interface AIRiskAnalysis {
  applicationId: string;
  tenantId: string;
  
  // Overall Score
  overallScore: number; // 0-100
  recommendation: "approve" | "review" | "reject";
  
  // Factor Scores
  incomeScore: number;
  employmentScore: number;
  creditScore: number;
  rentalHistoryScore: number;
  documentScore: number;
  
  // Risk Factors
  riskFactors: {
    factor: string;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
  
  // Positive Factors
  positiveFactors: string[];
  
  // AI Insights
  insights: string[];
  warnings: string[];
  
  // Metadata
  analyzedAt: Date;
  modelVersion: string;
}

export interface AIPropertyIntelligence {
  propertyId: string;
  
  // Overall Assessment
  overallScore: number; // 0-100
  
  // Component Scores
  profitabilityScore: number;
  occupancyRiskScore: number;
  marketPositionScore: number;
  maintenanceEfficiencyScore: number;
  
  // Recommendations
  recommendations: {
    type: "rent_increase" | "renovation" | "marketing" | "maintenance" | "pricing";
    title: string;
    description: string;
    expectedImpact: string;
    priority: "low" | "medium" | "high";
    estimatedCost?: number;
    estimatedROI?: number;
  }[];
  
  // Market Analysis
  marketData: {
    averageRent: number;
    suggestedRent: number;
    rentIncreasePotential: number;
    vacancyRate: number;
    demandLevel: "low" | "medium" | "high";
  };
  
  // Metadata
  analyzedAt: Date;
  modelVersion: string;
}

// ============================================================================
// SYSTEM LOGS
// ============================================================================

export interface ActivityLog {
  id: string;
  userId: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
