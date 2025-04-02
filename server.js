require('dotenv').config(); // Load environment variables from .env file
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const OpenAI = require('openai'); // Import OpenAI library
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import Google AI library
// Removed unused fs.promises
const i18next = require('i18next');
const i18nextFsBackend = require('i18next-fs-backend');
const i18nextHttpMiddleware = require('i18next-http-middleware');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
// Adjusted default port based on user feedback during deployment phase
const port = process.env.PORT || 6091; // Changed port to 6093 due to persistent EADDRINUSE conflict

// i18next configuration
i18next
  .use(i18nextFsBackend)
  .use(i18nextHttpMiddleware.LanguageDetector) // Detect language from request
  .init({
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'), // Path to translation files
    },
    fallbackLng: 'en', // Default language
    supportedLngs: ['en', 'de'], // Supported languages
    ns: ['translation'], // Namespace for translation files
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // Allow HTML in translations using <%- %> in EJS
    },
    detection: {
      order: ['querystring', 'cookie', 'header'], // Detection order: ?lng=..., cookie, Accept-Language header
      caches: ['cookie'], // Cache detected language in a cookie
      lookupQuerystring: 'lng', // Query parameter name
      lookupCookie: 'i18next', // Cookie name
    }
  });

// Explicitly set EJS as the engine for .ejs files // Removed - app.set should be sufficient
// app.engine('ejs', require('ejs').renderFile);
// Set the view engine to EJS
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));
// Disable view caching for development (ensures template changes are reflected)
app.disable('view cache');

// Apply i18next middleware
app.use(i18nextHttpMiddleware.handle(i18next)); // Re-enabled

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the home page - Render unified home.ejs
app.get('/', (req, res) => {
  // Pass t function and i18n instance to the template
  // Ensure both t and i18n are passed
  res.render('pages/home', { t: req.t, i18n: req.i18n });
});

// Route for About page
app.get('/about', (req, res) => {
  // Render the specific EJS template for the about page (back in views/pages/)
  // Pass t function and i18n instance for translations
  res.render('pages/about', { t: req.t, i18n: req.i18n }); // Restored data object
});

// Route for Projects page
app.get('/projects', (req, res) => {
  // Render the specific EJS template for the projects page
  res.render('pages/projects', { t: req.t, i18n: req.i18n });
});

// Route for Services page
app.get('/services', (req, res) => {
  // Render the specific EJS template for the services page
  res.render('pages/services', { t: req.t, i18n: req.i18n });
});

// Route for AI Chat page
app.get('/aichat', (req, res) => {
  // Render the specific EJS template for the AI chat page
  res.render('pages/aichat', { t: req.t, i18n: req.i18n });
});

// Route for Contact page (content now directly in contact.ejs)
app.get('/contact', (req, res) => {
  // Render the specific EJS template for the contact page
  res.render('pages/contact', { t: req.t, i18n: req.i18n });
});

// Route for Donations page
app.get('/donations', (req, res) => {
  // Render the specific EJS template for the donations page
  res.render('pages/donations', { t: req.t, i18n: req.i18n });
});

// API route for chat
app.post('/api/chat', async (req, res) => {
  // Use selectedProvider to match frontend key
  const { message: userMessage, selectedProvider, subModel, useMock } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }
  // Only require provider and subModel if not using mock
  if (!useMock) {
      if (!selectedProvider) {
        return res.status(400).json({ error: 'Selected provider is required' });
      }
      if (!subModel) {
        return res.status(400).json({ error: 'Specific model selection is required' });
      }
  }


  // Check if mock API should be used (controlled by frontend checkbox)
  if (useMock === true) {
    // Use selectedProvider in log message
    console.log(`Using mock API response for /api/chat (Provider: ${selectedProvider})`);
    // Simulate network delay and return a mock response
    return setTimeout(() => {
      // Use selectedProvider in mock response
      res.json({ response: `Simulated ${selectedProvider} response to: "${userMessage}"` });
    }, 500); // 500ms delay
  }

  // --- Handle Real API Calls ---

  if (selectedProvider === 'gemini') {
    // --- Gemini API Call ---
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API Key not configured.');
      return res.status(500).json({ error: 'Gemini AI service configuration error.' });
    }
    try {
      console.log(`Calling Gemini with model: ${subModel}`); // Log the specific model being used
      const model = genAI.getGenerativeModel({ model: subModel }); // Use subModel from request
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      res.json({ response: text });
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      res.status(500).json({ error: 'An error occurred while processing your request with Gemini.' });
    }

  } else if (selectedProvider === 'openai') {
    // --- OpenAI API Call ---
    // Simplified API Key check
    if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API Key not configured.');
        return res.status(500).json({ error: 'OpenAI service configuration error.' });
    }
    try {
      console.log(`Calling OpenAI with model: ${subModel}`); // Log the specific model being used
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: userMessage }],
        model: subModel, // Use subModel from request
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (aiResponse) {
        res.json({ response: aiResponse });
      } else {
        console.error('No response content from OpenAI:', completion);
        res.status(500).json({ error: 'Failed to get response from OpenAI' });
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Avoid sending detailed error info to the client
      if (error.response) {
          console.error('OpenAI API Error Status:', error.response.status);
          console.error('OpenAI API Error Data:', error.response.data);
      }
      res.status(500).json({ error: 'An error occurred while processing your request with OpenAI.' });
    }

  } else if (selectedProvider === 'deepseek') {
    // --- DeepSeek API Call ---
    if (!process.env.DEEPSEEK_API_KEY) {
        console.error('DeepSeek API Key not configured.');
        return res.status(500).json({ error: 'DeepSeek AI service configuration error.' });
    }
    try {
        console.log(`Calling DeepSeek with model: ${subModel}`);
        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: subModel,
                messages: [{ role: 'user', content: userMessage }]
                // Add other parameters like temperature, max_tokens if needed
            })
        });
        if (!deepseekResponse.ok) {
            const errorData = await deepseekResponse.json();
            console.error('DeepSeek API Error:', errorData);
            throw new Error(`DeepSeek API request failed with status ${deepseekResponse.status}`);
        }
        const data = await deepseekResponse.json();
        const aiResponse = data.choices?.[0]?.message?.content;
        if (aiResponse) {
            res.json({ response: aiResponse });
        } else {
            console.error('No response content from DeepSeek:', data);
            res.status(500).json({ error: 'Failed to get response from DeepSeek' });
        }
    } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        res.status(500).json({ error: 'An error occurred while processing your request with DeepSeek.' });
    }

  } else if (selectedProvider === 'openrouter') {
    // --- OpenRouter API Call ---
     if (!process.env.OPENROUTER_API_KEY) {
        console.error('OpenRouter API Key not configured.');
        return res.status(500).json({ error: 'OpenRouter AI service configuration error.' });
    }
    try {
        console.log(`Calling OpenRouter with model: ${subModel}`);
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:6093', // Set Referer
                'X-Title': 'SpecNazz IT Chat' // Optional: Set Title
            },
            body: JSON.stringify({
                model: subModel, // OpenRouter uses model identifier directly
                messages: [{ role: 'user', content: userMessage }]
            })
        });
         if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.json();
            console.error('OpenRouter API Error:', errorData);
            throw new Error(`OpenRouter API request failed with status ${openRouterResponse.status}`);
        }
        const data = await openRouterResponse.json();
        const aiResponse = data.choices?.[0]?.message?.content;
         if (aiResponse) {
            res.json({ response: aiResponse });
        } else {
            console.error('No response content from OpenRouter:', data);
            res.status(500).json({ error: 'Failed to get response from OpenRouter' });
        }
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        res.status(500).json({ error: 'An error occurred while processing your request with OpenRouter.' });
    }

  } else {
    // --- Invalid Provider Selection ---
    return res.status(400).json({ error: 'Invalid AI provider selected.' });
  }
});


// 404 Handler - Must be the last route handler
// Renders the 404 EJS template directly
app.use((req, res, next) => {
  res.status(404).render('pages/404', { t: req.t, i18n: req.i18n });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});