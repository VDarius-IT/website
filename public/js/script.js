document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userAccountDiv = document.getElementById('user-account');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon'); // Get reference to icon span
    // Removed language option constants

    // --- Theme Toggling ---
    // Function to apply theme based on stored preference or default
    const applyTheme = (theme) => {
        // Apply class to HTML element now
        document.documentElement.classList.remove('light-mode', 'dark-mode');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme); // Store preference
        // Update icon based on theme
        if (themeIcon) {
            themeIcon.innerHTML = theme === 'light-mode' ? '☀️' : '🌙';
        }
    };

    // Initial theme is set by inline script in <head>
    // We just need to ensure the icon matches the initial theme
    const initialTheme = localStorage.getItem('theme') || 'dark-mode';
    if (themeIcon) {
        themeIcon.innerHTML = initialTheme === 'light-mode' ? '☀️' : '🌙';
    }
    // Removed: applyTheme(savedTheme); - Handled by inline script

    // Theme toggle button event listener
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            // Check class on HTML element now
            const currentTheme = document.documentElement.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
            applyTheme(currentTheme);
        });
    }

    // --- Sidebar Toggling ---
    const openSidebar = () => {
        if (sidebar) {
            sidebar.classList.add('open');
            localStorage.setItem('sidebarState', 'open');
        }
    };

    const closeSidebar = () => {
        if (sidebar) {
            sidebar.classList.remove('open');
            localStorage.setItem('sidebarState', 'closed');
        }
    };

    // Check initial sidebar state on page load
    if (sidebar && localStorage.getItem('sidebarState') === 'open') {
        openSidebar(); // Keep it open if it was open before navigation
    }

    // Menu button toggles sidebar
    if (menuToggleButton && sidebar) {
        menuToggleButton.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close button closes sidebar
    if (closeSidebarButton && sidebar) {
        closeSidebarButton.addEventListener('click', () => {
            closeSidebar();
        });
    }

    // Close sidebar if clicking outside of it
    document.addEventListener('click', (event) => {
        // Ensure sidebar exists and the click target is valid before proceeding
        if (!sidebar || !event.target) return;

        // Check if the click is outside the sidebar and not the menu toggle button
        if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && event.target !== menuToggleButton) {
           closeSidebar();
        }
    });


    // --- Language Toggle Switch ---
    const languageSwitchCheckbox = document.getElementById('language-switch-checkbox');
    if (languageSwitchCheckbox) {
        // Set initial state based on HTML lang attribute
        const currentLang = document.documentElement.lang || 'en'; // Default to 'en' if not set
        languageSwitchCheckbox.checked = currentLang === 'de';

        languageSwitchCheckbox.addEventListener('change', () => {
            const targetLang = languageSwitchCheckbox.checked ? 'de' : 'en';
            const currentPath = window.location.pathname;
            const currentSearchParams = new URLSearchParams(window.location.search);

            currentSearchParams.set('lng', targetLang); // Set the new language parameter

            // Construct the new URL
            const newSearchString = currentSearchParams.toString();
            const newUrl = currentPath + (newSearchString ? '?' + newSearchString : '');

            // Navigate to the new URL
            window.location.href = newUrl;
        });
    }


    // --- Placeholder Login/Logout ---
    if (loginButton && userAccountDiv) {
        loginButton.addEventListener('click', () => {
            // In a real app, this would involve authentication
            console.log('Login button clicked - showing user account section');
            loginButton.style.display = 'none';
            userAccountDiv.style.display = 'block'; // Or 'flex', 'inline-block' etc. depending on desired layout
        });
    }

    if (logoutButton && loginButton && userAccountDiv) {
         logoutButton.addEventListener('click', () => {
            // In a real app, this would clear session/token
            console.log('Logout button clicked - hiding user account section');
            userAccountDiv.style.display = 'none';
            loginButton.style.display = 'block'; // Or 'inline-block' etc.
        });
    }

});