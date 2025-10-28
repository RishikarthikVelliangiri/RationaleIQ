import geminiService from '../services/geminiService.js';

export const explainDecision = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Use Gemini to generate explanation
    const explanation = await geminiService.generateExplanation(prompt);
    
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message });
  }
};
