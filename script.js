const Model = {
    tabs: [],

    addTab: function(url = '') {
        this.tabs.push({ url });
    },

    removeTab: function(index) {
        this.tabs.splice(index, 1);
    },

    updateTabUrl: function(index, url) {
        console.log('Updating tab URL:', url);
        if (Model.tabs[index]) {
            Model.tabs[index].url = url;
            const iframe = document.getElementById(`iframe-${index}`);
            if (iframe) {
                console.log('Updating iframe src:', url);
                iframe.src = url;
            }
        }
    }
};

const View = {
    renderTabs: function() {
        const tabsContainer = document.getElementById('tabs-container');
        tabsContainer.innerHTML = '';

        Model.tabs.forEach((tab, index) => {
            const tabElement = document.createElement('div');
            tabElement.classList.add('tab', 'mr-2');
            tabElement.innerHTML = `
                <input type="text" class="form-control url-input" placeholder="Enter URL" value="${tab.url}">
                <button class="btn btn-danger close-btn" data-index="${index}">x</button>
            `;
            tabsContainer.appendChild(tabElement);

            // Create iframe for each tab
            const iframe = document.createElement('iframe');
            iframe.id = `iframe-${index}`;
            iframe.classList.add('tab-iframe');
            tabsContainer.appendChild(iframe);
        });
    }
};

const Controller = {
    init: function() {
        this.bindEvents();
        View.renderTabs();
    },

    bindEvents: function() {
        document.getElementById('add-tab-btn').addEventListener('click', this.addNewTab.bind(this));
        const tabsContainer = document.getElementById('tabs-container');
        tabsContainer.addEventListener('input', function(event) {
            Controller.updateTabUrl(event);
        });
        tabsContainer.addEventListener('click', this.closeTab.bind(this));
    },

    addNewTab: function() {
        console.log('Adding new tab...');
        Model.addTab();
        View.renderTabs();
    },

    updateTabUrl: function(event) {
        const tabElement = event.target.closest('.tab');
        if (tabElement) {
            const index = tabElement.dataset.index;
            const input = event.target.value.trim();
            console.log('Tab index:', index);
            console.log('Input value:', input);
            if (event.target === document.activeElement && event.inputType !== 'deleteContentBackward') {
                if (input.startsWith('http')) {
                    console.log('Updating tab URL with entered URL:', input);
                    Model.updateTabUrl(index, input);
                } else {
                    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
                    console.log('Performing Google search with query:', input);
                    Model.updateTabUrl(index, googleSearchUrl);
                }
            }
        }
    },

    closeTab: function(event) {
        if (event.target.classList.contains('close-btn')) {
            const index = event.target.dataset.index;
            console.log('Closing tab at index:', index);
            Model.removeTab(index);
            View.renderTabs();
        }
    }
};

Controller.init();
