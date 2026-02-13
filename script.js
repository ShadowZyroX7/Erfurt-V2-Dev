// ==== AUTHENTIFIZIERUNGSSYSTEM ====
let currentUser = null;
let users = [];
let roleplays = [];
let registrations = []; // Speichert alle Anmeldungen zu Events
let teamMembers = []; // Speichert Team-Mitglieder
let nextRoleplayId = 1;

// Rollen-Definitionen mit Berechtigungen
const ROLES = {
    user: {
        name: 'Benutzer',
        permissions: ['view_events', 'register_event']
    },
    beobachter: {
        name: 'Beobachter',
        permissions: ['view_events', 'view_registrations']
    },
    verwalter: {
        name: 'Verwalter',
        permissions: ['view_events', 'create_event', 'edit_own_event', 'delete_own_event', 'view_registrations']
    },
    admin: {
        name: 'Administrator',
        permissions: ['view_events', 'create_event', 'edit_event', 'delete_event', 'view_registrations', 'manage_users']
    }
};

// Prüfe, ob Benutzer Berechtigung hat
function hasPermission(permission) {
    if (!currentUser) return ROLES.user.permissions.includes(permission);
    return ROLES[currentUser.role]?.permissions.includes(permission) || false;
}

// Standardbenutzer initialisieren
function initializeUsers() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        // Standard-Admin-Benutzer
        users = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123', // In der Praxis würde man das hashen!
                role: 'admin'
            }
        ];
        saveUsers();
    }
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function loadRoleplays() {
    const saved = localStorage.getItem('roleplays');
    if (saved) {
        roleplays = JSON.parse(saved);
        if (roleplays.length > 0) {
            nextRoleplayId = Math.max(...roleplays.map(r => r.id)) + 1;
        }
    }
}

function saveRoleplays() {
    localStorage.setItem('roleplays', JSON.stringify(roleplays));
}

function loadRegistrations() {
    const saved = localStorage.getItem('registrations');
    if (saved) {
        registrations = JSON.parse(saved);
    }
}

function saveRegistrations() {
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

function loadTeamMembers() {
    const saved = localStorage.getItem('teamMembers');
    if (saved) {
        teamMembers = JSON.parse(saved);
    }
}

function saveTeamMembers() {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
}

// ==== LOGIN-FUNKTIONEN ====
function openLoginModal() {
    switchTab('login');
}

function closeLoginModal() {
    // Obsolete - wird durch switchTab ersetzt
}

function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // UI aktualisieren
        updateUserUI();
        // Nach erfolgreicher Anmeldung zur Startseite
        switchTab('browse');
        document.getElementById('loginForm').reset();
    } else {
        document.getElementById('loginError').textContent = 'Benutzername oder Passwort falsch!';
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    switchTab('login');
}

// ==== PASSWORT-SICHERHEIT ====
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
}

function generatePassword(fieldId) {
    const chars = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    
    const length = 16;
    let password = '';
    
    // Mindestens ein Zeichen aus jeder Kategorie
    password += chars.uppercase.charAt(Math.floor(Math.random() * chars.uppercase.length));
    password += chars.lowercase.charAt(Math.floor(Math.random() * chars.lowercase.length));
    password += chars.numbers.charAt(Math.floor(Math.random() * chars.numbers.length));
    password += chars.special.charAt(Math.floor(Math.random() * chars.special.length));
    
    // Restliche Zeichen zufällig
    const allChars = Object.values(chars).join('');
    for (let i = password.length; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mischen
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    // In Feld einfügen
    const field = document.getElementById(fieldId);
    field.value = password;
    field.type = 'text'; // Zeige Passwort an
    
    // Stärkeanzeige aktualisieren
    checkPasswordStrength(fieldId);
}

function checkPasswordStrength(fieldId) {
    const password = document.getElementById(fieldId).value;
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthIndicator || !strengthText) return;
    
    let strength = 0;
    let feedback = '';
    
    // Länge
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    
    // Großbuchstaben
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Kleinbuchstaben
    if (/[a-z]/.test(password)) strength += 1;
    
    // Zahlen
    if (/[0-9]/.test(password)) strength += 1;
    
    // Sonderzeichen
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) strength += 2;
    
    // Status
    strengthIndicator.className = 'strength-fill';
    if (strength < 3) {
        strengthIndicator.style.width = '25%';
        strengthIndicator.style.backgroundColor = '#ef4444';
        strengthText.textContent = 'Schwaches Passwort';
    } else if (strength < 5) {
        strengthIndicator.style.width = '50%';
        strengthIndicator.style.backgroundColor = '#f59e0b';
        strengthText.textContent = 'Mittleres Passwort';
    } else if (strength < 7) {
        strengthIndicator.style.width = '75%';
        strengthIndicator.style.backgroundColor = '#3b82f6';
        strengthText.textContent = 'Starkes Passwort';
    } else {
        strengthIndicator.style.width = '100%';
        strengthIndicator.style.backgroundColor = '#10b981';
        strengthText.textContent = 'Sehr starkes Passwort';
    }
}

function validatePassword(password) {
    // Mindestanforderungen
    if (password.length < 8) {
        return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein.' };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Passwort muss mindestens einen Großbuchstaben enthalten.' };
    }
    
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Passwort muss mindestens einen Kleinbuchstaben enthalten.' };
    }
    
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Passwort muss mindestens eine Zahl enthalten.' };
    }
    
    return { valid: true, message: 'Passwort erfüllt die Sicherheitsanforderungen.' };
}

function updateUserUI() {
    const userSection = document.getElementById('userSection');
    const loginTabBtn = document.getElementById('loginTabBtn');
    const adminBtn = document.getElementById('adminBtn');
    const manageTabBtn = document.getElementById('manageTabBtn');
    const registrationsTabBtn = document.getElementById('registrationsTabBtn');
    
    // Alle Admin-Tabs zunächst verstecken
    manageTabBtn.style.display = 'none';
    registrationsTabBtn.style.display = 'none';
    adminBtn.style.display = 'none';
    
    if (currentUser) {
        userSection.style.display = 'inline';
        loginTabBtn.style.display = 'none';
        document.getElementById('currentUsername').textContent = currentUser.username;
        
        // Rollen-basierte Tab-Sichtbarkeit
        if (hasPermission('create_event') || hasPermission('manage_users')) {
            manageTabBtn.style.display = 'inline-block';
        }
        if (hasPermission('view_registrations')) {
            registrationsTabBtn.style.display = 'inline-block';
        }
        
        if (currentUser.role === 'admin') {
            adminBtn.style.display = 'inline-block';
        }
    } else {
        userSection.style.display = 'none';
        loginTabBtn.style.display = 'inline-block';
    }
}

// ==== BENUTZERVERWALTUNG (ADMIN) ====
function openAdminModal() {
    if (currentUser?.role !== 'admin') return;
    document.getElementById('adminModal').classList.add('show');
    renderUsersList();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('admin-' + tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'team') {
        renderTeamManagement();
    }
}

function renderUsersList() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        const isCurrentUser = user.id === currentUser?.id;
        
        tr.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${getRoleEmoji(user.role)}</td>
            <td>
                ${!isCurrentUser ? `
                    <select class="role-select" onchange="changeUserRole(${user.id}, this.value)" style="padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.9em;">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Benutzer</option>
                        <option value="beobachter" ${user.role === 'beobachter' ? 'selected' : ''}>Beobachter</option>
                        <option value="verwalter" ${user.role === 'verwalter' ? 'selected' : ''}>Verwalter</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                    </select>
                    <button class="btn-delete" onclick="deleteUser(${user.id})" style="margin-left: 10px;">Löschen</button>
                ` : '<em>Dein Account</em>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRoleEmoji(role) {
    // Rollen-Label statt Emojis
    const labels = {
        user: 'Benutzer',
        beobachter: 'Beobachter',
        verwalter: 'Verwalter',
        admin: 'Admin'
    };
    return labels[role] || 'Unbekannt';
}

function renderRegistrationsList() {
    // Berechtigungsprüfung
    if (!hasPermission('view_registrations')) {
        document.getElementById('registrationsContainer').innerHTML = '<div class="empty-state"><p>Du hast nicht die erforderlichen Berechtigungen!</p></div>';
        return;
    }
    
    const container = document.getElementById('registrationsContainer');
    
    if (registrations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Noch keine Anmeldungen vorhanden.</p></div>';
        return;
    }
    
    container.innerHTML = '';
    registrations.forEach(reg => {
        const roleplay = roleplays.find(rp => rp.id === reg.roleplayId);
        const item = document.createElement('div');
        item.className = 'registration-item';
        item.innerHTML = `
            <div class="registration-info">
                <h3>📝 ${roleplay?.name || 'Unbekanntes Event'}</h3>
                <p><strong>Benutzer:</strong> ${reg.username}</p>
                <p><strong>E-Mail:</strong> ${reg.email}</p>
                <p><strong>Rolle im Event:</strong> ${reg.eventRole}</p>
                <p><strong>Notizen/Bio:</strong> ${reg.bio || 'Keine Notizen'}</p>
                <p><strong>Angemeldet am:</strong> ${formatDateTime(reg.registeredAt)}</p>
            </div>
            <div class="registration-actions">
                <button class="btn-edit" onclick="editRegistration(${reg.id})">Bearbeiten</button>
                <button class="btn-delete" onclick="deleteRegistration(${reg.id})">Löschen</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function createUser(event) {
    event.preventDefault();
    
    if (currentUser?.role !== 'admin') {
        alert('Nur Administratoren können Benutzer erstellen!');
        return;
    }
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    // Validierung: Benutzername darf nicht existieren
    if (users.some(u => u.username === username)) {
        alert('Dieser Benutzername existiert bereits!');
        return;
    }
    
    // Passwort-Validierung
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        alert('Passwort-Anforderung nicht erfüllt:\n\n' + passwordValidation.message);
        return;
    }
    
    const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username,
        password,
        role
    };
    
    users.push(newUser);
    saveUsers();
    
    document.getElementById('createUserForm').reset();
    renderUsersList();
    alert(`Benutzer "${username}" erfolgreich erstellt!`);
}

function changeUserRole(userId, newRole) {
    if (currentUser?.role !== 'admin') return;
    
    const user = users.find(u => u.id === userId);
    if (!user || user.role === newRole) return;
    
    const roleName = ROLES[newRole]?.name || newRole;
    if (confirm(`Möchtest du ${user.username} zu "${roleName}" ändern?`)) {
        user.role = newRole;
        saveUsers();
        renderUsersList();
    }
}

function deleteUser(userId) {
    if (currentUser?.role !== 'admin') return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Wirklich "${user.username}" löschen?`)) {
        users = users.filter(u => u.id !== userId);
        saveUsers();
        renderUsersList();
        
        // Wenn der gelöschte User der aktuelle User ist, abmelden und zur Login-Seite
        if (currentUser?.id === userId) {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserUI();
            closeAdminModal();
            switchTab('login');
            alert('Dein Account wurde gelöscht. Du wirst zur Anmeldenseite weitergeleitet.');
        }
    }
}

// ==== ROLEPLAY-FUNKTIONEN ====
function renderRoleplays() {
    const list = document.getElementById('roleplayList');
    const select = document.getElementById('roleplay');
    
    list.innerHTML = '';
    
    if (roleplays.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.innerHTML = '<p>Keine Roleplays verfügbar. Admins können neue erstellen!</p>';
        list.appendChild(emptyMsg);
        select.innerHTML = '<option value="">-- Keine Roleplays --</option>';
        return;
    }
    
    roleplays.forEach(rp => {
        const isFull = rp.currentParticipants >= rp.maxParticipants;
        const status = isFull ? 'status-full' : 'status-active';
        const statusText = isFull ? 'Voll' : 'Aktiv';
        
        const item = document.createElement('li');
        item.className = 'roleplay-item';
        item.onclick = () => selectRoleplay(rp.id);
        item.innerHTML = `
            <h3>${rp.name}</h3>
            <p>${rp.description}</p>
            <p><strong>Ort:</strong> ${rp.city}</p>
            <p><strong>Anmeldungsfrist:</strong> ${formatDateTime(rp.registrationDeadline)}</p>
            <p><strong>Starts am:</strong> ${formatDateTime(rp.startDate)}</p>
            <p><strong>Teilnehmer:</strong> ${rp.currentParticipants}/${rp.maxParticipants}</p>
            <span class="roleplay-status ${status}">${statusText}</span>
        `;
        list.appendChild(item);
    });
    
    // Select-Optionen aktualisieren
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Bitte wählen --</option>';
    roleplays.forEach(rp => {
        const isFull = rp.currentParticipants >= rp.maxParticipants;
        const option = document.createElement('option');
        option.value = rp.id;
        option.textContent = rp.name;
        if (isFull) option.disabled = true;
        select.appendChild(option);
    });
    select.value = currentValue;
}

function renderCreatedRoleplays() {
    // Berechtigungsprüfung
    if (!hasPermission('create_event')) {
        document.getElementById('createdRoleplays').innerHTML = '<div class="empty-state"><p>❌ Du hast nicht die erforderlichen Berechtigungen!</p></div>';
        return;
    }
    
    const container = document.getElementById('createdRoleplays');
    const myRoleplays = roleplays.filter(rp => rp.createdBy === currentUser?.username);
    
    if (myRoleplays.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Du hast noch keine Roleplays erstellt.</p></div>';
        return;
    }
    
    container.innerHTML = '';
    myRoleplays.forEach(rp => {
        const item = document.createElement('div');
        item.className = 'roleplay-item-admin';
        item.innerHTML = `
            <div class="roleplay-info">
                <h3>${rp.name}</h3>
                <p>${rp.description}</p>
                <p><strong>Ort:</strong> ${rp.city}</p>
                <p><strong>Anmeldungsfrist:</strong> ${formatDateTime(rp.registrationDeadline)}</p>
                <p><strong>Starts am:</strong> ${formatDateTime(rp.startDate)}</p>
                <p><strong>Max. Teilnehmer:</strong> ${rp.maxParticipants}</p>
            </div>
            <div class="roleplay-actions">
                <button class="btn-edit" onclick="editRoleplay(${rp.id})">Bearbeiten</button>
                <button class="btn-delete" onclick="deleteRoleplay(${rp.id})">Löschen</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderManageRoleplays() {
    // Berechtigungsprüfung
    if (!hasPermission('manage_users')) {
        document.getElementById('manageRoleplays').innerHTML = '<div class="empty-state"><p>❌ Du hast nicht die erforderlichen Berechtigungen!</p></div>';
        return;
    }
    
    const container = document.getElementById('manageRoleplays');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    if (roleplays.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Keine Roleplays vorhanden.</p></div>';
        selectAllCheckbox.style.display = 'none';
        deleteSelectedBtn.style.display = 'none';
        return;
    }
    
    selectAllCheckbox.style.display = 'inline';
    deleteSelectedBtn.style.display = 'inline-block';
    selectAllCheckbox.checked = false;
    
    container.innerHTML = '';
    roleplays.forEach(rp => {
        const item = document.createElement('div');
        item.className = 'manage-roleplay-item';
        item.innerHTML = `
            <div class="manage-checkbox">
                <input type="checkbox" class="roleplay-checkbox" value="${rp.id}">
            </div>
            <div class="manage-info">
                <h3>${rp.name}</h3>
                <p>${rp.description}</p>
                <p><strong>Ort:</strong> ${rp.city} | <strong>Erstellt von:</strong> ${rp.createdBy || 'Admin'}</p>
                <p><strong>Starts am:</strong> ${formatDateTime(rp.startDate)}</p>
            </div>
            <div class="manage-actions">
                <button class="btn-edit" onclick="editRoleplay(${rp.id})">Bearbeiten</button>
                <button class="btn-delete" onclick="deleteRoleplay(${rp.id})">Löschen</button>
            </div>
        `;
        container.appendChild(item);
    });
    
    // Add change listener to checkboxes
    document.querySelectorAll('.roleplay-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateDeleteButtonVisibility);
    });
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.roleplay-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
    });
    updateDeleteButtonVisibility();
}

function updateDeleteButtonVisibility() {
    const checkboxes = document.querySelectorAll('.roleplay-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    deleteBtn.style.opacity = checkboxes.length > 0 ? '1' : '0.5';
    deleteBtn.style.pointerEvents = checkboxes.length > 0 ? 'auto' : 'none';
}

function deleteSelectedRoleplays() {
    const checkboxes = document.querySelectorAll('.roleplay-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        alert('Bitte wähle mindestens ein Roleplay aus!');
        return;
    }
    
    if (confirm(`Willst du wirklich ${selectedIds.length} Roleplay(s) löschen?`)) {
        roleplays = roleplays.filter(rp => !selectedIds.includes(rp.id));
        saveRoleplays();
        renderManageRoleplays();
        renderRoleplays();
        alert(`${selectedIds.length} Roleplay(s) erfolgreich gelöscht!`);
    }
}

function switchTab(tabName) {
    // Berechtigungsprüfung für geschützte Tabs
    if (tabName === 'manage' && !hasPermission('create_event') && !hasPermission('manage_users')) {
        alert('Du hast keine Berechtigung, auf diese Seite zuzugreifen!');
        return;
    }
    
    if (tabName === 'registrations' && !hasPermission('view_registrations')) {
        alert('Du hast keine Berechtigung, Anmeldungen zu sehen!');
        return;
    }
    
    // Verstecke alle Tab-Inhalte
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deaktiviere alle Tab-Buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Deaktiviere auch den Header-Login-Button
    const loginTabBtn = document.getElementById('loginTabBtn');
    if (loginTabBtn) {
        loginTabBtn.classList.remove('active');
    }
    
    // Zeige den gewählten Tab
    const tabElement = document.getElementById('tab-' + tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Aktiviere den entsprechenden Tab-Button
    const tabButtons = document.querySelectorAll('.tab-button');
    for (let btn of tabButtons) {
        const onclickStr = btn.getAttribute('onclick');
        if (onclickStr && onclickStr.includes(`switchTab('${tabName}')`)) {
            btn.classList.add('active');
            break;
        }
    }
    
    // Aktiviere auch den Login-Tab-Button wenn nötig
    if (tabName === 'login' && loginTabBtn) {
        loginTabBtn.classList.add('active');
    }
    
    if (tabName === 'manage') {
        renderCreatedRoleplays();
        renderManageRoleplays();
    } else if (tabName === 'registrations') {
        renderRegistrationsList();
    } else if (tabName === 'team') {
        renderTeam();
    }
}

function selectRoleplay(id) {
    document.getElementById('roleplay').value = id;
    switchTab('browse');
    setTimeout(() => {
        document.querySelector('#tab-browse .section:nth-child(2)').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatISOtoLocal(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
}

function createRoleplay(event) {
    event.preventDefault();
    
    if (currentUser?.role !== 'admin') {
        alert('Nur Administratoren können Roleplays erstellen!');
        return;
    }
    
    const name = document.getElementById('newRoleplayName').value;
    const description = document.getElementById('newRoleplayDescription').value;
    const maxParticipants = parseInt(document.getElementById('newRoleplayMaxParticipants').value);
    const city = document.getElementById('newRoleplayCity').value;
    const registrationDeadline = document.getElementById('newRoleplayRegistrationDeadline').value;
    const startDate = document.getElementById('newRoleplayStartDate').value;
    
    if (registrationDeadline >= startDate) {
        alert('Die Anmeldungsfrist muss vor dem Startdatum liegen!');
        return;
    }
    
    const newRoleplay = {
        id: nextRoleplayId++,
        name,
        description,
        maxParticipants,
        currentParticipants: 0,
        city,
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        startDate: new Date(startDate).toISOString(),
        createdBy: currentUser.username
    };
    
    roleplays.push(newRoleplay);
    saveRoleplays();
    renderRoleplays();
    renderCreatedRoleplays();
    
    const successMsg = document.getElementById('createSuccessMessage');
    successMsg.classList.add('show');
    document.getElementById('createRoleplayForm').reset();
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 3000);
}

function editRoleplay(id) {
    const roleplay = roleplays.find(rp => rp.id === id);
    if (!roleplay || roleplay.createdBy !== currentUser?.username) return;
    
    document.getElementById('editRoleplayId').value = id;
    document.getElementById('editRoleplayName').value = roleplay.name;
    document.getElementById('editRoleplayDescription').value = roleplay.description;
    document.getElementById('editRoleplayMaxParticipants').value = roleplay.maxParticipants;
    document.getElementById('editRoleplayCity').value = roleplay.city;
    document.getElementById('editRoleplayRegistrationDeadline').value = formatISOtoLocal(roleplay.registrationDeadline);
    document.getElementById('editRoleplayStartDate').value = formatISOtoLocal(roleplay.startDate);
    
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

function saveEditRoleplay(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('editRoleplayId').value);
    const index = roleplays.findIndex(rp => rp.id === id);
    if (index === -1 || roleplays[index].createdBy !== currentUser?.username) return;
    
    const name = document.getElementById('editRoleplayName').value;
    const description = document.getElementById('editRoleplayDescription').value;
    const maxParticipants = parseInt(document.getElementById('editRoleplayMaxParticipants').value);
    const city = document.getElementById('editRoleplayCity').value;
    const registrationDeadline = document.getElementById('editRoleplayRegistrationDeadline').value;
    const startDate = document.getElementById('editRoleplayStartDate').value;
    
    if (registrationDeadline >= startDate) {
        alert('Die Anmeldungsfrist muss vor dem Startdatum liegen!');
        return;
    }
    
    roleplays[index] = {
        ...roleplays[index],
        name,
        description,
        maxParticipants,
        city,
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        startDate: new Date(startDate).toISOString()
    };
    
    saveRoleplays();
    renderRoleplays();
    renderCreatedRoleplays();
    closeEditModal();
    
    alert('Roleplay wurde erfolgreich aktualisiert!');
}

function deleteRoleplay(id) {
    const roleplay = roleplays.find(rp => rp.id === id);
    if (!roleplay || roleplay.createdBy !== currentUser?.username) return;
    
    if (confirm('Möchtest du dieses Roleplay wirklich löschen?')) {
        roleplays = roleplays.filter(rp => rp.id !== id);
        saveRoleplays();
        renderRoleplays();
        renderCreatedRoleplays();
    }
}

function deleteRegistration(regId) {
    if (!hasPermission('view_registrations')) {
        alert('Du hast nicht die erforderlichen Berechtigungen!');
        return;
    }
    if (confirm('Willst du diese Anmeldung wirklich löschen?')) {
        registrations = registrations.filter(reg => reg.id !== regId);
        saveRegistrations();
        renderRegistrationsList();
    }
}

function editRegistration(regId) {
    if (!hasPermission('view_registrations')) {
        alert('Du hast nicht die erforderlichen Berechtigungen!');
        return;
    }
    alert('Bearbeitung wird in einer zukünftigen Version implementiert.');
}

// ==== TEAM-VERWALTUNG ====
function extractRobloxId(url) {
    // Extrahiert die Benutzer-ID aus einer Roblox-URL
    // Unterstützt: https://www.roblox.com/users/12345/profile
    const match = url.match(/\/users\/(\d+)/);
    return match ? match[1] : null;
}

function getRobloxAvatarUrl(robloxUrl) {
    const userId = extractRobloxId(robloxUrl);
    if (!userId) return null;
    // Roblox Thumbnails API - wird als JSON zurückgegeben
    return `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
}

function fetchRobloxAvatar(userId) {
    // Versuche zuerst die direkte Roblox API
    const apiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
    console.log('Versuche direkte Roblox API:', apiUrl);
    
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.length > 0 && data.data[0].imageUrl) {
                console.log('Avatar-URL gefunden:', data.data[0].imageUrl);
                return data.data[0].imageUrl;
            }
            throw new Error('Keine Avatar-URL in Antwort');
        })
        .catch(error => {
            console.log('Direkte API fehlgeschlagen, versuche CORS-Proxy:', error.message);
            
            // Fallback: Verwende CORS-Proxy
            const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
            return fetch(corsProxyUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.contents) {
                        const parsed = JSON.parse(data.contents);
                        if (parsed.data && parsed.data.length > 0 && parsed.data[0].imageUrl) {
                            console.log('Avatar-URL via Proxy gefunden:', parsed.data[0].imageUrl);
                            return parsed.data[0].imageUrl;
                        }
                    }
                    throw new Error('Keine Avatar-URL via Proxy');
                })
                .catch(proxyError => {
                    console.log('CORS-Proxy fehlgeschlagen, verwende generischen Avatar:', proxyError.message);
                    // Fallback: Generischer Avatar-Service
                    return `https://www.roblox.com/bust-cache/avatar-headshot-url?userId=${userId}&size=420x420&format=Png&isCircular=false`;
                });
        });
}

function updateAvatarPreview() {
    const urlInput = document.getElementById('teamImage');
    const previewImg = document.getElementById('previewImg');
    const previewDiv = document.getElementById('avatarPreview');
    
    if (!urlInput.value) {
        previewDiv.style.display = 'none';
        return;
    }
    
    const userId = extractRobloxId(urlInput.value);
    console.log('Extrahierte Roblox-ID:', userId);
    
    if (!userId) {
        console.log('Konnte keine gültige Roblox-ID extrahieren');
        previewDiv.style.display = 'none';
        return;
    }
    
    fetchRobloxAvatar(userId)
        .then(imageUrl => {
            console.log('Avatar-URL für Vorschau:', imageUrl);
            previewImg.src = imageUrl;
            previewImg.onload = () => {
                console.log('Avatar-Bild erfolgreich geladen');
                previewDiv.style.display = 'block';
            };
            previewImg.onerror = () => {
                console.log('Avatar-Bild konnte nicht geladen werden');
                previewDiv.style.display = 'none';
            };
            // Fallback wenn Bild bereits gecacht ist
            setTimeout(() => {
                previewDiv.style.display = 'block';
            }, 100);
        })
        .catch(error => {
            console.error('Fehler beim Avatar-Abrufen:', error);
            previewDiv.style.display = 'none';
        });
}

function renderTeam() {
    const container = document.getElementById('teamContainer');
    if (!container) return;
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Noch keine Team-Mitglieder.</p></div>';
        return;
    }
    
    container.innerHTML = '';
    const positions = ['Gameentwickler', 'Management', 'Developer', 'Admin', 'Support'];
    
    positions.forEach(position => {
        const members = teamMembers.filter(m => m.position === position);
        if (members.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'team-section';
        section.innerHTML = `<h3>${position}</h3>`;
        
        const memberGrid = document.createElement('div');
        memberGrid.className = 'team-grid';
        
        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'team-card';
            
            // member.image ist bereits die echte Avatar-URL von Roblox API
            const defaultImage = 'https://via.placeholder.com/420x420?text=' + encodeURIComponent(member.name);
            const imageUrl = member.image || defaultImage;
            
            card.innerHTML = `
                <div class="team-image">
                    <img src="${imageUrl}" alt="${member.name}" onerror="this.src='${defaultImage}'">
                </div>
                <div class="team-info">
                    <h4>${member.name}</h4>
                    <p class="team-position">${member.position}</p>
                    ${member.description ? `<p>${member.description}</p>` : ''}
                </div>
            `;
            memberGrid.appendChild(card);
        });
        
        section.appendChild(memberGrid);
        container.appendChild(section);
    });
}

function renderTeamManagement() {
    if (currentUser?.role !== 'admin') return;
    
    const container = document.getElementById('teamManagementContainer');
    if (!container) return;
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Noch keine Team-Mitglieder.</p></div>';
        return;
    }
    
    container.innerHTML = '';
    teamMembers.forEach(member => {
        const item = document.createElement('div');
        item.className = 'team-management-item';
        item.innerHTML = `
            <div class="team-mgmt-info">
                <h4>${member.name}</h4>
                <p>${member.position}</p>
            </div>
            <div class="team-mgmt-actions">
                <button class="btn-delete" onclick="deleteTeamMember(${member.id})">Löschen</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function createTeamMember(event) {
    event.preventDefault();
    
    if (currentUser?.role !== 'admin') {
        alert('Nur Administratoren können Team-Mitglieder hinzufügen!');
        return;
    }
    
    const name = document.getElementById('teamName').value;
    const position = document.getElementById('teamPosition').value;
    const description = document.getElementById('teamDescription').value;
    const imageInput = document.getElementById('teamImage').value;
    
    // Funktion zum Speichern des Team-Mitglieds
    function saveNewMember(imageUrl) {
        const newMember = {
            id: Date.now(),
            name,
            position,
            description,
            image: imageUrl
        };
        
        teamMembers.push(newMember);
        saveTeamMembers();
        
        document.getElementById('addTeamMemberForm').reset();
        document.getElementById('avatarPreview').style.display = 'none';
        renderTeam();
        renderTeamManagement();
        
        alert(`Team-Mitglied "${name}" erfolgreich hinzugefügt!`);
    }
    
    // Verarbeite Roblox-URL - hole echte Avatar-URL von API
    if (imageInput && imageInput.includes('roblox.com/users')) {
        const userId = extractRobloxId(imageInput);
        console.log('createTeamMember: Roblox-ID extrahiert:', userId);
        
        if (userId) {
            console.log('createTeamMember: Versuche Avatar-URL zu laden...');
            fetchRobloxAvatar(userId)
                .then(imageUrl => {
                    console.log('createTeamMember: Avatar-URL erfolgreich:', imageUrl);
                    saveNewMember(imageUrl);
                })
                .catch(error => {
                    console.error('createTeamMember: Fehler beim Avatar-Abrufen:', error);
                    alert('Avatar konnte nicht geladen werden. Bitte versuche es später.');
                });
            return;
        } else {
            console.log('createTeamMember: Konnte keine Roblox-ID extrahieren');
            alert('Ungültige Roblox-URL. Bitte verwende das Format: https://www.roblox.com/users/12345/profile');
            return;
        }
    }
    
    // Normale URL (kein Roblox)
    saveNewMember(imageInput);
}

function deleteTeamMember(memberId) {
    if (currentUser?.role !== 'admin') return;
    
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    if (confirm(`Wirklich "${member.name}" löschen?`)) {
        teamMembers = teamMembers.filter(m => m.id !== memberId);
        saveTeamMembers();
        renderTeam();
        renderTeamManagement();
    }
}

function submitForm(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const roleplayId = parseInt(document.getElementById('roleplay').value);
    const eventRole = document.getElementById('role').value;
    const bio = document.getElementById('bio').value;
    
    const roleplay = roleplays.find(rp => rp.id === roleplayId);
    if (!roleplay) return;
    
    // Teilnehmerzahl erhöhen
    roleplay.currentParticipants++;
    saveRoleplays();
    
    // Anmeldung speichern
    const registration = {
        id: Date.now(),
        username: username,
        email: email,
        roleplayId: roleplayId,
        eventRole: eventRole,
        bio: bio,
        registeredAt: new Date().toISOString()
    };
    
    registrations.push(registration);
    saveRegistrations();
    renderRegistrationsList();
    
    console.log({
        username,
        email,
        roleplay: roleplay.name,
        eventRole,
        bio,
        registrierungsDatum: new Date().toLocaleString('de-DE')
    });
    
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('show');
    document.getElementById('registrationForm').reset();
    
    renderRoleplays();
    
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
}

// ==== PASSWORT-FUNKTIONEN ====
function validatePassword(password) {
    if (password.length < 8) {
        return {
            valid: false,
            message: '❌ Mindestens 8 Zeichen erforderlich'
        };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const requirements = {
        uppercase: hasUppercase,
        lowercase: hasLowercase,
        numbers: hasNumbers,
        special: hasSpecialChar
    };
    
    const meetsAll = Object.values(requirements).filter(v => v).length >= 3;
    
    if (!meetsAll) {
        let message = 'Das Passwort muss mindestens 3 der folgenden Anforderungen erfüllen:\n';
        if (!hasUppercase) message += '❌ Großbuchstaben (A-Z)\n';
        if (!hasLowercase) message += '❌ Kleinbuchstaben (a-z)\n';
        if (!hasNumbers) message += '❌ Zahlen (0-9)\n';
        if (!hasSpecialChar) message += '❌ Sonderzeichen (!@#$%^&*)';
        
        return { valid: false, message };
    }
    
    return { valid: true, message: 'Passwort erfüllt alle Anforderungen' };
}

function checkPasswordStrength(inputId) {
    const password = document.getElementById(inputId).value;
    const strengthFill = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    if (password.length === 0) {
        strengthFill.style.width = '0%';
        strengthFill.style.background = '#e5e7eb';
        strengthText.textContent = '';
        return;
    }
    
    let strength = 0;
    let color = '#ef4444';
    let label = 'Schwach';
    
    // Länge prüfen
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    
    // Zeichenkategorien
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
    
    // Farbcodierung
    if (strength < 35) {
        color = '#ef4444';
        label = 'Schwach';
    } else if (strength < 60) {
        color = '#eab308';
        label = 'Mittel';
    } else if (strength < 85) {
        color = '#3b82f6';
        label = 'Stark';
    } else {
        color = '#22c55e';
        label = 'Sehr Stark';
    }
    
    strengthFill.style.width = strength + '%';
    strengthFill.style.background = color;
    strengthText.textContent = label;
    strengthText.style.color = color;
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

function generatePassword(inputId) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    for (let i = password.length; i < 14; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    const input = document.getElementById(inputId);
    input.value = password;
    input.type = 'text';
    
    checkPasswordStrength(inputId);
    
    alert('Neues Passwort generiert: ' + password);
}

// Modal schließen bei Klick außerhalb
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    const adminModal = document.getElementById('adminModal');
    
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === adminModal) {
        closeAdminModal();
    }
});

// Beim Laden der Seite
window.addEventListener('DOMContentLoaded', function() {
    initializeUsers();
    loadRoleplays();
    loadRegistrations();
    loadTeamMembers();
    
    // Prüfen, ob ein Benutzer bereits angemeldet ist
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            currentUser = null;
        }
    }
    
    updateUserUI();
    renderRoleplays();
    renderTeam();
    
    // Event-Listener für Passwortfeld
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
        newPasswordField.addEventListener('input', function() {
            checkPasswordStrength('newPassword');
        });
    }
});
