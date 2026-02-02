interface Env {
  OPENAI_API_KEY: string;
}

interface ModerationRequest {
  imageBase64: string;
}

interface ModerationResponse {
  safe: boolean;
  reason: string;
}

// Prompt adapted from moderate-review.ts to ensure strictness (e.g. catching PDA/nudity)
const SYSTEM_PROMPT = `You are an image content moderator for a restaurant review site.
Analyze the user's image to ensure it is family-friendly.

- Rules: Flag content that is not family-friendly. This includes violence, nudity, offensive symbols, and Public Displays of Affection (PDA) like kissing.
- Safe Content: Photos of food, drinks, restaurant environments, and portraits of people are generally safe.

Output only a JSON object: { "safe": boolean, "reason": "string" }.
If safe, reason is "". If unsafe, use the generic reason "Image is too explicit."`;

const createErrorResponse = (reason: string, status: number, corsHeaders: HeadersInit) => {
  return new Response(
    JSON.stringify({ success: false, error: { reason } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

const createSuccessResponse = (data: any, corsHeaders: HeadersInit) => {
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    const OPENAI_API_KEY = context.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return createErrorResponse('Server configuration error', 500, corsHeaders);
    }

    const { imageBase64 }: ModerationRequest = await context.request.json();

    if (!imageBase64) {
      return createSuccessResponse({ safe: true, reason: '' }, corsHeaders);
    }

    console.log('Processing avatar moderation request');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: [
              { type: 'image_url', image_url: { url: imageBase64 } }
            ] 
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      // Fail open so users aren't blocked by API errors
      return createSuccessResponse({ safe: true, reason: 'Moderation check failed, approved by default.' }, corsHeaders);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return createSuccessResponse({ safe: true, reason: 'Moderation check failed, approved by default.' }, corsHeaders);
    }

    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7, -3).trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3, -3).trim();
    }
    
    const result: ModerationResponse = JSON.parse(jsonContent);
    return createSuccessResponse(result, corsHeaders);

  } catch (error) {
    console.error('Moderation error:', error);
    return createErrorResponse('Unable to verify content.', 500, corsHeaders);
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
};
