import geminiService from '../services/geminiService.js';

export const explainDecision = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Use Gemini to generate explanation (use user's key if provided via header)
    const explanation = await geminiService.generateExplanation(prompt, req.geminiApiKey);
    
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message });
  }
};
