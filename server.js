const express = require('express');
const path = require('path');
const i18next = require('i18next');
const i18nextFsBackend = require('i18next-fs-backend');
const i18nextHttpMiddleware = require('i18next-http-middleware');

const app = express();
// Adjusted default port based on user feedback during deployment phase
const port = process.env.PORT || 6091; // Changed port to 6091 due to conflict

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

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Apply i18next middleware
app.use(i18nextHttpMiddleware.handle(i18next));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the home page - Render unified home.ejs
app.get('/', (req, res) => {
  // Pass t function and i18n instance to the template
  // Ensure both t and i18n are passed
  res.render('pages/home', { t: req.t, i18n: req.i18n });
});

// Routes for the 10 blank pages - Use generic page template
for (let i = 1; i <= 10; i++) {
  app.get(`/page${i}`, (req, res) => {
    // Pass t function, i18n instance, and pageNum for interpolation
    res.render('pages/page', {
      t: req.t,
      i18n: req.i18n,
      pageNum: i
    });
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});