// DOM elements
const articleUrlInput = document.getElementById('articleUrl');
const apiKeyInput = document.getElementById('apiKey');
const apiKeySection = document.getElementById('apiKeySection');
const preferencesBtn = document.getElementById('preferencesBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const summarizeBtn = document.getElementById('summarizeBtn');
const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const summaryContent = document.getElementById('summaryContent');
const articleInfo = document.getElementById('articleInfo');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');

// File upload elements
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const summarizeFileBtn = document.getElementById('summarizeFileBtn');

// Image upload elements
const imageInput = document.getElementById('imageInput');
const imageUploadArea = document.getElementById('imageUploadArea');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const imageName = document.getElementById('imageName');
const imageSize = document.getElementById('imageSize');
const removeImageBtn = document.getElementById('removeImage');
const analyzeImageBtn = document.getElementById('analyzeImageBtn');
const analysisType = document.getElementById('analysisType');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// File handling variables
let selectedFile = null;
let selectedImage = null;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('perplexity_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        hideApiKeySection();
    } else {
        showApiKeySection();
    }

    // Save API key when user types
    apiKeyInput.addEventListener('input', function() {
        localStorage.setItem('perplexity_api_key', this.value);
    });

    // Handle preferences button
    preferencesBtn.addEventListener('click', toggleApiKeySection);

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    // Handle theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Handle form submission
    summarizeBtn.addEventListener('click', handleSummarize);
    
    // Handle Enter key in URL input
    articleUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSummarize();
        }
    });

    // Handle copy button
    copyBtn.addEventListener('click', copyToClipboard);

    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Handle file input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Handle file upload area drag and drop
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    // Handle remove file button
    removeFileBtn.addEventListener('click', removeFile);
    
    // Handle summarize file button
    summarizeFileBtn.addEventListener('click', handleSummarizeFile);

    // Handle image input
    imageInput.addEventListener('change', handleImageSelect);
    
    // Handle image upload area drag and drop
    imageUploadArea.addEventListener('dragover', handleImageDragOver);
    imageUploadArea.addEventListener('dragleave', handleImageDragLeave);
    imageUploadArea.addEventListener('drop', handleImageDrop);
    
    // Handle remove image button
    removeImageBtn.addEventListener('click', removeImage);
    
    // Handle analyze image button
    analyzeImageBtn.addEventListener('click', handleAnalyzeImage);
});

// Main function to handle article summarization
async function handleSummarize() {
    const url = articleUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Validation
    if (!url) {
        showError('Please enter an article URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('Please enter a valid URL');
        return;
    }

    if (!apiKey) {
        showError('Please enter your Perplexity API key');
        showApiKeySection();
        return;
    }

    // Show loading state
    showLoading('Analyzing article and generating summary...');
    hideError();
    hideResult();

    try {
        const summary = await summarizeArticle(url, apiKey);
        showResult(summary);
    } catch (error) {
        console.error('Error summarizing article:', error);
        showError(error.message || 'Failed to summarize article. Please try again.');
    }
}

// Function to call Perplexity API
async function summarizeArticle(url, apiKey) {
    const prompt = `Please provide a comprehensive summary of the following article. Include:
1. Main topic and key points
2. Important details and findings
3. Key takeaways
4. Any relevant statistics or data mentioned

Article URL: ${url}

Please format the summary in a clear, structured way with headings and bullet points where appropriate.`;

    const requestBody = {
        model: "sonar",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that provides clear, accurate, and well-structured summaries of articles. Focus on extracting the most important information and presenting it in an organized manner."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.9,
        return_citations: false,
        return_images: false
    };

    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(response.status, errorData));
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from Perplexity API');
    }

    return {
        summary: data.choices[0].message.content,
        usage: data.usage,
        model: data.model
    };
}

// Function to get user-friendly error messages
function getErrorMessage(status, errorData) {
    switch (status) {
        case 401:
            return 'Invalid API key. Please check your Perplexity API key and try again.';
        case 403:
            return 'API key doesn\'t have permission to access this service.';
        case 429:
            return 'Rate limit exceeded. Please wait a moment and try again.';
        case 400:
            return errorData.error?.message || 'Invalid request. Please check your input.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return `API request failed (${status}). Please try again.`;
    }
}

// Tab switching function
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    // Clear any existing results/errors
    hideResult();
    hideError();
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processSelectedFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processSelectedFile(files[0]);
    }
}

function processSelectedFile(file) {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        showError(`File size (${formatFileSize(file.size)}) exceeds the 5MB limit. Please choose a smaller file.`);
        return;
    }

    // Validate file type
    const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'text/html'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx|md|html|htm)$/i)) {
        showError('Unsupported file type. Please upload a TXT, PDF, DOC, DOCX, MD, or HTML file.');
        return;
    }

    selectedFile = file;
    displayFileInfo(file);
    hideError();
}

function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = `(${formatFileSize(file.size)})`;
    fileInfo.style.display = 'flex';
    summarizeFileBtn.style.display = 'inline-flex';
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    summarizeFileBtn.style.display = 'none';
    hideError();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getAnalysisTypeLabel(analysisType) {
    const labels = {
        describe: 'Image Description',
        extract_text: 'Text Extraction (OCR)',
        analyze_content: 'Content Analysis',
        identify_objects: 'Object Identification'
    };
    return labels[analysisType] || analysisType;
}

// API Key section management functions
function showApiKeySection() {
    apiKeySection.style.display = 'block';
    apiKeyInput.focus();
}

function hideApiKeySection() {
    apiKeySection.style.display = 'none';
}

function toggleApiKeySection() {
    if (apiKeySection.style.display === 'none') {
        showApiKeySection();
    } else {
        hideApiKeySection();
    }
}

// Function to handle file summarization
async function handleSummarizeFile() {
    const apiKey = apiKeyInput.value.trim();

    if (!selectedFile) {
        showError('Please select a file to summarize');
        return;
    }

    if (!apiKey) {
        showError('Please enter your Perplexity API key');
        showApiKeySection();
        return;
    }

    showLoading('Analyzing document and generating summary...');
    hideError();
    hideResult();

    try {
        const fileContent = await readFileContent(selectedFile);
        const summary = await summarizeFileContent(fileContent, selectedFile.name, apiKey);
        showResult(summary);
    } catch (error) {
        console.error('Error summarizing file:', error);
        showError(error.message || 'Failed to summarize file. Please try again.');
    }
}

// Function to read file content
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let content = e.target.result;
                
                // For text files, use the content as is
                if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'text/html') {
                    resolve(content);
                } else {
                    // For other file types, we'll need to extract text
                    // This is a simplified approach - in a real app you might want to use libraries like pdf.js for PDFs
                    resolve(content);
                }
            } catch (error) {
                reject(new Error('Failed to read file content'));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        // Read as text for now (simplified approach)
        reader.readAsText(file);
    });
}

// Function to summarize file content
async function summarizeFileContent(content, fileName, apiKey) {
    const prompt = `Please provide a comprehensive summary of the following file content. Include:
1. Main topic and key points
2. Important details and findings
3. Key takeaways
4. Any relevant statistics or data mentioned

File Name: ${fileName}
Content:
${content.substring(0, 50000)} // Limit content to 50KB to avoid token limits

Please format the summary in a clear, structured way with headings and bullet points where appropriate.`;

    const requestBody = {
        model: "sonar",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that provides clear, accurate, and well-structured summaries of documents and files. Focus on extracting the most important information and presenting it in an organized manner."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.9,
        return_citations: false,
        return_images: false
    };

    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(response.status, errorData));
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from Perplexity API');
    }

    return {
        summary: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        fileName: fileName
    };
}

// Image handling functions
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processSelectedImage(file);
    }
}

function handleImageDragOver(event) {
    event.preventDefault();
    imageUploadArea.classList.add('dragover');
}

function handleImageDragLeave(event) {
    event.preventDefault();
    imageUploadArea.classList.remove('dragover');
}

function handleImageDrop(event) {
    event.preventDefault();
    imageUploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processSelectedImage(files[0]);
    }
}

function processSelectedImage(file) {
    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
        showError(`Image size (${formatFileSize(file.size)}) exceeds the 10MB limit. Please choose a smaller image.`);
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file (JPG, PNG, GIF, WebP).');
        return;
    }

    selectedImage = file;
    displayImagePreview(file);
    hideError();
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        imageName.textContent = file.name;
        imageSize.textContent = `(${formatFileSize(file.size)})`;
        imagePreview.style.display = 'flex';
        analyzeImageBtn.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImage = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
    analyzeImageBtn.style.display = 'none';
    hideError();
}

// Function to handle image analysis
async function handleAnalyzeImage() {
    const apiKey = apiKeyInput.value.trim();

    if (!selectedImage) {
        showError('Please select an image to analyze');
        return;
    }

    if (!apiKey) {
        showError('Please enter your Perplexity API key');
        showApiKeySection();
        return;
    }

    showLoading('Analyzing image and generating analysis...');
    hideError();
    hideResult();

    try {
        const imageBase64 = await convertImageToBase64(selectedImage);
        const analysisType = document.getElementById('analysisType').value;
        const summary = await analyzeImageContent(imageBase64, selectedImage.name, analysisType, apiKey);
        showResult(summary);
    } catch (error) {
        console.error('Error analyzing image:', error);
        showError(error.message || 'Failed to analyze image. Please try again.');
    }
}

// Function to convert image to base64
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function() {
            reject(new Error('Failed to read image file'));
        };
        reader.readAsDataURL(file);
    });
}

// Function to analyze image content
async function analyzeImageContent(imageBase64, imageName, analysisType, apiKey) {
    const analysisPrompts = {
        describe: "Please provide a detailed description of this image. Include what you see, the main subjects, colors, composition, and any notable details.",
        extract_text: "Please extract and transcribe any text visible in this image. If there are multiple text elements, organize them clearly.",
        analyze_content: "Please analyze the content of this image. What is happening? What are the main elements? What might be the context or purpose?",
        identify_objects: "Please identify and list all the objects, people, animals, or other elements visible in this image. Be specific about what you can see."
    };

    const prompt = analysisPrompts[analysisType] || analysisPrompts.describe;

    const requestBody = {
        model: "sonar",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that can analyze images and provide detailed, accurate descriptions and analysis. Be thorough and specific in your observations."
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageBase64
                        }
                    }
                ]
            }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 0.9,
        return_citations: false,
        return_images: false
    };

    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(response.status, errorData));
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from Perplexity API');
    }

    return {
        summary: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        imageName: imageName,
        analysisType: analysisType
    };
}

// Function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// UI helper functions
function showLoading(message = 'Analyzing article and generating summary...') {
    loadingSection.style.display = 'block';
    loadingText.textContent = message;
    summarizeBtn.disabled = true;
    summarizeFileBtn.disabled = true;
    analyzeImageBtn.disabled = true;
    summarizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...';
    summarizeFileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...';
    analyzeImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
}

function hideLoading() {
    loadingSection.style.display = 'none';
    summarizeBtn.disabled = false;
    summarizeFileBtn.disabled = false;
    analyzeImageBtn.disabled = false;
    summarizeBtn.innerHTML = '<i class="fas fa-magic"></i> Summarize';
    summarizeFileBtn.innerHTML = '<i class="fas fa-magic"></i> Summarize File';
    analyzeImageBtn.innerHTML = '<i class="fas fa-eye"></i> Analyze Image';
}

function showResult(data) {
    hideLoading();
    
    // Format the summary content
    const formattedSummary = formatSummary(data.summary);
    summaryContent.innerHTML = formattedSummary;
    
    // Add metadata based on source type
    let metadata = `
        <h4><i class="fas fa-info-circle"></i> Summary Details</h4>
        <p><strong>Model:</strong> ${data.model}</p>
        <p><strong>Tokens Used:</strong> ${data.usage?.total_tokens || 'N/A'}</p>
    `;
    
    if (data.imageName) {
        // Image analysis
        metadata += `<p><strong>Image Name:</strong> ${data.imageName}</p>`;
        metadata += `<p><strong>Analysis Type:</strong> ${getAnalysisTypeLabel(data.analysisType)}</p>`;
    } else if (data.fileName) {
        // File summary
        metadata += `<p><strong>File Name:</strong> ${data.fileName}</p>`;
    } else {
        // URL summary
        metadata += `<p><strong>Source URL:</strong> <a href="${articleUrlInput.value}" target="_blank">${articleUrlInput.value}</a></p>`;
    }
    
    articleInfo.innerHTML = metadata;
    
    resultSection.style.display = 'block';
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult() {
    resultSection.style.display = 'none';
}

function showError(message) {
    hideLoading();
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // If it's an API key error, show the API key section
    if (message.includes('API key')) {
        showApiKeySection();
    }
}

function hideError() {
    errorSection.style.display = 'none';
}

// Function to format summary with proper HTML
function formatSummary(summary) {
    // Convert markdown-style formatting to HTML
    let formatted = summary
        // Convert headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^# (.*$)/gim, '<h3>$1</h3>')
        // Convert bullet points
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Convert numbered lists
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        // Convert bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert line breaks to paragraphs
        .split('\n\n')
        .map(paragraph => {
            paragraph = paragraph.trim();
            if (paragraph.startsWith('<h3>') || paragraph.startsWith('<li>')) {
                return paragraph;
            }
            if (paragraph.includes('<li>')) {
                return `<ul>${paragraph}</ul>`;
            }
            return paragraph ? `<p>${paragraph}</p>` : '';
        })
        .join('');

    return formatted;
}

// Function to copy summary to clipboard
async function copyToClipboard() {
    try {
        const summaryText = summaryContent.innerText;
        await navigator.clipboard.writeText(summaryText);
        
        // Show success feedback
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = summaryContent.innerText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success feedback
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    }
}

// Add some helpful tips
function showTips() {
    const tips = [
        'Make sure the URL is publicly accessible',
        'The API key is stored locally in your browser',
        'You can summarize articles from most news sites and blogs',
        'The summary includes key points and main takeaways'
    ];
    
    console.log('💡 Tips for using the Article Summarizer:');
    tips.forEach((tip, index) => {
        console.log(`${index + 1}. ${tip}`);
    });
}



// Theme management functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.title = 'Switch to Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.title = 'Switch to Dark Mode';
    }
}

// Show tips when page loads
document.addEventListener('DOMContentLoaded', showTips); 