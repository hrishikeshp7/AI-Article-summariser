// Default API key configuration
const config = {
    // Replace this with your actual Perplexity API key
    defaultApiKey: 'YOUR_API_KEY_HERE',
    
    // API configuration
    apiEndpoint: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar',
    maxTokens: 2000,
    temperature: 0.3
};

// Don't modify below this line
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
} 