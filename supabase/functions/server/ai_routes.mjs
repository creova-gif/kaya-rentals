/**
 * AI route gate for /ai/*.
 *
 * Every model call goes through dispatchAiRequest:
 *   1. Reject missing, anon-key, and invalid sessions (no model call).
 *   2. Reject unknown routes.
 *   3. Consume a per-user quota (fail closed if the counter is down).
 *   4. Run the handler, which is the only place model.create is invoked.
 *
 * Identity for stored chat and voice context is the authenticated user id.
 * Client-supplied userId is ignored.
 *
 * Tenant approve/deny wording in screen-tenant is unchanged (CRE-42).
 */

export const AI_USER_LIMIT = 20;
export const AI_WINDOW_SECS = 60;

export const AI_ROUTE_NAMES = [
  'rent-estimate',
  'compare-listings',
  'explain-lease',
  'chat',
  'voice-command',
  'screen-tenant',
];

const UNAUTHORIZED = 'Unauthorized - Please log in';
const INVALID_TOKEN = 'Unauthorized - Invalid or expired token';
const RATE_LIMITED = 'Too many AI requests. Please slow down and try again.';
const UNAVAILABLE = 'Service temporarily unavailable. Please try again in a moment.';

export function aiUserBucket(userId, nowMs, windowSecs = AI_WINDOW_SECS) {
  return `ratelimit:ai:user:${userId}:${Math.floor(nowMs / (windowSecs * 1000))}`;
}

export async function authenticateCaller({ authorizationHeader, anonKey, getUser }) {
  const accessToken = authorizationHeader?.split(' ')[1];
  if (!accessToken || (anonKey && accessToken === anonKey)) {
    return { ok: false, status: 401, error: UNAUTHORIZED };
  }

  let user = null;
  let error = null;
  try {
    const result = await getUser(accessToken);
    user = result?.user ?? null;
    error = result?.error ?? null;
  } catch (err) {
    error = err;
  }

  if (error || !user?.id) {
    return { ok: false, status: 401, error: INVALID_TOKEN };
  }

  return { ok: true, user };
}

export async function consumeAiUserQuota({
  userId,
  increment,
  nowMs = Date.now(),
  limit = AI_USER_LIMIT,
  windowSecs = AI_WINDOW_SECS,
}) {
  if (!userId) {
    return { ok: false, status: 401, error: UNAUTHORIZED };
  }
  if (typeof increment !== 'function') {
    return { ok: false, status: 503, error: UNAVAILABLE };
  }

  const bucket = aiUserBucket(userId, nowMs, windowSecs);
  let count;
  try {
    count = Number(await increment(bucket));
  } catch {
    return { ok: false, status: 503, error: UNAVAILABLE };
  }

  if (!Number.isFinite(count) || count < 1) {
    return { ok: false, status: 503, error: UNAVAILABLE };
  }
  if (count > limit) {
    return {
      ok: false,
      status: 429,
      error: RATE_LIMITED,
      retryAfter: String(windowSecs),
    };
  }

  return { ok: true, count };
}

function modelText(message) {
  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

function jsonFromText(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

async function handleRentEstimate(body, { model }) {
  try {
    const { address, city, province, bedrooms, bathrooms, sqft, amenities } = body ?? {};

    const prompt = `You are a Canadian real estate expert. Analyze this rental property and provide a detailed rent estimate.

Property Details:
- Address: ${address}, ${city}, ${province}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Square Feet: ${sqft}
- Amenities: ${amenities?.join(', ') || 'None specified'}

Please provide:
1. Estimated monthly rent range (low and high)
2. Key factors affecting the price
3. Market comparison insights
4. Recommendations for landlords or tenants

Format your response in JSON with this structure:
{
  "estimatedRent": { "low": number, "high": number },
  "averageRent": number,
  "confidence": "high" | "medium" | "low",
  "factors": [string],
  "marketInsights": string,
  "recommendations": string
}`;

    const message = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = modelText(message);
    const analysis = jsonFromText(responseText) ?? {
      estimatedRent: { low: 1500, high: 2500 },
      averageRent: 2000,
      confidence: 'medium',
      factors: ['Location', 'Size', 'Amenities'],
      marketInsights: 'Market analysis unavailable',
      recommendations: 'Please provide more property details',
    };

    return { status: 200, body: { success: true, analysis } };
  } catch (error) {
    console.log('AI rent estimate error:', error);
    return { status: 500, body: { error: 'Failed to generate rent estimate' } };
  }
}

async function handleCompareListings(body, { model }) {
  try {
    const { listings } = body ?? {};

    if (!listings || listings.length < 2) {
      return { status: 400, body: { error: 'At least 2 listings required for comparison' } };
    }

    const listingsText = listings.map((l, i) => `
Listing ${i + 1}:
- Title: ${l.title}
- Price: $${l.price}/month
- Location: ${l.address}, ${l.city}
- Bedrooms: ${l.beds}
- Bathrooms: ${l.baths}
- Square Feet: ${l.sqft}
- Tags: ${l.tags?.map((t) => t.label).join(', ')}
    `).join('\n');

    const prompt = `You are a Canadian real estate expert helping a tenant compare rental properties. Analyze these listings and provide a detailed comparison.

${listingsText}

Please provide:
1. Best overall value
2. Pros and cons for each listing
3. Which listing is best for different tenant profiles (budget-conscious, luxury-seeking, family, etc.)
4. Red flags or concerns
5. Final recommendation

Format your response in JSON with this structure:
{
  "bestValue": number (listing index),
  "comparisons": [
    {
      "listingIndex": number,
      "pros": [string],
      "cons": [string],
      "valueScore": number (1-10)
    }
  ],
  "recommendations": {
    "budgetConscious": number,
    "luxurySeeking": number,
    "family": number
  },
  "redFlags": [string],
  "summary": string
}`;

    const message = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = modelText(message);
    const comparison = jsonFromText(responseText) ?? {
      bestValue: 0,
      comparisons: [],
      recommendations: {},
      redFlags: [],
      summary: 'Comparison unavailable',
    };

    return { status: 200, body: { success: true, comparison } };
  } catch (error) {
    console.log('AI comparison error:', error);
    return { status: 500, body: { error: 'Failed to compare listings' } };
  }
}

async function handleExplainLease(body, { model }) {
  try {
    const { question, leaseText, province } = body ?? {};

    const prompt = question
      ? `You are a Canadian tenant rights expert. Answer this question about lease terms in ${province || 'Canada'}:

Question: ${question}

${leaseText ? `Lease Context: ${leaseText}` : ''}

Provide a clear, helpful explanation in plain language. Include relevant tenant rights and landlord obligations under Canadian/provincial law.`
      : `You are a Canadian tenant rights expert. Explain common lease terms and tenant rights in ${province || 'Canada'}.

Provide:
1. Key lease terms explained in plain language
2. Tenant rights and protections
3. Landlord obligations
4. Red flags to watch for
5. Tips for first-time renters

Format as JSON:
{
  "explanation": string,
  "keyTerms": [{ "term": string, "definition": string }],
  "tenantRights": [string],
  "landlordObligations": [string],
  "redFlags": [string],
  "tips": [string]
}`;

    const message = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = modelText(message);

    if (question) {
      return { status: 200, body: { success: true, explanation: responseText } };
    }

    const leaseGuide = jsonFromText(responseText) ?? {
      explanation: responseText,
      keyTerms: [],
      tenantRights: [],
      landlordObligations: [],
      redFlags: [],
      tips: [],
    };
    return { status: 200, body: { success: true, leaseGuide } };
  } catch (error) {
    console.log('AI lease explanation error:', error);
    return { status: 500, body: { error: 'Failed to explain lease terms' } };
  }
}

async function handleChat(body, { model, user, kv }) {
  try {
    const { message, context, conversationHistory, pageContext } = body ?? {};
    const userId = user.id;

    if (userId) {
      const conversationId = `conversation:${userId}:${Date.now()}`;
      await kv.set(conversationId, {
        userId,
        message,
        context,
        pageContext,
        timestamp: new Date().toISOString(),
      });
    }

    const messages = [];
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }
    messages.push({ role: 'user', content: message });

    const systemPrompt = `You are KAYA AI, an expert assistant for Canadian landlords and property managers powered by Claude 3.5 Sonnet. You are specifically trained on:

📚 EXPERTISE AREAS:
1. Canadian Residential Tenancies Act (RTA) and all provincial tenant laws across Canada
2. Landlord and Tenant Board (LTB) procedures, forms (N4, N5, N7, N12, L1, L2, etc.), and hearing processes
3. Property management best practices and optimization strategies
4. Advanced tenant screening, risk assessment, and application evaluation
5. Lease agreements, legal compliance, and contractual obligations
6. Rent collection, arrears management, and financial planning
7. Maintenance coordination and contractor management
8. Canadian tax implications for rental properties
9. Multi-province compliance (BC, AB, SK, MB, ON, QC, NB, NS, PE, NL)

🎯 YOUR ROLE:
- Provide accurate, actionable, and professional advice
- Reference specific laws, regulations, and LTB decisions when applicable
- Be concise but thorough - aim for clarity and practical application
- Use Canadian terminology (e.g., "tenant" not "renter", "LTB" not "court")
- Consider both landlord rights AND tenant protections
- Flag potential legal risks and suggest compliant alternatives
- Provide step-by-step guidance when appropriate

${pageContext ? `\n📍 CURRENT CONTEXT: The user is on the "${pageContext}" page of KAYA platform.\nProvide responses relevant to this context when applicable.` : ''}

${context ? `\n💡 ADDITIONAL CONTEXT: ${context}` : ''}

Remember: You're not just answering questions - you're helping landlords run better, more compliant, and more profitable rental businesses across Canada.`;

    const response = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const responseText = modelText(response);

    if (userId) {
      const responseId = `conversation:${userId}:response:${Date.now()}`;
      await kv.set(responseId, {
        userId,
        response: responseText,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 200,
      body: {
        success: true,
        response: responseText,
        messageId: Date.now().toString(),
      },
    };
  } catch (error) {
    console.log('AI chat error:', error);
    return { status: 500, body: { error: 'Failed to process chat message' } };
  }
}

async function handleVoiceCommand(body, { model, user, kv }) {
  try {
    const { command, userContext } = body ?? {};
    const userId = user.id;

    let contextualInfo = '';
    if (userId) {
      try {
        const properties = await kv.getByPrefix(`property:${userId}:`);
        const applications = await kv.getByPrefix(`application:landlord:${userId}:`);
        const payments = await kv.getByPrefix(`payment:${userId}:`);

        const pendingApps = applications.filter((a) => a.status === 'submitted' || a.status === 'landlord_review').length;
        const completedPayments = payments.filter((p) => p.status === 'completed');
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        contextualInfo = `
USER DATA CONTEXT (Real-time from database):
- Total Properties: ${properties.length}
- Pending Applications: ${pendingApps}
- Total Revenue (All-time): $${totalRevenue.toLocaleString()}
- Recent Payments: ${payments.length}
`;
      } catch (e) {
        console.log('Could not fetch user context:', e);
      }
    }

    const systemPrompt = `You are KAYA Voice AI, an intelligent voice assistant for Canadian landlords and property managers.

🎤 YOUR CAPABILITIES:
When given a voice command, provide:
1. A natural, conversational response (as if speaking to the user)
2. Actionable data and specific insights
3. Suggested follow-up actions
4. Proactive recommendations based on the data

${contextualInfo}

📋 SAMPLE COMMANDS YOU HANDLE:
- "Show me high-risk tenant applications"
- "What's my total revenue this month?"
- "List all maintenance requests"
- "Which properties have vacancies?"
- "Generate an N4 notice for late rent"
- "Summarize LTB hearing requirements"
- "Show me tenants with lease renewals coming up"
- "What's my occupancy rate?"
- "Find contractors for plumbing work"
- "Review my financial performance"

💬 RESPONSE STYLE:
- Conversational and professional (like a helpful assistant)
- Provide specific numbers and data when available
- If you need clarification, ask follow-up questions
- Suggest related actions the user might want to take next
- Use emojis sparingly for visual clarity

${userContext ? `\nUSER CONTEXT: ${userContext}` : ''}

Respond as if you're a knowledgeable assistant speaking directly to the user. Be helpful and proactive.`;

    const response = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: command }],
    });

    const responseText = modelText(response);

    return {
      status: 200,
      body: {
        success: true,
        response: responseText,
        transcript: command,
      },
    };
  } catch (error) {
    console.log('AI voice command error:', error);
    return { status: 500, body: { error: 'Failed to process voice command' } };
  }
}

async function handleScreenTenant(body, { model }) {
  try {
    const {
      tenantName,
      income,
      creditScore,
      employmentStatus,
      rentalHistory,
      references,
      additionalInfo,
    } = body ?? {};

    const prompt = `You are an AI tenant screening expert for Canadian landlords. Analyze this tenant application and provide a detailed risk assessment.

Tenant Information:
- Name: ${tenantName}
- Annual Income: ${income ? `$${income}` : 'Not provided'}
- Credit Score: ${creditScore || 'Not provided'}
- Employment: ${employmentStatus || 'Not provided'}
- Rental History: ${rentalHistory || 'Not provided'}
- References: ${references || 'Not provided'}
- Additional Info: ${additionalInfo || 'None'}

Provide your analysis in JSON format:
{
  "riskScore": number (0-100, where 0 is lowest risk),
  "riskLevel": "low" | "medium" | "high",
  "recommendation": "approve" | "conditional" | "deny",
  "strengths": [string],
  "concerns": [string],
  "redFlags": [string],
  "verificationNeeded": [string],
  "summary": string,
  "incomeToRentRatio": string (if income provided),
  "suggestedActions": [string]
}

Consider Canadian tenant screening best practices and legal requirements.`;

    const response = await model.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = modelText(response);
    const screening = jsonFromText(responseText) ?? {
      riskScore: 50,
      riskLevel: 'medium',
      recommendation: 'conditional',
      strengths: [],
      concerns: ['Insufficient data for complete analysis'],
      redFlags: [],
      verificationNeeded: ['All information'],
      summary: 'Unable to complete screening with provided information',
      suggestedActions: ['Request complete application'],
    };

    return { status: 200, body: { success: true, screening } };
  } catch (error) {
    console.log('AI tenant screening error:', error);
    return { status: 500, body: { error: 'Failed to screen tenant' } };
  }
}

const HANDLERS = {
  'rent-estimate': handleRentEstimate,
  'compare-listings': handleCompareListings,
  'explain-lease': handleExplainLease,
  chat: handleChat,
  'voice-command': handleVoiceCommand,
  'screen-tenant': handleScreenTenant,
};

export async function dispatchAiRequest({
  authorizationHeader,
  anonKey,
  getUser,
  increment,
  path,
  body,
  readBody,
  model,
  kv,
  nowMs,
  limit,
  windowSecs,
}) {
  const auth = await authenticateCaller({ authorizationHeader, anonKey, getUser });
  if (!auth.ok) {
    return { status: auth.status, body: { error: auth.error } };
  }

  if (!Object.prototype.hasOwnProperty.call(HANDLERS, path)) {
    return { status: 404, body: { error: 'Not found' } };
  }

  let parsed = body ?? {};
  if (readBody) {
    try {
      parsed = await readBody();
    } catch {
      return { status: 400, body: { error: 'Invalid JSON body' } };
    }
  }

  const quota = await consumeAiUserQuota({
    userId: auth.user.id,
    increment,
    nowMs,
    limit,
    windowSecs,
  });
  if (!quota.ok) {
    const headers = quota.retryAfter ? { 'Retry-After': quota.retryAfter } : undefined;
    return { status: quota.status, body: { error: quota.error }, headers };
  }

  return HANDLERS[path](parsed, { model, user: auth.user, kv });
}
