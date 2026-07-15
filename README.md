# Bulk OCR Feedback Modal — Prototype

Interactive HTML/CSS/JS mock of the feedback modal for the Wikisource Bulk OCR feature. It lets volunteers preview, edit, approve, reject or skip OCR results before they are saved to the wiki and shows how the Index page reflects those decisions afterwards.

- Author: Hussein Mmbaga 
- Project:Wikisource Bulk OCR Improvement ([T415145](https://phabricator.wikimedia.org/T415145))
- Related task: [T394131](https://phabricator.wikimedia.org/T394131) (feedback modal)
- Live demo: https://sseinmmbaga.github.io/bulk-ocr-prototype/

 1. Purpose of this document

This document explains the design of the feedback modal in detail. It complements the README which explains how to use the prototype. This document explains why the prototype is designed the way it is.

## How to use the demo

1. Open the live demo — the Index page shows all 9 page numbers in red (not proofread).
2. Click Bulk OCR to open the review modal.
3. Approve, reject, or skip each page 
4. Click Save Approved and confirm — approved pages turn yellow on the Index page, and unreviewed pages stay red so you can run Bulk OCR again later.


### Non-goals of this prototype

This prototype is not:
- A real MediaWiki API integration
- A test suite
- A performance benchmark
- Production-ready code

Its only purpose is to help mentors visualize and react to the design.


2. Problem the modal solves

Wikisource volunteers transcribe scanned old books page by page. The Bulk OCR feature runs OCR on many pages at once so volunteers do not have to click through each page manually. The current Bulk OCR feature has one critical UX gap it saves OCR results directly to the wiki without letting the user review them first. This creates three problems.

1. OCR is never perfect. Errors like "1sabella" instead of "Isabella" or "TW0" instead of "TWO" get committed to the wiki and other volunteers must fix them later.
2. Users have no way to catch OCR failures until after the damage is done.
3. Users cannot decide this page looks good but this one needs manual work every page is saved regardless of quality.

The feedback modal solves this by inserting a human review step between OCR completion and the save. Users can preview, edit, approve, reject or retry each page before anything is written to the wiki.


3. Every design decision in this prototype comes from one of five principles.

i/ Respect what users already know
 Wikisource volunteers already use the Page:X editor to transcribe single pages. That editor uses a split view with text on the left and image on the right, plus a WikiEditor toolbar. The modal will follows the same layout so users do not have to learn anything new.

ii/ Trust the user do not block them
If OCR fails the user can type manually. If the OCR text has errors the user can edit it. If the user disagrees with an OCR result they can reject it. 

iii/ Small commitments
The user approves each page individually. They do not have to approve or reject the whole batch at once.

iv/ Show progress and preserve state
The status bar shows how many pages are pending, approved or rejected. The Index page updates after save to show which pages are done. Users can return later to process the remaining pages.

v/ Follow Wikimedia design conventions
The modal uses the ProcessDialog pattern that already exists in ProofreadPage and Wikisource. It uses the BookletLayout sidebar pattern that the OOUI documentation recommends. This makes the real implementation easier to review and merge.


4. User flow

Step 1 : The user opens an Index page for a scanned book. The pagelist at the bottom shows red numbers because no OCR has run yet.

Step 2 : The user clicks the Bulk OCR button. In the real implementation the OCR API runs on all pages in the background. In the prototype we skip this step because its already be implimented and I continue go directly to the modal.

Step 3 : The modal shows page 1 with its OCR text on the left and the original scan on the right. The sidebar shows all pages and marks page one as active.

Step 4  : For each page the user does one of three things accepts the OCR text and moves to the next page, discards this page and moves to the next and leaves it as pending and moves to any other page. User can also edit the OCR text before approving. They can navigate freely using the sidebar or the previous and next buttons.

Step 5 : Handle OCR failures: If OCR failed on a page (empty result) the user has three recovery options Retry OCR attempts OCR again possibly with a different engine, user can write the transcription themselves and Reject it for someone else to handle

Step 6 : The user clicks (Save Approved) a confirmation dialog summarises what will happen. The user confirms and only approved pages are written to the wiki.

Step 7 : Back on the Index page pproved pages now show as yellow text saved and needs review. Rejected and pending pages remain red. The user can return later and run Bulk OCR again for the remaining red pages.

Step 8 :  User runs Bulk OCR a second time on a book with some approved pages Previously approved pages stay approved. The modal shows their approved status. The user can review remaining pending pages without redoing work.


 The real implementation will use OOUI widgets:
1. ProcessDialog (size: larger or full)
2. MessageWidget (type: warning)
3. PanelLayout
4. LabelWidget
5. ProgressBarWidget
6. BookletLayout (outlined: true)
7. OutlineOptionWidget
8. PageLayout
9. MultilineTextInputWidget (autosize: true)
10. WikiEditor toolbar
11. ButtonWidget
12. MessageDialog


The prototype does not implement these features but These will all be addressed in the real implementation.

- Real OCR API calls
- Real MediaWiki API saves 
- Internationalization 
- The full WikiEditor toolbar 
- Real user permission checks 
- Loading states during initial OCR 
- Multiple language support in the OCR engine dropdown 
- Configuration for the retry OCR engine choice (not shown)




