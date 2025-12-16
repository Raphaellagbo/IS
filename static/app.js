// app.js - COMPLETE WITH REPLY SYSTEM
let loggedIn = false;
let notificationsEnabled = false;
let currentEmailList = [];
let currentReplyEmailId = null;
let originalEmail = null; // track loaded profile email to detect changes
let resetToken = null; // used when a reset token is in URL


// AUTH UI SWITCHERS
function showLogin() {
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const reqCard = document.getElementById('password-reset-request-card');
    const resetCard = document.getElementById('password-reset-card');
    if (loginCard) loginCard.style.display = '';
    if (registerCard) registerCard.style.display = 'none';
    if (reqCard) reqCard.style.display = 'none';
    if (resetCard) resetCard.style.display = 'none';

    document.getElementById('login-form').style.display = '';
    document.getElementById('register-form').style.display = 'none';
    // Ensure password reset forms are hidden
    const reqForm = document.getElementById('password-reset-request-form');
    const resetForm = document.getElementById('password-reset-form');
    if (reqForm) reqForm.style.display = 'none';
    if (resetForm) resetForm.style.display = 'none';
}

function showRegister() {
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const reqCard = document.getElementById('password-reset-request-card');
    const resetCard = document.getElementById('password-reset-card');
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = '';
    if (reqCard) reqCard.style.display = 'none';
    if (resetCard) resetCard.style.display = 'none';

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = '';
}


// LOGIN / REGISTER / LOGOUT
async function loginFunc(event) {
    event.preventDefault();
    const btn = document.getElementById('login-button');
    const btnText = document.getElementById('login-button-text');
    btn.disabled = true;
    const prevText = btnText.innerHTML;
    btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in...';
    const errorEl = document.getElementById('login-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    try {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.status === "logged in") {
            loggedIn = true;
            showDashboard(data.username);
            showTab('dashboard');
        } else {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = data.error || "Login failed";
            }
            showNotification(data.error || "Login failed");
        }
    } catch (err) {
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Login request failed';
        }
        showNotification('Login request failed', 'danger');
    } finally {
        btn.disabled = false;
        btnText.innerHTML = prevText;
    }
}

async function registerFunc(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const full_name = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const organization = document.getElementById('register-organization').value;

    if (!email || !username || !password) {
        showNotification('Please provide username, password and email', 'warning');
        return;
    }
    // basic client-side email/phone validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'warning');
        return;
    }
    if (phone && !/^\+?[0-9\- ()]{7,20}$/.test(phone)) {
        showNotification('Please enter a valid phone number', 'warning');
        return;
    }

    // Client-side password policy: min 10, upper, lower, digit, special
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        showNotification('Password must be at least 10 characters and include upper, lower, number, and special', 'warning');
        return;
    }

    const payload = { username, password, full_name, email, phone, organization };

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "registered") {
        showLogin();
        showNotification("Registered! You can login now.");
    } else {
        showNotification(data.error || "Registration failed");
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    loggedIn = false;
    showLoginPage();
    showNotification("Logged out");
}


// PAGE/UI SWITCHING
function showDashboard(username) {
    const authSection = document.getElementById('auth-section');
    authSection.style.setProperty('display', 'none', 'important');

    // NEW FIX: Show the sidebar toggle button only when logged in
    document.getElementById('sidebar-toggle').style.removeProperty('display');

    document.getElementById('userinfo-name').textContent = username;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('logout-navbar').style.removeProperty('display');
}

function showLoginPage() {
    const authSection = document.getElementById('auth-section');
    authSection.style.removeProperty('display');

    // NEW FIX: Hide the sidebar toggle button when logged out
    document.getElementById('sidebar-toggle').style.display = 'none';

    // Hide all main sections
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
    document.getElementById('compose').style.display = 'none';
    document.getElementById('archived').style.display = 'none';
    document.getElementById('trashed').style.display = 'none';
    document.getElementById('manual-classify').style.display = 'none'; // <-- NEW

    // Hide user info/logout from top navbar
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('logout-navbar').style.display = 'none';
}

async function checkLoginStatus() {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.logged_in) {
            loggedIn = true;
            showDashboard(data.username);
            const hash = window.location.hash.replace('#', '');
            showTab(hash || 'dashboard');
        } else {
            loggedIn = false;
            showLoginPage();
        }
    } catch (error) {
        console.error("Failed to check login status:", error);
        showLoginPage();

        // Ensure sidebar toggle is hidden if login fails
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) sidebarToggle.style.display = 'none';

    } finally {
        document.body.classList.add('loaded');
    }
}

function showTab(tabName) {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('compose').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
    document.getElementById('archived').style.display = 'none';
    document.getElementById('trashed').style.display = 'none';
    document.getElementById('manual-classify').style.display = 'none'; // <-- NEW

    if (tabName === 'dashboard') {
        document.getElementById('dashboard').style.removeProperty('display');
        renderEmails();
    } else if (tabName === 'compose') {
        document.getElementById('compose').style.removeProperty('display');
    } else if (tabName === 'manual-classify') { // <-- NEW
        document.getElementById('manual-classify').style.removeProperty('display');
    } else if (tabName === 'settings') {
        document.getElementById('settings').style.removeProperty('display');
        loadNotificationSetting();
        renderPrioritySenders();
        loadUserProfile();
    } else if (tabName === 'archived') {
        document.getElementById('archived').style.removeProperty('display');
        renderArchivedEmails();
    } else if (tabName === 'trashed') {
        document.getElementById('trashed').style.removeProperty('display');
        renderTrashedEmails();
    } else {
        document.getElementById('dashboard').style.removeProperty('display');
        renderEmails();
        tabName = 'dashboard';
    }
    window.location.hash = tabName;
}


// NOTIFICATIONS
function showNotification(message, type = 'info') {
    let notif = document.createElement('div');
    notif.textContent = message;
    notif.className = `alert alert-${type} shadow`;
    document.getElementById("notif-container").appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function showBrowserNotification(subject, content) {
    if (!("Notification" in window)) return;
    if (notificationsEnabled && Notification.permission === "granted") {
        new Notification(subject, {
            body: content,
            icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E%F0%9F%93%A7%3C/text%3E%3C/svg%3E"
        });
    }
}


// DASHBOARD: MAIN EMAIL LOGIC
function searchEmails() {
    const searchTerm = document.getElementById('searchbar').value.toLowerCase();
    const emailCards = document.querySelectorAll('#email-list .card');
    emailCards.forEach(card => {
        const textContent = card.textContent.toLowerCase();
        card.style.display = textContent.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterEmails(type) {
    renderEmails(type === 'all' ? null : type);
    document.getElementById('searchbar').value = '';
}

async function renderEmails(filter = null) {
    if (!loggedIn) return;
    try {
        const res = await fetch('/api/emails');
        if (res.status === 401) return;
        let allEmails = await res.json();
        currentEmailList = allEmails;
        let emailsToRender = allEmails;

        // compute now to help categorize emails
        const now = new Date();

        if (filter === "important") emailsToRender = allEmails.filter(e => e.priority <= 3 && !(e.due_date && new Date(e.due_date) < now));
        else if (filter === "not-important") emailsToRender = allEmails.filter(e => e.priority === 4);
        else if (filter === "pending") emailsToRender = allEmails.filter(e => e.status === 'active' && !(e.due_date && new Date(e.due_date) < now));
        else if (filter === "past-due") emailsToRender = allEmails.filter(e => e.due_date && new Date(e.due_date) < now && e.status === 'active');

        let impCount = allEmails.filter(e => e.priority <= 3 && !(e.due_date && new Date(e.due_date) < now)).length;
        let notImpCount = allEmails.filter(e => e.priority === 4).length;
        let pendingCount = allEmails.filter(e => e.status === 'active' && !(e.due_date && new Date(e.due_date) < now)).length;
        let pastDueCount = allEmails.filter(e => e.due_date && new Date(e.due_date) < now).length;
        document.getElementById('stats').innerHTML = `
            <span>Important: ${impCount}</span>
            <span class="ms-4 text-muted">Not Important: ${notImpCount}</span>
            <span class="ms-4 text-muted">Pending: ${pendingCount}</span>
            <span class="ms-4 text-muted">Past Due: ${pastDueCount}</span>
        `;

        const emailList = document.getElementById('email-list');
        emailList.innerHTML = '';

        // Sort emails: important tasks first (priority <= 3),
        // then by nearest due date (items with due dates first, closest deadline first),
        // then by priority (lower number = higher priority), then most recently received.
        emailsToRender.sort((a, b) => {
            const aImp = (a.priority <= 3) ? 0 : 1;
            const bImp = (b.priority <= 3) ? 0 : 1;
            if (aImp !== bImp) return aImp - bImp;

            const hasDueA = !!a.due_date;
            const hasDueB = !!b.due_date;
            if (hasDueA && hasDueB) {
                const da = new Date(a.due_date);
                const db = new Date(b.due_date);
                if (da.getTime() !== db.getTime()) return da - db;
            }
            if (hasDueA && !hasDueB) return -1;
            if (!hasDueA && hasDueB) return 1;

            if (a.priority !== b.priority) return a.priority - b.priority;
            const ra = a.date_received ? new Date(a.date_received).getTime() : 0;
            const rb = b.date_received ? new Date(b.date_received).getTime() : 0;
            return rb - ra;
        });

        if (emailsToRender.length === 0) {
            emailList.innerHTML = '<p class="text-center text-muted">Your inbox is empty.</p>';
        }

        emailsToRender.forEach(email => {
            emailList.innerHTML += createEmailCardHTML(email);
        });
    } catch (error) {
        console.error("Error rendering emails:", error);
    }
}

function createEmailCardHTML(email) {
    let providerActions = '';

    if (email.status === 'active') {
        if (email.provider === "gmail" && email.gmail_id) {
            providerActions = `
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="archiveEmail(${email.id}, '${email.gmail_id}', event)">📦 Archive</button>
                <button class="btn btn-sm btn-outline-danger" onclick="trashEmail(${email.id}, '${email.gmail_id}', event)">🗑️ Trash</button>
            `;
        } else if (email.provider === "manual") {
            providerActions = `
                <button class="btn btn-sm btn-outline-danger" onclick="trashEmail(${email.id}, null, event)">🗑️ Trash</button>
            `;
        }
    } else if (email.status === 'archived') {
        providerActions = `
            <button class="btn btn-sm btn-success me-1" onclick="restoreEmail(${email.id}, event)">📬 Move to Inbox</button>
        `;
    } else if (email.status === 'trashed') {
        providerActions = `
            <button class="btn btn-sm btn-success me-1" onclick="restoreEmail(${email.id}, event)">📬 Restore</button>
            <button class="btn btn-sm btn-danger" onclick="deletePermanently(${email.id}, event)">❌ Delete</button>
        `;
    }

    const isImportant = email.priority <= 3;

    // --- NEW STYLING LOGIC (Using background for priority line) ---
    let priorityColorClass = 'priority-p4'; // Default P4
    if (email.priority === 1) priorityColorClass = 'priority-p1';
    else if (email.priority === 2) priorityColorClass = 'priority-p2';
    else if (email.priority === 3) priorityColorClass = 'priority-p3';

    // Check for Due Date and apply styling/badge
    let dueTimeBadge = '';
    if (email.due_date) {
        const dueDate = new Date(email.due_date);
        const now = new Date();
        const isPastDue = dueDate < now;

        const dueText = `DUE: ${dueDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`;

        if (isPastDue) {
            dueTimeBadge = `<span class="badge bg-danger ms-2">💀 PAST DUE</span>`;
            priorityColorClass = 'priority-pastdue'; // Override for past due
        } else if (email.priority <= 2) {
            dueTimeBadge = `<span class="badge bg-warning text-dark ms-2">🚨 ${dueText}</span>`;
        } else {
            dueTimeBadge = `<span class="badge bg-info text-dark ms-2">📅 ${dueText}</span>`;
        }
    }

    // We intentionally remove the visible P1/P2/P3/P4 label from the top of cards.
    // The color bar (priorityColorClass) indicates priority visually.

    const providerBadge = `<span class="badge bg-light text-muted border border-secondary-subtle">${email.provider}</span>`;

    let receivedTime = '';
    if (email.date_received) {
        // Use a compact date/time format to prevent overlap
        receivedTime = new Date(email.date_received).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const replyCountBadge = email.reply_count > 0
        ? `<span class="badge bg-success ms-2">💬 ${email.reply_count}</span>`
        : '';

    // FIX 1: Put replyCountBadge in the TOP LEFT BADGE ROW
    const topBadges = `
        <div class="mb-1">
            ${providerBadge}
            ${email.reply_count > 0 ? replyCountBadge : ''} </div>
    `;


    // FIX 3: Restructured time display to push all metadata to the bottom of the right panel
    const timeDisplay = `
        <div class="date-display"> <div class="small text-muted text-end">${receivedTime}</div>
            <div class="d-flex justify-content-end align-items-center small text-muted mt-1">
                ${email.due_date ? dueTimeBadge : ''}
            </div>
        </div>
    `;

    let markButtons = '';
    if (email.status === 'active') {
        // Removed star from button text
        markButtons = `
            <div class="mark-buttons d-flex flex-column gap-2">
                <button class="btn ${isImportant ? 'btn-primary' : 'btn-outline-primary'} btn-sm" onclick="markImportant(${email.id}, true); event.stopPropagation()">Important</button>
                <button class="btn ${!isImportant ? 'btn-secondary' : 'btn-outline-secondary'} btn-sm" onclick="markImportant(${email.id}, false); event.stopPropagation()">Not Important</button>
            </div>
        `;
    }

    const replyThreadHTML = `
        <div id="reply-thread-${email.id}" class="reply-thread mt-3" style="display:none;">
            <div class="card bg-light">
                <div class="card-body py-3">
                    <h6 class="text-primary mb-3">💬 Reply History</h6>
                    <div id="reply-list-${email.id}" class="reply-list">
                        <p class="text-muted">Loading replies...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const showRepliesButton = email.reply_count > 0
        ? `<button class="btn btn-sm btn-link p-0 mt-2" onclick="toggleReplyThread(${email.id}); event.stopPropagation()">
             <span id="toggle-icon-${email.id}">▶</span> View ${email.reply_count} ${email.reply_count === 1 ? 'Reply' : 'Replies'}
           </button>`
        : '';

    // --- FINAL CARD STRUCTURE WITH ABSOLUTE RIGHT PANEL ---
    return `
        <div class="card email-card ${priorityColorClass} mb-3 shadow-sm" onclick="openEmailModal(${email.id})">
            <div class="card-body p-3">
                
                <div class="flex-grow-1">
                    ${topBadges} <h5 class="card-title mb-0 fw-bold">${email.subject}</h5>
                    <h6 class="card-subtitle mb-1 text-primary small">${email.sender}</h6>
                    <p class="card-text small snippet" style="max-width: 100%;">${email.content}</p>
                    
                    <div class="action-row d-flex align-items-center mt-2 gap-2">
                        ${providerActions}
                        ${showRepliesButton}
                    </div>
                    
                    ${replyThreadHTML}
                </div>

                <div class="right-panel"> 
                    <div> ${markButtons}
                    </div>
                    
                    ${timeDisplay} </div>

            </div>
        </div>
    `;
}

function openEmailModal(id) {
    const email = currentEmailList.find(e => e.id === id);
    if (!email) {
        showNotification("Email details not found.", 'danger');
        return;
    }

    const emailModal = new bootstrap.Modal(document.getElementById('emailModal'));

    // Show due date badge in modal if present, hide otherwise.
    const modalPriorityElem = document.getElementById('modal-priority-badge');
    if (modalPriorityElem) {
        if (email.due_date) {
            const dueDate = new Date(email.due_date);
            const isPastDue = dueDate < new Date();
            const dueText = dueDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            if (isPastDue) {
                modalPriorityElem.innerHTML = `<span class="badge bg-danger">PAST DUE: ${dueText}</span>`;
            } else {
                modalPriorityElem.innerHTML = `<span class="badge bg-warning text-dark">DUE: ${dueText}</span>`;
            }
            modalPriorityElem.style.display = 'block';
        } else {
            modalPriorityElem.style.display = 'none';
        }
    }
    document.getElementById('modal-subject').textContent = email.subject;
    document.getElementById('modal-sender').textContent = email.sender;
    document.getElementById('modal-date').textContent = new Date(email.date_received).toLocaleString();
    document.getElementById('modal-content-full').textContent = email.content;

    const replyButton = document.getElementById('reply-button');
    const senderMatch = email.sender.match(/<([^>]+)>/);
    const senderEmail = senderMatch ? senderMatch[1] : email.sender;

    replyButton.setAttribute('data-reply-to', senderEmail);
    replyButton.setAttribute('data-email-id', email.id);

    emailModal.show();
}

function replyToEmail() {
    const replyButton = document.getElementById('reply-button');
    const recipient = replyButton.getAttribute('data-reply-to');
    const emailId = replyButton.getAttribute('data-email-id');

    const emailModal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
    if (emailModal) {
        emailModal.hide();
    }

    currentReplyEmailId = parseInt(emailId);

    showTab('compose');
    document.getElementById('send-to').value = recipient;

    const email = currentEmailList.find(e => e.id === parseInt(emailId));
    if (email && email.subject) {
        const subject = email.subject.startsWith('Re: ') ? email.subject : 'Re: ' + email.subject;
        document.getElementById('send-subject').value = subject;
    }

    document.getElementById('send-body').focus();
    showNotification(`Replying to ${recipient}. Your reply will be tracked.`, 'info');
}


async function markImportant(id, flag) {
    await fetch(`/api/emails/${id}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ important: flag }),
    });
    renderEmails();
    showNotification(`Email marked as ${flag ? "Important" : "Not Important"}`, 'success');
}

async function addEmail(event) {
    event.preventDefault();
    const subject = document.getElementById('subject').value;
    const sender = document.getElementById('sender').value;
    const content = document.getElementById('content').value;
    const res = await fetch('/api/emails/auto-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, sender, content })
    });
    const data = await res.json();
    renderEmails();
    const isImportant = data.priority <= 3;
    showNotification(`Email added & classified as ${isImportant ? "Important" : "Not Important"}`, 'success');
    if (data.priority <= 2) {
        showBrowserNotification(data.subject, data.content);
    }
    event.target.reset();
}

async function importGmail() {
    showNotification("Importing emails from Gmail...", "info");
    try {
        const res = await fetch('/api/fetch_gmail');
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(`✅ Imported: ${data.imported} emails from Gmail!`, "success");
            if (data.emails && data.emails.length > 0) {
                data.emails.forEach(email => {
                    if (email.priority <= 2) {
                        showBrowserNotification(email.subject, email.content);
                    }
                });
            }
            renderEmails();
        } else {
            showNotification(`❌ Import failed: ${data.error}`, "danger");
        }
    } catch (error) {
        showNotification("❌ Error sending email: " + error.message, "danger");
    }
}


// COMPOSE EMAIL
async function sendGmail(event) {
    event.preventDefault();
    const to = document.getElementById('send-to').value;
    const subject = document.getElementById('send-subject').value;
    const body = document.getElementById('send-body').value;
    const spinner = document.getElementById('send-spinner');
    if (spinner) spinner.style.display = 'inline-block';
    try {
        const res = await fetch('/api/gmail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                subject,
                body,
                parent_email_id: currentReplyEmailId
            })
        });
        const data = await res.json();
        if (data.status === 'sent') {
            showNotification("✅ Email sent successfully!", "success");
            clearComposeForm();
            currentReplyEmailId = null;

            if (loggedIn) {
                renderEmails();
            }
        } else {
            showNotification("❌ Failed to send email!", "danger");
        }
    } catch (error) {
        showNotification("❌ Error sending email: " + error.message, "danger");
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

function clearComposeForm() {
    document.getElementById('send-to').value = '';
    document.getElementById('send-subject').value = '';
    document.getElementById('send-body').value = '';
    currentReplyEmailId = null;
}


// EMAIL ACTIONS
async function archiveEmail(local_id, gmail_id, event) {
    // Replaced confirm() with window.confirm() for basic browser compatibility
    if (!window.confirm('Archive this email? This will also archive it in Gmail.')) return;
    const btn = event ? event.target : null;
    if (btn) btn.disabled = true;

    try {
        const res = await fetch('/api/gmail/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail_id: gmail_id })
        });
        const data = await res.json();
        if (data.result === 'archived') {
            showNotification("✅ Email archived successfully!", "success");
            renderEmails();
        } else {
            showNotification("❌ Failed to archive email!", "danger");
            if (btn) btn.disabled = false;
        }
    } catch (error) {
        showNotification("❌ Error archiving email: " + error.message, "danger");
        if (btn) btn.disabled = false;
    }
}

async function trashEmail(local_id, gmail_id, event) {
    let confirmMsg = 'Move this email to trash?';
    if (gmail_id) confirmMsg += ' (This will also move it to trash in Gmail).';

    // Replaced confirm() with window.confirm() for basic browser compatibility
    if (!window.confirm(confirmMsg)) return;

    const btn = event ? event.target : null;
    if (btn) btn.disabled = true;

    try {
        let res;
        if (gmail_id) {
            res = await fetch('/api/gmail/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gmail_id: gmail_id })
            });
        } else {
            res = await fetch(`/api/emails/${local_id}`, {
                method: 'DELETE'
            });
        }

        const data = await res.json();
        if (res.ok && (data.result === 'trashed' || data.status === 'trashed')) {
            showNotification("✅ Email moved to trash!", "success");
            renderEmails();
        } else {
            showNotification("❌ Failed to trash email: " + (data.error || "Unknown error"), "danger");
            if (btn) btn.disabled = false;
        }
    } catch (error) {
        showNotification("❌ Error trashing email: " + error.message, "danger");
        if (btn) btn.disabled = false;
    }
}

async function restoreEmail(local_id, event) {
    const btn = event ? event.target : null;
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`/api/emails/${local_id}/restore`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.status === 'restored') {
            showNotification("✅ Email restored to inbox!", "success");
            renderArchivedEmails();
            renderTrashedEmails();
        } else {
            showNotification("❌ Failed to restore email: " + (data.error || "Unknown error"), "danger");
            if (btn) btn.disabled = false;
        }
    } catch (error) {
        showNotification("❌ Error restoring email: " + error.message, "danger");
        if (btn) btn.disabled = false;
    }
}

async function deletePermanently(local_id, event) {
    // Replaced confirm() with window.confirm() for basic browser compatibility
    if (!window.confirm('⚠️ Permanently delete this email? This cannot be undone!')) return;

    const btn = event ? event.target : null;
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`/api/emails/${local_id}/permanent`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.status === 'permanently_deleted') {
            showNotification("✅ Email permanently deleted!", "success");
            renderTrashedEmails();
        } else {
            showNotification("❌ Failed to delete: " + (data.error || "Unknown error"), "danger");
            if (btn) btn.disabled = false;
        }
    } catch (error) {
        showNotification("❌ Error deleting: " + error.message, "danger");
        if (btn) btn.disabled = false;
    }
}


// REPLY THREAD FUNCTIONS
async function toggleReplyThread(emailId) {
    const threadDiv = document.getElementById(`reply-thread-${emailId}`);
    const toggleIcon = document.getElementById(`toggle-icon-${emailId}`);

    if (threadDiv.style.display === 'none') {
        threadDiv.style.display = 'block';
        toggleIcon.textContent = '▼';
        await loadReplies(emailId);
    } else {
        threadDiv.style.display = 'none';
        toggleIcon.textContent = '▶';
    }
}

async function loadReplies(emailId) {
    const replyListDiv = document.getElementById(`reply-list-${emailId}`);
    replyListDiv.innerHTML = '<p class="text-muted">Loading replies...</p>';

    try {
        const res = await fetch(`/api/emails/${emailId}/replies`);
        if (!res.ok) {
            throw new Error('Failed to load replies');
        }

        const replies = await res.json();

        if (replies.length === 0) {
            replyListDiv.innerHTML = '<p class="text-muted">No replies yet.</p>';
            return;
        }

        replyListDiv.innerHTML = '';
        replies.forEach((reply, index) => {
            const replyCard = document.createElement('div');
            replyCard.className = 'card mb-2 border-success';
            replyCard.innerHTML = `
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <p class="mb-1 small"><strong>To:</strong> ${reply.recipient}</p>
                            <p class="mb-1 small"><strong>Subject:</strong> ${reply.subject || '(No subject)'}</p>
                            <p class="mb-2 small text-muted">${new Date(reply.sent_date).toLocaleString()}</p>
                            <div class="small" style="white-space: pre-wrap;">${reply.body}</div>
                        </div>
                        <span class="badge bg-success">Reply #${index + 1}</span>
                    </div>
                </div>
            `;
            replyListDiv.appendChild(replyCard);
        });
    } catch (error) {
        replyListDiv.innerHTML = '<p class="text-danger">Failed to load replies.</p>';
        console.error('Error loading replies:', error);
    }
}


// ARCHIVE/TRASH VIEW RENDERING
async function renderArchivedEmails() {
    const listElement = document.getElementById('archived-email-list');
    listElement.innerHTML = '<p class="text-center text-muted">Loading...</p>';
    try {
        const res = await fetch('/api/emails/archived');
        const emails = await res.json();
        listElement.innerHTML = '';
        if (emails.length === 0) {
            listElement.innerHTML = '<p class="text-center text-muted">Your archive is empty.</p>';
            return;
        }
        emails.forEach(email => {
            listElement.innerHTML += createEmailCardHTML(email);
        });
    } catch (error) {
        listElement.innerHTML = '<p class="text-center text-danger">Failed to load archived emails.</p>';
    }
}

async function renderTrashedEmails() {
    const listElement = document.getElementById('trashed-email-list');
    listElement.innerHTML = '<p class="text-center text-muted">Loading...</p>';
    try {
        const res = await fetch('/api/emails/trashed');
        const emails = await res.json();
        listElement.innerHTML = '';
        if (emails.length === 0) {
            listElement.innerHTML = '<p class="text-center text-muted">Your trash is empty.</p>';
            return;
        }
        emails.forEach(email => {
            listElement.innerHTML += createEmailCardHTML(email);
        });
    } catch (error) {
        listElement.innerHTML = '<p class="text-center text-danger">Failed to load trashed emails.</p>';
    }
}


// SETTINGS
async function cleanupOldEmails() {
    // Replaced confirm() with window.confirm() for basic browser compatibility
    if (!window.confirm('Are you sure you want to delete all ACTIVE emails (local copies) older than 30 days?')) return;
    try {
        const res = await fetch('/api/emails/cleanup', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            if (data.status === 'cleaned_up') {
                showNotification(`✅ Successfully cleaned up ${data.count} old emails.`, 'success');
                renderEmails();
            } else if (data.status === 'nothing_to_delete') {
                showNotification(`No old active emails found to delete.`, 'info');
            }
        } else {
            showNotification(`❌ Cleanup failed: ${data.error}`, "danger");
        }
    } catch (error) {
        showNotification(`❌ Cleanup error: ${error.message}`, "danger");
    }
}

async function loadNotificationSetting() {
    try {
        const res = await fetch('/api/settings/notifications');
        const data = await res.json();
        const checkbox = document.getElementById('notifications-check');
        if (checkbox) checkbox.checked = data.enabled;
        notificationsEnabled = data.enabled;
    } catch (error) {
        console.error("Failed to load notification settings:", error);
    }
}

// SETTINGS (continuation)
async function saveNotificationSetting(event) {
    const isChecked = event.target.checked;
    if (isChecked) {
        if (!("Notification" in window)) {
            showNotification("This browser does not support desktop notification", "danger");
            event.target.checked = false;
            return;
        }
        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                showNotification("Notification permission was denied.", "warning");
                event.target.checked = false;
                return;
            }
        }
    }
    try {
        const res = await fetch('/api/settings/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: isChecked })
        });
        const data = await res.json();
        if (data.status === 'updated') {
            notificationsEnabled = data.enabled;
            showNotification(`Notifications ${data.enabled ? 'Enabled' : 'Disabled'}`, 'success');
        }
    } catch (error) {
        showNotification('Failed to save setting', 'danger');
        event.target.checked = !isChecked;
    }
}

async function renderPrioritySenders() {
    const listElement = document.getElementById('priority-sender-list');
    listElement.innerHTML = '';
    try {
        const res = await fetch('/api/priority-senders');
        const senders = await res.json();
        if (senders.length === 0) {
            listElement.innerHTML = '<li class="list-group-item text-muted">No priority senders added yet.</li>';
        } else {
            senders.forEach(sender => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = sender.email;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => deletePrioritySender(sender.id);
                li.appendChild(deleteBtn);
                listElement.appendChild(li);
            });
        }
    } catch (error) {
        listElement.innerHTML = '<li class="list-group-item text-danger">Failed to load list.</li>';
    }
}

// Load profile into settings form
async function loadUserProfile() {
    try {
        const res = await fetch('/api/user');
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById('profile-fullname').value = data.full_name || '';
        document.getElementById('profile-email').value = data.email || '';
        document.getElementById('profile-phone').value = data.phone || '';
        document.getElementById('profile-organization').value = data.organization || '';
        originalEmail = data.email || null;
        const statusEl = document.getElementById('email-confirmation-status');
        const resendBtn = document.getElementById('resend-verification');
        if (statusEl) statusEl.textContent = data.email_confirmed ? `Verified${data.email_confirmed_at ? ' • ' + new Date(data.email_confirmed_at).toLocaleString() : ''}` : 'Not verified';
        if (resendBtn) resendBtn.onclick = sendVerification;
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function sendVerification() {
    try {
        const res = await fetch('/api/user/send_verification', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showNotification('Verification email sent', 'success');
            if (data.link) {
                // show link to developer in a small notification
                showNotification(`(Dev) ${data.link}`, 'info');
            }
        } else {
            showNotification(data.error || 'Failed to send verification', 'danger');
        }
    } catch (err) {
        showNotification('Failed to send verification', 'danger');
    }
}

// Save profile changes
async function saveUserProfile(event) {
    event.preventDefault();
    const full_name = document.getElementById('profile-fullname').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const organization = document.getElementById('profile-organization').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'warning');
        return;
    }
    if (phone && !/^\+?[0-9\- ()]{7,20}$/.test(phone)) {
        showNotification('Please enter a valid phone number', 'warning');
        return;
    }

    // If email was changed, prompt for current password for re-auth
    let current_password = null;
    if (originalEmail && email !== originalEmail) {
        current_password = prompt('To change your email, please enter your current password');
        if (!current_password) {
            showNotification('Email change cancelled (password required)', 'warning');
            return;
        }
    }

    try {
        const payload = { full_name, email, phone, organization };
        if (current_password) payload.current_password = current_password;
        const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Profile updated', 'success');
            // if email change, refresh profile (which will show unverified status)
            if (current_password) loadUserProfile();
        } else {
            showNotification(data.error || 'Failed to update profile', 'danger');
        }
    } catch (error) {
        showNotification('Failed to update profile', 'danger');
    }
}

async function addPrioritySender(event) {
    event.preventDefault();
    const emailInput = document.getElementById('priority-sender-email');
    const email = emailInput.value;
    const res = await fetch('/api/priority-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    });
    const data = await res.json();
    if (res.ok) {
        showNotification(`Added ${data.email} to P1 priority list.`, 'success');
        emailInput.value = '';
        renderPrioritySenders();
    } else {
        showNotification(data.error || 'Failed to add sender.', 'danger');
    }
}

async function deletePrioritySender(id) {
    // Replaced confirm() with window.confirm() for basic browser compatibility
    if (!window.confirm('Are you sure you want to remove this email from the priority list?')) return;
    const res = await fetch(`/api/priority-senders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
        showNotification('Sender removed from priority list.', 'success');
        renderPrioritySenders();
    } else {
        showNotification(data.error || 'Failed to remove sender.', 'danger');
    }
}


// INIT ON LOAD...
window.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    document.getElementById('login-form').addEventListener('submit', loginFunc);
    document.getElementById('register-form').addEventListener('submit', registerFunc);
    document.getElementById('compose-form').addEventListener('submit', sendGmail);
    document.getElementById('priority-sender-form').addEventListener('submit', addPrioritySender);
    document.getElementById('notifications-check').addEventListener('change', saveNotificationSetting);
    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.addEventListener('submit', saveUserProfile);
    const changePwdForm = document.getElementById('change-password-form');
    if (changePwdForm) changePwdForm.addEventListener('submit', changePasswordHandler);

    const resetRequestForm = document.getElementById('password-reset-request-form');
    if (resetRequestForm) resetRequestForm.addEventListener('submit', requestPasswordReset);
    const resetForm = document.getElementById('password-reset-form');
    if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

    // Password strength meter listeners
    const regPwd = document.getElementById('register-password');
    if (regPwd) regPwd.addEventListener('input', (e) => updateStrengthBar(e.target.value, 'register-password-strength', 'register-password-hint'));
    const newPwd = document.getElementById('new-password');
    if (newPwd) newPwd.addEventListener('input', (e) => updateStrengthBar(e.target.value, 'change-password-strength'));
    const resetNewPwd = document.getElementById('reset-new-password');
    if (resetNewPwd) resetNewPwd.addEventListener('input', (e) => updateStrengthBar(e.target.value, 'reset-password-strength'));

    // Check for verification query params and show notifications
    checkQueryParamsOnLoad();
});

function checkQueryParamsOnLoad() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('verified')) {
            showNotification('Email verified. Thank you!', 'success');
            params.delete('verified');
        }
        if (params.has('verify_error')) {
            const err = params.get('verify_error');
            if (err === 'expired') showNotification('Verification link expired.', 'danger');
            else showNotification('Invalid verification link.', 'danger');
            params.delete('verify_error');
        }
        // Password reset token handling
        if (params.has('reset') && params.has('token')) {
            resetToken = params.get('token');
            showPasswordResetForm();
            params.delete('reset');
            // keep token in memory but remove it from URL for UX/security
            params.delete('token');
        }
        // Clean up URL (remove query params without reloading)
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
        console.error('Failed to parse query params:', e);
    }
}

function showPasswordResetRequest() {
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const reqCard = document.getElementById('password-reset-request-card');
    const resetCard = document.getElementById('password-reset-card');
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = 'none';
    if (reqCard) reqCard.style.display = '';
    if (resetCard) resetCard.style.display = 'none';

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    // show request form inside its card
    const reqForm = document.getElementById('password-reset-request-form');
    if (reqForm) reqForm.style.display = '';
    const resetForm = document.getElementById('password-reset-form');
    if (resetForm) resetForm.style.display = 'none';
}

function showPasswordResetForm() {
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const reqCard = document.getElementById('password-reset-request-card');
    const resetCard = document.getElementById('password-reset-card');
    if (loginCard) loginCard.style.display = 'none';
    if (registerCard) registerCard.style.display = 'none';
    if (reqCard) reqCard.style.display = 'none';
    if (resetCard) resetCard.style.display = '';

    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    // show reset form inside its card
    const reqForm = document.getElementById('password-reset-request-form');
    if (reqForm) reqForm.style.display = 'none';
    const resetForm = document.getElementById('password-reset-form');
    if (resetForm) resetForm.style.display = '';
    // focus the password input
    setTimeout(() => {
        const el = document.getElementById('reset-new-password');
        if (el) el.focus();
    }, 100);
}

async function requestPasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('reset-request-email').value;
    if (!email) {
        showNotification('Please enter your email', 'warning');
        return;
    }
    try {
        const res = await fetch('/api/user/request_password_reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('If that email exists, a reset link has been sent.', 'info');
            if (data.link) showNotification('(Dev) ' + data.link, 'info');
            showLogin();
        } else if (res.status === 429) {
            showNotification(data.error || 'Too many requests. Try later.', 'danger');
        } else {
            showNotification(data.error || 'Failed to request password reset', 'danger');
        }
    } catch (err) {
        showNotification('Failed to request password reset', 'danger');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const new_password = document.getElementById('reset-new-password').value;
    if (!resetToken) {
        showNotification('Reset token is missing or invalid', 'danger');
        return;
    }
    // Client-side password policy
    if (new_password.length < 10 || !/[A-Z]/.test(new_password) || !/[a-z]/.test(new_password) || !/[0-9]/.test(new_password) || !/[^A-Za-z0-9]/.test(new_password)) {
        showNotification('Password must be at least 10 chars and include upper, lower, number, special', 'warning');
        return;
    }
    try {
        const res = await fetch('/api/user/reset_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: resetToken, new_password })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Password has been reset. You can now login.', 'success');
            resetToken = null;
            showLogin();
        } else {
            showNotification(data.error || 'Failed to reset password', 'danger');
        }
    } catch (err) {
        showNotification('Failed to reset password', 'danger');
    }
}

function updateStrengthBar(password, barId, textId) {
    let score = 0;
    if (password.length >= 10) score += 25;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    const pct = Math.min(100, score);
    const bar = document.getElementById(barId);
    if (bar) {
        bar.style.width = pct + '%';
        bar.className = 'progress-bar ' + (pct >= 80 ? 'bg-success' : (pct >= 50 ? 'bg-warning' : 'bg-danger'));
    }
    if (textId) {
        const el = document.getElementById(textId);
        if (el) {
            let text = 'Very weak';
            if (pct >= 80) text = 'Strong';
            else if (pct >= 50) text = 'Okay';
            else if (pct >= 30) text = 'Weak';
            el.textContent = text;
            el.className = 'form-text ' + (pct >= 80 ? 'text-success' : (pct >= 50 ? 'text-warning' : 'text-danger'));
        }
    }
}

async function changePasswordHandler(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const nw = document.getElementById('new-password').value;
    if (!current || !nw) {
        showNotification('Please provide both current and new passwords', 'warning');
        return;
    }
    if (nw.length < 8 || !/[A-Za-z]/.test(nw) || !/[0-9]/.test(nw)) {
        showNotification('New password must be at least 8 characters and include letters and numbers', 'warning');
        return;
    }
    try {
        const res = await fetch('/api/user/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: current, new_password: nw })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Password changed', 'success');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
        } else {
            showNotification(data.error || 'Failed to change password', 'danger');
        }
    } catch (err) {
        showNotification('Failed to change password', 'danger');
    }
}