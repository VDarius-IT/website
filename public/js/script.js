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

    // --- AI Chat Functionality ---
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const mockApiCheckbox = document.getElementById('mock-api-checkbox');
        const providerSelect = document.getElementById('provider-select'); // Get provider dropdown
        const subModelSelect = document.getElementById('sub-model-select'); // Get sub-model dropdown

        // --- Define Model Lists ---
        const models = {
            openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'], // Keep existing list as per user instruction
            gemini: ['gemini-2.5-pro-exp-03-25', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-1.5-flash', 'learnlm-1.5-pro-experimental'], // Keep existing list as per user instruction
            deepseek: ['deepseek-chat', 'deepseek-reasoner'], // From user feedback
            openrouter: [ // From user feedback
                'nvidia/llama-3.1-nemotron-70b-instruct:free',
                'deepseek/deepseek-r1-distill-llama-70b:free',
                'qwen/qwen2.5-vl-72b-instruct:free',
                'bytedance-research/ui-tars-72b:free',
                'deepseek/deepseek-v3-base:free',
                'deepseek/deepseek-r1-zero:free',
                'mistralai/mistral-small-24b-instruct-2501:free'
            ]
        };

        // --- Function to Populate Sub-Model Dropdown ---
        const populateSubModels = (provider) => {
            if (!subModelSelect) return;
            const modelList = models[provider] || [];
            subModelSelect.innerHTML = ''; // Clear existing options

            modelList.forEach(modelName => {
                const option = document.createElement('option');
                option.value = modelName;
                option.textContent = modelName;
                subModelSelect.appendChild(option);
            });
        };

        // --- Initial Population & Event Listener ---
        // Populate based on default selected provider dropdown value
        const defaultProvider = providerSelect ? providerSelect.value : 'gemini';
        populateSubModels(defaultProvider);

        // Add event listener to provider dropdown
        if (providerSelect) {
            providerSelect.addEventListener('change', (event) => {
                populateSubModels(event.target.value);
            });
        }


        const addMessage = (sender, text) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', `${sender}-message`);
            // Basic text sanitization (replace < and > to prevent HTML injection)
            const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            messageElement.innerHTML = sanitizedText; // Use innerHTML to render potential line breaks if needed later
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            return messageElement; // Return the element for potential removal (e.g., typing indicator)
        };

        const handleSendMessage = async () => {
            const messageText = chatInput.value.trim();
            if (!messageText) return;

            // Determine selected provider from dropdown
            const selectedProviderValue = providerSelect ? providerSelect.value : 'gemini'; // Default to gemini

            // Determine selected sub-model
            const selectedSubModelValue = subModelSelect ? subModelSelect.value : null;
            if (!selectedSubModelValue) {
                 addMessage('system', 'Error: Please select a specific model.'); // Add basic validation
                 return;
            }

            // Determine mock state
            const useMockValue = mockApiCheckbox ? mockApiCheckbox.checked : false;

            addMessage('user', messageText);
            chatInput.value = ''; // Clear input

            // Add thinking indicator
            const thinkingIndicator = addMessage('system', 'AI is thinking...');

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: messageText,
                        selectedProvider: selectedProviderValue, // Use 'selectedProvider' key
                        subModel: selectedSubModelValue,         // Send the specific model
                        useMock: useMockValue
                     }),
                });

                // Remove thinking indicator regardless of success/failure
                if (thinkingIndicator) {
                    chatMessages.removeChild(thinkingIndicator);
                }

                if (!response.ok) {
                    let errorMsg = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {
                        // Ignore if response is not JSON
                    }
                    addMessage('system', `Error: ${errorMsg}`);
                    return;
                }

                const data = await response.json();
                if (data.response) {
                    addMessage('ai', data.response);
                } else {
                     addMessage('system', 'Error: Received an empty response from the AI.');
                }

            } catch (error) {
                 // Remove thinking indicator if fetch failed
                if (thinkingIndicator && chatMessages.contains(thinkingIndicator)) {
                    chatMessages.removeChild(thinkingIndicator);
                }
                console.error('Chat fetch error:', error);
                addMessage('system', `Error sending message: ${error.message}`);
            }
        };

        if (sendButton) {
            sendButton.addEventListener('click', handleSendMessage);
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevent default form submission if it were in a form
                    handleSendMessage();
                }
            });
        }
    }

});