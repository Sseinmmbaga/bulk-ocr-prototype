# Bulk OCR Feedback Modal — Prototype

Interactive HTML/CSS/JS mock of the feedback modal for the Wikisource Bulk OCR feature. It lets volunteers preview, edit, approve, reject or skip OCR results before they are saved to the wiki and shows how the Index page reflects those decisions afterwards.

- Author: Hussein Mmbaga 
- Project:Wikisource Bulk OCR Improvement ([T415145](https://phabricator.wikimedia.org/T415145))
- Related task: [T394131](https://phabricator.wikimedia.org/T394131) (feedback modal)
- Live demo: https://sseinmmbaga.github.io/bulk-ocr-prototype/

## How to use the demo

1. Open the live demo — the Index page shows all 9 page numbers in red (not proofread).
2. Click Bulk OCR to open the review modal.
3. Approve, reject, or skip each page 
4. Click Save Approved and confirm — approved pages turn yellow on the Index page, and unreviewed pages stay red so you can run Bulk OCR again later.


# Handling OCR failures

When OCR fails for a page the user is not blocked. They can:

1. Retry OCR — attempt the OCR again 
2. Type manually the user can always type the text themselves
3. Reject the page  leave it for someone else to handle later

The Approve button becomes enabled as soon as there is any text in the editor, regardless of whether the text came from OCR or manual typing. This matches the philosophy of Wikisource OCR is a helper not a gatekeeper.

### Non-goals of this prototype

This prototype is not:
- A real MediaWiki API integration
- A test suite
- A performance benchmark
- Production-ready code

Its only purpose is to help mentors visualize and react to the design.
