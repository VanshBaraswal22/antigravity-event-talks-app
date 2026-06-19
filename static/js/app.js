// Application State
let state = {
    releases: [],
    selectedRelease: null,
    currentFilter: 'all',
    searchQuery: '',
    isLoading: false
};

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshSvg = document.getElementById('refresh-svg');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');
const releasesFeed = document.getElementById('releases-feed');

const detailSection = document.getElementById('detail-section');
const detailPlaceholder = document.getElementById('detail-placeholder');
const detailContent = document.getElementById('detail-content');
const detailDate = document.getElementById('detail-date');
const detailBadge = document.getElementById('detail-badge');
const closeDetailBtn = document.getElementById('close-detail-btn');
const detailDescHtml = document.getElementById('detail-desc-html');
const detailLink = document.getElementById('detail-link');

const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const tweetBtn = document.getElementById('tweet-btn');
const themeCheckbox = document.getElementById('theme-checkbox');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });
    
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.type;
            renderFeed();
        });
    });
    
    // Mobile details drawer close
    closeDetailBtn.addEventListener('click', () => {
        detailSection.classList.remove('open');
    });
    
    // Tweet text change character counting
    tweetTextarea.addEventListener('input', () => {
        updateCharCounter();
    });
    
    // Tweet button
    tweetBtn.addEventListener('click', handleTweetSubmit);
    
    // Theme Switch
    initThemeSwitch();
    
    // Export CSV
    exportCsvBtn.addEventListener('click', handleExportCSV);
}

// Fetch Releases from Flask API
async function fetchReleases() {
    if (state.isLoading) return;
    
    setLoading(true);
    showError(false);
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            state.releases = data.releases;
            renderFeed();
            
            // Auto-select first item on desktop if available and nothing is selected
            if (state.releases.length > 0 && window.innerWidth > 900 && !state.selectedRelease) {
                selectRelease(state.releases[0]);
            }
        } else {
            throw new Error(data.message || 'Unknown server error');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showError(true, err.message || 'Failed to connect to the server.');
    } finally {
        setLoading(false);
    }
}

// Render Feed List
function renderFeed() {
    const filtered = state.releases.filter(item => {
        // Filter by type
        const typeMatch = state.currentFilter === 'all' || 
            item.type.toLowerCase() === state.currentFilter;
            
        // Filter by search query
        const textMatch = !state.searchQuery || 
            item.type.toLowerCase().includes(state.searchQuery) ||
            item.date.toLowerCase().includes(state.searchQuery) ||
            item.plain_text.toLowerCase().includes(state.searchQuery);
            
        return typeMatch && textMatch;
    });
    
    // Clear feed
    releasesFeed.innerHTML = '';
    
    // Handle empty state
    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    
    // Populate cards
    filtered.forEach(item => {
        const card = document.createElement('div');
        const lowerType = item.type.toLowerCase();
        
        // Match CSS type class
        let typeClass = 'type-update';
        if (['feature', 'change', 'announcement', 'issue'].includes(lowerType)) {
            typeClass = `type-${lowerType}`;
        }
        
        card.className = `release-card glass-panel ${typeClass}`;
        if (state.selectedRelease && state.selectedRelease.id === item.id) {
            card.classList.add('active');
        }
        
        // Determine badge styling class
        let badgeClass = 'badge-update';
        if (['feature', 'change', 'announcement', 'issue'].includes(lowerType)) {
            badgeClass = `badge-${lowerType}`;
        }
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${item.date}</span>
                <div class="card-header-actions">
                    <span class="type-badge ${badgeClass}">${item.type}</span>
                    <button class="card-copy-btn" title="Copy to Clipboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <h3>${item.type} Release</h3>
                <p>${escapeHTML(item.plain_text)}</p>
            </div>
        `;
        
        // Copy to clipboard button listener
        const copyBtn = card.querySelector('.card-copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent selecting the card
            const textToCopy = `BigQuery Release (${item.date}) - [${item.type}]:\n${item.plain_text}\n\nLink: ${item.link}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
        
        card.addEventListener('click', () => selectRelease(item));
        releasesFeed.appendChild(card);
    });
}

// Select Release Item
function selectRelease(release) {
    state.selectedRelease = release;
    
    // Update card active classes
    const cards = document.querySelectorAll('.release-card');
    cards.forEach(card => card.classList.remove('active'));
    
    // Re-render feed to preserve active states easily or manually set it:
    renderFeed(); // This updates the visual list select state
    
    // Show detail content & Hide placeholder
    detailPlaceholder.classList.add('hidden');
    detailContent.classList.remove('hidden');
    
    // Slide detail drawer on mobile
    if (window.innerWidth <= 900) {
        detailSection.classList.add('open');
    }
    
    // Populate details
    detailDate.textContent = release.date;
    detailBadge.textContent = release.type;
    
    // Remove old classes from badge
    detailBadge.className = 'type-badge';
    const lowerType = release.type.toLowerCase();
    if (['feature', 'change', 'announcement', 'issue'].includes(lowerType)) {
        detailBadge.classList.add(`badge-${lowerType}`);
    } else {
        detailBadge.classList.add('badge-update');
    }
    
    // Description HTML
    detailDescHtml.innerHTML = release.description;
    
    // Link
    if (release.link) {
        detailLink.href = release.link;
        detailLink.classList.remove('hidden');
    } else {
        detailLink.classList.add('hidden');
    }
    
    // Compose Draft Tweet
    composeDraftTweet(release);
}

// Compose Initial Tweet
function composeDraftTweet(release) {
    const dateStr = release.date;
    const typeStr = release.type;
    
    // Header & Tags
    const header = `BigQuery Release (${dateStr}) - [${typeStr}]:\n`;
    const tags = ` #BigQuery #GoogleCloud`;
    
    // Twitter counts any URL as 23 characters.
    const urlLength = 23;
    const paddingLength = 6; // for quotes, spacing, newlines
    
    // Available space for the description plain text
    const availableSpace = 280 - header.length - urlLength - tags.length - paddingLength;
    
    let descriptionText = release.plain_text;
    if (descriptionText.length > availableSpace) {
        descriptionText = descriptionText.substring(0, availableSpace - 3).trim() + '...';
    }
    
    // Construct final textarea text
    const tweetBody = `${header}"${descriptionText}"\n\n${release.link}${tags}`;
    
    tweetTextarea.value = tweetBody;
    updateCharCounter();
}

// Calculate Twitter Post length (taking URL rules into account)
function calculateTwitterLength(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    let length = text.length;
    let match;
    
    // Replace URL length contribution with exactly 23
    while ((match = urlRegex.exec(text)) !== null) {
        length = length - match[0].length + 23;
    }
    return length;
}

// Update Character Counter Visuals
function updateCharCounter() {
    const text = tweetTextarea.value;
    const length = calculateTwitterLength(text);
    
    charCounter.textContent = `${length} / 280`;
    
    // Style text color based on remaining chars
    const counterWrapper = charCounter.parentElement;
    counterWrapper.className = 'tweet-stats';
    tweetBtn.disabled = false;
    
    if (length > 280) {
        counterWrapper.classList.add('error');
        tweetBtn.disabled = true;
    } else if (length > 250) {
        counterWrapper.classList.add('warning');
    }
}

// Handle Tweet button click
function handleTweetSubmit() {
    const text = tweetTextarea.value;
    const length = calculateTwitterLength(text);
    
    if (length > 280) {
        alert('Your tweet exceeds the 280-character limit.');
        return;
    }
    
    // Open Twitter/X intent
    const encodedText = encodeURIComponent(text);
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
}

// UI State Toggles
function setLoading(loading) {
    state.isLoading = loading;
    if (loading) {
        loadingState.classList.remove('hidden');
        refreshSvg.classList.add('spinning');
        refreshBtn.disabled = true;
    } else {
        loadingState.classList.add('hidden');
        refreshSvg.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

function showError(show, message = '') {
    if (show) {
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
        releasesFeed.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
        releasesFeed.classList.remove('hidden');
    }
}

// Helper to escape HTML characters
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Theme Switcher Initialization
function initThemeSwitch() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeCheckbox.checked = true;
    } else {
        document.body.classList.remove('light-theme');
        themeCheckbox.checked = false;
    }
    
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Export Filtered Releases to CSV
function handleExportCSV() {
    const filtered = state.releases.filter(item => {
        const typeMatch = state.currentFilter === 'all' || 
            item.type.toLowerCase() === state.currentFilter;
        const textMatch = !state.searchQuery || 
            item.type.toLowerCase().includes(state.searchQuery) ||
            item.date.toLowerCase().includes(state.searchQuery) ||
            item.plain_text.toLowerCase().includes(state.searchQuery);
        return typeMatch && textMatch;
    });
    
    if (filtered.length === 0) {
        alert('No release notes to export.');
        return;
    }
    
    // Build CSV Content
    const headers = ['Date', 'Type', 'Link', 'Plain Text Description'];
    const rows = filtered.map(item => [
        item.date,
        item.type,
        item.link,
        item.plain_text
    ]);
    
    function escapeCSV(val) {
        if (val === null || val === undefined) return '';
        let str = String(val);
        str = str.replace(/"/g, '""'); // Escape double quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str}"`;
        }
        return str;
    }
    
    const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');
    
    // Download Trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filterName = state.currentFilter !== 'all' ? `-${state.currentFilter}` : '';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery-releases${filterName}-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
