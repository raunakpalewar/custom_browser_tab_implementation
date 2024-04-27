document.addEventListener('DOMContentLoaded', function() {
    const addTabButton = document.getElementById('add-tab-btn');
    const tabsContainer = document.getElementById('tabs-container');
    const iframeContainer = document.getElementById('iframe-container');
    const searchInput = document.getElementById('search-input');
    const backButton = document.getElementById('back-button');
    const forwardButton = document.getElementById('forward-button');
    const reloadButton = document.getElementById('reload-button');
    const homeButton = document.getElementById('home-button');
    
    // Initialize an array to store tab states and titles
    const tabStates = [];
    const tabTitles = [];
    const tabIds = []; // Array to store tab ids
    const iframes = {}; // Object to store references to iframes

    addTabButton.addEventListener('click', addTab);
    backButton.addEventListener('click', goBack);
    forwardButton.addEventListener('click', goForward);
    reloadButton.addEventListener('click', reloadPage);
    homeButton.addEventListener('click', goHome);
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            search();
        }
    });

    function addTab() {
        const newTabId = generateTabId();
        const newTab = createTab(newTabId);
        const newIFrame = createIFrame(newTabId);
        tabsContainer.appendChild(newTab);
        iframeContainer.appendChild(newIFrame);
        tabIds.push(newTabId); // Add the new tab id to the array
        iframes[newTabId] = newIFrame; // Store the iframe reference in the object
        tabStates.push({ id: newTabId, steps: [], title: 'New Tab' }); // Initialize tab state
    }

    function createTab(tabId) {
        const tab = document.createElement('div');
        tab.classList.add('tab');
        tab.setAttribute('data-tab-id', tabId); // Set the data attribute for tab id
        const tabTitle = document.createElement('span');
        tabTitle.textContent = 'New Tab';
        tab.appendChild(tabTitle);
        
        tab.addEventListener('click', function() {
            // Remove the 'active' class from all tabs
            const allTabs = tabsContainer.querySelectorAll('.tab');
            allTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            // Add the 'active' class to the clicked tab
            tab.classList.add('active');
            
            // Hide all iframes except the one corresponding to the active tab
            const tabId = tab.getAttribute('data-tab-id');
            for (const id in iframes) {
                if (id === tabId) {
                    iframes[id].style.display = 'block';
                } else {
                    iframes[id].style.display = 'none';
                }
            }

            // Load the previous state of the tab if it's not already loaded
            const tabState = getTabStateById(tabId);
            const iframe = iframes[tabId];
            if (!iframe.getAttribute('data-loaded')) {
                iframe.src = tabState.steps[tabState.steps.length - 1] || 'https://www.bing.com';
                iframe.setAttribute('data-loaded', 'true');
            }
        });
        
        return tab;
    }

    function createIFrame(tabId) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100% - 40px)'; // Adjust height for browser bar
        iframe.style.display = 'none'; // Hide the iframe initially
        iframe.src = 'https://www.bing.com';
        iframe.setAttribute('data-tab-id', tabId); // Set the data attribute for tab id
        iframe.setAttribute('sandbox', 'allow-same-origin');

        // Listen for messages from the parent window
        window.addEventListener('message', function(event) {
            if (event.data === 'back') {
                iframe.contentWindow.history.back();
            }
        });

        return iframe;
    }

    function goBack() {
        const activeTabId = getActiveTabId();
        const tabState = getTabStateById(activeTabId);
        const iframe = iframes[activeTabId];
        if (tabState.steps.length > 1) {
            tabState.steps.pop(); // Remove the current step
            const previousStep = tabState.steps[tabState.steps.length - 1]; // Get the previous step
            iframe.src = previousStep; // Navigate to the previous step
        } else {
            // Send a message to the iframe to trigger a back action
            iframe.contentWindow.postMessage('back', '*');
        }
    }

    function goForward() {
        const activeTabId = getActiveTabId();
        iframes[activeTabId].contentWindow.history.forward();
    }

    function reloadPage() {
        const activeTabId = getActiveTabId();
        iframes[activeTabId].contentWindow.location.reload();
    }

    function goHome() {
        const activeTabId = getActiveTabId();
        iframes[activeTabId].src = 'https://www.bing.com';
    }

    function search() {
        const activeTabId = getActiveTabId();
        const query = searchInput.value.trim();
        const googleSearchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        iframes[activeTabId].src = googleSearchUrl;
        // Save the state of the tab
        const tabState = getTabStateById(activeTabId);
        tabState.steps.push(googleSearchUrl);
    }

    function getActiveTabId() {
        // Find the index of the active tab
        const activeTab = tabsContainer.querySelector('.tab.active');
        return activeTab.getAttribute('data-tab-id');
    }

    function getTabStateById(tabId) {
        return tabStates.find(tabState => tabState.id === tabId);
    }

    function generateTabId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Show the iframe associated with the initially active tab
    const initialActiveTab = tabsContainer.querySelector('.tab.active');
    if (initialActiveTab) {
        const initialActiveTabId = initialActiveTab.getAttribute('data-tab-id');
        iframes[initialActiveTabId].style.display = 'block';
    }
});
