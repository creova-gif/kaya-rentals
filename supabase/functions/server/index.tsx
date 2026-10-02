import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { secureHeaders } from "npm:hono/secure-headers";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { AI_ROUTE_NAMES, authenticateCaller, dispatchAiRequest } from "./ai_routes.mjs";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Allowed origins — extend for additional production domains
const ALLOWED_ORIGINS = [
  'https://kaya.ca',
  'https://app.kaya.ca',
  'https://www.kaya.ca',
  // Replit preview domains (dev only)
  /\.replit\.dev$/,
  /\.repl\.co$/,
  // Local development
  'http://localhost:5000',
  'http://localhost:5173',
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
}

// CORS — explicit allowlist, no wildcard
// Supabase's gateway adds `Access-Control-Allow-Origin: *` when the header is
// absent. To prevent that, we ALWAYS set the ACAO header: to the echoed origin
// for allowed requests, or to a fixed allowlisted value for denied ones
// (browser then sees the mismatch and rejects the cross-origin request).
const CORS_FALLBACK_ORIGIN = 'https://kaya.ca';
app.use("/*", cors({
  origin: (origin) => (isOriginAllowed(origin) ? origin : CORS_FALLBACK_ORIGIN),
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 600,
  credentials: false,
}));

// Security headers — Hono's built-in secureHeaders middleware
app.use("/*", secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", 'https://*.supabase.co'],
    imgSrc: ["'self'", 'data:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  },
}));

// Rate limiting — registered here so it runs BEFORE route handlers
// (rateLimiter fn is hoisted from its declaration further below)
// Global: 100 req/min; Auth routes: 10 req/min (separate KV namespaces)
app.use('*', (c, next) => rateLimiter(c, next, 100, 60, 'global'));
app.use('/make-server-2071350e/auth/*', (c, next) => rateLimiter(c, next, 10, 60, 'auth'));

// ============================================================================
// MIDDLEWARE - Authentication
// ============================================================================

async function verifyAccessToken(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    console.log('Auth error during user verification:', error);
  }
  return { user: data?.user ?? null, error };
}

async function requireAuth(c: any, next: any) {
  const result = await authenticateCaller({
    authorizationHeader: c.req.header('Authorization'),
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    getUser: verifyAccessToken,
  });

  if (!result.ok) {
    return c.json({ error: result.error }, { status: result.status });
  }

  c.set('user', result.user);
  c.set('userId', result.user.id);
  await next();
}

// ============================================================================
// ACCOUNT LOCKOUT — per-email brute-force protection
// 5 failed login attempts within 15 minutes → 15-minute lockout
// ============================================================================

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECS  = 15 * 60; // 15 minutes
const LOCKOUT_DURATION_SECS = 15 * 60; // 15 minutes

async function checkAccountLockout(email: string): Promise<{ locked: boolean; retryAfter?: number }> {
  const key = `lockout:${email.toLowerCase()}`;
  const record = await kv.get(key) as { attempts: number; lockedUntil?: number } | null;
  if (!record) return { locked: false };
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return { locked: true, retryAfter: Math.ceil((record.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false };
}

async function recordFailedAttempt(email: string): Promise<void> {
  const key = `lockout:${email.toLowerCase()}`;
  const now = Date.now();
  const record = (await kv.get(key) as { attempts: number; windowStart: number; lockedUntil?: number } | null)
    ?? { attempts: 0, windowStart: now };

  // Reset window if it has expired
  if (now - record.windowStart > LOCKOUT_WINDOW_SECS * 1000) {
    record.attempts = 0;
    record.windowStart = now;
    delete record.lockedUntil;
  }

  record.attempts += 1;
  if (record.attempts >= LOCKOUT_MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_SECS * 1000;
    console.warn(`[lockout] Account locked for ${email} after ${record.attempts} failed attempts`);
  }
  await kv.set(key, record);
}

async function clearFailedAttempts(email: string): Promise<void> {
  await kv.set(`lockout:${email.toLowerCase()}`, { attempts: 0, windowStart: Date.now() });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/make-server-2071350e/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Login — with per-email lockout and input validation
app.post("/make-server-2071350e/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (typeof email !== 'string' || email.length > 254) {
      return c.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length > 128) {
      return c.json({ error: 'Invalid password' }, { status: 400 });
    }

    // Check lockout before attempting login
    const lockout = await checkAccountLockout(email);
    if (lockout.locked) {
      return c.json(
        { error: `Account temporarily locked. Try again in ${Math.ceil((lockout.retryAfter ?? 900) / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(lockout.retryAfter ?? 900) } }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      await recordFailedAttempt(email);
      // Use a generic message — don't indicate whether email or password is wrong
      return c.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Successful login — clear failed attempts
    await clearFailedAttempts(email);

    const userProfile = await kv.get(`user:${data.user.id}`);
    return c.json({
      success: true,
      user: userProfile,
      accessToken: data.session.access_token,
    });
  } catch (error) {
    console.error('[auth/login] error:', error);
    return c.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
});

// Sign up new user
app.post("/make-server-2071350e/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'landlord' } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return c.json({ error: 'Password must be 8–128 characters' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return c.json({ error: 'Name must be 2–100 characters' }, { status: 400 });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm email since we haven't configured an email server
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, { status: 400 });
    }

    // Store user profile in KV store
    const userProfile = {
      id: data.user.id,
      email,
      name,
      role,
      verificationStatus: 'email_verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionTier: 'trial', // Start with trial tier
      subscriptionStatus: 'active',
      trialStartDate: new Date().toISOString(), // Track when trial started
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      isTrialActive: true,
    };

    await kv.set(`user:${data.user.id}`, userProfile);

    return c.json({ 
      success: true, 
      user: userProfile,
      message: 'Account created successfully. You can now log in.' 
    });

  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to create account' }, { status: 500 });
  }
});

// Get current session/user
app.get("/make-server-2071350e/auth/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken || accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
      return c.json({ user: null, session: null });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ user: null, session: null });
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${user.id}`);

    return c.json({ 
      user: userProfile || { id: user.id, email: user.email, ...user.user_metadata },
      session: { access_token: accessToken }
    });

  } catch (error) {
    console.log('Session check error:', error);
    return c.json({ user: null, session: null });
  }
});

// Check trial status
app.get("/make-server-2071350e/auth/trial-status", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get user profile from KV store
    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if trial is still valid
    const now = new Date();
    const trialEndDate = new Date(userProfile.trialEndDate);
    const isTrialExpired = now > trialEndDate;
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // If trial expired and user still on trial tier, update status
    if (isTrialExpired && userProfile.subscriptionTier === 'trial') {
      const updatedProfile = {
        ...userProfile,
        isTrialActive: false,
        subscriptionStatus: 'trial_expired',
        updatedAt: new Date().toISOString(),
      };
      await kv.set(`user:${userId}`, updatedProfile);
      
      return c.json({ 
        isTrialActive: false,
        trialExpired: true,
        daysRemaining: 0,
        trialEndDate: userProfile.trialEndDate,
        subscriptionTier: userProfile.subscriptionTier,
        message: 'Your 7-day free trial has expired. Please upgrade to continue using KAYA.'
      });
    }

    return c.json({ 
      isTrialActive: !isTrialExpired && userProfile.subscriptionTier === 'trial',
      trialExpired: isTrialExpired,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      trialStartDate: userProfile.trialStartDate,
      trialEndDate: userProfile.trialEndDate,
      subscriptionTier: userProfile.subscriptionTier,
      subscriptionStatus: userProfile.subscriptionStatus,
    });

  } catch (error) {
    console.log('Error checking trial status:', error);
    return c.json({ error: 'Failed to check trial status' }, { status: 500 });
  }
});

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

// Get user profile
app.get("/make-server-2071350e/users/:userId", requireAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    const currentUserId = c.get('userId');

    // Users can only view their own profile (unless admin)
    if (userId !== currentUserId) {
      return c.json({ error: 'Forbidden - Cannot view other user profiles' }, { status: 403 });
    }

    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'User profile not found' }, { status: 404 });
    }

    return c.json({ profile });

  } catch (error) {
    console.log('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
});

// Update user profile
app.put("/make-server-2071350e/users/:userId", requireAuth, async (c) => {
  try {
    const userId = c.req.param('userId');
    const currentUserId = c.get('userId');
    const body = await c.req.json();

    if (userId !== currentUserId) {
      return c.json({ error: 'Forbidden - Cannot update other user profiles' }, { status: 403 });
    }

    const existingProfile = await kv.get(`user:${userId}`);

    if (!existingProfile) {
      return c.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Update allowed fields
    const updatedProfile = {
      ...existingProfile,
      ...body,
      id: userId, // Prevent ID modification
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ profile: updatedProfile });

  } catch (error) {
    console.log('Error updating user profile:', error);
    return c.json({ error: 'Failed to update profile' }, { status: 500 });
  }
});

// ============================================================================
// PROPERTY ROUTES
// ============================================================================

// Create property
app.post("/make-server-2071350e/properties", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Check subscription limits
    const userProfile = await kv.get(`user:${userId}`);
    const subscriptionTier = userProfile?.subscriptionTier || 'free';
    
    // Get user's existing properties
    const userProperties = await kv.getByPrefix(`property:${userId}:`);
    
    // Enforce limits: Free=1, Pro=10, Enterprise=unlimited
    const limits: Record<string, number> = { free: 1, pro: 10, enterprise: 999999 };
    if (userProperties.length >= limits[subscriptionTier]) {
      return c.json({ 
        error: `Property limit reached for ${subscriptionTier} plan. Upgrade to add more properties.`,
        limit: limits[subscriptionTier],
        current: userProperties.length
      }, { status: 403 });
    }

    const propertyId = crypto.randomUUID();
    const property = {
      id: propertyId,
      ownerId: userId,
      ...body,
      verified: false, // Properties start unverified
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`property:${userId}:${propertyId}`, property);

    return c.json({ property }, { status: 201 });

  } catch (error) {
    console.log('Error creating property:', error);
    return c.json({ error: 'Failed to create property' }, { status: 500 });
  }
});

// Get all properties for user (with analytics)
app.get("/make-server-2071350e/properties", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const properties = await kv.getByPrefix(`property:${userId}:`);

    // Calculate portfolio analytics for each property
    const propertiesWithAnalytics = await Promise.all(
      properties.map(async (property: any) => {
        // Get units for this property
        const allUnits = await kv.getByPrefix(`unit:${userId}:`);
        const propertyUnits = allUnits.filter((u: any) => u.propertyId === property.id);
        
        // Calculate occupancy
        const occupiedUnits = propertyUnits.filter((u: any) => u.status === 'occupied').length;
        const availableUnits = propertyUnits.filter((u: any) => u.status === 'available').length;
        const totalUnits = propertyUnits.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        // Calculate revenue
        const totalRevenue = propertyUnits.reduce((sum: number, u: any) => {
          if (u.status === 'occupied') {
            return sum + (u.rentPrice || 0);
          }
          return sum;
        }, 0);

        return {
          ...property,
          analytics: {
            totalUnits,
            occupiedUnits,
            availableUnits,
            vacantUnits: totalUnits - occupiedUnits,
            occupancyRate: Math.round(occupancyRate),
            monthlyRevenue: totalRevenue,
          },
        };
      })
    );

    return c.json({ properties: propertiesWithAnalytics });

  } catch (error) {
    console.log('Error fetching properties:', error);
    return c.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
});

// Get single property
app.get("/make-server-2071350e/properties/:propertyId", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');

    const property = await kv.get(`property:${userId}:${propertyId}`);

    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    return c.json({ property });

  } catch (error) {
    console.log('Error fetching property:', error);
    return c.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
});

// Update property
app.put("/make-server-2071350e/properties/:propertyId", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    const existingProperty = await kv.get(`property:${userId}:${propertyId}`);

    if (!existingProperty) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    const updatedProperty = {
      ...existingProperty,
      ...body,
      id: propertyId,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`property:${userId}:${propertyId}`, updatedProperty);

    return c.json({ property: updatedProperty });

  } catch (error) {
    console.log('Error updating property:', error);
    return c.json({ error: 'Failed to update property' }, { status: 500 });
  }
});

// Delete property
app.delete("/make-server-2071350e/properties/:propertyId", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');

    await kv.del(`property:${userId}:${propertyId}`);

    return c.json({ success: true, message: 'Property deleted' });

  } catch (error) {
    console.log('Error deleting property:', error);
    return c.json({ error: 'Failed to delete property' }, { status: 500 });
  }
});

// ============================================================================
// UNIT ROUTES
// ============================================================================

// Create unit
app.post("/make-server-2071350e/properties/:propertyId/units", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    // Verify property ownership
    const property = await kv.get(`property:${userId}:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    const unitId = crypto.randomUUID();
    const unit = {
      id: unitId,
      propertyId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`unit:${userId}:${propertyId}:${unitId}`, unit);

    return c.json({ unit }, { status: 201 });

  } catch (error) {
    console.log('Error creating unit:', error);
    return c.json({ error: 'Failed to create unit' }, { status: 500 });
  }
});

// Get all units for a property
app.get("/make-server-2071350e/properties/:propertyId/units", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');

    const units = await kv.getByPrefix(`unit:${userId}:${propertyId}:`);

    return c.json({ units });

  } catch (error) {
    console.log('Error fetching units:', error);
    return c.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
});

// ============================================================================
// BUILDING ROUTES (Multi-Building Support)
// ============================================================================

// Create building
app.post("/make-server-2071350e/properties/:propertyId/buildings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    // Verify property ownership
    const property = await kv.get(`property:${userId}:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    const buildingId = crypto.randomUUID();
    const building = {
      id: buildingId,
      propertyId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`building:${userId}:${propertyId}:${buildingId}`, building);

    return c.json({ building }, { status: 201 });

  } catch (error) {
    console.log('Error creating building:', error);
    return c.json({ error: 'Failed to create building' }, { status: 500 });
  }
});

// Get all buildings for a property
app.get("/make-server-2071350e/properties/:propertyId/buildings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');

    const buildings = await kv.getByPrefix(`building:${userId}:${propertyId}:`);

    return c.json({ buildings });

  } catch (error) {
    console.log('Error fetching buildings:', error);
    return c.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
});

// ============================================================================
// AMENITIES ROUTES
// ============================================================================

// Add amenity to property
app.post("/make-server-2071350e/properties/:propertyId/amenities", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    // Verify property ownership
    const property = await kv.get(`property:${userId}:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get existing amenities or create new array
    const existingAmenities = property.amenities || [];
    const updatedAmenities = [...existingAmenities, ...body.amenities];

    // Update property with new amenities
    const updatedProperty = {
      ...property,
      amenities: updatedAmenities,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`property:${userId}:${propertyId}`, updatedProperty);

    return c.json({ amenities: updatedAmenities });

  } catch (error) {
    console.log('Error adding amenities:', error);
    return c.json({ error: 'Failed to add amenities' }, { status: 500 });
  }
});

// ============================================================================
// VERIFICATION ROUTES
// ============================================================================

// Submit property for verification
app.post("/make-server-2071350e/properties/:propertyId/verify", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    const property = await kv.get(`property:${userId}:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    // Create verification record
    const verificationId = crypto.randomUUID();
    const verification = {
      id: verificationId,
      propertyId,
      userId,
      documents: {
        governmentId: body.governmentId || false,
        propertyTax: body.propertyTax || false,
        titleDeed: body.titleDeed || false,
        utilityBill: body.utilityBill || false,
      },
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
      notes: body.notes || '',
    };

    await kv.set(`verification:${userId}:${propertyId}:${verificationId}`, verification);

    // Update property verification status
    const updatedProperty = {
      ...property,
      verificationStatus: 'under_review',
      verificationId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`property:${userId}:${propertyId}`, updatedProperty);

    return c.json({ verification });

  } catch (error) {
    console.log('Error submitting verification:', error);
    return c.json({ error: 'Failed to submit verification' }, { status: 500 });
  }
});

// ============================================================================
// BULK IMPORT ROUTES
// ============================================================================

// Bulk import units via CSV data
app.post("/make-server-2071350e/properties/:propertyId/bulk-import", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();

    // Verify property ownership
    const property = await kv.get(`property:${userId}:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, { status: 404 });
    }

    const { units } = body; // Array of unit objects

    if (!Array.isArray(units) || units.length === 0) {
      return c.json({ error: 'Units array is required' }, { status: 400 });
    }

    // Create all units
    const createdUnits = [];
    for (const unitData of units) {
      const unitId = crypto.randomUUID();
      const unit = {
        id: unitId,
        propertyId,
        ...unitData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`unit:${userId}:${propertyId}:${unitId}`, unit);
      createdUnits.push(unit);
    }

    return c.json({ 
      success: true, 
      imported: createdUnits.length,
      units: createdUnits 
    });

  } catch (error) {
    console.log('Error bulk importing units:', error);
    return c.json({ error: 'Failed to import units' }, { status: 500 });
  }
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// Get dashboard analytics
app.get("/make-server-2071350e/analytics/dashboard", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    const properties = await kv.getByPrefix(`property:${userId}:`);
    const applications = await kv.getByPrefix(`application:landlord:${userId}:`);
    const payments = await kv.getByPrefix(`payment:${userId}:`);

    const analytics = {
      totalProperties: properties.length,
      totalUnits: properties.reduce((sum: number, p: any) => sum + (p.totalUnits || 0), 0),
      totalApplications: applications.length,
      pendingApplications: applications.filter((a: any) => a.status === 'submitted' || a.status === 'landlord_review').length,
      totalRevenue: payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingPayments: payments.filter((p: any) => p.status === 'pending').length,
    };

    return c.json({ analytics });

  } catch (error) {
    console.log('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
});

// ============================================================================
// CONTRACTOR MARKETPLACE ROUTES
// ============================================================================

// Register contractor
app.post("/make-server-2071350e/contractors/register", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const contractorId = crypto.randomUUID();
    const contractor = {
      id: contractorId,
      userId,
      ...body,
      rating: 0,
      jobsCompleted: 0,
      verified: false,
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`contractor:${contractorId}`, contractor);
    await kv.set(`contractor:user:${userId}`, contractorId); // Link user to contractor

    return c.json({ contractor }, { status: 201 });

  } catch (error) {
    console.log('Error registering contractor:', error);
    return c.json({ error: 'Failed to register contractor' }, { status: 500 });
  }
});

// Get all contractors (for marketplace browsing)
app.get("/make-server-2071350e/contractors", async (c) => {
  try {
    const trade = c.req.query('trade');
    const radius = c.req.query('radius');
    const verified = c.req.query('verified');

    let contractors = await kv.getByPrefix(`contractor:`);
    
    // Filter out user mappings
    contractors = contractors.filter((c: any) => c.name);

    // Filter by trade
    if (trade) {
      contractors = contractors.filter((c: any) => c.trade?.toLowerCase() === trade.toLowerCase());
    }

    // Filter verified only
    if (verified === 'true') {
      contractors = contractors.filter((c: any) => c.verified === true);
    }

    // Sort by rating
    contractors.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

    return c.json({ contractors });

  } catch (error) {
    console.log('Error fetching contractors:', error);
    return c.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
});

// Get single contractor
app.get("/make-server-2071350e/contractors/:contractorId", async (c) => {
  try {
    const contractorId = c.req.param('contractorId');
    const contractor = await kv.get(`contractor:${contractorId}`);

    if (!contractor) {
      return c.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Get recent jobs for this contractor
    const allJobs = await kv.getByPrefix(`job:`);
    const contractorJobs = allJobs.filter((j: any) => 
      j.assignedContractorId === contractorId && j.status === 'completed'
    ).slice(0, 10);

    return c.json({ contractor, recentJobs: contractorJobs });

  } catch (error) {
    console.log('Error fetching contractor:', error);
    return c.json({ error: 'Failed to fetch contractor' }, { status: 500 });
  }
});

// Verify contractor
app.post("/make-server-2071350e/contractors/:contractorId/verify", requireAuth, async (c) => {
  try {
    const contractorId = c.req.param('contractorId');
    const body = await c.req.json();

    const contractor = await kv.get(`contractor:${contractorId}`);
    if (!contractor) {
      return c.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Create verification record
    const verificationId = crypto.randomUUID();
    const verification = {
      id: verificationId,
      contractorId,
      documents: {
        governmentId: body.governmentId || false,
        tradeLicense: body.tradeLicense || false,
        insurance: body.insurance || false,
        backgroundCheck: body.backgroundCheck || false,
      },
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    };

    await kv.set(`contractor:verification:${contractorId}`, verification);

    // Update contractor status
    const updatedContractor = {
      ...contractor,
      verificationStatus: 'under_review',
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`contractor:${contractorId}`, updatedContractor);

    return c.json({ verification });

  } catch (error) {
    console.log('Error verifying contractor:', error);
    return c.json({ error: 'Failed to verify contractor' }, { status: 500 });
  }
});

// ============================================================================
// JOB ROUTES (Contractor Jobs)
// ============================================================================

// Create job
app.post("/make-server-2071350e/jobs", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const jobId = crypto.randomUUID();
    
    // AI Classification (simplified for demo)
    const aiCategory = body.title?.toLowerCase().includes('leak') ? 'plumbing' :
                       body.title?.toLowerCase().includes('heat') ? 'hvac' :
                       body.title?.toLowerCase().includes('electric') ? 'electrical' :
                       body.category || 'general';

    const aiPriority = body.urgency === 'emergency' ? 'high' :
                       body.urgency === 'high' ? 'medium' : 'low';

    const aiEstimatedCost = aiCategory === 'plumbing' ? { min: 120, max: 350 } :
                            aiCategory === 'hvac' ? { min: 200, max: 600 } :
                            aiCategory === 'electrical' ? { min: 150, max: 400 } :
                            { min: 100, max: 300 };

    const job = {
      id: jobId,
      landlordId: userId,
      ...body,
      category: aiCategory,
      priority: aiPriority,
      estimatedCost: aiEstimatedCost,
      status: 'open',
      applicationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${userId}:${jobId}`, job);

    return c.json({ job }, { status: 201 });

  } catch (error) {
    console.log('Error creating job:', error);
    return c.json({ error: 'Failed to create job' }, { status: 500 });
  }
});

// Get all jobs (landlord view)
app.get("/make-server-2071350e/jobs", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const status = c.req.query('status');

    let jobs = await kv.getByPrefix(`job:${userId}:`);

    if (status) {
      jobs = jobs.filter((j: any) => j.status === status);
    }

    return c.json({ jobs });

  } catch (error) {
    console.log('Error fetching jobs:', error);
    return c.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
});

// Get available jobs (contractor view)
app.get("/make-server-2071350e/jobs/marketplace", requireAuth, async (c) => {
  try {
    const category = c.req.query('category');
    
    // Get all open jobs
    const allJobs = await kv.getByPrefix(`job:`);
    let openJobs = allJobs.filter((j: any) => j.status === 'open');

    // Filter by category if specified
    if (category) {
      openJobs = openJobs.filter((j: any) => j.category === category);
    }

    // Sort by urgency and date
    openJobs.sort((a: any, b: any) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json({ jobs: openJobs });

  } catch (error) {
    console.log('Error fetching marketplace jobs:', error);
    return c.json({ error: 'Failed to fetch marketplace jobs' }, { status: 500 });
  }
});

// Get single job
app.get("/make-server-2071350e/jobs/:jobId", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');

    const job = await kv.get(`job:${userId}:${jobId}`);

    if (!job) {
      // Try to find in all jobs (for contractors)
      const allJobs = await kv.getByPrefix(`job:`);
      const foundJob = allJobs.find((j: any) => j.id === jobId);
      
      if (!foundJob) {
        return c.json({ error: 'Job not found' }, { status: 404 });
      }

      return c.json({ job: foundJob });
    }

    // Get applications for this job
    const applications = await kv.getByPrefix(`job:application:${jobId}:`);

    return c.json({ job, applications });

  } catch (error) {
    console.log('Error fetching job:', error);
    return c.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
});

// ============================================================================
// JOB APPLICATION ROUTES
// ============================================================================

// Apply for job (contractor)
app.post("/make-server-2071350e/jobs/:jobId/apply", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');
    const body = await c.req.json();

    // Get contractor ID for this user
    const contractorId = await kv.get(`contractor:user:${userId}`);
    if (!contractorId) {
      return c.json({ error: 'User is not registered as a contractor' }, { status: 403 });
    }

    const applicationId = crypto.randomUUID();
    const application = {
      id: applicationId,
      jobId,
      contractorId,
      ...body,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    await kv.set(`job:application:${jobId}:${applicationId}`, application);

    // Update job applications count
    const allJobs = await kv.getByPrefix(`job:`);
    const job = allJobs.find((j: any) => j.id === jobId);
    
    if (job) {
      const jobKey = Object.keys(await kv.getByPrefix(`job:`))
        .find(key => key.includes(jobId));
      
      if (jobKey) {
        const updatedJob = {
          ...job,
          applicationsCount: (job.applicationsCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        await kv.set(jobKey, updatedJob);
      }
    }

    return c.json({ application }, { status: 201 });

  } catch (error) {
    console.log('Error applying for job:', error);
    return c.json({ error: 'Failed to apply for job' }, { status: 500 });
  }
});

// Accept contractor (landlord assigns job)
app.post("/make-server-2071350e/jobs/:jobId/assign", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');
    const body = await c.req.json();

    const job = await kv.get(`job:${userId}:${jobId}`);
    if (!job) {
      return c.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job with assigned contractor
    const updatedJob = {
      ...job,
      status: 'assigned',
      assignedContractorId: body.contractorId,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${userId}:${jobId}`, updatedJob);

    // Update application status
    const applications = await kv.getByPrefix(`job:application:${jobId}:`);
    for (const app of applications) {
      const appKey = `job:application:${jobId}:${app.id}`;
      if (app.contractorId === body.contractorId) {
        await kv.set(appKey, { ...app, status: 'accepted' });
      } else {
        await kv.set(appKey, { ...app, status: 'rejected' });
      }
    }

    return c.json({ job: updatedJob });

  } catch (error) {
    console.log('Error assigning job:', error);
    return c.json({ error: 'Failed to assign job' }, { status: 500 });
  }
});

// Complete job
app.post("/make-server-2071350e/jobs/:jobId/complete", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');
    const body = await c.req.json();

    const job = await kv.get(`job:${userId}:${jobId}`);
    if (!job) {
      return c.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create completion record
    const completionId = crypto.randomUUID();
    const completion = {
      id: completionId,
      jobId,
      contractorId: job.assignedContractorId,
      actualCost: body.actualCost,
      notes: body.notes || '',
      photos: body.photos || [],
      completedAt: new Date().toISOString(),
    };

    await kv.set(`job:completion:${jobId}`, completion);

    // Update job status
    const updatedJob = {
      ...job,
      status: 'completed',
      actualCost: body.actualCost,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${userId}:${jobId}`, updatedJob);

    return c.json({ job: updatedJob, completion });

  } catch (error) {
    console.log('Error completing job:', error);
    return c.json({ error: 'Failed to complete job' }, { status: 500 });
  }
});

// Rate contractor
app.post("/make-server-2071350e/jobs/:jobId/rate", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');
    const body = await c.req.json();

    const job = await kv.get(`job:${userId}:${jobId}`);
    if (!job || job.status !== 'completed') {
      return c.json({ error: 'Job not found or not completed' }, { status: 404 });
    }

    // Add rating to job
    const updatedJob = {
      ...job,
      rating: body.rating,
      review: body.review,
      ratedAt: new Date().toISOString(),
    };

    await kv.set(`job:${userId}:${jobId}`, updatedJob);

    // Update contractor's overall rating
    const contractor = await kv.get(`contractor:${job.assignedContractorId}`);
    if (contractor) {
      const currentRating = contractor.rating || 0;
      const currentJobs = contractor.jobsCompleted || 0;
      const newRating = ((currentRating * currentJobs) + body.rating) / (currentJobs + 1);

      const updatedContractor = {
        ...contractor,
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
        jobsCompleted: currentJobs + 1,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`contractor:${job.assignedContractorId}`, updatedContractor);
    }

    return c.json({ job: updatedJob });

  } catch (error) {
    console.log('Error rating contractor:', error);
    return c.json({ error: 'Failed to rate contractor' }, { status: 500 });
  }
});

// ============================================================================
// MARKETPLACE ANALYTICS
// ============================================================================

// Get maintenance analytics
app.get("/make-server-2071350e/analytics/maintenance", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    const jobs = await kv.getByPrefix(`job:${userId}:`);

    const analytics = {
      total: jobs.length,
      open: jobs.filter((j: any) => j.status === 'open').length,
      assigned: jobs.filter((j: any) => j.status === 'assigned').length,
      inProgress: jobs.filter((j: any) => j.status === 'in_progress').length,
      completed: jobs.filter((j: any) => j.status === 'completed').length,
      averageCost: jobs
        .filter((j: any) => j.actualCost)
        .reduce((sum: number, j: any, _, arr) => sum + (j.actualCost / arr.length), 0),
      byCategory: jobs.reduce((acc: any, j: any) => {
        acc[j.category] = (acc[j.category] || 0) + 1;
        return acc;
      }, {}),
      totalSpent: jobs
        .filter((j: any) => j.actualCost)
        .reduce((sum: number, j: any) => sum + j.actualCost, 0),
    };

    return c.json({ analytics });

  } catch (error) {
    console.log('Error fetching maintenance analytics:', error);
    return c.json({ error: 'Failed to fetch maintenance analytics' }, { status: 500 });
  }
});

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

// Get all notifications for a user
app.get("/make-server-2071350e/notifications/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    
    // Sort by timestamp (newest first)
    const sortedNotifications = notifications.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ notifications: sortedNotifications });
  } catch (error) {
    console.log('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
});

// Get unread notification count
app.get("/make-server-2071350e/notifications/:userId/unread-count", async (c) => {
  try {
    const userId = c.req.param('userId');
    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return c.json({ count: unreadCount });
  } catch (error) {
    console.log('Error fetching unread count:', error);
    return c.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
});

// Mark notification as read
app.put("/make-server-2071350e/notifications/:notificationId/read", async (c) => {
  try {
    const notificationId = c.req.param('notificationId');
    
    // Find the notification by searching all user notifications
    const allNotifications = await kv.getByPrefix(`notification:`);
    const notification = allNotifications.find((n: any) => n.id === notificationId);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updatedNotification = { ...notification, read: true };
    await kv.set(`notification:${notification.userId}:${notificationId}`, updatedNotification);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
});

// Mark all notifications as read
app.put("/make-server-2071350e/notifications/:userId/read-all", async (c) => {
  try {
    const userId = c.req.param('userId');
    const notifications = await kv.getByPrefix(`notification:${userId}:`);

    const updatePromises = notifications.map((notification: any) => {
      const updatedNotification = { ...notification, read: true };
      return kv.set(`notification:${userId}:${notification.id}`, updatedNotification);
    });

    await Promise.all(updatePromises);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error marking all notifications as read:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
  }
});

// Delete notification
app.delete("/make-server-2071350e/notifications/:notificationId", async (c) => {
  try {
    const notificationId = c.req.param('notificationId');
    
    const allNotifications = await kv.getByPrefix(`notification:`);
    const notification = allNotifications.find((n: any) => n.id === notificationId);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, { status: 404 });
    }

    await kv.del(`notification:${notification.userId}:${notificationId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
});

// Create new notification
app.post("/make-server-2071350e/notifications", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, type, title, message, priority, actionUrl, metadata } = body;

    if (!userId || !type || !title || !message) {
      return c.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationId = crypto.randomUUID();
    const notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: priority || 'medium',
      actionUrl,
      metadata,
    };

    await kv.set(`notification:${userId}:${notificationId}`, notification);

    return c.json({ success: true, notification });
  } catch (error) {
    console.log('Error creating notification:', error);
    return c.json({ error: 'Failed to create notification' }, { status: 500 });
  }
});

// ============================================================================
// MESSAGING ROUTES (Unread Count)
// ============================================================================

// Get unread message count
app.get("/make-server-2071350e/messages/unread-count", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get all conversations where this user is a participant
    const allMessages = await kv.getByPrefix(`message:`);
    const unreadCount = allMessages.filter((m: any) => 
      m.recipientId === userId && m.read === false
    ).length;

    return c.json({ count: unreadCount });
  } catch (error) {
    console.log('Error fetching unread message count:', error);
    return c.json({ error: 'Failed to fetch unread message count' }, { status: 500 });
  }
});

// ============================================================================
// STRIPE SUBSCRIPTION ROUTES
// ============================================================================

// Create Stripe checkout session for subscription
app.post("/make-server-2071350e/stripe/create-checkout-session", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { priceId, planName } = body;

    if (!priceId || !planName) {
      return c.json({ error: 'Price ID and plan name are required' }, { status: 400 });
    }

    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, { status: 404 });
    }

    const Stripe = (await import('npm:stripe@20')).default;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    });

    // Create or get Stripe customer
    let customerId = userProfile.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: userId,
          name: userProfile.name,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to user profile
      await kv.set(`user:${userId}`, {
        ...userProfile,
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${c.req.header('origin') || 'http://localhost:5173'}/settings?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${c.req.header('origin') || 'http://localhost:5173'}/pricing?subscription=cancelled`,
      metadata: {
        userId: userId,
        planName: planName,
      },
    });

    return c.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.log('Error creating Stripe checkout session:', error);
    return c.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
});

// Create Stripe portal session for subscription management
app.post("/make-server-2071350e/stripe/create-portal-session", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile || !userProfile.stripeCustomerId) {
      return c.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const Stripe = (await import('npm:stripe@20')).default;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: userProfile.stripeCustomerId,
      return_url: `${c.req.header('origin') || 'http://localhost:5173'}/settings`,
    });

    return c.json({ url: session.url });

  } catch (error) {
    console.log('Error creating Stripe portal session:', error);
    return c.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
});

// Stripe webhook handler
app.post("/make-server-2071350e/stripe/webhook", async (c) => {
  try {
    const Stripe = (await import('npm:stripe@20')).default;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    });

    const sig = c.req.header('stripe-signature');
    const body = await c.req.text();
    
    let event;
    
    try {
      // In production, you should set STRIPE_WEBHOOK_SECRET
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
      } else {
        // For testing without webhook secret
        event = JSON.parse(body);
      }
    } catch (err) {
      console.log('Webhook signature verification failed:', err);
      return c.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;

        if (userId) {
          const userProfile = await kv.get(`user:${userId}`);
          if (userProfile) {
            await kv.set(`user:${userId}`, {
              ...userProfile,
              subscriptionTier: planName.toLowerCase(),
              subscriptionStatus: 'active',
              stripeSubscriptionId: session.subscription,
              updatedAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && !customer.deleted) {
          const userId = customer.metadata?.userId;
          
          if (userId) {
            const userProfile = await kv.get(`user:${userId}`);
            if (userProfile) {
              await kv.set(`user:${userId}`, {
                ...userProfile,
                subscriptionStatus: subscription.status,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && !customer.deleted) {
          const userId = customer.metadata?.userId;
          
          if (userId) {
            const userProfile = await kv.get(`user:${userId}`);
            if (userProfile) {
              await kv.set(`user:${userId}`, {
                ...userProfile,
                subscriptionTier: 'free',
                subscriptionStatus: 'cancelled',
                stripeSubscriptionId: null,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });

  } catch (error) {
    console.log('Webhook error:', error);
    return c.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
});

// ============================================================================
// PROPERTY LISTINGS ROUTES
// ============================================================================

// Get all listings
app.get("/make-server-2071350e/listings", async (c) => {
  try {
    const listings = await kv.getByPrefix("listing:");
    return c.json({ 
      success: true, 
      listings: listings.map(l => l.value) 
    });
  } catch (error) {
    console.log('Error fetching listings:', error);
    return c.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
});

// Create new listing
app.post("/make-server-2071350e/listings", async (c) => {
  try {
    const listing = await c.req.json();
    
    if (!listing.id) {
      listing.id = Date.now().toString();
    }
    
    await kv.set(`listing:${listing.id}`, listing);
    
    return c.json({ 
      success: true, 
      listing 
    });
  } catch (error) {
    console.log('Error creating listing:', error);
    return c.json({ error: 'Failed to create listing' }, { status: 500 });
  }
});

// Delete listing
app.delete("/make-server-2071350e/listings/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`listing:${id}`);
    
    return c.json({ 
      success: true, 
      message: 'Listing deleted' 
    });
  } catch (error) {
    console.log('Error deleting listing:', error);
    return c.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
});

// ============================================================================
// CLAUDE AI ROUTES
// Auth and the per-user quota are enforced in ai_routes.mjs before any model
// call. Registering from AI_ROUTE_NAMES keeps a new /ai route from skipping
// that gate. The Anthropic client is constructed only when model.create runs.
// ============================================================================

let anthropicClient: any = null;

async function aiModel() {
  if (!anthropicClient) {
    const Anthropic = (await import('npm:@anthropic-ai/sdk@0.32')).default;
    anthropicClient = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });
  }
  return anthropicClient;
}

async function serveAi(c: any, name: string) {
  const result = await dispatchAiRequest({
    authorizationHeader: c.req.header('Authorization'),
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    getUser: verifyAccessToken,
    increment: (bucket: string) => kv.atomicIncrement(bucket, 'count', 0),
    path: name,
    readBody: () => c.req.json(),
    model: {
      create: async (params: any) => {
        const client = await aiModel();
        return client.messages.create(params);
      },
    },
    kv,
  });

  if (result.headers) {
    return c.json(result.body, { status: result.status, headers: result.headers });
  }
  return c.json(result.body, { status: result.status });
}

for (const name of AI_ROUTE_NAMES) {
  app.post(`/make-server-2071350e/ai/${name}`, (c) => serveAi(c, name));
}


// ============================================================================
// COMPLIANCE MODULE — PIPEDA + Ontario RTA
// ============================================================================

// ----------------------------------------------------------------------------
// 1. RATE LIMITING MIDDLEWARE
// Per-IP: 100 req/min general | 10 req/min for auth routes
// Uses KV store as the counter backend
// ----------------------------------------------------------------------------

async function rateLimiter(c: any, next: any, limit = 100, windowSecs = 60, namespace = 'global') {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('cf-connecting-ip')
    || 'unknown';
  // Namespace the bucket key so global and auth counters don't share state.
  // Without namespacing, global requests deplete the auth quota (shared counter).
  const bucket = `ratelimit:${namespace}:${ip}:${Math.floor(Date.now() / (windowSecs * 1000))}`;

  const isAuthRoute = c.req.path.includes('/auth/');
  try {
    const entry = (await kv.get(bucket)) ?? { count: 0, resetAt: Date.now() + windowSecs * 1000 };
    entry.count += 1;

    if (entry.count > limit) {
      return c.json(
        { error: 'Too many requests. Please slow down and try again.' },
        { status: 429, headers: { 'Retry-After': String(windowSecs) } }
      );
    }

    await kv.set(bucket, entry);
  } catch (_e) {
    // Auth routes fail-closed: if KV is unavailable, block rather than allow unlimited attempts
    if (isAuthRoute) {
      console.error('[rate-limiter] KV unavailable on auth route — blocking request');
      return c.json(
        { error: 'Service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }
    // Non-auth routes fail-open to preserve availability
  }

  return next();
}


// ----------------------------------------------------------------------------
// 2. AUDIT LOGGING
// Append-only audit trail for every sensitive data operation.
// Stored under kv key: audit:{userId} — each entry is a JSON record.
// ----------------------------------------------------------------------------

async function writeAuditLog(entry: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  details?: Record<string, any>;
}) {
  const key = `audit:${entry.userId}`;
  const existing: any[] = (await kv.get(key)) ?? [];
  const record = {
    ...entry,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
  existing.push(record);
  // Keep last 500 entries per user to cap storage
  const trimmed = existing.slice(-500);
  await kv.set(key, trimmed);
}

// GET /compliance/audit-log — retrieve audit trail for authenticated user
app.get('/make-server-2071350e/compliance/audit-log', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const logs: any[] = (await kv.get(`audit:${userId}`)) ?? [];
    const { limit = '50', resource } = c.req.query() as any;
    const filtered = resource ? logs.filter((l: any) => l.resource === resource) : logs;
    const page = filtered.slice(-Number(limit)).reverse();
    return c.json({ success: true, total: filtered.length, logs: page });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve audit log' }, { status: 500 });
  }
});

// POST /compliance/audit-log — manually log a client-side event (e.g. document view)
app.post('/make-server-2071350e/compliance/audit-log', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { action, resource, resourceId, details } = body;

    if (!action || !resource) {
      return c.json({ error: 'action and resource are required' }, { status: 400 });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    await writeAuditLog({ userId, action, resource, resourceId, ip, details });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to write audit log' }, { status: 500 });
  }
});

// ----------------------------------------------------------------------------
// 3. CONSENT MANAGEMENT (PIPEDA §6 — Meaningful Consent)
// Stored under kv key: consent:{userId}
// Each consent record has type, granted_at, revoked_at, ip
// ----------------------------------------------------------------------------

const CONSENT_TYPES = [
  'marketing_emails',
  'credit_check',
  'data_sharing_partners',
  'background_screening',
  'analytics_tracking',
] as const;
type ConsentType = typeof CONSENT_TYPES[number];

// POST /compliance/consent — record consent grant or revocation
app.post('/make-server-2071350e/compliance/consent', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { type, granted }: { type: ConsentType; granted: boolean } = body;

    if (!CONSENT_TYPES.includes(type)) {
      return c.json(
        { error: `Invalid consent type. Must be one of: ${CONSENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `consent:${userId}`;
    const existing: Record<string, any> = (await kv.get(key)) ?? {};

    existing[type] = {
      type,
      granted,
      grantedAt: granted ? new Date().toISOString() : existing[type]?.grantedAt ?? null,
      revokedAt: !granted ? new Date().toISOString() : null,
      ip,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, existing);
    await writeAuditLog({
      userId,
      action: granted ? 'consent_granted' : 'consent_revoked',
      resource: 'consent',
      resourceId: type,
      ip,
    });

    return c.json({ success: true, consent: existing[type] });
  } catch (error) {
    return c.json({ error: 'Failed to record consent' }, { status: 500 });
  }
});

// GET /compliance/consent — retrieve all consent records for authenticated user
app.get('/make-server-2071350e/compliance/consent', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const consents: Record<string, any> = (await kv.get(`consent:${userId}`)) ?? {};
    return c.json({ success: true, consents });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve consents' }, { status: 500 });
  }
});

// DELETE /compliance/consent/:type — revoke a specific consent
app.delete('/make-server-2071350e/compliance/consent/:type', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const type = c.req.param('type') as ConsentType;

    if (!CONSENT_TYPES.includes(type)) {
      return c.json({ error: `Invalid consent type` }, { status: 400 });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `consent:${userId}`;
    const existing: Record<string, any> = (await kv.get(key)) ?? {};

    existing[type] = {
      ...existing[type],
      granted: false,
      revokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, existing);
    await writeAuditLog({ userId, action: 'consent_revoked', resource: 'consent', resourceId: type, ip });
    return c.json({ success: true, message: `Consent for '${type}' revoked` });
  } catch (error) {
    return c.json({ error: 'Failed to revoke consent' }, { status: 500 });
  }
});

// ----------------------------------------------------------------------------
// 4. RIGHT TO ERASURE (PIPEDA §8 — Right of Access & Correction)
// Anonymizes PII in user profile. Retains audit trail and financial records
// for CRA 7-year requirement. Hard deletion is never performed.
// ----------------------------------------------------------------------------

app.delete('/make-server-2071350e/compliance/users/:id/data', requireAuth, async (c) => {
  try {
    const requestingUserId = c.get('userId');
    const targetUserId = c.req.param('id');

    // Users can only erase their own data unless they are admins
    const requestingProfile = (await kv.get(`user:${requestingUserId}`)) as any;
    if (requestingUserId !== targetUserId && requestingProfile?.role !== 'admin') {
      return c.json({ error: 'Forbidden — you can only request erasure of your own data' }, { status: 403 });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const userKey = `user:${targetUserId}`;
    const existing: any = (await kv.get(userKey)) ?? {};

    // Anonymize PII fields — retain non-PII for audit continuity
    const anonymized = {
      id: existing.id,
      email: `deleted_${crypto.randomUUID().slice(0, 8)}@erased.kaya.ca`,
      name: '[Deleted User]',
      role: existing.role,
      verificationStatus: 'erased',
      subscriptionTier: existing.subscriptionTier,
      erasedAt: new Date().toISOString(),
      erasureRequestedBy: requestingUserId,
      // Intentionally retained for CRA/RTA compliance
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(userKey, anonymized);

    // Revoke all consents
    await kv.set(`consent:${targetUserId}`, {});

    // Audit log — this entry is itself kept as a legal record
    await writeAuditLog({
      userId: requestingUserId,
      action: 'right_to_erasure_executed',
      resource: 'user',
      resourceId: targetUserId,
      ip,
      details: { targetUserId, anonymizedAt: anonymized.erasedAt },
    });

    return c.json({
      success: true,
      message: 'Personal data anonymized per PIPEDA right to erasure. Financial audit trail retained for 7 years as required by CRA.',
      erasedAt: anonymized.erasedAt,
    });
  } catch (error) {
    return c.json({ error: 'Failed to execute erasure' }, { status: 500 });
  }
});

// ----------------------------------------------------------------------------
// 5. ONTARIO RENT INCREASE VALIDATION (RTA §120)
// Validates a proposed rent increase against the annual provincial guideline.
// Guideline source: Ontario Ministry of Municipal Affairs and Housing.
// Must be updated annually each fall when Ontario announces next year's rate.
// ----------------------------------------------------------------------------

const ONTARIO_RENT_GUIDELINES: Record<number, number> = {
  2022: 1.2,
  2023: 2.5,
  2024: 2.5,
  2025: 2.5,
  2026: 2.5, // Update when Ontario announces — typically in fall of prior year
};

function getOntarioGuideline(year: number): number | null {
  return ONTARIO_RENT_GUIDELINES[year] ?? null;
}

// GET /compliance/rent-increase/validate?currentRent=&proposedRent=&effectiveYear=
app.get('/make-server-2071350e/compliance/rent-increase/validate', requireAuth, async (c) => {
  try {
    const { currentRent, proposedRent, effectiveYear } = c.req.query() as any;
    const userId = c.get('userId');

    if (!currentRent || !proposedRent || !effectiveYear) {
      return c.json({ error: 'currentRent, proposedRent, and effectiveYear are required' }, { status: 400 });
    }

    const current = parseFloat(currentRent);
    const proposed = parseFloat(proposedRent);
    const year = parseInt(effectiveYear);

    if (isNaN(current) || isNaN(proposed) || isNaN(year) || current <= 0 || proposed <= 0) {
      return c.json({ error: 'Invalid numeric values provided' }, { status: 400 });
    }

    const guideline = getOntarioGuideline(year);
    const actualIncreasePercent = ((proposed - current) / current) * 100;
    const maxAllowedRent = guideline !== null ? current * (1 + guideline / 100) : null;
    const isCompliant = guideline !== null ? actualIncreasePercent <= guideline : null;

    // Notice requirements under RTA §116: 90 days written notice on Form N1
    const today = new Date();
    const minimumNoticeDate = new Date(today);
    minimumNoticeDate.setDate(today.getDate() + 90);

    await writeAuditLog({
      userId,
      action: 'rent_increase_validated',
      resource: 'rent_increase',
      details: { currentRent: current, proposedRent: proposed, effectiveYear: year, isCompliant },
    });

    return c.json({
      success: true,
      validation: {
        currentRent: current,
        proposedRent: proposed,
        effectiveYear: year,
        actualIncreasePercent: Math.round(actualIncreasePercent * 100) / 100,
        ontarioGuideline: guideline,
        maxAllowedRent: maxAllowedRent !== null ? Math.round(maxAllowedRent * 100) / 100 : null,
        isCompliant,
        guidelineKnown: guideline !== null,
      },
      rtaRequirements: {
        requiredForm: 'N1 — Notice of Rent Increase',
        minimumNoticeDays: 90,
        earliestEffectiveDate: minimumNoticeDate.toISOString().split('T')[0],
        note: isCompliant === false
          ? `⚠️ Proposed increase of ${actualIncreasePercent.toFixed(2)}% exceeds the ${year} Ontario guideline of ${guideline}%. An application to the LTB (Form L1/L5) is required.`
          : isCompliant
          ? `✅ Increase is within the ${year} Ontario guideline of ${guideline}%. Serve Form N1 with 90 days notice.`
          : `ℹ️ Guideline for ${year} is not yet confirmed. Check ontario.ca/rentincrease before proceeding.`,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to validate rent increase' }, { status: 500 });
  }
});

// ----------------------------------------------------------------------------
// 6. NOTICE DELIVERY TRACKING (RTA §83 + LTB evidence requirements)
// Creates an auditable delivery receipt for every tenant notice sent.
// Includes method, timestamp, and recipient confirmation for LTB hearings.
// ----------------------------------------------------------------------------

// POST /compliance/notices/track — record a notice delivery event
app.post('/make-server-2071350e/compliance/notices/track', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const {
      noticeType,       // e.g. 'N1', 'N4', 'N12'
      noticeId,         // internal notice record ID
      recipientId,      // tenant user ID
      recipientEmail,   // for delivery confirmation
      method,           // 'email' | 'mail' | 'hand_delivered'
      propertyId,
      unitId,
      notes,
    } = body;

    if (!noticeType || !recipientId || !method) {
      return c.json({ error: 'noticeType, recipientId, and method are required' }, { status: 400 });
    }

    const VALID_METHODS = ['email', 'mail', 'hand_delivered'];
    if (!VALID_METHODS.includes(method)) {
      return c.json({ error: `method must be one of: ${VALID_METHODS.join(', ')}` }, { status: 400 });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const deliveryId = crypto.randomUUID();
    const deliveredAt = new Date().toISOString();

    const record = {
      deliveryId,
      noticeType,
      noticeId: noticeId ?? null,
      sentBy: userId,
      recipientId,
      recipientEmail: recipientEmail ?? null,
      method,
      propertyId: propertyId ?? null,
      unitId: unitId ?? null,
      deliveredAt,
      status: 'sent',
      notes: notes ?? null,
      ip,
    };

    // Store under two indexes: by landlord and by notice ID
    const landlordKey = `notice_deliveries:landlord:${userId}`;
    const existing: any[] = (await kv.get(landlordKey)) ?? [];
    existing.push(record);
    await kv.set(landlordKey, existing.slice(-1000)); // keep last 1000

    if (noticeId) {
      await kv.set(`notice_deliveries:notice:${noticeId}`, record);
    }

    await writeAuditLog({
      userId,
      action: 'notice_delivered',
      resource: 'notice',
      resourceId: noticeId ?? deliveryId,
      ip,
      details: { noticeType, method, recipientId, deliveredAt },
    });

    return c.json({
      success: true,
      deliveryId,
      deliveredAt,
      message: `Notice ${noticeType} delivery recorded via ${method}. This receipt is admissible as evidence at the LTB.`,
    });
  } catch (error) {
    return c.json({ error: 'Failed to record notice delivery' }, { status: 500 });
  }
});

// GET /compliance/notices/track — retrieve delivery receipts for authenticated landlord
app.get('/make-server-2071350e/compliance/notices/track', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { noticeType, limit = '50' } = c.req.query() as any;
    const key = `notice_deliveries:landlord:${userId}`;
    const all: any[] = (await kv.get(key)) ?? [];
    const filtered = noticeType ? all.filter((r: any) => r.noticeType === noticeType) : all;
    const page = filtered.slice(-Number(limit)).reverse();
    return c.json({ success: true, total: filtered.length, deliveries: page });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve delivery records' }, { status: 500 });
  }
});

// GET /compliance/notices/track/:noticeId — get delivery receipt for a specific notice
app.get('/make-server-2071350e/compliance/notices/track/:noticeId', requireAuth, async (c) => {
  try {
    const noticeId = c.req.param('noticeId');
    const record = await kv.get(`notice_deliveries:notice:${noticeId}`);
    if (!record) {
      return c.json({ error: 'No delivery record found for this notice ID' }, { status: 404 });
    }
    return c.json({ success: true, delivery: record });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve delivery record' }, { status: 500 });
  }
});

// ----------------------------------------------------------------------------
// 7. SOFT DELETE UTILITY
// All delete operations use anonymization / soft-delete, never hard deletion.
// Financial and audit records are retained for 7 years (CRA requirement).
// Physical deletion (vacuum) of eligible records is scheduled externally.
// ----------------------------------------------------------------------------

async function softDelete(kvKey: string, resourceId: string, deletedBy: string): Promise<Record<string, any>> {
  const existing: any = (await kv.get(kvKey)) ?? {};
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    isDeleted: true,
  };
  await kv.set(kvKey, updated);
  await writeAuditLog({
    userId: deletedBy,
    action: 'soft_deleted',
    resource: kvKey.split(':')[0],
    resourceId,
    details: { deletedAt: updated.deletedAt },
  });
  return updated;
}

// GET /compliance/health — expose compliance module status
app.get('/make-server-2071350e/compliance/health', (c) => {
  return c.json({
    status: 'active',
    modules: [
      'rate_limiting',
      'audit_logging',
      'consent_management',
      'right_to_erasure',
      'rent_increase_validation',
      'notice_delivery_tracking',
      'soft_delete',
    ],
    dataResidency: 'ca-central-1',
    frameworks: ['PIPEDA', 'Ontario RTA', 'LTB Evidence Rules'],
    ontarioRentGuidelineYears: Object.keys(ONTARIO_RENT_GUIDELINES),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// END COMPLIANCE MODULE
// ============================================================================

// Wrap app.fetch so security headers are baked into EVERY response at the
// outermost layer. This is more reliable than Hono middleware because it runs
// AFTER the entire middleware/route chain (including cors and secureHeaders)
// and creates a brand-new Response object that Supabase's gateway cannot strip.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; " +
    "connect-src 'self' https://*.supabase.co; " +
    "img-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com",
};

Deno.serve(async (req: Request) => {
  const res = await app.fetch(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
});