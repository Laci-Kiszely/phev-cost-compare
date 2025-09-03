import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configure CORS for production - allow Lovable app domains
const getAllowedOrigins = () => {
  const origins = [
    'https://aknltelxmsattcjwhbwo.lovable.app',
    'http://localhost:5173', // for local development
    'http://localhost:3000', // alternative local port
  ];
  return origins;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically below
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simple rate limiting storage (in-memory for basic protection)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per minute per IP

// Rate limiting function
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);
  
  if (!clientData || (now - clientData.timestamp) > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

interface FeedbackData {
  name: string;
  email: string;
  title?: string;
  feedback: string;
}

Deno.serve(async (req) => {
  // Dynamic CORS handling
  const origin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const corsOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
  
  const dynamicCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': corsOrigin || '*',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCorsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Content-Length to prevent oversized payloads
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB limit
      return new Response(JSON.stringify({ error: 'Request payload too large' }), {
        status: 413,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, title, feedback }: FeedbackData = await req.json();

    // Server-side validation
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!email || !email.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!feedback || !feedback.trim()) {
      return new Response(JSON.stringify({ error: 'Feedback is required' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Length validation
    if (name.trim().length > 100) {
      return new Response(JSON.stringify({ error: 'Name too long (max 100 characters)' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (email.trim().length > 255) {
      return new Response(JSON.stringify({ error: 'Email too long (max 255 characters)' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (title && title.trim().length > 200) {
      return new Response(JSON.stringify({ error: 'Title too long (max 200 characters)' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (feedback.trim().length > 2000) {
      return new Response(JSON.stringify({ error: 'Feedback too long (max 2000 characters)' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key for secure database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert feedback using service role (bypasses RLS)
    const { error } = await supabase
      .from('Feedback_Collecting_DB')
      .insert({
        name_of_poster: name.trim(),
        email_of_poster: email.trim(),
        title_feedback: title?.trim() || null,
        comment_feedback: feedback.trim(),
      });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save feedback' }), {
        status: 500,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Feedback submitted successfully from:', email);

    return new Response(JSON.stringify({ message: 'Feedback submitted successfully' }), {
      status: 200,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in feedback-submit function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
    });
  }
});