/**
 * Bulk OCR Feedback Modal Prototype
 *
 * Static HTML/CSS/JS prototype for GSoC 2026 Wikisource Bulk OCR project.
 * The real implementation will use OO.ui.ProcessDialog with BookletLayout.
 *
 * Design based on:
 * - Task T394131 requirements (5 pages preview, safety banner)
 * - OOUI BookletLayout with outlined:true pattern
 * - Vector 2010 skin styling
 * - Existing ProcessDialog patterns from ProofreadPage extension
 */

let pages = [];
let currentIndex = 0;
let hasUnsavedChanges = false;

// DOM refs
const modal = document.getElementById('modalOverlay');
const confirmDialog = document.getElementById('confirmOverlay');
const openBtn = document.getElementById('openModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDiscardBtn = document.getElementById('confirmDiscardBtn');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const prevTooltip = document.getElementById('prevTooltip');
const nextTooltip = document.getElementById('nextTooltip');

const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const saveBtn = document.getElementById('saveBtn');

const currentPageNum = document.getElementById('currentPageNum');
const totalPagesNum = document.getElementById('totalPagesNum');
const pageStatus = document.getElementById('pageStatus');

const ocrTextarea = document.getElementById('ocrTextarea');
const pageImage = document.getElementById('pageImage');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');

const statPending = document.getElementById('statPending');
const statApproved = document.getElementById('statApproved');
const statRejected = document.getElementById('statRejected');
const saveCount = document.getElementById('saveCount');
const progressFill = document.getElementById('progressFill');
const pageSidebar = document.getElementById('pageSidebar');
const pagelistElement = document.getElementById('pagelist');
const persistenceInfo = document.getElementById('persistenceInfo');
const statusBanner = document.getElementById('statusBanner');


// ================================
// Load mock data
// ================================
async function loadPages() {
    try {
        const response = await fetch('mock-data/pages.json');
        const data = await response.json();
        pages = data.pages.map(p => ({ ...p }));
        totalPagesNum.textContent = pages.length;
        buildSidebar();
        buildPagelist();
    } catch (err) {
        console.error('Failed to load pages:', err);
        alert('Prototype error: could not load pages.json.\nServe via GitHub Pages or local server.');
    }
}


// ================================
// Build sidebar with page list (BookletLayout style)
// ================================
function buildSidebar() {
    const header = pageSidebar.querySelector('.sidebar-header');
    pageSidebar.innerHTML = '';
    pageSidebar.appendChild(header);

    pages.forEach((page, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.dataset.index = index;

        const num = document.createElement('div');
        num.className = 'page-num';
        num.textContent = `Page ${page.number}`;

        const dot = document.createElement('div');
        dot.className = 'status-dot';
        if (page.hasErrors) dot.classList.add('error');

        item.appendChild(num);
        item.appendChild(dot);

        item.addEventListener('click', () => {
            saveCurrentEdits();
            currentIndex = index;
            renderPage();
        });

        pageSidebar.appendChild(item);
    });
}


// ================================
// Build the Index page's page number list
// Shows color state: red = pending, yellow = approved
// ================================
function buildPagelist() {
    if (!pagelistElement) return;
    pagelistElement.innerHTML = '';

    pages.forEach(page => {
        const link = document.createElement('a');
        link.className = 'pagelist-number ' + page.status;
        link.textContent = page.number;
        link.title = `Page ${page.number} — ${capitalize(page.status)}`;
        pagelistElement.appendChild(link);
    });
}


// ================================
// Update sidebar highlights
// ================================
function updateSidebar() {
    document.querySelectorAll('.sidebar-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
        const dot = item.querySelector('.status-dot');
        dot.className = 'status-dot';
        const status = pages[index].status;
        if (status === 'approved') dot.classList.add('approved');
        else if (status === 'rejected') dot.classList.add('rejected');
        else if (pages[index].hasErrors) dot.classList.add('error');
    });
}


// ================================
// Save any current textarea edits back to the page
// ================================
function saveCurrentEdits() {
    if (pages[currentIndex]) {
        pages[currentIndex].ocrText = ocrTextarea.value;
    }
}


// ================================
// Render current page in modal
// ================================
function renderPage() {
    if (!pages.length) return;

    const page = pages[currentIndex];

    currentPageNum.textContent = page.number;
    pageStatus.textContent = capitalize(page.status);

    ocrTextarea.value = page.ocrText || '';
    ocrTextarea.classList.toggle('error', page.hasErrors);

    if (page.hasErrors) {
        errorBanner.classList.add('visible');
        errorMessage.textContent = ' ' + (page.errorMessage || 'Unknown error');
        approveBtn.disabled = true;
    } else {
        errorBanner.classList.remove('visible');
        approveBtn.disabled = false;
    }

    // Status banner (matches Wikisource "Not proofread" pattern)
    if (statusBanner) {
        if (page.status === 'approved') {
            statusBanner.textContent = 'This page has been approved for saving';
            statusBanner.className = 'status-banner approved';
        } else {
            statusBanner.textContent = 'This page has not been proofread';
            statusBanner.className = 'status-banner';
        }
    }

    pageImage.src = page.image;
    pageImage.alt = 'Scan of page ' + page.number;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === pages.length - 1;

    if (currentIndex > 0) {
        const p = pages[currentIndex - 1];
        prevTooltip.textContent = `Page ${p.number} (${p.status})`;
    }
    if (currentIndex < pages.length - 1) {
        const p = pages[currentIndex + 1];
        nextTooltip.textContent = `Page ${p.number} (${p.status})`;
    }

    updateSidebar();
    updateStats();
}


// ================================
// Update status counters and progress bar
// ================================
function updateStats() {
    let pending = 0, approved = 0, rejected = 0;
    pages.forEach(p => {
        if (p.status === 'approved') approved++;
        else if (p.status === 'rejected') rejected++;
        else pending++;
    });
    statPending.textContent = pending;
    statApproved.textContent = approved;
    statRejected.textContent = rejected;
    saveCount.textContent = approved;
    saveBtn.disabled = approved === 0;

    const percent = ((approved + rejected) / pages.length) * 100;
    progressFill.style.width = percent + '%';
}


// ================================
// Actions
// ================================
function approvePage() {
    const page = pages[currentIndex];
    if (page.hasErrors) return;
    page.ocrText = ocrTextarea.value;
    page.status = 'approved';
    hasUnsavedChanges = true;

    if (currentIndex < pages.length - 1) {
        currentIndex++;
    }
    renderPage();
}

function rejectPage() {
    pages[currentIndex].status = 'rejected';
    hasUnsavedChanges = true;

    if (currentIndex < pages.length - 1) {
        currentIndex++;
    }
    renderPage();
}

function goPrev() {
    if (currentIndex > 0) {
        saveCurrentEdits();
        currentIndex--;
        renderPage();
    }
}

function goNext() {
    if (currentIndex < pages.length - 1) {
        saveCurrentEdits();
        currentIndex++;
        renderPage();
    }
}


// ================================
// Save & Cancel flows
// ================================
function trySave() {
    const approved = pages.filter(p => p.status === 'approved');
    const rejected = pages.filter(p => p.status === 'rejected');
    const pending = pages.filter(p => p.status === 'pending');

    let message = `Saving ${approved.length} approved page${approved.length > 1 ? 's' : ''}.\n\n`;
    if (rejected.length) message += `${rejected.length} rejected page${rejected.length > 1 ? 's' : ''} will be discarded.\n`;
    if (pending.length) message += `${pending.length} unreviewed page${pending.length > 1 ? 's' : ''} will remain as "not proofread" (unchanged).\n`;
    message += '\nProceed with save?';

    if (confirm(message)) {
        alert('✓ Prototype: pages saved successfully.\n\nIn the real extension this would call the MediaWiki API to save each approved page.\n\nNotice: the Index page now shows approved pages in yellow. You can run Bulk OCR again for any red (unreviewed) pages.');
        closeModal(true);  // pass true to keep state
    }
}

function tryClose() {
    if (hasUnsavedChanges) {
        confirmDialog.classList.add('open');
    } else {
        closeModal();
    }
}

function closeModal(persist = false) {
    modal.classList.remove('open');
    confirmDialog.classList.remove('open');

    if (!persist) {
        // Discard: reset all statuses
        pages.forEach(p => p.status = 'pending');
    }
    // else: keep the approved/rejected statuses so the Index shows them

    currentIndex = 0;
    hasUnsavedChanges = false;
    updateStats();
    buildPagelist();
    updatePersistenceInfo();
}

function updatePersistenceInfo() {
    if (!persistenceInfo) return;
    const anyApproved = pages.some(p => p.status === 'approved');
    persistenceInfo.classList.toggle('visible', anyApproved);
}


// ================================
// Event bindings
// ================================
openBtn.addEventListener('click', async () => {
    if (!pages.length) await loadPages();
    currentIndex = 0;

    // Only reset pages that are still PENDING or ERROR
    // (approved/rejected pages from previous run stay as they were)
    pages.forEach(p => {
        if (p.status === 'approved' || p.status === 'rejected') {
            // Keep it - user already reviewed
        } else {
            p.status = 'pending';
        }
    });

    hasUnsavedChanges = false;
    renderPage();
    modal.classList.add('open');
});

cancelBtn.addEventListener('click', tryClose);
confirmCancelBtn.addEventListener('click', () => confirmDialog.classList.remove('open'));
confirmDiscardBtn.addEventListener('click', () => closeModal(false));

prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);
approveBtn.addEventListener('click', approvePage);
rejectBtn.addEventListener('click', rejectPage);
saveBtn.addEventListener('click', trySave);

ocrTextarea.addEventListener('input', () => {
    hasUnsavedChanges = true;
});

document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'a') approvePage();
    if (e.key === 'r') rejectPage();
    if (e.key === 'Escape') tryClose();
});


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


// Build the Index pagelist immediately on page load
window.addEventListener('DOMContentLoaded', () => {
    loadPages();
});