// Bulk OCR feedback modal prototype
// Hussein Mmbaga (@Ssein) - GSoC 2026, Wikisource Bulk OCR Improvement
// Tasks: T415145 (project), T394131 (feedback modal)
//
// This is throwaway prototype code to demo the design. The real version lives
// in the Wikisource extension as an OO.ui.ProcessDialog with a BookletLayout,
// so don't port this file directly - the rough mapping is:
//   pages[] / currentIndex   -> OCR API response + BookletLayout page names
//   renderPage()             -> BookletLayout.setPage()
//   approve/reject/save      -> dialog actions in getActionProcess()
//   the cancel warning       -> showErrors() override, same pattern as
//                               PagelistInputWidget.Dialog.js in ProofreadPage
//
// Shortcuts while the modal is open: arrow keys navigate, a = approve,
// r = reject, s = skip, Esc = close (warns if there is unsaved work).

let pages = [];                 // page objects loaded from mock-data/pages.json
let currentIndex = 0;           // which page is currently showing in the modal
let hasUnsavedChanges = false;  // true once the user has edited or reviewed anything

// DOM refs, grabbed once so renderPage() isn't doing lookups on every click

// modal containers
const modal = document.getElementById('modalOverlay');
const confirmDialog = document.getElementById('confirmOverlay');

// open/close buttons
const openBtn = document.getElementById('openModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDiscardBtn = document.getElementById('confirmDiscardBtn');

// navigation
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const prevTooltip = document.getElementById('prevTooltip');
const nextTooltip = document.getElementById('nextTooltip');

// per-page actions
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const skipBtn = document.getElementById('skipBtn');
const saveBtn = document.getElementById('saveBtn');

// page indicator
const currentPageNum = document.getElementById('currentPageNum');
const totalPagesNum = document.getElementById('totalPagesNum');
const pageStatus = document.getElementById('pageStatus');

// content pane
const ocrTextarea = document.getElementById('ocrTextarea');
const pageImage = document.getElementById('pageImage');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');

// counters and progress
const statPending = document.getElementById('statPending');
const statApproved = document.getElementById('statApproved');
const statRejected = document.getElementById('statRejected');
const saveCount = document.getElementById('saveCount');
const progressFill = document.getElementById('progressFill');
const pageSidebar = document.getElementById('pageSidebar');

// Index page bits (outside the modal)
const pagelistElement = document.getElementById('pagelist');
const persistenceInfo = document.getElementById('persistenceInfo');
const statusBanner = document.getElementById('statusBanner');

// OOUI-style message dialogs
const saveConfirmOverlay = document.getElementById('saveConfirmOverlay');
const saveConfirmContent = document.getElementById('saveConfirmContent');
const saveConfirmCancel = document.getElementById('saveConfirmCancel');
const saveConfirmOk = document.getElementById('saveConfirmOk');
const successOverlay = document.getElementById('successOverlay');
const successMessage = document.getElementById('successMessage');
const successOk = document.getElementById('successOk');


// Load the mock data. In the real extension this arrives as the OCR API
// response instead of a static file.
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


// Build the clickable page list in the modal sidebar, one item per page with
// a status dot. Later this becomes BookletLayout.addPages() with one
// PageLayout per book page.
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


// Rebuild the numbered pagelist on the Index page. Follows the Wikisource
// colour convention: red = not proofread, yellow = has text but needs review,
// struck through = rejected. Red pages can be run through Bulk OCR again later.
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


// Highlight the active sidebar item and refresh all the status dots.
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


// Copy any textarea edits back into the page object, so nothing is lost when
// the user navigates away.
function saveCurrentEdits() {
    if (pages[currentIndex]) {
        pages[currentIndex].ocrText = ocrTextarea.value;
    }
}


// Show the current page in the modal: OCR text, scan image, banners,
// nav button state and the counters.
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

    // same wording as the "Not proofread" banner on a real Page: edit view
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


// Refresh the pending/approved/rejected counters and the progress bar.
// Save stays disabled until at least one page is approved.
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


// Approve the current page and move on. Pages where OCR failed can't be
// approved - there would be nothing to save.
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

// Reject the current page and move on. Rejected pages are dropped on save.
function rejectPage() {
    pages[currentIndex].status = 'rejected';
    hasUnsavedChanges = true;

    if (currentIndex < pages.length - 1) {
        currentIndex++;
    }
    renderPage();
}

// Skip = decide later. Keeps any text edits but the page stays pending, so it
// stays red on the Index page and can be picked up in a later run.
function skipPage() {
    saveCurrentEdits();
    pages[currentIndex].status = 'pending';

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


// Show the save summary (how many pages get saved / dropped / left alone)
// before actually committing anything.
function trySave() {
    const approved = pages.filter(p => p.status === 'approved');
    const rejected = pages.filter(p => p.status === 'rejected');
    const pending = pages.filter(p => p.status === 'pending');

    let html = `<p><strong>${approved.length} approved page${approved.length !== 1 ? 's' : ''}</strong> will be saved to the wiki.</p>`;
    html += '<ul>';
    if (rejected.length) {
        html += `<li>${rejected.length} rejected page${rejected.length !== 1 ? 's' : ''} will be discarded</li>`;
    }
    if (pending.length) {
        html += `<li>${pending.length} unreviewed page${pending.length !== 1 ? 's' : ''} will remain as "not proofread"</li>`;
    }
    html += '</ul>';
    html += '<p style="margin-top:10px;">Do you want to proceed?</p>';

    saveConfirmContent.innerHTML = html;
    saveConfirmOverlay.classList.add('open');
}

// The mock "save". The real version loops over the approved pages and calls
// mw.Api().postWithToken('csrf', ...) for each one, with error handling.
function performSave() {
    const approved = pages.filter(p => p.status === 'approved');
    saveConfirmOverlay.classList.remove('open');

    successMessage.textContent = `${approved.length} page${approved.length !== 1 ? 's' : ''} saved. The Index page now shows approved pages in yellow.`;
    successOverlay.classList.add('open');
}

// User dismissed the success dialog: close up but keep the statuses so the
// Index page shows what was saved.
function finishSave() {
    successOverlay.classList.remove('open');
    closeModal(true);
}

// Warn before closing if the user has done any work. Same idea as the cancel
// warning in PagelistInputWidget.Dialog.js.
function tryClose() {
    if (hasUnsavedChanges) {
        confirmDialog.classList.add('open');
    } else {
        closeModal();
    }
}

// Close the modal. persist=true (used after a save) keeps the review statuses
// so the Index page reflects them; otherwise everything resets to pending.
function closeModal(persist = false) {
    modal.classList.remove('open');
    confirmDialog.classList.remove('open');

    if (!persist) {
        pages.forEach(p => p.status = 'pending');
    }

    currentIndex = 0;
    hasUnsavedChanges = false;
    updateStats();
    buildPagelist();
    updatePersistenceInfo();
}

// Show the "your approved pages are saved" note on the Index page once at
// least one page has been approved.
function updatePersistenceInfo() {
    if (!persistenceInfo) return;
    const anyApproved = pages.some(p => p.status === 'approved');
    persistenceInfo.classList.toggle('visible', anyApproved);
}


// event wiring

openBtn.addEventListener('click', async () => {
    if (!pages.length) await loadPages();
    currentIndex = 0;

    // reset only unreviewed pages - approved/rejected ones from an earlier
    // run keep their status
    pages.forEach(p => {
        if (p.status !== 'approved' && p.status !== 'rejected') {
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
skipBtn.addEventListener('click', skipPage);
saveBtn.addEventListener('click', trySave);

saveConfirmCancel.addEventListener('click', () => {
    saveConfirmOverlay.classList.remove('open');
});
saveConfirmOk.addEventListener('click', performSave);
successOk.addEventListener('click', finishSave);

ocrTextarea.addEventListener('input', () => {
    hasUnsavedChanges = true;
});

document.addEventListener('keydown', (e) => {
    // if a message dialog is open it gets the keys, nothing fires underneath
    if (saveConfirmOverlay.classList.contains('open')) {
        if (e.key === 'Escape') saveConfirmOverlay.classList.remove('open');
        return;
    }
    if (successOverlay.classList.contains('open')) {
        if (e.key === 'Escape' || e.key === 'Enter') finishSave();
        return;
    }

    if (!modal.classList.contains('open')) return;
    if (e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'a') approvePage();
    if (e.key === 'r') rejectPage();
    if (e.key === 's') skipPage();
    if (e.key === 'Escape') tryClose();
});


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


// build the Index pagelist as soon as the page loads
window.addEventListener('DOMContentLoaded', () => {
    loadPages();
});
