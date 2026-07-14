/**
 * Bulk OCR Feedback Modal Prototype
 *
 * This is a HTML/CSS/JS prototype demonstrating the design for
 * the feedback modal that will let Wikisource volunteers review,
 * edit, approve, or reject OCR results before saving them.
 *
 * The real implementation will use OOUI ProcessDialog inside the
 * Wikisource extension. This prototype focuses on the UX flow only.
 */

// State
let pages = [];
let currentIndex = 0;
let hasUnsavedChanges = false;

// DOM refs
const modal = document.getElementById('modalOverlay');
const confirmDialog = document.getElementById('confirmOverlay');
const openBtn = document.getElementById('openModal');
const closeBtn = document.getElementById('closeBtn');
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


// ================================
// Load mock data
// ================================
async function loadPages() {
    try {
        const response = await fetch('mock-data/pages.json');
        const data = await response.json();
        pages = data.pages.map(p => ({ ...p })); // clone
        totalPagesNum.textContent = pages.length;
    } catch (err) {
        console.error('Failed to load pages:', err);
        alert('Prototype error: could not load pages.json. Are you serving this via GitHub Pages or a local server?');
    }
}


// ================================
// Render current page in modal
// ================================
function renderPage() {
    if (!pages.length) return;

    const page = pages[currentIndex];

    // Header
    currentPageNum.textContent = page.number;
    pageStatus.textContent = capitalize(page.status);

    // Textarea
    ocrTextarea.value = page.ocrText || '';
    ocrTextarea.classList.toggle('error', page.hasErrors);

    // Error banner
    if (page.hasErrors) {
        errorBanner.classList.add('visible');
        errorMessage.textContent = ' ' + (page.errorMessage || 'Unknown error');
        approveBtn.disabled = true;
    } else {
        errorBanner.classList.remove('visible');
        approveBtn.disabled = false;
    }

    // Image
    pageImage.src = page.image;
    pageImage.alt = 'Scan of page ' + page.number;

    // Nav button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === pages.length - 1;

    // Tooltips
    if (currentIndex > 0) {
        const p = pages[currentIndex - 1];
        prevTooltip.textContent = `Page ${p.number} — ${p.status}`;
    }
    if (currentIndex < pages.length - 1) {
        const p = pages[currentIndex + 1];
        nextTooltip.textContent = `Page ${p.number} — ${p.status}`;
    }

    updateStats();
}


// ================================
// Update status counters
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
}


// ================================
// Actions
// ================================
function approvePage() {
    const page = pages[currentIndex];
    // Save edited text
    page.ocrText = ocrTextarea.value;
    page.status = 'approved';
    hasUnsavedChanges = true;

    // Auto-advance if not last page
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
        // Save any edits before switching
        pages[currentIndex].ocrText = ocrTextarea.value;
        currentIndex--;
        renderPage();
    }
}

function goNext() {
    if (currentIndex < pages.length - 1) {
        pages[currentIndex].ocrText = ocrTextarea.value;
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

    let message = `Saving ${approved.length} approved pages.\n\n`;
    if (rejected.length) message += `${rejected.length} rejected pages will be discarded.\n`;
    if (pending.length) message += `${pending.length} unreviewed pages will remain as "not proofread" (unchanged).\n`;
    message += '\nProceed with save?';

    if (confirm(message)) {
        alert('✓ Prototype: pages saved successfully.\n\nIn the real extension this would call the MediaWiki API to save each approved page.');
        closeModal();
    }
}

function tryClose() {
    if (hasUnsavedChanges) {
        confirmDialog.classList.add('open');
    } else {
        closeModal();
    }
}

function closeModal() {
    modal.classList.remove('open');
    confirmDialog.classList.remove('open');
    // Reset state
    pages.forEach(p => p.status = 'pending');
    currentIndex = 0;
    hasUnsavedChanges = false;
    updateStats();
}


// ================================
// Event bindings
// ================================
openBtn.addEventListener('click', async () => {
    if (!pages.length) await loadPages();
    currentIndex = 0;
    pages.forEach(p => p.status = 'pending');
    hasUnsavedChanges = false;
    renderPage();
    modal.classList.add('open');
});

closeBtn.addEventListener('click', tryClose);
cancelBtn.addEventListener('click', tryClose);
confirmCancelBtn.addEventListener('click', () => confirmDialog.classList.remove('open'));
confirmDiscardBtn.addEventListener('click', closeModal);

prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);
approveBtn.addEventListener('click', approvePage);
rejectBtn.addEventListener('click', rejectPage);
saveBtn.addEventListener('click', trySave);

// Track edits
ocrTextarea.addEventListener('input', () => {
    hasUnsavedChanges = true;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'a') approvePage();
    if (e.key === 'r') rejectPage();
    if (e.key === 'Escape') tryClose();
});


// ================================
// Helpers
// ================================
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}