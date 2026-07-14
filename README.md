# Bulk OCR Feedback Modal — Prototype

Interactive HTML/CSS/JS mock of the feedback modal for the Wikisource Bulk OCR feature. It lets volunteers preview, edit, approve, reject, or skip OCR results before they are saved to the wiki, and shows how the Index page reflects those decisions afterwards.

- Author: Hussein Mmbaga ([@Ssein](https://meta.wikimedia.org/wiki/User:Ssein))
- Project:Wikisource Bulk OCR Improvement ([T415145](https://phabricator.wikimedia.org/T415145))
- Related task: [T394131](https://phabricator.wikimedia.org/T394131) (feedback modal)
- Live demo: https://sseinmmbaga.github.io/bulk-ocr-prototype/

## How to use the demo

1. Open the live demo — the Index page shows all 9 page numbers in red (not proofread).
2. Click Bulk OCR to open the review modal.
3. Approve, reject, or skip each page (keyboard: a, r, s arrow keys to navigate). Page 2 and 4 contain deliberate OCR errors to fix; page 5 simulates an OCR failure.
4. Click Save Approved and confirm — approved pages turn yellow on the Index page, and unreviewed pages stay red so you can run Bulk OCR again later.

## For Developers Reading This Code

If you are a developer inspecting this prototype, here is where to start:

### Recommended reading order

1. README.md — this file, explains the WHY behind the design
2. index.html — top-level structure comment explains every section of the page
3. js/prototype.js — header comment explains state model and OOUI mapping
4. css/style.css — header comment lists all sections
5. mock-data/pages.json — the data shape the OCR API is expected to return


### Design decisions to review before rebuilding

Before rewriting this as real OOUI code, please look at:

- The safety banner text and position (matches T394131 requirement)
- The color scheme for page numbers (red / yellow / rejected)
- The auto-advance behavior after approve or reject
- The Cancel warning behavior when there are unsaved changes
- The persistence of approved/rejected status across sessions
- The status counters showing pending / approved / rejected

If any of these decisions need to change, discuss on Phabricator T415145 before implementing.

### Handling OCR failures

When OCR fails for a page, the user is not blocked. They can:

1. Retry OCR — attempt the OCR again (in real implementation, possibly with a different engine or language)
2. Type manually — Wikisource is a human transcription project; the user can always type the text themselves
3. Reject the page — leave it for someone else to handle later

The Approve button becomes enabled as soon as there is any text in the editor, regardless of whether the text came from OCR or manual typing. This matches the philosophy of Wikisource: OCR is a helper, not a gatekeeper.

### Non-goals of this prototype

This prototype is not:
- A real MediaWiki API integration
- A test suite
- A performance benchmark
- Production-ready code

Its only purpose is to help mentors visualize and react to the design.
