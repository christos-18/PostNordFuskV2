// Default script paths (används för initial import)
const defaultScriptPaths = {
  btn1: 'makron/uppdatera stopp (konsol).txt',
  btn2: 'makron/aktiviteter lastade (konsol).txt',
  btn3: 'makron/uppdatera bilar (konsol).txt',
  btn4: 'makron/flexa (konsol).txt',
  btn5: 'makron/excel makro (uppdatera stopp).txt',
  btn6: 'makron/excel makro (aktiviteter lastade).txt',
  btn7: 'makron/excel makro (bilar w).txt',
  btn8: 'makron/excel makro (bilar x).txt',
  btn9: 'makron/alla som är klara.txt',
  btn10:'makron/excel makro (skriva ut planering).txt'
};

// Supabase configuration
const SUPABASE_URL = 'https://uzaybbrsowugvglrsjqy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UwFNCgoFo4EpLSFoMpW1Uw_jEX96_KW';

// Initialize Supabase client
let supabaseClient = null;
let supabaseEnabled = false;

// Vänta på att Supabase laddas
if (typeof window !== 'undefined') {
  // Kontrollera om credentials är konfigurerade
  if (SUPABASE_URL !== 'https://ditt-projekt.supabase.co' &&
      SUPABASE_ANON_KEY !== 'din-anon-key-här') {
    try {
      // Vänta på att window.supabase laddas
      const checkSupabase = async () => {
        if (window.supabase && window.supabase.createClient) {
          supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          supabaseEnabled = true;
          console.log('✅ Supabase ansluten!');

          // Check for existing session and restore user
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session && session.user) {
            currentUser = session.user.email;
            localStorage.setItem('postnord_user', currentUser);
            updateLoginStatus();
            console.log('✅ Session återställd för:', currentUser);

            // Load permissions after session restore
            await loadUserPermissions();
          }
        } else {
          console.log('⏳ Väntar på Supabase SDK...');
          setTimeout(checkSupabase, 100);
        }
      };
      checkSupabase();
    } catch (e) {
      console.error('❌ Supabase-fel:', e);
    }
  } else {
    console.log('ℹ️ Supabase ej konfigurerad - följ SUPABASE_SETUP.md');
  }
}

// Button categories for styling
let scriptCategories = {
  'btn1': 'console',
  'btn2': 'console',
  'btn3': 'console',
  'btn4': 'console',
  'btn5': 'excel',
  'btn6': 'excel',
  'btn7': 'excel',
  'btn8': 'excel',
  'btn9': 'message',
  'btn10': 'excel'
};

let scriptNames = {
  'btn1': '📦 Uppdatera stopp 📦<br>(Konsol)',
  'btn2': '⌛ Aktiviteter lastade ⌛<br>(Konsol)',
  'btn3': '🔋 Uppdatera bilar 🔋<br>(Konsol)',
  'btn4': '⏰ Flexa ⏰<br>(Konsol)',
  'btn5': '📗 Excel makro 📗<br>(Uppdatera stopp)',
  'btn6': '📗 Excel makro 📗<br>(Aktiviteter lastade)',
  'btn7': '📗 Excel makro 📗<br>(Bilar W)',
  'btn8': '📗 Excel makro 📗<br>(Bilar X)',
  'btn9': '🚚 Alla som är klara 🚚',
  'btn10': '📗 Excel makro 📗<br>(Skriva ut planering)'
};

let scriptOrder = ['btn1', 'btn2', 'btn3', 'btn4', 'btn5', 'btn6', 'btn7', 'btn8', 'btn9', 'btn10'];

let nextBtnId = 11;
let customScripts = {}; // Alla scripts lagras här (både förvalda och custom)
let buttonStyles = {}; // Custom styles för varje knapp

// Script sections - vilken sektion varje knapp tillhör ('kvall' eller 'dag')
let scriptSections = {
  'btn1': 'kvall',
  'btn2': 'kvall',
  'btn3': 'kvall',
  'btn4': 'kvall',
  'btn5': 'kvall',
  'btn6': 'kvall',
  'btn7': 'kvall',
  'btn8': 'kvall',
  'btn9': 'kvall',
  'btn10': 'kvall'
};

// User authentication
let currentUser = null;
const users = {
  'admin': 'admin123',
  // Lägg till fler användare här
};

// User permissions
let userPermissions = {
  is_admin: false,
  can_edit_main_scripts: false,
  can_manage_custom_scripts: false,
  can_edit_button_design: false
};

// Load saved user session (check both localStorage and sessionStorage)
const savedUser = localStorage.getItem('postnord_user') || sessionStorage.getItem('postnord_user');
if (savedUser) {
  currentUser = savedUser;
}

let currentScript = null;
let currentScriptContent = '';

// Save custom scripts to both localStorage and Supabase
function saveCustomData() {
  // Save to localStorage
  localStorage.setItem('postnord_custom_scripts', JSON.stringify({
    scripts: customScripts,
    names: scriptNames,
    categories: scriptCategories,
    order: scriptOrder,
    nextId: nextBtnId,
    buttonStyles: buttonStyles,
    sections: scriptSections
  }));

  // Save to Supabase (async, don't wait)
  saveToSupabase();
}

// Supabase functions
async function loadFromSupabase() {
  if (!supabaseClient) return false;
  
  try {
    const { data, error } = await supabaseClient
      .from('custom_scripts')
      .select('data')
      .eq('id', 1)
      .single();

    if (error) {
      console.log('ℹ️ Ingen data i Supabase ännu, laddar från filer...');
      return false;
    }

    if (data && data.data) {
      const supabaseData = data.data;
      
      // BARA ladda från Supabase om det faktiskt finns scripts där
      if (supabaseData.scripts && Object.keys(supabaseData.scripts).length > 0) {
        customScripts = supabaseData.scripts;
        scriptNames = supabaseData.names || scriptNames;
        scriptCategories = supabaseData.categories || scriptCategories;
        scriptOrder = supabaseData.order || scriptOrder;
        nextBtnId = supabaseData.nextId || nextBtnId;
        buttonStyles = supabaseData.buttonStyles || {};
        scriptSections = supabaseData.sections || scriptSections;

        console.log('✅ Data laddad från Supabase');
        return true;
      } else {
        console.log('ℹ️ Supabase är tom, laddar från filer...');
        return false;
      }
    }
  } catch (err) {
    console.log('❌ Kunde inte ladda från Supabase:', err);
  }
  return false;
}

async function saveToSupabase() {
  if (!supabaseClient || !currentUser) {
    console.log('⚠️ Supabase inte tillgänglig eller ingen användare inloggad - sparar endast lokalt');
    return;
  }

  try {
    const dataToSave = {
      scripts: customScripts,  // ALLA scripts (både förvalda och custom)
      names: scriptNames,
      categories: scriptCategories,
      order: scriptOrder,
      nextId: nextBtnId,
      buttonStyles: buttonStyles,
      sections: scriptSections
    };

    const { error } = await supabaseClient
      .from('custom_scripts')
      .upsert({ 
        id: 1, 
        data: dataToSave,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.log('❌ Supabase save error:', error);
    } else {
      console.log('✅ Sparat till Supabase');
    }
  } catch (err) {
    console.log('❌ Kunde inte spara till Supabase:', err);
  }
}

function setupRealtimeSubscription() {
  if (!supabaseClient) return;
  
  supabaseClient
    .channel('custom_scripts_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'custom_scripts'
    }, (payload) => {
      console.log('🔄 Realtime update:', payload);
      if (payload.new && payload.new.data) {
        const newData = payload.new.data;
        
        // Uppdatera ALLA scripts
        customScripts = newData.scripts || customScripts;
        scriptNames = newData.names || scriptNames;
        scriptCategories = newData.categories || scriptCategories;
        scriptOrder = newData.order || scriptOrder;
        nextBtnId = newData.nextId || nextBtnId;
        buttonStyles = newData.buttonStyles || {};
        scriptSections = newData.sections || scriptSections;
        if (newData.nextId) {
          nextBtnId = newData.nextId;
        }
        
        // Re-render buttons
        renderButtons();
        showStatus('🔄 Uppdaterat från annan användare');
      }
    })
    .subscribe();
}

// Initialize data loading and Supabase connection
async function initializeApp() {
  // First load from localStorage (for immediate availability)
  const savedData = localStorage.getItem('postnord_custom_scripts');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      customScripts = data.scripts || {};
      Object.keys(data.names || {}).forEach(key => {
        if (!scriptNames[key]) {
          scriptNames[key] = data.names[key];
        }
      });
      Object.keys(data.categories || {}).forEach(key => {
        if (!scriptCategories[key]) {
          scriptCategories[key] = data.categories[key];
        }
      });
      Object.keys(data.sections || {}).forEach(key => {
        if (!scriptSections[key]) {
          scriptSections[key] = data.sections[key];
        }
      });
      scriptOrder = data.order || scriptOrder;
      nextBtnId = data.nextId || nextBtnId;
      buttonStyles = data.buttonStyles || {};
    } catch (e) {
      console.error('Failed to load local data', e);
    }
  }

  // Render buttons immediately with local data
  renderButtons();
  updateLoginStatus();

  // Then try to load from Supabase (will override local data if available)
  const supabaseLoaded = await loadFromSupabase();
  
  if (supabaseLoaded) {
    console.log('✅ Supabase initialiserad och ansluten!');
    setupRealtimeSubscription();
    // Re-render with Supabase data
    renderButtons();
  } else {
    // Om Supabase är tom, ladda default scripts från filer och spara till Supabase
    console.log('📥 Laddar default scripts från filer...');
    await loadDefaultScriptsFromFiles();
    renderButtons();
  }
  
  // Initialize activity console
  await initActivityConsole();
}

// Ladda default scripts från filer (körs bara första gången)
async function loadDefaultScriptsFromFiles() {
  for (const [key, path] of Object.entries(defaultScriptPaths)) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const content = await response.text();
        customScripts[key] = content;
        console.log(`✅ Laddade ${key} från ${path}`);
      } else {
        customScripts[key] = `// Kunde inte ladda ${path}\n// Redigera och spara här istället`;
        console.warn(`⚠️ Kunde inte hämta ${path}`);
      }
    } catch (err) {
      console.error(`❌ Fel vid laddning av ${path}:`, err);
      customScripts[key] = `// Kunde inte ladda ${path}\n// Redigera och spara här istället`;
    }
  }
  
  // Spara till localStorage direkt
  saveCustomData();
  
  console.log('✅ Default scripts laddade från filer och sparade lokalt');
}

function updateLoginStatus() {
  const currentUserSpan = document.getElementById('currentUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const mainLoginBtn = document.getElementById('mainLoginBtn');

  if (currentUserSpan && logoutBtn) {
    if (currentUser) {
      currentUserSpan.textContent = currentUser;
      logoutBtn.style.display = 'inline-block';
    } else {
      currentUserSpan.textContent = 'Ingen';
      logoutBtn.style.display = 'none';
    }
  }

  // Show/hide main login button
  if (mainLoginBtn) {
    mainLoginBtn.style.display = currentUser ? 'none' : 'flex';
  }

  // Update user badge on main page
  if (userBadge && userNameDisplay) {
    if (currentUser) {
      userNameDisplay.textContent = currentUser;
      userBadge.style.display = 'flex';
    } else {
      userBadge.style.display = 'none';
    }
  }
}

// Modal functionality
const modal = document.getElementById('editorModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeModal = document.getElementById('closeModal');
const scriptList = document.getElementById('scriptList');
const codeEditor = document.getElementById('codeEditor');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const addScriptBtn = document.getElementById('addScriptBtn');
const buttonContainerKvall = document.getElementById('buttonContainerKvall');
const buttonContainerDag = document.getElementById('buttonContainerDag');

// Button Designer elements
const buttonDesignerDialog = document.getElementById('buttonDesignerDialog');
const previewButton = document.getElementById('previewButton');
const previewText = document.getElementById('previewText');
const primaryColor = document.getElementById('primaryColor');
const secondaryColor = document.getElementById('secondaryColor');
const transparency = document.getElementById('transparency');
const transparencyValue = document.getElementById('transparencyValue');
const borderRadius = document.getElementById('borderRadius');
const borderRadiusValue = document.getElementById('borderRadiusValue');
const borderWidth = document.getElementById('borderWidth');
const borderWidthValue = document.getElementById('borderWidthValue');
const glowEffect = document.getElementById('glowEffect');
const gradientEffect = document.getElementById('gradientEffect');
const customColorSection = document.getElementById('customColorSection');
const designerCancel = document.getElementById('designerCancel');
const designerSave = document.getElementById('designerSave');

let currentDesigningButton = null;
let currentButtonStyle = {
  preset: 'custom',
  primaryColor: '#3b82f6',
  secondaryColor: '#4f46e5',
  transparency: 30,
  borderRadius: 12,
  borderWidth: 1,
  glow: true,
  gradient: true
};

const inputDialog = document.getElementById('inputDialog');
const scriptNameInput = document.getElementById('scriptNameInput');
const scriptEmojiInput = document.getElementById('scriptEmojiInput');
const dialogConfirm = document.getElementById('dialogConfirm');
const dialogCancel = document.getElementById('dialogCancel');
const confirmDialog = document.getElementById('confirmDialog');
const confirmMessage = document.getElementById('confirmMessage');
const confirmDelete = document.getElementById('confirmDelete');
const confirmCancel = document.getElementById('confirmCancel');

const loginDialog = document.getElementById('loginDialog');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginConfirm = document.getElementById('loginConfirm');
const loginCancel = document.getElementById('loginCancel');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userBadge = document.getElementById('userBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const badgeLogoutBtn = document.getElementById('badgeLogoutBtn');

let scriptToDelete = null;

// Update login status on page load
updateLoginStatus();

settingsBtn.onclick = () => {
  if (!currentUser) {
    // Show login dialog
    loginError.textContent = '';
    loginUsername.value = '';
    loginPassword.value = '';
    loginDialog.classList.add('active');
    loginUsername.focus();
    return;
  }

  // Check if user has any permission
  if (!hasAnyPermission()) {
    showConfirm({
      title: 'Ingen behörighet',
      message: 'Du har inga redigeringsbehörigheter. Kontakta en admin för att få tillgång.',
      icon: '🔒',
      confirmText: 'OK',
      cancelText: 'Stäng'
    });
    return;
  }

  modal.classList.add('active');

  // Show/hide add script button based on permission
  if (addScriptBtn) {
    addScriptBtn.style.display = canManageCustomScripts() ? 'block' : 'none';
  }

  renderScriptList();
  if (!currentScript && scriptOrder.length > 0) {
    selectScript(scriptOrder[0]);
  }
};

closeModal.onclick = () => {
  modal.classList.remove('active');
};

modal.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
  }
};

// Render script list
function renderScriptList() {
  scriptList.innerHTML = '';
  scriptOrder.forEach(key => {
    const item = document.createElement('div');
    item.className = 'script-item';
    item.draggable = true;
    item.dataset.script = key;

    // Drag handle (hamburger icon)
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '☰';
    dragHandle.title = 'Dra för att flytta';

    const nameSpan = document.createElement('span');
    const cleanName = (scriptNames[key] || key).replace(/<br>/g, ' ');
    nameSpan.textContent = cleanName;
    nameSpan.style.flex = '1';
    nameSpan.style.cursor = 'pointer';
    nameSpan.onclick = () => selectScript(key);

    // Design button
    const designBtn = document.createElement('button');
    designBtn.className = 'design-script-btn';
    designBtn.textContent = '🎨';
    designBtn.title = 'Designa knapp';
    designBtn.onclick = (e) => {
      e.stopPropagation();
      openButtonDesigner(key);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-script-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteScript(key);
    };

    item.appendChild(dragHandle);
    item.appendChild(nameSpan);

    // Only show design button if user has permission
    if (canEditButtonDesign()) {
      item.appendChild(designBtn);
    }

    // Only show delete button for custom scripts and if user has permission
    const isDefaultScript = ['btn1', 'btn2', 'btn3', 'btn4', 'btn5', 'btn6', 'btn7', 'btn8', 'btn9', 'btn10'].includes(key);
    if (!isDefaultScript && canManageCustomScripts()) {
      item.appendChild(deleteBtn);
    }

    // Drag and drop event listeners
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);

    scriptList.appendChild(item);
  });
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);

  // Add smooth transition
  setTimeout(() => {
    this.style.transition = 'none';
  }, 0);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  this.style.transition = '';

  // Remove all drag-over classes with animation
  document.querySelectorAll('.script-item').forEach(item => {
    item.classList.remove('drag-over');
  });

  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  this.classList.add('drag-over');
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    // Get the dragged and target script keys
    const draggedKey = draggedElement.dataset.script;
    const targetKey = this.dataset.script;

    // Find their positions in scriptOrder
    const draggedIndex = scriptOrder.indexOf(draggedKey);

    // Remove dragged item and insert at new position
    scriptOrder.splice(draggedIndex, 1);
    const newTargetIndex = scriptOrder.indexOf(targetKey);
    scriptOrder.splice(newTargetIndex, 0, draggedKey);

    // Save and re-render
    saveCustomData();
    renderScriptList();
    renderButtons();

    // Re-select current script
    if (currentScript) {
      document.querySelectorAll('.script-item').forEach(item => {
        item.classList.toggle('active', item.dataset.script === currentScript);
      });
    }
  }

  this.classList.remove('drag-over');
  return false;
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

// Add new script
addScriptBtn.onclick = async () => {
  if (!canManageCustomScripts()) {
    await showConfirm({
      title: 'Ingen behörighet',
      message: 'Du har inte behörighet att skapa nya scripts.',
      icon: '🔒',
      confirmText: 'OK',
      cancelText: 'Stäng'
    });
    return;
  }

  console.log('Add script clicked');
  scriptNameInput.value = '';
  scriptEmojiInput.value = '';
  inputDialog.classList.add('active');
  scriptNameInput.focus();
};

dialogCancel.onclick = () => {
  inputDialog.classList.remove('active');
};

dialogConfirm.onclick = () => {
  const name = scriptNameInput.value.trim();
  if (!name) {
    alert('Du måste ange ett namn!');
    return;
  }

  const emoji = scriptEmojiInput.value.trim() || '📝';
  const btnId = 'btn' + nextBtnId;
  const selectedSection = document.getElementById('scriptSectionSelect').value;

  nextBtnId++;
  scriptNames[btnId] = emoji + ' ' + name;
  customScripts[btnId] = '// Nytt script\n// Skriv din kod här...';
  scriptOrder.push(btnId);
  scriptCategories[btnId] = 'custom';
  scriptSections[btnId] = selectedSection;

  saveCustomData();
  renderButtons();
  renderScriptList();
  selectScript(btnId);
  showStatus('✅ Nytt script skapat!');

  inputDialog.classList.remove('active');

  // Öppna button designer direkt för att designa den nya knappen
  setTimeout(() => openButtonDesigner(btnId), 300);
};

// Allow Enter key to confirm
scriptNameInput.onkeypress = scriptEmojiInput.onkeypress = (e) => {
  if (e.key === 'Enter') {
    dialogConfirm.click();
  }
};

// Login functionality
loginConfirm.onclick = async () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = 'Fyll i både användarnamn och lösenord';
    return;
  }

  if (!supabaseClient) {
    loginError.textContent = 'Supabase inte tillgänglig - kan inte logga in';
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error) {
      loginError.textContent = '❌ Felaktigt användarnamn eller lösenord';
      loginPassword.value = '';
      loginPassword.focus();
      return;
    }

    currentUser = data.user.email;

    // Save session based on "remember me" checkbox
    const rememberMe = document.getElementById('rememberMe').checked;
    if (rememberMe) {
      localStorage.setItem('postnord_user', currentUser);
    } else {
      sessionStorage.setItem('postnord_user', currentUser);
      localStorage.removeItem('postnord_user');
    }

    updateLoginStatus();

    // Load user permissions
    await loadUserPermissions();

    loginDialog.classList.remove('active');
  } catch (err) {
    loginError.textContent = '❌ Inloggning misslyckades';
    console.error('Login error:', err);
  }
};

loginCancel.onclick = () => {
  loginDialog.classList.remove('active');
};

logoutBtn.onclick = async () => {
  const confirmed = await showConfirm({
    title: 'Logga ut',
    message: 'Vill du logga ut från ditt konto?',
    icon: '👋',
    confirmText: 'Logga ut',
    cancelText: 'Avbryt'
  });

  if (confirmed) {
    currentUser = null;
    localStorage.removeItem('postnord_user');
    userPermissions = {
      is_admin: false,
      can_edit_main_scripts: false,
      can_manage_custom_scripts: false,
      can_edit_button_design: false
    };
    updateLoginStatus();
    updateUIForPermissions();
    modal.classList.remove('active');
    loginDialog.classList.remove('active');

    // Sign out from Supabase
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  }
};

// Badge logout button
badgeLogoutBtn.onclick = async () => {
  const confirmed = await showConfirm({
    title: 'Logga ut',
    message: 'Vill du logga ut från ditt konto?',
    icon: '👋',
    confirmText: 'Logga ut',
    cancelText: 'Avbryt'
  });

  if (confirmed) {
    currentUser = null;
    localStorage.removeItem('postnord_user');
    userPermissions = {
      is_admin: false,
      can_edit_main_scripts: false,
      can_manage_custom_scripts: false,
      can_edit_button_design: false
    };
    updateLoginStatus();
    updateUIForPermissions();
    modal.classList.remove('active');

    // Sign out from Supabase
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  }
};

// ===== PERMISSIONS SYSTEM =====

// Load user permissions from Supabase
async function loadUserPermissions() {
  if (!supabaseClient || !currentUser) {
    userPermissions = {
      is_admin: false,
      can_edit_main_scripts: false,
      can_manage_custom_scripts: false,
      can_edit_button_design: false
    };
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('user_permissions')
      .select('*')
      .eq('email', currentUser)
      .single();

    if (error) {
      userPermissions = {
        is_admin: false,
        can_edit_main_scripts: false,
        can_manage_custom_scripts: false,
        can_edit_button_design: false
      };
    } else if (data) {
      userPermissions = {
        is_admin: data.is_admin || false,
        can_edit_main_scripts: data.can_edit_main_scripts || false,
        can_manage_custom_scripts: data.can_manage_custom_scripts || false,
        can_edit_button_design: data.can_edit_button_design || false
      };
    }
  } catch (err) {
    console.error('Error loading permissions:', err);
  }

  updateUIForPermissions();
}

// Update UI based on permissions
function updateUIForPermissions() {
  const adminBtn = document.getElementById('adminBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  // Show admin button only for admins
  if (adminBtn) {
    adminBtn.style.display = userPermissions.is_admin ? 'flex' : 'none';
  }

  // Show settings button only if user has any editing permission
  const hasAnyEditPermission =
    userPermissions.can_edit_main_scripts ||
    userPermissions.can_manage_custom_scripts ||
    userPermissions.can_edit_button_design;

  if (settingsBtn && currentUser) {
    settingsBtn.style.opacity = hasAnyEditPermission ? '1' : '0.5';
  }
}

// Check if user can perform action
function canEditMainScripts() {
  return userPermissions.is_admin || userPermissions.can_edit_main_scripts;
}

function canManageCustomScripts() {
  return userPermissions.is_admin || userPermissions.can_manage_custom_scripts;
}

function canEditButtonDesign() {
  return userPermissions.is_admin || userPermissions.can_edit_button_design;
}

function hasAnyPermission() {
  return userPermissions.is_admin ||
    userPermissions.can_edit_main_scripts ||
    userPermissions.can_manage_custom_scripts ||
    userPermissions.can_edit_button_design;
}

// ===== ADMIN PANEL =====

const adminBtn = document.getElementById('adminBtn');
const adminPanel = document.getElementById('adminPanel');
const adminCloseBtn = document.getElementById('adminCloseBtn');
const adminUsersList = document.getElementById('adminUsersList');

if (adminBtn) {
  adminBtn.onclick = async () => {
    adminPanel.classList.add('active');
    await loadAllUsers();
  };
}

if (adminCloseBtn) {
  adminCloseBtn.onclick = () => {
    adminPanel.classList.remove('active');
  };
}

if (adminPanel) {
  adminPanel.onclick = (e) => {
    if (e.target === adminPanel) {
      adminPanel.classList.remove('active');
    }
  };
}

// Load all users for admin panel
async function loadAllUsers() {
  if (!supabaseClient || !userPermissions.is_admin) return;

  adminUsersList.innerHTML = '<p style="color: #888; text-align: center;">Laddar användare...</p>';

  try {
    const { data, error } = await supabaseClient
      .from('user_permissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      adminUsersList.innerHTML = '<p style="color: #f87171; text-align: center;">Kunde inte ladda användare</p>';
      return;
    }

    renderUsersList(data || []);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Render users list in admin panel
function renderUsersList(users) {
  if (users.length === 0) {
    adminUsersList.innerHTML = '<p style="color: #888; text-align: center;">Inga användare hittades</p>';
    return;
  }

  adminUsersList.innerHTML = users.map(user => {
    const permCount = [user.can_edit_main_scripts, user.can_manage_custom_scripts, user.can_edit_button_design].filter(Boolean).length;

    let cardClass = 'admin-user-card';
    let badgeClass = 'admin-user-badge';
    let badgeText = '';

    if (user.is_admin) {
      cardClass += ' is-admin';
      badgeClass += ' admin';
      badgeText = 'Admin';
    } else if (permCount > 0) {
      cardClass += ' has-permissions';
      badgeClass += ' active';
      badgeText = `${permCount} behörighet${permCount > 1 ? 'er' : ''}`;
    } else {
      badgeClass += ' pending';
      badgeText = 'Inga behörigheter';
    }

    const isCurrentUser = user.email === currentUser;

    return `
      <div class="${cardClass}" data-user-id="${user.id}">
        <div class="admin-user-header">
          <span class="admin-user-email">${user.email}${isCurrentUser ? ' (du)' : ''}</span>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
        <div class="admin-permissions">
          <div class="admin-permission-item ${isCurrentUser ? 'disabled' : ''}">
            <input type="checkbox" id="admin_${user.id}"
              ${user.is_admin ? 'checked' : ''}
              ${isCurrentUser ? 'disabled' : ''}
              onchange="updatePermission('${user.id}', 'is_admin', this.checked)">
            <label for="admin_${user.id}">Admin</label>
          </div>
          <div class="admin-permission-item">
            <input type="checkbox" id="main_${user.id}"
              ${user.can_edit_main_scripts ? 'checked' : ''}
              onchange="updatePermission('${user.id}', 'can_edit_main_scripts', this.checked)">
            <label for="main_${user.id}">Redigera huvudscripts</label>
          </div>
          <div class="admin-permission-item">
            <input type="checkbox" id="custom_${user.id}"
              ${user.can_manage_custom_scripts ? 'checked' : ''}
              onchange="updatePermission('${user.id}', 'can_manage_custom_scripts', this.checked)">
            <label for="custom_${user.id}">Hantera custom scripts</label>
          </div>
          <div class="admin-permission-item">
            <input type="checkbox" id="design_${user.id}"
              ${user.can_edit_button_design ? 'checked' : ''}
              onchange="updatePermission('${user.id}', 'can_edit_button_design', this.checked)">
            <label for="design_${user.id}">Redigera knappdesign</label>
          </div>
        </div>
        ${!isCurrentUser ? `
          <div class="admin-user-delete">
            <button class="admin-delete-btn" onclick="deleteUser('${user.id}', '${user.email}')">🗑️ Ta bort användare</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Update user permission
async function updatePermission(userId, permission, value) {
  if (!supabaseClient || !userPermissions.is_admin) return;

  try {
    const updateData = {
      [permission]: value,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('user_permissions')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating permission:', error);
      alert('Kunde inte uppdatera behörighet');
      // Reload to reset checkbox state
      await loadAllUsers();
    } else {
      console.log(`Updated ${permission} to ${value} for user ${userId}`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// ===== REGISTRATION =====

const registerDialog = document.getElementById('registerDialog');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
const registerConfirm = document.getElementById('registerConfirm');
const registerCancel = document.getElementById('registerCancel');
const registerError = document.getElementById('registerError');
const showRegisterBtn = document.getElementById('showRegisterBtn');

if (showRegisterBtn) {
  showRegisterBtn.onclick = () => {
    loginDialog.classList.remove('active');
    registerDialog.classList.add('active');
    registerEmail.value = '';
    registerPassword.value = '';
    registerPasswordConfirm.value = '';
    registerError.textContent = '';
    registerEmail.focus();
  };
}

if (registerCancel) {
  registerCancel.onclick = () => {
    registerDialog.classList.remove('active');
    loginDialog.classList.add('active');
  };
}

if (registerConfirm) {
  registerConfirm.onclick = async () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const passwordConfirm = registerPasswordConfirm.value;

    // Validation
    if (!email || !password || !passwordConfirm) {
      registerError.textContent = 'Fyll i alla fält';
      return;
    }

    if (password !== passwordConfirm) {
      registerError.textContent = 'Lösenorden matchar inte';
      return;
    }

    if (password.length < 6) {
      registerError.textContent = 'Lösenordet måste vara minst 6 tecken';
      return;
    }

    if (!supabaseClient) {
      registerError.textContent = 'Supabase inte tillgänglig';
      return;
    }

    try {
      // Create user in Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        registerError.textContent = error.message;
        return;
      }

      if (data.user) {
        // Create permissions entry with no permissions
        const { error: permError } = await supabaseClient
          .from('user_permissions')
          .insert({
            user_id: data.user.id,
            email: email,
            is_admin: false,
            can_edit_main_scripts: false,
            can_manage_custom_scripts: false,
            can_edit_button_design: false
          });

        if (permError) {
          console.error('Error creating permissions:', permError);
        }

        // Show success message
        registerDialog.classList.remove('active');
        await showConfirm({
          title: 'Konto skapat!',
          message: 'Du kan nu logga in. En admin behöver ge dig behörigheter innan du kan redigera.',
          icon: '✅',
          confirmText: 'Logga in',
          cancelText: 'Stäng'
        });
        loginDialog.classList.add('active');
        loginUsername.value = email;
        loginPassword.focus();
      }
    } catch (err) {
      console.error('Registration error:', err);
      registerError.textContent = 'Registrering misslyckades';
    }
  };
}

// Allow Enter to register
if (registerEmail && registerPassword && registerPasswordConfirm) {
  registerEmail.onkeypress = registerPassword.onkeypress = registerPasswordConfirm.onkeypress = (e) => {
    if (e.key === 'Enter') {
      registerConfirm.click();
    }
  };
}

// ===== CUSTOM CONFIRM DIALOG =====

const customConfirmDialog = document.getElementById('customConfirmDialog');
const customConfirmIcon = document.getElementById('customConfirmIcon');
const customConfirmTitle = document.getElementById('customConfirmTitle');
const customConfirmMessage = document.getElementById('customConfirmMessage');
const customConfirmOk = document.getElementById('customConfirmOk');
const customConfirmCancel = document.getElementById('customConfirmCancel');

let confirmResolve = null;

// Show custom confirm dialog (returns Promise)
function showConfirm(options = {}) {
  const {
    title = 'Bekräfta',
    message = 'Är du säker?',
    icon = '⚠️',
    confirmText = 'OK',
    cancelText = 'Avbryt',
    danger = false
  } = options;

  customConfirmIcon.textContent = icon;
  customConfirmTitle.textContent = title;
  customConfirmMessage.textContent = message;
  customConfirmOk.textContent = confirmText;
  customConfirmCancel.textContent = cancelText;

  if (danger) {
    customConfirmOk.classList.add('danger');
  } else {
    customConfirmOk.classList.remove('danger');
  }

  customConfirmDialog.classList.add('active');

  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

if (customConfirmOk) {
  customConfirmOk.onclick = () => {
    customConfirmDialog.classList.remove('active');
    if (confirmResolve) confirmResolve(true);
  };
}

if (customConfirmCancel) {
  customConfirmCancel.onclick = () => {
    customConfirmDialog.classList.remove('active');
    if (confirmResolve) confirmResolve(false);
  };
}

if (customConfirmDialog) {
  customConfirmDialog.onclick = (e) => {
    if (e.target === customConfirmDialog) {
      customConfirmDialog.classList.remove('active');
      if (confirmResolve) confirmResolve(false);
    }
  };
}

// ===== DELETE USER =====

async function deleteUser(userId, userEmail) {
  const confirmed = await showConfirm({
    title: 'Ta bort användare',
    message: `Är du säker på att du vill ta bort ${userEmail}?`,
    icon: '🗑️',
    confirmText: 'Ta bort',
    cancelText: 'Avbryt',
    danger: true
  });

  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from('user_permissions')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      await showConfirm({
        title: 'Fel',
        message: 'Kunde inte ta bort användaren',
        icon: '❌',
        confirmText: 'OK',
        cancelText: 'Stäng'
      });
    } else {
      await loadAllUsers();
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// ===== MAIN LOGIN BUTTON =====

const mainLoginBtn = document.getElementById('mainLoginBtn');

if (mainLoginBtn) {
  mainLoginBtn.onclick = () => {
    loginError.textContent = '';
    loginUsername.value = '';
    loginPassword.value = '';
    loginDialog.classList.add('active');
    loginUsername.focus();
  };
}

// ===== END PERMISSIONS & ADMIN =====

// Allow Enter to login
loginUsername.onkeypress = loginPassword.onkeypress = (e) => {
  if (e.key === 'Enter') {
    loginConfirm.click();
  }
};

// Delete script (only custom scripts can be deleted)
async function deleteScript(key) {
  const isDefaultScript = ['btn1', 'btn2', 'btn3', 'btn4', 'btn5', 'btn6', 'btn7', 'btn8', 'btn9', 'btn10'].includes(key);

  if (isDefaultScript) {
    await showConfirm({
      title: 'Kan inte ta bort',
      message: 'De 10 förvalda scripten kan inte tas bort.',
      icon: '⚠️',
      confirmText: 'OK',
      cancelText: 'Stäng'
    });
    return;
  }

  if (!canManageCustomScripts()) {
    await showConfirm({
      title: 'Ingen behörighet',
      message: 'Du har inte behörighet att ta bort scripts.',
      icon: '🔒',
      confirmText: 'OK',
      cancelText: 'Stäng'
    });
    return;
  }

  scriptToDelete = key;
  const scriptName = (scriptNames[key] || key).replace(/<br>/g, ' ');
  confirmMessage.textContent = `Är du säker på att du vill ta bort "${scriptName}"?`;
  confirmDialog.classList.add('active');
}

confirmCancel.onclick = () => {
  confirmDialog.classList.remove('active');
  scriptToDelete = null;
};

confirmDelete.onclick = () => {
  const isDefaultScript = ['btn1', 'btn2', 'btn3', 'btn4', 'btn5', 'btn6', 'btn7', 'btn8', 'btn9', 'btn10'].includes(scriptToDelete);
  
  if (scriptToDelete && !isDefaultScript) {
    delete customScripts[scriptToDelete];
    delete scriptNames[scriptToDelete];
    delete scriptCategories[scriptToDelete];
    scriptOrder = scriptOrder.filter(id => id !== scriptToDelete);

    if (currentScript === scriptToDelete) {
      currentScript = scriptOrder[0] || null;
      if (currentScript) {
        selectScript(currentScript);
      } else {
        codeEditor.value = '';
      }
    }

    saveCustomData();
    renderButtons();
    renderScriptList();
    showStatus('🗑️ Script borttaget');

    confirmDialog.classList.remove('active');
    scriptToDelete = null;
  }
};

// ===== BUTTON DESIGNER =====

// Open button designer
async function openButtonDesigner(buttonKey) {
  if (!canEditButtonDesign()) {
    await showConfirm({
      title: 'Ingen behörighet',
      message: 'Du har inte behörighet att redigera knappdesign.',
      icon: '🔒',
      confirmText: 'OK',
      cancelText: 'Stäng'
    });
    return;
  }

  currentDesigningButton = buttonKey;
  
  // Load existing style or use default
  const existingStyle = buttonStyles[buttonKey];
  if (existingStyle) {
    currentButtonStyle = { ...existingStyle };
  } else {
    // Get category-based default
    const category = scriptCategories[buttonKey] || 'custom';
    currentButtonStyle.preset = category;
  }
  
  // Update preview text
  previewText.textContent = (scriptNames[buttonKey] || buttonKey).replace(/<br>/g, ' ');
  
  // Set form values
  applyStyleToPreview();
  selectPreset(currentButtonStyle.preset);
  
  primaryColor.value = currentButtonStyle.primaryColor;
  secondaryColor.value = currentButtonStyle.secondaryColor;
  transparency.value = currentButtonStyle.transparency;
  transparencyValue.textContent = currentButtonStyle.transparency + '%';
  borderRadius.value = currentButtonStyle.borderRadius;
  borderRadiusValue.textContent = currentButtonStyle.borderRadius + 'px';
  borderWidth.value = currentButtonStyle.borderWidth;
  borderWidthValue.textContent = currentButtonStyle.borderWidth + 'px';
  glowEffect.checked = currentButtonStyle.glow;
  gradientEffect.checked = currentButtonStyle.gradient;
  
  buttonDesignerDialog.classList.add('active');
}

// Select preset
function selectPreset(preset) {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`.preset-btn[data-style="${preset}"]`)?.classList.add('selected');
  
  currentButtonStyle.preset = preset;
  
  // Show/hide custom color section
  if (preset === 'custom') {
    customColorSection.style.display = 'block';
  } else {
    customColorSection.style.display = 'none';
    
    // Set colors based on preset
    const presets = {
      console: { primary: '#3b82f6', secondary: '#4f46e5' },
      excel: { primary: '#22c55e', secondary: '#15803d' },
      message: { primary: '#a855f7', secondary: '#9333ea' }
    };
    
    if (presets[preset]) {
      currentButtonStyle.primaryColor = presets[preset].primary;
      currentButtonStyle.secondaryColor = presets[preset].secondary;
    }
  }
  
  applyStyleToPreview();
}

// Apply style to preview button
function applyStyleToPreview() {
  const style = currentButtonStyle;
  const btn = previewButton;
  
  // Clear existing classes
  btn.className = 'copy-btn preview-button';
  
  // Convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const primary = style.primaryColor;
  const secondary = style.secondaryColor;
  const alpha = style.transparency / 100;
  
  let bgStyle = '';
  if (style.gradient) {
    bgStyle = `
      linear-gradient(135deg, ${hexToRgba(primary, alpha * 0.5)}, ${hexToRgba(secondary, alpha * 0.5)}),
      linear-gradient(180deg, ${hexToRgba(primary, alpha)} 0%, ${hexToRgba(secondary, alpha * 1.5)} 100%)
    `;
  } else {
    bgStyle = hexToRgba(primary, alpha);
  }
  
  let boxShadow = `0 8px 20px rgba(0,0,0,0.2)`;
  if (style.glow) {
    boxShadow += `, 0 0 30px ${hexToRgba(primary, alpha * 0.5)}`;
  }
  
  btn.style.background = bgStyle;
  btn.style.boxShadow = boxShadow;
  btn.style.borderRadius = style.borderRadius + 'px';
  btn.style.border = `${style.borderWidth}px solid ${hexToRgba(primary, alpha)}`;
  btn.style.textShadow = style.glow ? `0 0 10px ${hexToRgba(primary, alpha * 2)}` : 'none';
}

// Event listeners for designer
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectPreset(btn.dataset.style);
  });
});

primaryColor.addEventListener('input', (e) => {
  currentButtonStyle.primaryColor = e.target.value;
  applyStyleToPreview();
});

secondaryColor.addEventListener('input', (e) => {
  currentButtonStyle.secondaryColor = e.target.value;
  applyStyleToPreview();
});

transparency.addEventListener('input', (e) => {
  currentButtonStyle.transparency = parseInt(e.target.value);
  transparencyValue.textContent = e.target.value + '%';
  applyStyleToPreview();
});

borderRadius.addEventListener('input', (e) => {
  currentButtonStyle.borderRadius = parseInt(e.target.value);
  borderRadiusValue.textContent = e.target.value + 'px';
  applyStyleToPreview();
});

borderWidth.addEventListener('input', (e) => {
  currentButtonStyle.borderWidth = parseInt(e.target.value);
  borderWidthValue.textContent = e.target.value + 'px';
  applyStyleToPreview();
});

glowEffect.addEventListener('change', (e) => {
  currentButtonStyle.glow = e.target.checked;
  applyStyleToPreview();
});

gradientEffect.addEventListener('change', (e) => {
  currentButtonStyle.gradient = e.target.checked;
  applyStyleToPreview();
});

designerCancel.onclick = () => {
  buttonDesignerDialog.classList.remove('active');
};

designerSave.onclick = () => {
  if (currentDesigningButton) {
    buttonStyles[currentDesigningButton] = { ...currentButtonStyle };
    saveCustomData();
    renderButtons();
    showStatus('✅ Knappdesign sparad!');
  }
  buttonDesignerDialog.classList.remove('active');
};

// ===== END BUTTON DESIGNER =====

// Apply button style to a button element
function applyButtonStyle(btn, style) {
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const primary = style.primaryColor;
  const secondary = style.secondaryColor;
  const alpha = style.transparency / 100;
  
  let bgStyle = '';
  if (style.gradient) {
    bgStyle = `
      linear-gradient(135deg, ${hexToRgba(primary, alpha * 0.5)}, ${hexToRgba(secondary, alpha * 0.5)}),
      linear-gradient(180deg, ${hexToRgba(primary, alpha)} 0%, ${hexToRgba(secondary, alpha * 1.5)} 100%)
    `;
  } else {
    bgStyle = hexToRgba(primary, alpha);
  }
  
  let boxShadow = `0 8px 20px rgba(0,0,0,0.2)`;
  if (style.glow) {
    boxShadow += `, 0 0 30px ${hexToRgba(primary, alpha * 0.5)}`;
  }
  
  btn.style.background = bgStyle;
  btn.style.boxShadow = boxShadow;
  btn.style.borderRadius = style.borderRadius + 'px';
  btn.style.border = `${style.borderWidth}px solid ${hexToRgba(primary, alpha)}`;
  btn.style.textShadow = style.glow ? `0 0 10px ${hexToRgba(primary, alpha * 2)}` : 'none';
}

// Render buttons on main page
function renderButtons() {
  buttonContainerKvall.innerHTML = '';
  buttonContainerDag.innerHTML = '';

  // Guard against duplicate IDs in DOM
  const seenIds = new Set();

  scriptOrder.forEach(key => {
    // Guard: skip if duplicate key somehow exists in scriptOrder
    if (seenIds.has(key)) {
      console.warn('Duplicate button key in scriptOrder:', key);
      return;
    }
    seenIds.add(key);

    const btn = document.createElement('button');
    btn.id = key;
    btn.className = 'copy-btn';

    const category = scriptCategories[key] || 'custom';
    btn.classList.add(category);

    btn.innerHTML = scriptNames[key] || key;

    // Apply custom button style if exists
    if (buttonStyles[key]) {
      applyButtonStyle(btn, buttonStyles[key]);
    }

    // Alla scripts kommer från customScripts
    const originalHTML = btn.innerHTML;
    btn.addEventListener('click', async () => {
      const textToCopy = customScripts[key] || '';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => fallbackCopy(textToCopy));
      } else {
        fallbackCopy(textToCopy);
      }

      // Log button click to activity log (don't wait for it)
      logButtonClick(key);

      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        btn.classList.add('clicked');
        requestAnimationFrame(() => {
          btn.innerHTML = '✅ Kopierat!';
        });
      });

      setTimeout(() => {
        requestAnimationFrame(() => {
          btn.classList.remove('clicked');
          requestAnimationFrame(() => {
            btn.innerHTML = originalHTML;
          });
        });
      }, 1500);
    });

    // Lägg till knappen i rätt container baserat på sektion
    const section = scriptSections[key] || 'kvall';
    if (section === 'dag') {
      buttonContainerDag.appendChild(btn);
    } else {
      buttonContainerKvall.appendChild(btn);
    }
  });
}

// Select and load script
async function selectScript(key) {
  currentScript = key;
  document.querySelectorAll('.script-item').forEach(item => {
    item.classList.toggle('active', item.dataset.script === key);
  });

  // Alla scripts finns i customScripts
  currentScriptContent = customScripts[key] || '';
  codeEditor.value = currentScriptContent;
}

saveBtn.onclick = () => {
  if (!currentScript) return;

  // Check permissions
  const isMainScript = ['btn1', 'btn2', 'btn3', 'btn4', 'btn5', 'btn6', 'btn7', 'btn8', 'btn9', 'btn10'].includes(currentScript);

  if (isMainScript && !canEditMainScripts()) {
    showStatus('❌ Du har inte behörighet att redigera huvudscripts');
    return;
  }

  if (!isMainScript && !canManageCustomScripts()) {
    showStatus('❌ Du har inte behörighet att redigera custom scripts');
    return;
  }

  customScripts[currentScript] = codeEditor.value;
  currentScriptContent = codeEditor.value;
  saveCustomData();
  showStatus('✅ Sparat!');
};

resetBtn.onclick = async () => {
  if (!currentScript) return;

  const confirmed = await showConfirm({
    title: 'Återställ script',
    message: 'Vill du återställa scriptet till senast sparade version?',
    icon: '↺',
    confirmText: 'Återställ',
    cancelText: 'Avbryt'
  });

  if (confirmed) {
    selectScript(currentScript);
    showStatus('↺ Återställd');
  }
};

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add('show');
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 2000);
}

// Copy button functionality
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ===== ACTIVITY CONSOLE =====

const consoleToggleBtn = document.getElementById('consoleToggleBtn');
const activityConsole = document.getElementById('activityConsole');
const consoleCloseBtn = document.getElementById('consoleCloseBtn');
const consoleBody = document.getElementById('consoleBody');
const onlineCount = document.getElementById('onlineCount');

let activitySubscription = null;
const MAX_ACTIVITIES = 100; // Begränsa antal aktiviteter i konsolen
const loadedActivityIds = new Set(); // Track loaded activity IDs to prevent duplicates

// Toggle console
if (consoleToggleBtn) {
  consoleToggleBtn.onclick = async () => {
    activityConsole.classList.toggle('active');
    if (activityConsole.classList.contains('active')) {
      await loadRecentActivities();
      // Ensure we scroll to bottom after activities are loaded
      setTimeout(() => {
        consoleBody.scrollTop = consoleBody.scrollHeight;
      }, 150);
    }
  };
}

if (consoleCloseBtn) {
  consoleCloseBtn.onclick = () => {
    activityConsole.classList.remove('active');
  };
}

// Log button click to Supabase
async function logButtonClick(buttonId) {
  if (!supabaseClient) return;

  const buttonName = (scriptNames[buttonId] || buttonId).replace(/<br>/g, ' ');
  const userName = currentUser || 'Anonym';

  try {
    const { error } = await supabaseClient
      .from('activity_log')
      .insert({
        button_id: buttonId,
        button_name: buttonName,
        user_name: userName,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// Load recent activities
async function loadRecentActivities() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load activities:', error);
      return;
    }

    consoleBody.innerHTML = '';
    loadedActivityIds.clear(); // Clear tracked IDs when reloading

    // Database returns in descending order (newest first)
    // We reverse to get oldest first, then appendChild adds to bottom
    // Result: oldest at top, newest at bottom ✓
    const sortedData = [...data].reverse();
    sortedData.forEach(activity => {
      if (activity.id && !loadedActivityIds.has(activity.id)) {
        loadedActivityIds.add(activity.id);
        const item = createActivityItem(activity);
        consoleBody.appendChild(item);
      }
    });
    
    // Limit activities (remove oldest from top)
    while (consoleBody.children.length > MAX_ACTIVITIES) {
      consoleBody.removeChild(consoleBody.firstChild);
    }
    
    // Scroll to bottom to show newest (use setTimeout to ensure DOM is fully rendered)
    setTimeout(() => {
      consoleBody.scrollTop = consoleBody.scrollHeight;
    }, 100);
  } catch (err) {
    console.error('Load activities error:', err);
  }
}

// Create activity item element
function createActivityItem(activity) {
  const item = document.createElement('div');
  item.className = 'activity-item';
  
  // Get category from button_id
  const category = scriptCategories[activity.button_id] || 'custom';
  item.classList.add(category);

  const timeAgo = getTimeAgo(new Date(activity.timestamp));
  
  item.innerHTML = `
    <div>
      <span class="activity-user">${activity.user_name}</span>
      <span class="activity-action">kopierade</span>
      <span class="activity-button">${activity.button_name}</span>
    </div>
    <span class="activity-time">${timeAgo}</span>
  `;
  
  return item;
}

// Add activity to console (appends to bottom - newest at bottom)
function addActivityToConsole(activity, scrollToBottom = true) {
  // Prevent duplicates - check if activity already exists
  if (activity.id && loadedActivityIds.has(activity.id)) {
    return; // Already loaded, skip
  }
  
  if (activity.id) {
    loadedActivityIds.add(activity.id);
  }
  
  const item = createActivityItem(activity);
  
  // appendChild adds to bottom of container (newest goes to bottom)
  consoleBody.appendChild(item);

  // Limit activities (remove oldest from top)
  while (consoleBody.children.length > MAX_ACTIVITIES) {
    consoleBody.removeChild(consoleBody.firstChild);
  }
  
  // Scroll to bottom to show newest activity
  if (scrollToBottom) {
    setTimeout(() => {
      consoleBody.scrollTop = consoleBody.scrollHeight;
    }, 0);
  }
}

// Time ago helper
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just nu';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min sedan`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} tim sedan`;
  return `${Math.floor(seconds / 86400)} dagar sedan`;
}

// Setup realtime subscription for activities
function setupActivitySubscription() {
  if (!supabaseClient) return;

  activitySubscription = supabaseClient
    .channel('activity_log_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_log'
    }, (payload) => {
      if (payload.new) {
        addActivityToConsole(payload.new);
      }
    })
    .subscribe();
}

// Update online count (optional - requires presence tracking)
async function updateOnlineCount() {
  // This is a simple placeholder - you can implement proper presence tracking
  if (onlineCount) {
    onlineCount.textContent = '● Aktiv';
  }
}

// Initialize activity console
async function initActivityConsole() {
  if (supabaseClient) {
    setupActivitySubscription();
    updateOnlineCount();
  }
}

// ===== END ACTIVITY CONSOLE =====

// Initialize the app
initializeApp();