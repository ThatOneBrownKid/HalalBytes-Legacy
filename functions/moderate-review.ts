interface Env {
  OPENAI_API_KEY: string;
}

interface ModerationRequest {
  reviewText?: string;
  imageBase64?: string;
  moderationType: 'review' | 'image_only' | 'avatar';
}

interface ModerationResponse {
  safe: boolean;
  reason: string;
}

const REVIEW_SYSTEM_PROMPT = `You are an AI content moderator for a Halal restaurant review website. Your job is to analyze user-submitted text reviews and accompanying images to ensure they are appropriate.

Your Rules:

Text Analysis: Scan the review text for profanity, swear words, curse words, hate speech, slurs, or highly offensive language. Common profanities like f***, s***, damn, hell, a**, b****, etc. must be flagged. Be strict about this.

Image Analysis: Scan the image specifically for alcoholic beverages (beer bottles, wine glasses filled with colored liquid, liquor bottles, bar taps).

Contextual Nuance (Crucial): You must use the text to interpret the image. If the image shows a drink that looks like a cocktail, but the review explicitly mentions it is a "mocktail," "virgin drink," or "non-alcoholic," you must mark it as SAFE. Only flag it if it clearly appears to be alcohol and the text does not offer a halal explanation.

Output Format: You must return a strict JSON object in this format: { "safe": boolean, "reason": "string (short explanation for the user if unsafe)" }

If the content is safe, return: { "safe": true, "reason": "" }
If profanity is detected, return something like: { "safe": false, "reason": "Your review contains inappropriate language. Please remove profanity and resubmit." }`;

const IMAGE_ONLY_SYSTEM_PROMPT = `You are an AI content moderator for a Halal restaurant review website. Your job is to analyze user-submitted images to ensure they are appropriate.

Your Rules:

Image Analysis: Scan the image specifically for:
1. Alcoholic beverages (beer bottles, wine glasses filled with colored liquid, liquor bottles, bar taps, cocktails)
2. Inappropriate or offensive content
3. Content unrelated to food/restaurants that may be harmful

Important: Food photography, restaurant interiors, and non-alcoholic beverages are SAFE. Only flag clearly inappropriate content.

Output Format: You must return a strict JSON object in this format: { "safe": boolean, "reason": "string (short explanation for the user if unsafe)" }

If the content is safe, return: { "safe": true, "reason": "" }`;

const AVATAR_SYSTEM_PROMPT = `You are an AI content moderator. Your job is to analyze user-submitted profile avatar images to ensure they are appropriate.

Your Rules:

Image Analysis: Scan the image for:
1. Inappropriate or offensive content
2. Nudity or sexually suggestive content
3. Violence or gore
4. Hate symbols

Normal photos of people, landscapes, artwork, or abstract images are SAFE.

Output Format: You must return a strict JSON object in this format: { "safe": boolean, "reason": "string (short explanation for the user if unsafe)" }

If the content is safe, return: { "safe": true, "reason": "" }`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    const OPENAI_API_KEY = context.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ safe: false, reason: 'Content moderation service is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reviewText, imageBase64, moderationType = 'review' }: ModerationRequest = await context.request.json();

    // For image_only and avatar, we need an image
    if ((moderationType === 'image_only' || moderationType === 'avatar') && !imageBase64) {
      return new Response(
        JSON.stringify({ safe: true, reason: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For review type, we need at least text
    if (moderationType === 'review' && (!reviewText || reviewText.trim().length === 0)) {
      return new Response(
        JSON.stringify({ safe: false, reason: 'Review text is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderating content:', { 
      moderationType,
      textLength: reviewText?.length || 0, 
      hasImage: !!imageBase64 
    });

    // Select appropriate system prompt
    let systemPrompt: string;
    switch (moderationType) {
      case 'avatar':
        systemPrompt = AVATAR_SYSTEM_PROMPT;
        break;
      case 'image_only':
        systemPrompt = IMAGE_ONLY_SYSTEM_PROMPT;
        break;
      default:
        systemPrompt = REVIEW_SYSTEM_PROMPT;
    }

    // Build the message content
    const userContent: any[] = [];

    if (moderationType === 'review' && reviewText) {
      userContent.push({
        type: 'text',
        text: `Please analyze this restaurant review for appropriateness. Be strict about profanity - flag any swear words, curse words, or offensive language:\n\n"${reviewText}"`
      });
    } else if (moderationType === 'image_only') {
      userContent.push({
        type: 'text',
        text: 'Please analyze this restaurant image for appropriateness.'
      });
    } else if (moderationType === 'avatar') {
      userContent.push({
        type: 'text',
        text: 'Please analyze this profile avatar image for appropriateness.'
      });
    }

    // Add image if provided
    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageBase64
        }
      });
    }

    console.log('Calling OpenAI for moderation...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ safe: false, reason: 'Content moderation is temporarily unavailable. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ safe: false, reason: 'Content moderation service needs attention. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Don't block submission if moderation fails unexpectedly
      return new Response(
        JSON.stringify({ safe: true, reason: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ safe: true, reason: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderation raw result:', content);

    // Parse the JSON from the response
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    }
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const result: ModerationResponse = JSON.parse(jsonContent);
    console.log('Moderation parsed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderation error:', error);
    
    return new Response(
      JSON.stringify({ safe: false, reason: 'Unable to verify content. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
