document.addEventListener('DOMContentLoaded', function() {
    const addTabButton = document.getElementById('add-tab-btn');
    const tabsContainer = document.getElementById('tabs-container');
    const iframeContainer = document.getElementById('iframe-container');
    const searchInput = document.getElementById('search-input');
    const backButton = document.getElementById('back-button');
    const forwardButton = document.getElementById('forward-button');
    const reloadButton = document.getElementById('reload-button');
    const homeButton = document.getElementById('home-button');
    
    const tabStates = [];
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
    addTab();

    function addTab() {
        const newTabId = generateTabId();
        const newTab = createTab(newTabId);
        const newIFrame = createIFrame(newTabId);
        tabsContainer.appendChild(newTab);
        iframeContainer.appendChild(newIFrame);
        tabIds.push(newTabId); // Add the new tab id to the array
        iframes[newTabId] = newIFrame; // Store the iframe reference in the object
        
        // Get the title from the search input or use 'New Tab' as default
        const query = searchInput.value.trim();
        const tabTitle = query || 'New Tab';

        tabStates.push({ id: newTabId, steps: [], title: tabTitle }); // Initialize tab state with title
    
        // Automatically navigate to the content of the newest tab iframe
        goToNewestTab();
    
        // Highlight the active tab
        highlightActiveTab();
    }

    function goToNewestTab() {
        // Hide all iframes except the one corresponding to the newest tab
        for (const id in iframes) {
            iframes[id].style.display = 'none';
        }
        
        const newestTabId = tabIds[tabIds.length - 1]; // Get the id of the newest tab
        iframes[newestTabId].style.display = 'block'; // Show the iframe of the newest tab
    }

    function createTab(tabId) {
        const allTabs = tabsContainer.querySelectorAll('.tab');
            allTabs.forEach(function(t) {
                t.classList.remove('active');
            });
        const tab = document.createElement('div');
        tab.classList.add('tab');
        tab.setAttribute('data-tab-id', tabId); // Set the data attribute for tab id
        
        const tabTitle = document.createElement('span');
        tabTitle.textContent = 'New Tab';
        tab.classList.add('active');

        tab.appendChild(tabTitle);
        
        tab.addEventListener('click', function() {
            // Remove the 'active' class from all tabs
            const allTabs = tabsContainer.querySelectorAll('.tab');
            allTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            // Add the 'active' class to the clicked tab
            tab.classList.add('active');
        
            // Highlight the active tab
            highlightActiveTab();
        
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
        
        // Add a close button to the tab
        const closeButton = document.createElement('span');
        closeButton.textContent = '✕';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent tab click event from firing
            closeTab(tabId);
        });
        tab.appendChild(closeButton);
        
        return tab;
    }

    function createIFrame(tabId) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%'; // Adjust height for browser bar
        iframe.style.display = 'none'; // Hide the iframe initially
        iframe.src = 'https://www.bing.com';
        iframe.setAttribute('data-tab-id', tabId); // Set the data attribute for tab id

        // Add event listener to update tab title when iframe content is loaded
        iframe.onload = function() {
            const activeTabId = getActiveTabId();
            const tab = tabsContainer.querySelector(`.tab[data-tab-id="${activeTabId}"]`);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const pageTitle = iframeDoc.title;
            tab.querySelector('span').textContent = pageTitle;
        };

        // Make sure to set the 'data-loaded' attribute to false initially
        iframe.setAttribute('data-loaded', 'false');

        return iframe;
    }

    // function goBack() {
    //     const activeTabId = getActiveTabId();
    //     const tabState = getTabStateById(activeTabId);
    //     const iframe = iframes[activeTabId];
    //     if (tabState.steps.length > 1) {
    //         tabState.steps.pop(); // Remove the current step
    //         const previousStep = tabState.steps[tabState.steps.length - 1]; // Get the previous step
    //         iframe.src = previousStep; // Navigate to the previous step
    //     }
    // }
    
    // function goForward() {
    //     const activeTabId = getActiveTabId();
    //     const tabState = getTabStateById(activeTabId);
    //     const iframe = iframes[activeTabId];
    //     const nextStepIndex = tabState.steps.findIndex(step => step === iframe.src) + 1;
    //     if (nextStepIndex < tabState.steps.length) {
    //         const nextStep = tabState.steps[nextStepIndex]; // Get the next step
    //         iframe.src = nextStep; // Navigate to the next step
    //     }
    // }
    

    function reloadPage() {
        const activeTabId = getActiveTabId();
        iframes[activeTabId].src = iframes[activeTabId].src; // Reload the iframe by setting its source again
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
        // Update the title of the tab
        const tabState = getTabStateById(activeTabId);
        tabState.title = query;
    
        // Save the state of the tab
        tabState.steps.push(googleSearchUrl);
    
        // Update the browsing history with the search link
        updateBrowsingHistory(activeTabId, googleSearchUrl);
    }
    
    function updateBrowsingHistory(tabId, url) {
        const tabState = getTabStateById(tabId);
        if (tabState) {
            const index = tabState.historyIndex;
            // Remove forward history entries if navigating after going back
            if (index < tabState.steps.length - 1) {
                tabState.steps.splice(index + 1);
            }
            tabState.steps.push(url);
            tabState.historyIndex = tabState.steps.length - 1;
        }
    }
    
    function goBack() {
        const activeTabId = getActiveTabId();
        const tabState = getTabStateById(activeTabId);
        if (tabState.historyIndex > 0) {
            tabState.historyIndex--;
            iframes[activeTabId].src = tabState.steps[tabState.historyIndex];
        } else {
            // If already at the beginning of history, navigate to home page
            goHome();
        }
    }
    
    
    function goForward() {
        const activeTabId = getActiveTabId();
        const tabState = getTabStateById(activeTabId);
        if (tabState.historyIndex < tabState.steps.length - 1) {
            tabState.historyIndex++;
            iframes[activeTabId].src = tabState.steps[tabState.historyIndex];
        }
    }
    
    
    function closeTab(tabId) {
        const tabIndex = tabIds.indexOf(tabId);
        if (tabIndex > -1) {
            tabIds.splice(tabIndex, 1); // Remove tab id from array
            delete iframes[tabId]; // Remove iframe reference
            tabsContainer.querySelector(`.tab[data-tab-id="${tabId}"]`).remove(); // Remove tab element
            // If the closed tab was the active tab, switch to the next tab
            if (tabsContainer.querySelector(`.tab.active`).getAttribute('data-tab-id') === tabId) {
                const nextTabId = tabIds[tabIndex] || tabIds[tabIndex - 1]; // Try to select the next tab, otherwise select the previous tab
                if (nextTabId) {
                    selectTab(nextTabId);
                }
            }
        }
    }

    // Function to highlight the active tab
    function highlightActiveTab() {
        const activeTabId = getActiveTabId();
        const activeTab = document.querySelector(`.tab[data-tab-id="${activeTabId}"]`);
        const allTabs = document.querySelectorAll('.tab');
        allTabs.forEach(tab => tab.classList.remove('active')); // Remove 'active' class from all tabs
        activeTab.classList.add('active'); // Add 'active' class to the active tab
    }

    function selectTab(tabId) {
        const tabElement = tabsContainer.querySelector(`.tab[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.click(); // Simulate click event to select the tab
        }
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

    const addTabButton2 = document.getElementById('add-tab-btn');
    const tabIds2 = []; // Array to store tab ids

    addTabButton2.addEventListener('click', addTab);

  
});
