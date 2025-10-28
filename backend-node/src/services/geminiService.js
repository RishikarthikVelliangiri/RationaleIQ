import dotenv from 'dotenv';

// Ensure environment variables load before constructing the service
dotenv.config();

class GeminiService {
  constructor() {
    this.defaultApiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-2.0-flash-001';
    // Use v1 endpoint directly since v1beta doesn't accept our API key
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models';

    if (!this.defaultApiKey) {
      console.log('GeminiService: No default GEMINI_API_KEY set - will use user-provided keys');
    } else {
      console.log('GeminiService initialized with default API key (first 6 chars):', this.defaultApiKey.substring(0, 6));
    }
    console.log('GeminiService using model:', this.model);
  }

  // Get API key from request or use default
  getApiKey(apiKey = null) {
    return apiKey || this.defaultApiKey;
  }

  async extractDecisions(transcriptText, customPrompt = '', maxDecisions = 1, apiKey = null) {
    const effectiveApiKey = this.getApiKey(apiKey);
    // When custom prompt is provided, we want focused extraction
    const isFocusedAnalysis = customPrompt && customPrompt.trim() !== ''
    
    // Check if multiple documents are being analyzed
    const hasMultipleDocs = transcriptText.includes('===') && transcriptText.split('===').length > 2
    
    const customFocusSection = isFocusedAnalysis ? `
🎯 **CRITICAL: USER'S ANALYSIS QUESTION**
"${customPrompt}"

**YOUR TASK:**
${hasMultipleDocs 
  ? `Analyze the ${transcriptText.split('===').length - 1} documents below as a COMBINED dataset.` 
  : 'Analyze the document below.'}
Extract UP TO ${maxDecisions} strategic insight${maxDecisions > 1 ? 's' : ''}/decision${maxDecisions > 1 ? 's' : ''} that DIRECTLY answer${maxDecisions === 1 ? 's' : ''} this question.
${hasMultipleDocs 
  ? 'Synthesize information across ALL documents - look for patterns, connections, and comprehensive insights.' 
  : ''}
This is NOT a general analysis - focus ONLY on what the user is asking about.
If the documents don't contain enough relevant information, extract fewer insights (quality over quantity).
` : ''

    const prompt = `
You are a senior management consultant and strategic decision analyst with decades of experience advising Fortune 500 companies, government agencies, and venture-backed startups.

${customFocusSection}

${isFocusedAnalysis ? `
**FOCUSED EXTRACTION MODE:**
- Extract UP TO ${maxDecisions} decision${maxDecisions > 1 ? 's' : ''}/insight${maxDecisions > 1 ? 's' : ''} that answer${maxDecisions === 1 ? 's' : ''} the user's question above
- Make them highly relevant to what they're asking about
- Provide concise rationale (1-2 sentences MAXIMUM)
- Be specific with data, numbers, timelines when available
` : `
**GENERAL EXTRACTION MODE:**
Your mission: Analyze business documents to extract strategic, operational, technical, and financial decisions.

INSTRUCTIONS:
• Identify key decisions that were made, approved, or ratified
• Look for explicit decisions (voted on, approved, authorized) AND implicit decisions (recommendations accepted, plans endorsed)
• Extract complete strategic context, not just surface-level information
• Pay attention to: resource allocation, strategic direction, risk acceptance, technical choices, organizational changes, investment decisions

QUALITY STANDARDS:
- Extract 1-${maxDecisions} decisions depending on document complexity
- Each decision should be independently understandable
- Rationale should be CONCISE (1-2 sentences MAXIMUM)
- Be specific about numbers, timelines, alternatives, risks
`}

For each decision identified, provide:
1. **Decision**: The specific action, commitment, or direction that was decided (be precise and actionable)
2. **Rationale**: CONCISE reasoning (MAXIMUM 1-2 sentences) - keep it brief and focused
3. **Category**: Classify as Cost, Technical, Operational, Strategic, or Other
4. **Summary**: Executive-level 1 sentence synopsis
5. **ConfidenceScore**: Your confidence in this decision extraction (0-100, where 100 = extremely confident)
6. **EvidenceQuotes**: 1-3 SHORT direct quotes from the text that support this decision (each under 100 characters)
7. **AIReasoning**: Brief explanation of HOW you identified this decision and WHY you're confident (2-3 sentences max)

**CRITICAL RATIONALE RULES:**
- Rationale MUST be 1-2 sentences ONLY
- Keep it under 150 characters if possible
- Focus on the key "why" without elaboration
- NO long explanations or multiple paragraphs

Return the results as a JSON array with this exact structure:
[
  {
    "decision": "the decision made",
    "rationale": "brief 1-2 sentence reasoning",
    "category": "Cost|Technical|Operational|Strategic|Other",
    "summary": "brief summary",
    "confidenceScore": 85,
    "evidenceQuotes": ["short quote 1", "short quote 2"],
    "aiReasoning": "Brief explanation of how you identified this decision and why you're confident about it."
  }
]

Document to analyze:
${transcriptText}

${isFocusedAnalysis ? `Remember: Extract UP TO ${maxDecisions} decision${maxDecisions > 1 ? 's' : ''} that answer${maxDecisions === 1 ? 's' : ''} the user's question. Keep rationale BRIEF (1-2 sentences).` : ''}

Return ONLY the JSON array, no other text.
`;

    try {
      // Make direct HTTP call to v1 endpoint
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${effectiveApiKey}`;

      console.log('Gemini extractDecisions request URL:', `${this.baseUrl}/${this.model}:generateContent`);
      console.log('Gemini API key present?', Boolean(effectiveApiKey));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to extract decisions from transcript');
    }
  }

  async answerQuestion(query, decisions, apiKey = null) {
    const effectiveApiKey = this.getApiKey(apiKey);
    
    const decisionsContext = decisions.map(d => 
      `Decision: ${d.decision}\nRationale: ${d.rationale}\nCategory: ${d.category}`
    ).join('\n\n');

    const prompt = `
You are an elite strategic advisor and business intelligence analyst with deep expertise across finance, technology, operations, and corporate strategy. You have advised C-suite executives at Fortune 100 companies, investment committees at top-tier VC firms, and boards of directors at publicly-traded corporations.

Your communication style is:
• Precise and data-driven, citing specific facts from the context
• Strategic and forward-thinking, connecting decisions to business outcomes
• Concise yet comprehensive, delivering maximum insight in minimum words
• Confident and authoritative, reflecting deep domain expertise
• Objective and balanced, acknowledging trade-offs and risks

CONTEXT - Strategic Business Decisions:
${decisionsContext}

USER QUESTION:
${query}

INSTRUCTIONS:
1. Analyze the question through the lens of a senior executive or board member
2. Synthesize insights from the available decision context
3. Provide a clear, actionable answer that demonstrates strategic understanding
4. If the question relates to multiple decisions, connect the dots and show relationships
5. If the context doesn't contain sufficient information, acknowledge this professionally and provide your best strategic guidance based on what is available
6. Use bullet points for clarity when listing multiple items
7. Cite specific decisions/rationales when relevant

Provide your expert analysis and answer:
`;

    try {
      // Make direct HTTP call to v1 endpoint
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${effectiveApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate answer');
    }
  }

  async generateExplanation(prompt, apiKey = null) {
    const effectiveApiKey = this.getApiKey(apiKey);
    
    try {
      // Make direct HTTP call to v1 endpoint
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${effectiveApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate explanation');
    }
  }
}

export default new GeminiService();
