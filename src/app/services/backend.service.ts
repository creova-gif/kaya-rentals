/**
 * KAYA Backend Service
 * Real API calls to Supabase backend
 */

import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '/src/lib/supabase';
import type { Property, Unit, Application, Payment, MaintenanceRequest } from '../types/database.types';

// API base URL
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2071350e`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Only add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Public API fetch - uses public anon key for unauthenticated endpoints
 */
async function publicApiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...options.headers as Record<string, string>,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// PROPERTY API
// ============================================================================

export const PropertyAPI = {
  /**
   * Create a new property
   */
  async create(data: Partial<Property>): Promise<Property> {
    const result = await apiFetch('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.property;
  },

  /**
   * Get all properties for current user
   */
  async getAll(): Promise<Property[]> {
    const result = await apiFetch('/properties');
    return result.properties || [];
  },

  /**
   * Get single property by ID
   */
  async getById(propertyId: string): Promise<Property> {
    const result = await apiFetch(`/properties/${propertyId}`);
    return result.property;
  },

  /**
   * Update property
   */
  async update(propertyId: string, data: Partial<Property>): Promise<Property> {
    const result = await apiFetch(`/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.property;
  },

  /**
   * Delete property
   */
  async delete(propertyId: string): Promise<void> {
    await apiFetch(`/properties/${propertyId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// UNIT API
// ============================================================================

export const UnitAPI = {
  /**
   * Create a new unit
   */
  async create(propertyId: string, data: Partial<Unit>): Promise<Unit> {
    const result = await apiFetch(`/properties/${propertyId}/units`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.unit;
  },

  /**
   * Get all units for a property
   */
  async getAll(propertyId: string): Promise<Unit[]> {
    const result = await apiFetch(`/properties/${propertyId}/units`);
    return result.units || [];
  },
};

// ============================================================================
// APPLICATION API
// ============================================================================

export const ApplicationAPI = {
  /**
   * Submit a new application
   */
  async submit(data: Partial<Application>): Promise<Application> {
    const result = await apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.application;
  },

  /**
   * Get all applications (landlord or tenant view)
   */
  async getAll(role: 'landlord' | 'tenant' = 'landlord'): Promise<Application[]> {
    const result = await apiFetch(`/applications?role=${role}`);
    return result.applications || [];
  },

  /**
   * Get single application by ID
   */
  async getById(applicationId: string): Promise<Application> {
    const result = await apiFetch(`/applications/${applicationId}`);
    return result.application;
  },

  /**
   * Update application (approve, reject, etc.)
   */
  async update(applicationId: string, data: Partial<Application>): Promise<Application> {
    const result = await apiFetch(`/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.application;
  },

  /**
   * Approve application
   */
  async approve(applicationId: string): Promise<Application> {
    return this.update(applicationId, { status: 'approved' });
  },

  /**
   * Reject application
   */
  async reject(applicationId: string, reason: string): Promise<Application> {
    return this.update(applicationId, { 
      status: 'rejected',
      rejectionReason: reason,
    });
  },
};

// ============================================================================
// PAYMENT API
// ============================================================================

export const PaymentAPI = {
  /**
   * Create a new payment
   */
  async create(data: Partial<Payment>): Promise<Payment> {
    const result = await apiFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.payment;
  },

  /**
   * Get all payments for current user
   */
  async getAll(): Promise<Payment[]> {
    const result = await apiFetch('/payments');
    return result.payments || [];
  },
};

// ============================================================================
// TENANT API
// ============================================================================

export const TenantAPI = {
  async getAll(): Promise<any[]> {
    const result = await apiFetch('/tenants');
    return result.tenants || [];
  },
  async getById(tenantId: string): Promise<any> {
    const result = await apiFetch(`/tenants/${tenantId}`);
    return result.tenant;
  },
};

// ============================================================================
// MAINTENANCE API
// ============================================================================

export const MaintenanceAPI = {
  /**
   * Create a new maintenance request
   */
  async create(data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const result = await apiFetch('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.request;
  },

  /**
   * Get all maintenance requests
   */
  async getAll(): Promise<MaintenanceRequest[]> {
    const result = await apiFetch('/maintenance');
    return result.requests || [];
  },

  /**
   * Update a maintenance request (e.g. change status)
   */
  async update(id: string, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const result = await apiFetch(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.request;
  },
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const AnalyticsAPI = {
  /**
   * Get dashboard analytics
   */
  async getDashboard(): Promise<{
    totalProperties: number;
    totalUnits: number;
    totalApplications: number;
    pendingApplications: number;
    totalRevenue: number;
    pendingPayments: number;
  }> {
    const result = await apiFetch('/analytics/dashboard');
    return result.analytics;
  },

  /**
   * Get complete portfolio analytics with AI insights
   */
  async getPortfolio(): Promise<{
    overview: {
      totalProperties: number;
      totalUnits: number;
      occupiedUnits: number;
      vacantUnits: number;
      occupancyRate: number;
      monthlyRevenue: number;
      totalRevenueCollected: number;
      maintenanceCosts: number;
      netIncome: number;
    };
    applications: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    maintenance: {
      total: number;
      open: number;
      totalCost: number;
    };
    aiInsights: Array<{
      type: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    }>;
    vacancyByProperty: Array<{
      propertyId: string;
      propertyName: string;
      vacantUnits: number;
      totalUnits: number;
    }>;
  }> {
    const result = await apiFetch('/analytics/portfolio');
    return result.portfolio;
  },
};

// ============================================================================
// BUILDING API (Multi-Building Support)
// ============================================================================

export const BuildingAPI = {
  /**
   * Create a building within a property
   */
  async create(propertyId: string, data: {
    name: string;
    floors?: number;
    yearBuilt?: number;
  }): Promise<any> {
    const result = await apiFetch(`/properties/${propertyId}/buildings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.building;
  },

  /**
   * Get all buildings for a property
   */
  async getAll(propertyId: string): Promise<any[]> {
    const result = await apiFetch(`/properties/${propertyId}/buildings`);
    return result.buildings || [];
  },
};

// ============================================================================
// AMENITIES API
// ============================================================================

export const AmenitiesAPI = {
  /**
   * Add amenities to a property
   */
  async add(propertyId: string, amenities: string[]): Promise<string[]> {
    const result = await apiFetch(`/properties/${propertyId}/amenities`, {
      method: 'POST',
      body: JSON.stringify({ amenities }),
    });
    return result.amenities;
  },
};

// ============================================================================
// VERIFICATION API
// ============================================================================

export const VerificationAPI = {
  /**
   * Submit property for verification
   */
  async submitProperty(propertyId: string, data: {
    governmentId: boolean;
    propertyTax: boolean;
    titleDeed: boolean;
    utilityBill: boolean;
    notes?: string;
  }): Promise<any> {
    const result = await apiFetch(`/properties/${propertyId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.verification;
  },
};

// ============================================================================
// BULK IMPORT API
// ============================================================================

export const BulkImportAPI = {
  /**
   * Bulk import units from CSV data
   */
  async importUnits(propertyId: string, units: Array<{
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    rentPrice: number;
    deposit: number;
    status: string;
    floor?: number;
    parkingSpaces?: number;
  }>): Promise<{
    success: boolean;
    imported: number;
    units: any[];
  }> {
    const result = await apiFetch(`/properties/${propertyId}/bulk-import`, {
      method: 'POST',
      body: JSON.stringify({ units }),
    });
    return result;
  },
};

// ============================================================================
// UNIFIED API EXPORT
// ============================================================================

export const BackendAPI = {
  properties: PropertyAPI,
  units: UnitAPI,
  applications: ApplicationAPI,
  payments: PaymentAPI,
  maintenance: MaintenanceAPI,
  analytics: AnalyticsAPI,
  buildings: BuildingAPI,
  amenities: AmenitiesAPI,
  verification: VerificationAPI,
  bulkImport: BulkImportAPI,
};

// ============================================================================
// CONTRACTOR MARKETPLACE API
// ============================================================================

export const ContractorAPI = {
  /**
   * Register as a contractor
   */
  async register(data: {
    name: string;
    trade: string;
    email: string;
    phone: string;
    licenseNumber?: string;
    serviceRadiusKm?: number;
    priceRange?: { min: number; max: number };
  }): Promise<any> {
    const result = await apiFetch('/contractors/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.contractor;
  },

  /**
   * Get all contractors (marketplace browsing) - PUBLIC ENDPOINT
   */
  async getAll(filters?: {
    trade?: string;
    verified?: boolean;
    radius?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.trade) params.append('trade', filters.trade);
    if (filters?.verified) params.append('verified', 'true');
    if (filters?.radius) params.append('radius', filters.radius.toString());

    const result = await publicApiFetch(`/contractors?${params.toString()}`);
    return result.contractors || [];
  },

  /**
   * Get single contractor with recent jobs - PUBLIC ENDPOINT
   */
  async getById(contractorId: string): Promise<{
    contractor: any;
    recentJobs: any[];
  }> {
    const result = await publicApiFetch(`/contractors/${contractorId}`);
    return result;
  },

  /**
   * Submit contractor for verification
   */
  async verify(contractorId: string, data: {
    governmentId: boolean;
    tradeLicense: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  }): Promise<any> {
    const result = await apiFetch(`/contractors/${contractorId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.verification;
  },
};

export const JobAPI = {
  /**
   * Create a job posting
   */
  async create(data: {
    propertyId: string;
    unitId?: string;
    title: string;
    description: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    budget?: { min: number; max: number };
    photos?: string[];
  }): Promise<any> {
    const result = await apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.job;
  },

  /**
   * Get all jobs (landlord view)
   */
  async getAll(status?: string): Promise<any[]> {
    const params = status ? `?status=${status}` : '';
    const result = await apiFetch(`/jobs${params}`);
    return result.jobs || [];
  },

  /**
   * Get marketplace jobs (contractor view)
   */
  async getMarketplace(category?: string): Promise<any[]> {
    const params = category ? `?category=${category}` : '';
    const result = await apiFetch(`/jobs/marketplace${params}`);
    return result.jobs || [];
  },

  /**
   * Get single job with applications
   */
  async getById(jobId: string): Promise<{
    job: any;
    applications?: any[];
  }> {
    const result = await apiFetch(`/jobs/${jobId}`);
    return result;
  },

  /**
   * Apply for a job (contractor)
   */
  async apply(jobId: string, data: {
    proposedPrice: number;
    message: string;
    estimatedDuration?: string;
  }): Promise<any> {
    const result = await apiFetch(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.application;
  },

  /**
   * Assign job to contractor (landlord)
   */
  async assign(jobId: string, contractorId: string): Promise<any> {
    const result = await apiFetch(`/jobs/${jobId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ contractorId }),
    });
    return result.job;
  },

  /**
   * Mark job as complete
   */
  async complete(jobId: string, data: {
    actualCost: number;
    notes?: string;
    photos?: string[];
  }): Promise<any> {
    const result = await apiFetch(`/jobs/${jobId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  },

  /**
   * Rate contractor after job completion
   */
  async rate(jobId: string, data: {
    rating: number;
    review: string;
  }): Promise<any> {
    const result = await apiFetch(`/jobs/${jobId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.job;
  },

  /**
   * Get maintenance analytics
   */
  async getAnalytics(): Promise<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    completed: number;
    averageCost: number;
    byCategory: Record<string, number>;
    totalSpent: number;
  }> {
    const result = await apiFetch('/analytics/maintenance');
    return result.analytics;
  },
};

// Re-export with marketplace features
export const MarketplaceAPI = {
  ...BackendAPI,
  contractors: ContractorAPI,
  jobs: JobAPI,
  
  /**
   * Helper: Get dashboard overview with real data
   */
  async getDashboardOverview(): Promise<{
    properties: any[];
    applications: any[];
    portfolio: any;
    recentActivity: any[];
  }> {
    const [properties, applications, portfolio] = await Promise.all([
      PropertyAPI.getAll(),
      ApplicationAPI.getAll(),
      AnalyticsAPI.getPortfolio(),
    ]);

    return {
      properties,
      applications: applications.slice(0, 3), // Top 3
      portfolio,
      recentActivity: [], // TODO: Implement activity feed
    };
  },
};