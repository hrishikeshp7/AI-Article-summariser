// Make API request through our secure backend
async function makeApiRequest(prompt, type = 'article') {
    const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, type })
    });

    if (!response.ok) {
        throw new Error('Failed to get response from server');
    }

    return await response.json();
}

// Rest of your existing script.js code here, but remove all API key related code 