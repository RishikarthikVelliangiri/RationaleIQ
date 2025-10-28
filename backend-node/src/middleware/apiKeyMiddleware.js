// Middleware to extract Gemini API key from request headers
// Allows users to provide their own API key
export const extractApiKey = (req, res, next) => {
  // Check for API key in headers (x-gemini-api-key)
  const userApiKey = req.headers['x-gemini-api-key'];
  
  if (userApiKey) {
    // Attach the user's API key to the request object
    req.geminiApiKey = userApiKey;
    console.log('Using user-provided Gemini API key (first 6 chars):', userApiKey.substring(0, 6));
  } else {
    console.log('No user API key provided, will use default if available');
  }
  
  next();
};
