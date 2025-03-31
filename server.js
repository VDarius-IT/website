const express = require('express');
const path = require('path');
// Removed unused fs.promises
const i18next = require('i18next');
const i18nextFsBackend = require('i18next-fs-backend');
const i18nextHttpMiddleware = require('i18next-http-middleware');

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

// 404 Handler - Must be the last route handler
// Renders the 404 EJS template directly
app.use((req, res, next) => {
  res.status(404).render('pages/404', { t: req.t, i18n: req.i18n });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});