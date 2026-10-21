// WardWell EHR - Headless End-to-End Test via Node 24 Native WebSocket & Chrome DevTools Protocol
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        return pageTarget.webSocketDebuggerUrl;
      }
    } catch {}
    await delay(300);
  }
  throw new Error('Could not connect to Chrome debugging endpoint');
}

async function runTest() {
  console.log('--- Starting Chrome Headless ---');
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'about:blank'
  ]);

  try {
    const wsUrl = await getDebuggerUrl();
    console.log('Connected to Chrome DevTools WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pendingRequests = new Map();
    const consoleLogs = [];
    const jsErrors = [];

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingRequests.has(msg.id)) {
        pendingRequests.get(msg.id)(msg);
        pendingRequests.delete(msg.id);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push({ type: msg.params.type, text });
        if (msg.params.type === 'error') {
          console.error('[Browser Console Error]:', text);
          jsErrors.push(text);
        } else {
          console.log(`[Browser Console ${msg.params.type}]:`, text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[Browser Exception]:', msg.params.exceptionDetails);
        jsErrors.push(msg.params.exceptionDetails.text || 'Exception');
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pendingRequests.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.result?.value;
    }

    // Enable Runtime and Page
    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');

    console.log('--- Navigating to http://localhost:8080/index.html ---');
    await sendCommand('Page.navigate', { url: 'http://localhost:8080/index.html' });
    await delay(1500);

    // Verify Login Screen (with retry wait)
    let hasLoginCard = false;
    for (let i = 0; i < 20; i++) {
      hasLoginCard = await evaluate('!!document.getElementById("login-card")');
      if (hasLoginCard) break;
      await delay(250);
    }
    const bodyHtml = await evaluate('document.body.innerHTML');
    const href = await evaluate('window.location.href');
    console.log('Current href:', href);
    console.log('Current body length:', bodyHtml?.length);
    console.log('1. Login Card Present:', hasLoginCard);
    if (!hasLoginCard) throw new Error('Login screen did not render!');

    // Test Wrong Password
    console.log('2. Testing Wrong Password...');
    await evaluate(`
      document.getElementById("login-pwd").value = "wrongpassword";
      document.getElementById("login-form").dispatchEvent(new Event("submit", { cancelable: true }));
    `);
    await delay(500);
    const shakeFound = await evaluate('document.getElementById("login-card").classList.contains("shake")');
    const errText = await evaluate('document.getElementById("login-error-msg").textContent');
    console.log('   Shake animation triggered:', shakeFound);
    console.log('   Error message shown:', errText);

    // Test Correct Password
    console.log('3. Testing Correct Password "Iloveward123"...');
    await evaluate(`
      document.getElementById("login-pwd").value = "Iloveward123";
      document.getElementById("login-form").dispatchEvent(new Event("submit", { cancelable: true }));
    `);
    await delay(800);

    // Verify redirect to Patients List
    const hashAfterLogin = await evaluate('window.location.hash');
    const patientsTable = await evaluate('!!document.querySelector(".patient-table-desktop")');
    const totalPatientsStat = await evaluate('document.getElementById("stat-total")?.textContent');
    console.log('   Route after login:', hashAfterLogin);
    console.log('   Patient table rendered:', patientsTable);
    console.log('   Total Patients Count:', totalPatientsStat);

    if (hashAfterLogin !== '#/patients' || !patientsTable) {
      throw new Error('Failed to reach patients list after login!');
    }

    // Test Search Functionality
    console.log('4. Testing Search Filter...');
    await evaluate(`
      const input = document.getElementById("patient-search-input");
      input.value = "Maria";
      input.dispatchEvent(new Event("input"));
    `);
    await delay(400);
    const filteredRows = await evaluate('document.querySelectorAll(".patient-table-row").length');
    console.log('   Rows matching "Maria":', filteredRows);
    if (filteredRows === 0) throw new Error('Search failed to find Maria Dela Cruz');

    // Reset search
    await evaluate(`
      const input = document.getElementById("patient-search-input");
      input.value = "";
      input.dispatchEvent(new Event("input"));
    `);
    await delay(400);

    // Test Opening Patient Chart
    console.log('5. Opening Patient Chart for Maria Dela Cruz...');
    await evaluate('window.location.hash = "#/patients/pt_delacruz01/admission"');
    await delay(600);

    const bannerName = await evaluate('document.querySelector(".banner-name")?.textContent?.trim()');
    console.log('   Banner Name:', bannerName);

    // Test Form Switching across all 11 forms
    const formsToTest = [
      'admission',
      'nursing-assessment',
      'consent',
      'doctors-order',
      'vitals',
      'iv-flow',
      'care-plan',
      'mar',
      'progress-notes',
      'endorsement',
      'discharge'
    ];

    console.log('6. Verifying all 11 Clinical Forms render properly...');
    for (const formKey of formsToTest) {
      await evaluate(`window.location.hash = "#/patients/pt_delacruz01/${formKey}"`);
      await delay(300);
      const titleBanner = await evaluate('document.querySelector(".form-title-banner h1")?.textContent?.trim()');
      const formPaperExists = await evaluate('!!document.querySelector(".form-paper")');
      console.log(`   [Form: ${formKey}] Title: "${titleBanner}" | Rendered: ${formPaperExists}`);
      if (!formPaperExists) throw new Error(`Form ${formKey} failed to render!`);
    }

    // Verify Vitals Chart Colors: Pulse (red) & Temp (black)
    console.log('6b. Verifying Vitals Chart Colors (Pulse -> Red, Temp -> Black)...');
    await evaluate('window.location.hash = "#/patients/pt_delacruz01/vitals"');
    await delay(300);
    const hasPulseRedLine = await evaluate('!!document.querySelector(\'path[stroke="#d32f2f"]\')');
    const hasTempBlackLine = await evaluate('!!document.querySelector(\'path[stroke="#000000"]\')');
    const hasPulseRedDot = await evaluate('!!document.querySelector(\'circle[fill="#d32f2f"]\')');
    const hasTempBlackDot = await evaluate('!!document.querySelector(\'circle[fill="#000000"]\')');
    console.log(`   Pulse Line Red (#d32f2f): ${hasPulseRedLine} | Temp Line Black (#000000): ${hasTempBlackLine}`);
    console.log(`   Pulse Dots Red: ${hasPulseRedDot} | Temp Dots Black: ${hasTempBlackDot}`);
    if (!hasPulseRedLine || !hasTempBlackLine) {
      throw new Error('Vitals chart did not apply Pulse -> red or Temp -> black stroke colors!');
    }

    // Verify Doctor\'s Orders Doctor Name Typing
    console.log('6c. Verifying Doctor\'s Orders Attending Physician Editing / Typing...');
    await evaluate('window.location.hash = "#/patients/pt_delacruz01/doctors-order"');
    await delay(300);
    // Click inline Change button
    await evaluate('document.getElementById("btn-edit-doctor-inline")?.click()');
    await delay(200);
    const inlineInputExists = await evaluate('!!document.getElementById("input-inline-doctor-name")');
    console.log(`   Inline Doctor Input visible: ${inlineInputExists}`);
    if (!inlineInputExists) throw new Error('Inline doctor name input failed to open!');

    // Type new doctor name and save
    await evaluate(`(() => {
      const input = document.getElementById("input-inline-doctor-name");
      input.value = "Dr. Robert P. Tan, MD (Cardiology)";
      document.getElementById("btn-save-inline-doctor").click();
    })()`);
    await delay(300);

    const updatedStripDoc = await evaluate('document.getElementById("doc-order-physician-view")?.textContent?.trim()');
    const updatedBannerDoc = await evaluate('document.getElementById("banner-doctor-val")?.textContent?.trim()');
    console.log(`   Updated Strip Doctor: "${updatedStripDoc}" | Updated Banner Doctor: "${updatedBannerDoc}"`);
    if (updatedStripDoc !== 'Dr. Robert P. Tan, MD (Cardiology)' || updatedBannerDoc !== 'Dr. Robert P. Tan, MD (Cardiology)') {
      throw new Error(`Doctor name did not update correctly! Got Strip: "${updatedStripDoc}", Banner: "${updatedBannerDoc}"`);
    }

    // Test Edit Mode Toggle and Action Bar immediate reactivity
    console.log('7. Testing View -> Edit Mode Toggle on Vitals Form and Action Bar Reactivity...');
    await evaluate('window.location.hash = "#/patients/pt_delacruz01/vitals"');
    await delay(300);
    
    // Verify Desktop hides mobile bottom dock
    const innerWidth = await evaluate('window.innerWidth');
    const computedDisplay = await evaluate('window.getComputedStyle(document.querySelector(".mobile-form-nav-container")).display');
    console.log(`   Desktop (width: ${innerWidth}px) mobile nav dock computed display: "${computedDisplay}"`);
    if (computedDisplay !== 'none') {
      throw new Error(`Expected mobile nav dock to be hidden on desktop, got "${computedDisplay}"`);
    }

    // Verify initial View Mode
    const initialBadge = await evaluate('document.getElementById("form-mode-badge")?.textContent?.trim()');
    console.log('   Initial Action Bar Badge:', initialBadge);
    if (initialBadge !== 'View Mode') throw new Error(`Expected "View Mode", got "${initialBadge}"`);

    // Click Edit Form button
    await evaluate('document.getElementById("btn-toggle-edit-mode").click()');
    await delay(300);
    
    const editingBadge = await evaluate('document.getElementById("form-mode-badge")?.textContent?.trim()');
    const hasCancelBtn = await evaluate('!!document.getElementById("btn-cancel-edit-mode")');
    const isEditing = await evaluate('!!document.getElementById("btn-save-vit")');
    console.log('   After clicking Edit -> Badge:', editingBadge, '| Has Cancel Btn:', hasCancelBtn, '| Form in Edit:', isEditing);
    if (editingBadge !== 'Editing Mode' || !hasCancelBtn || !isEditing) {
      throw new Error('Action bar failed to switch immediately to Editing Mode!');
    }

    // Cancel Edit via Action Bar Cancel Button
    console.log('   Testing Action Bar Cancel button with confirm modal...');
    await evaluate('document.getElementById("btn-cancel-edit-mode").click()');
    await delay(300);
    // Confirm discard changes modal
    const confirmModal = await evaluate('!!document.querySelector(".modal-container")');
    console.log('   Discard Changes Confirm Modal visible:', confirmModal);
    if (!confirmModal) throw new Error('Discard confirm modal did not appear!');

    // Click "Discard Changes" confirm button
    await evaluate(`
      const btns = Array.from(document.querySelectorAll(".modal-footer .btn"));
      const okBtn = btns.find(b => b.textContent.includes("Discard Changes") || b.classList.contains("btn-primary"));
      if (okBtn) okBtn.click();
    `);
    await delay(300);

    const postCancelBadge = await evaluate('document.getElementById("form-mode-badge")?.textContent?.trim()');
    const hasEditBtnAgain = await evaluate('!!document.getElementById("btn-toggle-edit-mode")');
    console.log('   After Discarding -> Badge:', postCancelBadge, '| Has Edit Btn:', hasEditBtnAgain);
    if (postCancelBadge !== 'View Mode' || !hasEditBtnAgain) {
      throw new Error('Action bar failed to return immediately to View Mode upon discard!');
    }

    // Test Complete Chart Print Preview and Back Button
    console.log('8. Testing Complete Chart Print Preview and Back Button...');
    await evaluate('document.getElementById("btn-print-full-chart").click()');
    await delay(400);

    const printToolbarExists = await evaluate('!!document.querySelector(".print-preview-toolbar")');
    const backBtnExists = await evaluate('!!document.getElementById("btn-exit-print-preview")');
    const formsCount = await evaluate('document.querySelectorAll(".print-forms-flow .form-paper").length');
    console.log('   Print Preview Toolbar:', printToolbarExists, '| Back Button:', backBtnExists, '| 11 Forms in print:', formsCount);
    if (!printToolbarExists || !backBtnExists || formsCount < 11) {
      throw new Error('Print Complete Chart toolbar or forms missing!');
    }

    // Click Back Button to return to Chart
    console.log('   Clicking "Back to Patient Chart"...');
    await evaluate('document.getElementById("btn-exit-print-preview").click()');
    await delay(400);

    const backInChart = await evaluate('!!document.getElementById("chart-form-action-bar")');
    console.log('   Returned safely back to Patient Chart workspace:', backInChart);
    if (!backInChart) throw new Error('Failed to return to patient chart after clicking Back!');

    // Verify Light Mode Only (No Theme Toggle)
    console.log('9. Verifying Light Mode only (Theme Toggle removed)...');
    const themeTogglePresent = await evaluate('!!document.getElementById("btn-theme-toggle")');
    const currentTheme = await evaluate('document.documentElement.getAttribute("data-theme")');
    console.log('   Theme Toggle button present:', themeTogglePresent, '| data-theme attr:', currentTheme);
    if (themeTogglePresent) {
      throw new Error('Theme toggle button should not be present in header!');
    }
    if (currentTheme === 'dark') {
      throw new Error('Application should strictly be in light mode!');
    }

    // =========================================================================
    // 10. Mobile Native Viewport Emulation Test (390x844 - iPhone 14)
    // =========================================================================
    console.log('10. Emulating Mobile Viewport (390x844 - iPhone 14)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });
    await delay(500);

    // Navigate to /patients
    console.log('    Checking Mobile Patient Directory...');
    await evaluate('window.location.hash = "#/patients"');
    await delay(500);

    const mobileCardsVisible = await evaluate('window.getComputedStyle(document.querySelector(".patient-cards-mobile")).display !== "none"');
    const desktopTableHidden = await evaluate('window.getComputedStyle(document.querySelector(".patient-table-desktop")).display === "none"');
    console.log('    Mobile Cards visible:', mobileCardsVisible, '| Desktop Table hidden:', desktopTableHidden);
    if (!mobileCardsVisible || !desktopTableHidden) {
      throw new Error('Responsive table -> card switch failed on mobile viewport!');
    }

    // Verify 2x2 Stats Grid on Mobile
    const statsGridColumns = await evaluate('window.getComputedStyle(document.querySelector(".stats-grid")).gridTemplateColumns.split(" ").length');
    console.log('    Stats Grid Columns on Mobile:', statsGridColumns);
    if (statsGridColumns !== 2) {
      throw new Error(`Expected 2 columns for stats grid on mobile, got ${statsGridColumns}`);
    }

    // Tap Mobile Patient Card to open chart
    console.log('    Tapping patient card on mobile...');
    await evaluate('document.querySelector(".patient-card-item").click()');
    await delay(500);

    const mobileFormSelectExists = await evaluate('!!document.getElementById("mobile-form-select")');
    const mobileFormTabsVisible = await evaluate('window.getComputedStyle(document.querySelector(".mobile-form-tabs")).display !== "none"');
    const mobileBottomDockVisible = await evaluate('window.getComputedStyle(document.querySelector(".mobile-form-nav-container")).position === "fixed"');
    const desktopSidebarHidden = await evaluate('window.getComputedStyle(document.querySelector(".chart-sidebar")).display === "none"');
    const hasBackBtn = await evaluate('!!document.getElementById("btn-mobile-prev-form")');
    const hasNextBtn = await evaluate('!!document.getElementById("btn-mobile-next-form")');
    console.log('    Mobile Bottom Dock fixed:', mobileBottomDockVisible, '| Back btn:', hasBackBtn, '| Next btn:', hasNextBtn);
    if (!mobileFormSelectExists || !mobileFormTabsVisible || !desktopSidebarHidden || !mobileBottomDockVisible || !hasBackBtn || !hasNextBtn) {
      throw new Error('Mobile sticky bottom chart navigation failed!');
    }

    // Test Mobile Next Button (From Form 1 to Form 2)
    console.log('    Testing Next button in sticky bottom dock...');
    await evaluate('document.getElementById("btn-mobile-next-form").click()');
    await delay(500);
    const routeAfterNext = await evaluate('window.location.hash');
    console.log('    Route after Next click:', routeAfterNext);
    if (!routeAfterNext.includes('/nursing-assessment')) {
      throw new Error(`Expected /nursing-assessment after Next button click, got ${routeAfterNext}`);
    }

    // Test Mobile Back Button (From Form 2 back to Form 1)
    console.log('    Testing Back button in sticky bottom dock...');
    await evaluate('document.getElementById("btn-mobile-prev-form").click()');
    await delay(500);
    const routeAfterBack = await evaluate('window.location.hash');
    console.log('    Route after Back click:', routeAfterBack);
    if (!routeAfterBack.includes('/admission')) {
      throw new Error(`Expected /admission after Back button click, got ${routeAfterBack}`);
    }

    // Verify Back button is disabled on Form 1 (Admission)
    const isBackDisabledOnFirst = await evaluate('document.getElementById("btn-mobile-prev-form").disabled');
    console.log('    Back button disabled on Form 1:', isBackDisabledOnFirst);
    if (!isBackDisabledOnFirst) {
      throw new Error('Back button should be disabled on Form 1!');
    }

    // Test Mobile Form Quick Jump via Select
    console.log('    Testing Quick Jump to Form 5 (Vitals) via mobile dropdown...');
    await evaluate(`
      const sel = document.getElementById("mobile-form-select");
      sel.value = "vitals";
      sel.dispatchEvent(new Event("change"));
    `);
    await delay(500);
    const currentRouteMobile = await evaluate('window.location.hash');
    console.log('    Route after mobile dropdown jump:', currentRouteMobile);
    if (!currentRouteMobile.includes('/vitals')) {
      throw new Error('Mobile dropdown form navigation failed!');
    }

    // Verify Breadcrumbs are hidden on mobile to reclaim vertical space
    const breadcrumbsHidden = await evaluate('window.getComputedStyle(document.querySelector(".breadcrumbs")).display === "none"');
    console.log('    Breadcrumbs hidden on mobile:', breadcrumbsHidden);
    if (!breadcrumbsHidden) {
      throw new Error('Breadcrumbs should be hidden on mobile to maximize viewport area!');
    }

    // Test Mobile Clinical Forms Bottom Sheet Picker
    console.log('    Testing Native Clinical Forms Bottom Sheet Picker...');
    await evaluate('document.getElementById("btn-open-form-sheet").click()');
    await delay(400);
    const isSheetOpen = await evaluate('document.getElementById("mobile-forms-sheet-backdrop").classList.contains("open")');
    console.log('    Forms Sheet Picker open:', isSheetOpen);
    if (!isSheetOpen) {
      throw new Error('Clinical Forms Sheet Picker failed to open!');
    }

    // Click Form 6 (IV Flow Sheet) in the Bottom Sheet
    console.log('    Selecting Form 6 (IV Flow Sheet) from the picker sheet...');
    await evaluate('document.querySelector(".mobile-sheet-form-item[data-form-key=\\"iv-flow\\"]").click()');
    await delay(500);
    const routeAfterSheetPick = await evaluate('window.location.hash');
    const isSheetClosedAfterPick = await evaluate('!document.getElementById("mobile-forms-sheet-backdrop").classList.contains("open")');
    console.log('    Route after sheet pick:', routeAfterSheetPick, '| Sheet closed:', isSheetClosedAfterPick);
    if (!routeAfterSheetPick.includes('/iv-flow') || !isSheetClosedAfterPick) {
      throw new Error('Selecting form from Bottom Sheet Picker failed!');
    }

    // Test Mobile Print Complete Chart Preview Toolbar
    console.log('    Testing Complete Chart Print Preview on mobile...');
    await evaluate('document.getElementById("btn-print-full-chart").click()');
    await delay(500);
    const mobilePrintToolbarExists = await evaluate('!!document.querySelector(".print-preview-toolbar")');
    const mobileBackBtnExists = await evaluate('!!document.getElementById("btn-exit-print-preview")');
    const mobilePrintBtnExists = await evaluate('!!document.getElementById("btn-do-print")');
    const mobilePrintOverflow = await evaluate('document.querySelector(".print-preview-toolbar").scrollWidth > window.innerWidth');
    console.log('    Mobile Print Toolbar:', mobilePrintToolbarExists, '| Back btn:', mobileBackBtnExists, '| Print btn:', mobilePrintBtnExists, '| Overflows:', mobilePrintOverflow);
    if (!mobilePrintToolbarExists || !mobileBackBtnExists || !mobilePrintBtnExists || mobilePrintOverflow) {
      throw new Error('Mobile Complete Chart print preview toolbar failed or overflowed!');
    }

    // Return back to chart
    await evaluate('document.getElementById("btn-exit-print-preview").click()');
    await delay(400);

    // Test Mobile Bottom Sheet (Add Patient Modal)
    console.log('    Testing Native Bottom Sheet Modal on mobile...');
    await evaluate('window.location.hash = "#/patients"');
    await delay(400);
    await evaluate('document.getElementById("btn-add-patient").click()');
    await delay(400);

    const bottomSheetContainer = await evaluate('!!document.querySelector(".modal-container")');
    console.log('    Bottom Sheet Modal open:', bottomSheetContainer);
    if (!bottomSheetContainer) {
      throw new Error('Modal failed to open on mobile!');
    }

    // Close Modal
    await evaluate('document.querySelector(".modal-close-btn").click()');
    await delay(400);

    // Reset emulation back to desktop
    await sendCommand('Emulation.clearDeviceMetricsOverride');
    await delay(300);

    console.log('--- ALL AUTOMATED E2E VERIFICATION CHECKS PASSED ---');
    console.log('Total console errors caught:', jsErrors.length);
    if (jsErrors.length > 0) {
      throw new Error(`Encountered ${jsErrors.length} console errors during test run`);
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
