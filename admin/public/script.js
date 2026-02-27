// admin/public/script.js

let config = { settings: {}, items: [] };

// For Folder functionality
let currentFolderIndex = null;

// A large subset of FontAwesome icons for the picker
const FA_ICONS = [
    'fas fa-link', 'fas fa-home', 'fas fa-user', 'fas fa-envelope', 'fas fa-phone',
    'fas fa-music', 'fas fa-video', 'fas fa-camera', 'fas fa-briefcase', 'fas fa-map-marker-alt',
    'fab fa-whatsapp', 'fab fa-instagram', 'fab fa-tiktok', 'fab fa-facebook', 'fab fa-twitter',
    'fab fa-youtube', 'fab fa-linkedin', 'fab fa-github', 'fab fa-discord', 'fab fa-spotify',
    'fab fa-telegram', 'fab fa-pinterest', 'fab fa-snapchat', 'fas fa-shopping-cart', 'fas fa-store',
    'fas fa-globe', 'fas fa-star', 'fas fa-heart', 'fas fa-gamepad', 'fas fa-graduation-cap',
    'fas fa-pen', 'fas fa-palette', 'fas fa-book', 'fas fa-images', 'fas fa-code',
    'fas fa-laptop', 'fas fa-tv', 'fas fa-bullhorn', 'fas fa-coffee', 'fas fa-utensils',
    'fas fa-bicycle', 'fas fa-car', 'fas fa-plane', 'fas fa-train', 'fas fa-subway',
    'fas fa-bus', 'fas fa-motorcycle', 'fas fa-truck', 'fas fa-ship', 'fas fa-rocket',
    'fas fa-paw', 'fas fa-tree', 'fas fa-leaf', 'fas fa-fire', 'fas fa-water',
    'fas fa-sun', 'fas fa-moon', 'fas fa-cloud', 'fas fa-snowflake', 'fas fa-bolt',
    'fas fa-umbrella', 'fas fa-shopping-bag', 'fas fa-gift', 'fas fa-ticket-alt', 'fas fa-tag',
    'fas fa-tags', 'fas fa-credit-card', 'fas fa-wallet', 'fas fa-coins', 'fas fa-money-bill',
    'fas fa-receipt', 'fas fa-calendar', 'fas fa-clock', 'fas fa-hourglass', 'fas fa-stopwatch',
    'fas fa-bell', 'fas fa-map', 'fas fa-compass', 'fas fa-location-arrow', 'fas fa-directions',
    'fas fa-share', 'fas fa-share-alt', 'fas fa-reply', 'fas fa-flag', 'fas fa-bookmark',
    'fas fa-paperclip', 'fas fa-folder', 'fas fa-folder-open', 'fas fa-file', 'fas fa-file-alt',
    'fas fa-clipboard', 'fas fa-save', 'fas fa-download', 'fas fa-upload', 'fas fa-cloud-upload-alt',
    'fas fa-cloud-download-alt', 'fas fa-database', 'fas fa-server', 'fas fa-desktop', 'fas fa-mobile-alt',
    'fas fa-print', 'fas fa-keyboard', 'fas fa-mouse', 'fas fa-headset', 'fas fa-microphone',
    'fas fa-search', 'fas fa-search-plus', 'fas fa-search-minus', 'fas fa-sliders-h', 'fas fa-cogs',
    'fas fa-wrench', 'fas fa-hammer', 'fas fa-magic', 'fas fa-paint-brush', 'fas fa-lock', 'fas fa-arrow-right'
];

document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
    setupTabs();
    setupModals();
    renderIconGrid(FA_ICONS);

    document.getElementById('save-btn').addEventListener('click', saveConfig);

    // Favicon file upload
    document.getElementById('favicon-file').addEventListener('change', function () {
        if (!this.files.length) return;
        const faviconInput = document.getElementById('set-favicon');
        uploadFile('favicon-file', null, (url) => {
            faviconInput.value = url;
            config.settings.favicon = url;
        });
    });

    // Background type toggles
    const bgTypeSel = document.getElementById('set-bg-type');
    const presetWrap = document.getElementById('preset-grid-wrap');
    const bgColorWrap = document.getElementById('set-bg-color-wrap');
    const bgGradWrap = document.getElementById('set-bg-gradient-wrap');
    const bgUrlWrap = document.getElementById('set-bg-url-wrap');

    function updateBgBlocks() {
        const val = bgTypeSel.value;
        presetWrap.style.display = val === 'preset' ? 'block' : 'none';
        bgColorWrap.style.display = val === 'color' ? 'block' : 'none';
        bgGradWrap.style.display = val === 'gradient' ? 'block' : 'none';
        bgUrlWrap.style.display = (val === 'url' || val === 'upload') ? 'block' : 'none';
    }
    bgTypeSel.addEventListener('change', updateBgBlocks);

    document.querySelectorAll('.bg-preset-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.bg-preset-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (!config.settings.background) config.settings.background = {};
            config.settings.background.value = item.dataset.preset;
        });
    });

    document.getElementById('btn-upload-bg').addEventListener('click', () => uploadFile('set-bg-file', 'set-bg-url-val'));

    // Icon search
    document.getElementById('icon-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderIconGrid(q ? FA_ICONS.filter(i => i.includes(q)) : FA_ICONS);
    });
});

async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to fetch config');
        config = await res.json();

        if (!config.settings) config.settings = {};
        if (!config.items) config.items = [];

        populateSettingsForm();
        renderItems(config.items, 'admin-links-container', false);
    } catch (error) {
        showToast('Error loading data: ' + error.message, 'error');
    }
}

async function saveConfig() {
    config.settings.siteTitle = document.getElementById('set-title').value;
    config.settings.favicon = document.getElementById('set-favicon').value;

    let bgValue = '';
    const bgType = document.getElementById('set-bg-type').value;
    if (bgType === 'color') bgValue = document.getElementById('set-bg-color-val').value;
    else if (bgType === 'gradient') bgValue = `${document.getElementById('set-bg-grad1').value},${document.getElementById('set-bg-grad2').value}`;
    else if (bgType === 'url') bgValue = document.getElementById('set-bg-url-val').value;
    else if (bgType === 'preset') {
        const activePreset = document.querySelector('.bg-preset-item.active');
        bgValue = activePreset ? activePreset.dataset.preset : 'sunset-glow';
    }

    config.settings.background = {
        type: bgType,
        value: bgValue
    };

    config.settings.footer = {
        text: document.getElementById('set-footer-text').value,
        url: document.getElementById('set-footer-url').value,
        color: document.getElementById('set-footer-color').value
    };

    const btn = document.getElementById('save-btn');
    const ogHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (!res.ok) throw new Error('Failed to save config');
        showToast('Settings saved successfully! Public output compiled securely.', 'success');
        renderItems(config.items, 'admin-links-container', false);
    } catch (e) {
        showToast('Save failed: ' + e.message, 'error');
    } finally {
        btn.innerHTML = ogHtml;
        btn.disabled = false;
    }
}

async function uploadFile(inputId, targetInputId, callback) {
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];
    if (!file) return showToast('Please select a file first', 'error');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            if (targetInputId && targetInputId !== 'null' && document.getElementById(targetInputId)) {
                document.getElementById(targetInputId).value = data.url;
            }
            showToast('File uploaded successfully', 'success');
            if (callback) callback(data.url);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// -- UI Setup --
function setupTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });
}

function setupModals() {
    // Component Add Modal
    const addModal = document.getElementById('add-modal');
    document.getElementById('btn-open-add-modal').addEventListener('click', () => {
        currentFolderIndex = null; // Adding to root
        addModal.classList.remove('hidden');
    });
    document.getElementById('btn-folder-add')?.addEventListener('click', () => {
        addModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => addModal.classList.add('hidden'));

    document.querySelectorAll('.component-card').forEach(card => {
        card.addEventListener('click', () => {
            addNewItem(card.dataset.type, currentFolderIndex);
            addModal.classList.add('hidden');
        });
    });

    // Icon Picker Modal
    document.getElementById('btn-close-icon-modal').addEventListener('click', () => {
        document.getElementById('icon-modal').classList.add('hidden');
    });

    // Folder Modal
    document.getElementById('btn-close-folder-modal').addEventListener('click', () => {
        document.getElementById('folder-modal').classList.add('hidden');
        currentFolderIndex = null;
        renderItems(config.items, 'admin-links-container', false); // Refresh root view
    });
}

function populateSettingsForm() {
    const s = config.settings;
    if (!s) return;

    document.getElementById('set-title').value = s.siteTitle || '';
    document.getElementById('set-favicon').value = s.favicon || '';

    if (s.background) {
        document.getElementById('set-bg-type').value = s.background.type || 'preset';

        if (s.background.type === 'color') document.getElementById('set-bg-color-val').value = s.background.value || '#0f172a';
        else if (s.background.type === 'gradient') {
            const parts = (s.background.value || '#3b82f6,#8b5cf6').split(',');
            document.getElementById('set-bg-grad1').value = parts[0] || '#3b82f6';
            document.getElementById('set-bg-grad2').value = parts[1] || '#8b5cf6';
        } else if (s.background.type === 'url') document.getElementById('set-bg-url-val').value = s.background.value || '';

        // highlight active preset if preset match
        if (s.background.type === 'preset') {
            document.querySelectorAll('.bg-preset-item').forEach(i => {
                if (i.dataset.preset === s.background.value) i.classList.add('active');
                else i.classList.remove('active');
            });
        }
    }
    // trigger UI toggle
    document.getElementById('set-bg-type').dispatchEvent(new Event('change'));

    if (s.footer) {
        document.getElementById('set-footer-text').value = s.footer.text || '';
        document.getElementById('set-footer-url').value = s.footer.url || '';
        document.getElementById('set-footer-color').value = s.footer.color || '#64748b';
    }
}

// -- Icon Picker --
let currentIconTargetIndex = null;
let currentIconTargetIsFolder = false;

window.openIconPicker = function (index, isFolderCtx = false) {
    currentIconTargetIndex = index;
    currentIconTargetIsFolder = isFolderCtx;
    document.getElementById('icon-modal').classList.remove('hidden');
}

function renderIconGrid(icons) {
    const grid = document.getElementById('icon-grid');
    grid.innerHTML = icons.map(cls => `
        <div class="icon-item" onclick="selectIcon('${cls}')">
            <i class="${cls}"></i>
        </div>
    `).join('');
}

window.selectIcon = function (cls) {
    const targetArr = currentIconTargetIsFolder ? config.items[currentFolderIndex].items : config.items;
    targetArr[currentIconTargetIndex].icon = cls;

    // Refresh UI
    const containerId = currentIconTargetIsFolder ? 'folder-links-container' : 'admin-links-container';
    renderItems(targetArr, containerId, currentIconTargetIsFolder);

    // Expand the item again
    setTimeout(() => toggleItem(currentIconTargetIndex), 50);
    document.getElementById('icon-modal').classList.add('hidden');
}

// -- Core Data Binding & Rendering --

function addNewItem(type, folderIndex = null) {
    const base = { id: 'item-' + Date.now(), type: type };
    if (type === 'profile') {
        base.url = 'https://ui-avatars.com/api/?name=User&background=1e293b&color=fff';
        base.style = 'framed';
    } else if (type === 'link') {
        base.title = 'New Link';
        base.url = 'https://';
        base.icon = 'fas fa-link';
    } else if (type === 'text') {
        base.content = 'New Text Block';
        base.style = 'heading';
    } else if (type === 'folder') {
        base.title = 'New Folder';
        base.icon = 'fas fa-folder';
        base.items = [];
    } else if (type === 'divider') {
        base.style = 'solid';
        base.color = '#e2e8f0';
        base.thickness = '1';
    }

    const targetArr = folderIndex !== null ? config.items[folderIndex].items : config.items;
    targetArr.push(base);

    const containerId = folderIndex !== null ? 'folder-links-container' : 'admin-links-container';
    const pfxVal = folderIndex !== null ? 'f' : 'm';
    renderItems(targetArr, containerId, folderIndex !== null);

    setTimeout(() => toggleItem(targetArr.length - 1, pfxVal), 50);
}

window.deleteItem = function (index, e, isFolderCtx) {
    if (e) e.stopPropagation();
    if (confirm('Remove this block?')) {
        const targetArr = isFolderCtx ? config.items[currentFolderIndex].items : config.items;
        targetArr.splice(index, 1);
        renderItems(targetArr, isFolderCtx ? 'folder-links-container' : 'admin-links-container', isFolderCtx);
    }
}

window.moveItem = function (index, direction, e, isFolderCtx) {
    if (e) e.stopPropagation();
    const targetArr = isFolderCtx ? config.items[currentFolderIndex].items : config.items;
    if (index + direction < 0 || index + direction >= targetArr.length) return;

    const temp = targetArr[index];
    targetArr[index] = targetArr[index + direction];
    targetArr[index + direction] = temp;

    renderItems(targetArr, isFolderCtx ? 'folder-links-container' : 'admin-links-container', isFolderCtx);
}

window.duplicateItem = function (index, e, isFolderCtx) {
    if (e) e.stopPropagation();

    // Deep-clone with fresh ID, strip password
    function cloneWithNewId(obj) {
        const c = JSON.parse(JSON.stringify(obj));
        c.id = 'item-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
        if (c.items) c.items = c.items.map(cloneWithNewId);
        delete c.encryptedData; delete c.password; c.isProtected = false;
        return c;
    }

    const clone = cloneWithNewId(
        isFolderCtx ? config.items[currentFolderIndex].items[index] : config.items[index]
    );

    // Build dropdown options: Main Page + every folder
    const folders = config.items.filter(it => it.type === 'folder');
    const folderOptions = folders.map((f, fi) => {
        const realIndex = config.items.indexOf(f);
        return `<option value="folder:${realIndex}">${escapeHtml(f.title || 'Folder ' + (fi + 1))}</option>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:1.75rem 2rem;min-width:300px;max-width:360px;box-shadow:0 24px 48px rgba(0,0,0,0.6);animation:fadeInDown 0.2s ease-out;">
            <div style="font-size:1rem;font-weight:700;color:#f6f6f6;margin-bottom:0.35rem;">
                <i class="fas fa-copy" style="color:var(--accent);margin-right:6px;"></i>Duplicate — Destination
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:1rem;">
                Pilih tujuan penempatan salinan item:
            </div>
            <select id="dup-dest-select" class="form-select" style="margin-bottom:1.25rem;">
                <option value="main">📄 Main Page</option>
                ${folderOptions}
            </select>
            <div style="display:flex;gap:0.75rem;">
                <button class="btn btn-primary" style="flex:1;" id="dup-confirm">
                    <i class="fas fa-check"></i> Duplicate
                </button>
                <button class="btn btn-secondary" id="dup-cancel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#dup-cancel').onclick = () => overlay.remove();

    overlay.querySelector('#dup-confirm').onclick = () => {
        const dest = overlay.querySelector('#dup-dest-select').value;
        overlay.remove();

        if (dest === 'main') {
            // Append to main page
            if (isFolderCtx) {
                config.items.push(clone);
                renderItems(config.items, 'admin-links-container', false);
            } else {
                // Insert right after original on main page
                config.items.splice(index + 1, 0, clone);
                renderItems(config.items, 'admin-links-container', false);
                setTimeout(() => toggleItem(index + 1, 'm'), 50);
            }
        } else {
            // dest = "folder:<realIndex>"
            const targetFolderIndex = parseInt(dest.split(':')[1]);
            if (!config.items[targetFolderIndex].items) config.items[targetFolderIndex].items = [];

            if (isFolderCtx && targetFolderIndex === currentFolderIndex) {
                // Same folder: insert right after
                config.items[targetFolderIndex].items.splice(index + 1, 0, clone);
                renderItems(config.items[targetFolderIndex].items, 'folder-links-container', true);
                setTimeout(() => toggleItem(index + 1, 'f'), 50);
            } else {
                // Different folder: append
                config.items[targetFolderIndex].items.push(clone);
                // If the target folder is currently open, refresh its view
                if (isFolderCtx && targetFolderIndex === currentFolderIndex) {
                    renderItems(config.items[targetFolderIndex].items, 'folder-links-container', true);
                }
            }
        }
    };
}



window.toggleItem = function (index, prefix) {
    const p = prefix || 'm';
    const acc = document.getElementById(`${p}-item-acc-${index}`);
    if (acc) acc.classList.toggle('expanded');
}

window.bindData = function (index, key, value, isFolderCtx = false) {
    const targetArr = isFolderCtx ? config.items[currentFolderIndex].items : config.items;
    targetArr[index][key] = value;
}

window.bindToggleData = function (index, key, checkbox, isFolderCtx = false) {
    const targetArr = isFolderCtx ? config.items[currentFolderIndex].items : config.items;
    targetArr[index][key] = checkbox.checked;

    // Refresh to show/hide password fields if needed
    const containerId = isFolderCtx ? 'folder-links-container' : 'admin-links-container';
    renderItems(targetArr, containerId, isFolderCtx);
    setTimeout(() => toggleItem(index, isFolderCtx ? 'f' : 'm'), 10); // Keep expanded
}

window.openFolderManage = function (index, e) {
    if (e) e.stopPropagation();
    currentFolderIndex = index;
    const folder = config.items[index];
    if (!folder.items) folder.items = [];

    document.getElementById('folder-modal').classList.remove('hidden');
    renderItems(folder.items, 'folder-links-container', true);
}


function renderItems(itemsArr, containerId, isFolderCtx) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!itemsArr || itemsArr.length === 0) {
        container.innerHTML = '<div class="loading">No items here yet.</div>';
        return;
    }

    itemsArr.forEach((item, index) => {
        const acc = document.createElement('div');
        acc.className = 'item-accordion';
        // Use namespaced IDs to avoid collisions between main list and folder list
        const accPrefix = isFolderCtx ? 'f' : 'm';
        acc.id = `${accPrefix}-item-acc-${index}`;

        // Context str for eval
        const ctxStr = isFolderCtx ? 'true' : 'false';
        // Quoted prefix string for use inside onclick strings
        const pfx = `'${accPrefix}'`;

        let iconHtml = ''; let titleTxt = ''; let subTxt = '';

        if (item.type === 'profile') {
            iconHtml = '<i class="fas fa-user-circle"></i>'; titleTxt = 'Profile Block'; subTxt = item.url;
        } else if (item.type === 'link') {
            iconHtml = `<i class="${item.icon || 'fas fa-link'}"></i>`; titleTxt = item.title; subTxt = item.isProtected ? '🔒 Protected URL' : item.url;
        } else if (item.type === 'text') {
            iconHtml = '<i class="fas fa-align-left"></i>'; titleTxt = item.content; subTxt = 'Style: ' + item.style;
        } else if (item.type === 'divider') {
            iconHtml = '<i class="fas fa-minus"></i>'; titleTxt = 'Divider'; subTxt = item.style || 'solid';
        } else if (item.type === 'folder') {
            iconHtml = `<i class="${item.icon || 'fas fa-folder'}"></i>`; titleTxt = item.title; subTxt = item.isProtected ? '🔒 Protected Folder' : `${item.items ? item.items.length : 0} items`;
        }

        let formHtml = '';

        if (item.type === 'profile') {
            const profUrl = item.url || 'https://ui-avatars.com/api/?name=?&background=3b82f6&color=fff';
            formHtml = `
                <!-- Profile Preview Area -->
                <div style="border-radius: 12px; overflow: hidden; background: ${item.bgColor || '#e2e8f0'}; position:relative; min-height: 120px; margin-bottom: 1.5rem;">
                    <div style="width:100%; height: 120px; background: ${item.bgColor || '#e2e8f0'};"></div>
                    <div style="position:absolute; bottom: -36px; left: 50%; transform: translateX(-50%)">
                        <img src="${profUrl}" alt="Profile" style="
                            width: 80px; height: 80px;
                            border-radius: ${item.style === 'frameless' ? '0' : '50%'};
                            border: 3px solid white;
                            object-fit: cover;
                            background: #94a3b8;
                        " onerror="this.src='https://ui-avatars.com/api/?name=?&background=94a3b8&color=fff'">
                    </div>
                </div>
                <div style="margin-top: 42px;"></div>

                <!-- Section: Profile Image -->
                <div style="background: var(--surface-2); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="font-size:0.75rem; font-weight:600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem;">Profile Image</div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" class="form-group-input" value="${escapeHtml(item.url || '')}" oninput="bindData(${index}, 'url', this.value, ${ctxStr})">
                    </div>
                    <div class="form-group">
                        <label>Upload Photo</label>
                        <div class="upload-flex">
                            <input type="file" id="prof-file-${index}" accept="image/*">
                            <button type="button" class="btn btn-secondary" onclick="uploadFile('prof-file-${index}', 'null', (url) => { bindData(${index}, 'url', url, ${ctxStr}); renderItems(${ctxStr} ? config.items[currentFolderIndex].items : config.items, '${containerId}', ${ctxStr}); setTimeout(()=>toggleItem(${index},${pfx}), 10); })">Upload</button>
                        </div>
                    </div>
                </div>

                <!-- Section: Profile Style & Banner -->
                <div style="background: var(--surface-2); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                    <div class="form-section-label" style="margin-bottom:0.75rem;">Display Style</div>
                    <div style="display: flex; gap: 1rem; flex-wrap:wrap; margin-bottom:1rem;">
                        <div style="flex:1;min-width:140px;">
                            <label>Photo Style</label>
                            <select class="form-select" onchange="bindData(${index}, 'style', this.value, ${ctxStr})">
                                <option value="framed" ${item.style === 'framed' ? 'selected' : ''}>Framed (Round)</option>
                                <option value="frameless" ${item.style === 'frameless' ? 'selected' : ''}>Frameless (Square)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Banner Color & Opacity -->
                    <div class="form-section-label" style="margin-bottom:0.4rem;"><i class="fas fa-image" style="font-size:0.65rem;"></i> Banner</div>
                    <div style="display:flex;gap:0.75rem;align-items:flex-end;flex-wrap:wrap;margin-bottom:0.75rem;">
                        <div>
                            <div class="form-section-label">Color</div>
                            <input type="color" value="${item.bannerColor || item.bgColor || '#3b82f6'}" oninput="bindData(${index},'bannerColor',this.value,${ctxStr})" style="width:46px;height:38px;">
                        </div>
                        <div style="flex:1;min-width:100px;">
                            <div class="form-section-label">Opacity (${Math.round((item.bannerOpacity ?? 1) * 100)}%)</div>
                            <input type="range" min="0" max="1" step="0.05" value="${item.bannerOpacity ?? 1}"
                                oninput="bindData(${index},'bannerOpacity',parseFloat(this.value),${ctxStr}); this.previousElementSibling.textContent='Opacity ('+Math.round(this.value*100)+'%)';"
                                style="width:100%;">
                        </div>
                    </div>

                    <!-- Banner Image -->
                    <div style="margin-bottom:0.5rem;">
                        <label>Banner Image URL</label>
                        <input type="text" class="form-group-input" value="${escapeHtml(item.bannerImage || '')}" placeholder="https://... (optional)"
                            oninput="bindData(${index},'bannerImage',this.value,${ctxStr})">
                    </div>
                    <div>
                        <label>Image Fit Mode</label>
                        <select class="form-select" onchange="bindData(${index},'bannerFit',this.value,${ctxStr})">
                            <option value="cover" ${(!item.bannerFit || item.bannerFit === 'cover') ? 'selected' : ''}>Fill (cover)</option>
                            <option value="contain" ${item.bannerFit === 'contain' ? 'selected' : ''}>Fit (contain)</option>
                            <option value="repeat" ${item.bannerFit === 'repeat' ? 'selected' : ''}>Tile (repeat)</option>
                        </select>
                    </div>
                </div>

                <!-- Section: Name & Bio -->
                <div style="background: var(--surface-2); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                    <div class="form-section-label" style="margin-bottom:0.75rem;">Profile Name</div>
                    <div style="display:flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap:wrap;">
                        <button type="button" class="editor-btn ${item.nameBold ? 'active' : ''}" onclick="bindData(${index}, 'nameBold', !${!!item.nameBold}, ${ctxStr}); renderItems(${ctxStr} ? config.items[currentFolderIndex].items : config.items, '${containerId}', ${ctxStr}); setTimeout(()=>toggleItem(${index}), 10);"><b>B</b></button>
                        <button type="button" class="editor-btn ${item.nameItalic ? 'active' : ''}" onclick="bindData(${index}, 'nameItalic', !${!!item.nameItalic}, ${ctxStr}); renderItems(${ctxStr} ? config.items[currentFolderIndex].items : config.items, '${containerId}', ${ctxStr}); setTimeout(()=>toggleItem(${index}), 10);"><i>I</i></button>
                        <select class="form-select" style="width:auto;" onchange="bindData(${index}, 'nameFontSize', this.value, ${ctxStr})">
                            <option value="" ${!item.nameFontSize ? 'selected' : ''}>Default</option>
                            <option value="1rem" ${item.nameFontSize === '1rem' ? 'selected' : ''}>Normal</option>
                            <option value="1.5rem" ${item.nameFontSize === '1.5rem' ? 'selected' : ''}>Large</option>
                            <option value="2rem" ${item.nameFontSize === '2rem' ? 'selected' : ''}>X-Large</option>
                        </select>
                        <input type="color" value="${item.nameColor || '#f8fafc'}" oninput="bindData(${index}, 'nameColor', this.value, ${ctxStr})" style="width:36px;height:32px;flex-shrink:0;" title="Name Color">
                        <input type="color" value="${item.nameShadowColor || '#000000'}" oninput="bindData(${index},'nameShadowColor',this.value,${ctxStr})" style="width:36px;height:32px;flex-shrink:0;" title="Shadow Color">
                        <input type="range" min="0" max="1" step="0.05" value="${item.nameShadowOpacity || 0.4}" title="Shadow Opacity"
                            oninput="bindData(${index},'nameShadowOpacity',parseFloat(this.value),${ctxStr})" style="width:60px;flex-shrink:0;">
                        <select class="form-select" style="width:auto;" onchange="bindData(${index},'nameShadowDir',this.value,${ctxStr})" title="Shadow Direction">
                            <option value="none" ${(!item.nameShadowDir || item.nameShadowDir === 'none') ? 'selected' : ''}>No Shadow</option>
                            <option value="bottom" ${item.nameShadowDir === 'bottom' ? 'selected' : ''}>↓</option>
                            <option value="top" ${item.nameShadowDir === 'top' ? 'selected' : ''}>↑</option>
                            <option value="center" ${item.nameShadowDir === 'center' ? 'selected' : ''}>✦ Glow</option>
                        </select>
                    </div>
                    <input type="text" class="form-group-input" value="${escapeHtml(item.name || '')}" placeholder="Display name..." oninput="bindData(${index}, 'name', this.value, ${ctxStr})">
                </div>

                <!-- Section: Bio/Description -->
                <div style="background: var(--surface-2); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                    <div class="form-section-label" style="margin-bottom:0.75rem;">Profile Bio / Role</div>
                    <div style="display:flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap:wrap;">
                        <button type="button" class="editor-btn ${item.bioBold ? 'active' : ''}" onclick="bindData(${index}, 'bioBold', !${!!item.bioBold}, ${ctxStr}); renderItems(${ctxStr} ? config.items[currentFolderIndex].items : config.items, '${containerId}', ${ctxStr}); setTimeout(()=>toggleItem(${index}), 10);"><b>B</b></button>
                        <button type="button" class="editor-btn ${item.bioItalic ? 'active' : ''}" onclick="bindData(${index}, 'bioItalic', !${!!item.bioItalic}, ${ctxStr}); renderItems(${ctxStr} ? config.items[currentFolderIndex].items : config.items, '${containerId}', ${ctxStr}); setTimeout(()=>toggleItem(${index}), 10);"><i>I</i></button>
                        <input type="color" value="${item.bioColor || '#94a3b8'}" oninput="bindData(${index}, 'bioColor', this.value, ${ctxStr})" style="width:36px;height:32px;flex-shrink:0;" title="Bio Color">
                        <input type="color" value="${item.bioShadowColor || '#000000'}" oninput="bindData(${index},'bioShadowColor',this.value,${ctxStr})" style="width:36px;height:32px;flex-shrink:0;" title="Shadow Color">
                        <input type="range" min="0" max="1" step="0.05" value="${item.bioShadowOpacity || 0.4}" title="Shadow Opacity"
                            oninput="bindData(${index},'bioShadowOpacity',parseFloat(this.value),${ctxStr})" style="width:60px;flex-shrink:0;">
                        <select class="form-select" style="width:auto;" onchange="bindData(${index},'bioShadowDir',this.value,${ctxStr})" title="Shadow Direction">
                            <option value="none" ${(!item.bioShadowDir || item.bioShadowDir === 'none') ? 'selected' : ''}>No Shadow</option>
                            <option value="bottom" ${item.bioShadowDir === 'bottom' ? 'selected' : ''}>↓</option>
                            <option value="top" ${item.bioShadowDir === 'top' ? 'selected' : ''}>↑</option>
                            <option value="center" ${item.bioShadowDir === 'center' ? 'selected' : ''}>✦ Glow</option>
                        </select>
                    </div>
                    <input type="text" class="form-group-input" value="${escapeHtml(item.bio || '')}" placeholder="e.g. Web Developer..." oninput="bindData(${index}, 'bio', this.value, ${ctxStr})">
                </div>
            `;
        } else if (item.type === 'link' || item.type === 'folder') {
            const isFolder = item.type === 'folder';

            formHtml = `
                <!-- Main editing card (white/card bg) -->
                <div style="background:var(--card-bg,#fff); border:1px solid var(--border-color); border-radius:14px; padding:1rem; margin-bottom:1rem;">

                    <!-- Row: Icon square + Title editor  -->
                    <div style="display:flex; gap:0.75rem; align-items:flex-start; margin-bottom:0.75rem;">
                        <!-- Clickable icon box -->
                        <div onclick="openIconPicker(${index}, ${ctxStr})" title="Click to change icon"
                             style="flex-shrink:0; width:64px; height:64px; border-radius:12px;
                                    background:${item.btnBgColor || 'rgba(99,102,241,0.15)'};
                                    display:flex; align-items:center; justify-content:center;
                                    font-size:1.75rem; color:${item.btnTextColor || 'var(--accent)'};
                                    cursor:pointer; position:relative; border:1.5px dashed var(--border-color);">
                            <i class="${item.icon || 'fas fa-link'}"></i>
                            <span style="position:absolute;bottom:2px;right:3px;font-size:0.55rem;
                                         background:rgba(0,0,0,0.4);color:#fff;padding:1px 4px;border-radius:3px;">icon</span>
                        </div>

                        <!-- Title section -->
                        <div style="flex:1;">
                            <!-- Title toolbar -->
                            <div style="display:flex; align-items:center; gap:4px; margin-bottom:5px;
                                        background:var(--surface-2); border-radius:8px; padding:3px 6px;">
                                <span style="font-size:0.7rem;color:var(--text-secondary);margin-right:4px;font-weight:600;">TITLE</span>
                                <button type="button" class="editor-btn ${item.titleBold ? 'active' : ''}"
                                    onclick="bindData(${index},'titleBold',!${!!item.titleBold},${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                    <b>B</b></button>
                                <button type="button" class="editor-btn ${item.titleItalic ? 'active' : ''}"
                                    onclick="bindData(${index},'titleItalic',!${!!item.titleItalic},${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                    <i>I</i></button>
                                <div style="width:1px;height:18px;background:var(--border-color);margin:0 2px;"></div>
                                <button type="button" class="editor-btn ${item.titleAlign === 'left' ? 'active' : ''}"
                                    onclick="bindData(${index},'titleAlign','left',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                    <i class="fas fa-align-left"></i></button>
                                <button type="button" class="editor-btn ${(!item.titleAlign || item.titleAlign === 'center') ? 'active' : ''}"
                                    onclick="bindData(${index},'titleAlign','center',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                    <i class="fas fa-align-center"></i></button>
                                <button type="button" class="editor-btn ${item.titleAlign === 'right' ? 'active' : ''}"
                                    onclick="bindData(${index},'titleAlign','right',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                    <i class="fas fa-align-right"></i></button>
                            </div>
                            <div style="display:flex;gap:6px;align-items:center;margin-top:4px;">
                                <input type="color" value="${item.titleColor || '#1e293b'}" title="Title Text Color"
                                    oninput="bindData(${index},'titleColor',this.value,${ctxStr})" style="width:36px;height:32px;">
                                <input type="text" class="form-group-input" value="${escapeHtml(item.title || '')}"
                                    style="flex:1;${item.titleBold ? 'font-weight:700;' : ''}${item.titleItalic ? 'font-style:italic;' : ''}"
                                    placeholder="Button title..." oninput="bindData(${index},'title',this.value,${ctxStr})">
                            </div>
                        </div>
                    </div>

                    <!-- URL row -->
                    ${!isFolder ? `
                    <div class="form-group" style="margin-bottom:0.75rem;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:var(--text-secondary);font-size:0.9rem;"><i class="fas fa-link"></i></span>
                            <input type="url" value="${escapeHtml(item.url || '')}" placeholder="https://..." 
                                style="flex:1;" class="form-group-input"
                                oninput="bindData(${index},'url',this.value,${ctxStr})">
                        </div>
                    </div>
                    ` : `
                    <button class="btn btn-primary" style="width:100%; justify-content:center; margin-bottom:0.75rem;"
                        onclick="openFolderManage(${index}, event)"><i class="fas fa-folder-open"></i> Manage Folder Contents</button>
                    `}

                    <!-- Description section with its own toolbar -->
                    <div style="background:var(--surface-2); border-radius:10px; padding:0.75rem;">
                        <div style="display:flex; align-items:center; gap:4px; margin-bottom:5px;">
                            <span style="font-size:0.7rem;color:var(--text-secondary);margin-right:4px;font-weight:600;">DESCRIPTION</span>
                            <button type="button" class="editor-btn ${item.descBold ? 'active' : ''}"
                                onclick="bindData(${index},'descBold',!${!!item.descBold},${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                <b>B</b></button>
                            <button type="button" class="editor-btn ${item.descItalic ? 'active' : ''}"
                                onclick="bindData(${index},'descItalic',!${!!item.descItalic},${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                <i>I</i></button>
                            <div style="width:1px;height:18px;background:var(--border-color);margin:0 2px;"></div>
                            <button type="button" class="editor-btn ${item.descAlign === 'left' ? 'active' : ''}"
                                onclick="bindData(${index},'descAlign','left',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                <i class="fas fa-align-left"></i></button>
                            <button type="button" class="editor-btn ${(!item.descAlign || item.descAlign === 'center') ? 'active' : ''}"
                                onclick="bindData(${index},'descAlign','center',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index}),10);">
                                <i class="fas fa-align-center"></i></button>
                            <button type="button" class="editor-btn ${item.descAlign === 'right' ? 'active' : ''}"
                                onclick="bindData(${index},'descAlign','right',${ctxStr});renderItems(${ctxStr}?config.items[currentFolderIndex].items:config.items,'${containerId}',${ctxStr});setTimeout(()=>toggleItem(${index},${pfx}),10);">
                                <i class="fas fa-align-right"></i></button>
                            <input type="color" value="${item.descColor || '#64748b'}" title="Description Text Color"
                                oninput="bindData(${index},'descColor',this.value,${ctxStr})" style="width:36px;height:32px;">
                        </div>
                        <input type="text" class="form-group-input" value="${escapeHtml(item.description || '')}"
                            style="flex:1;${item.descBold ? 'font-weight:700;' : ''}${item.descItalic ? 'font-style:italic;' : ''}"
                            placeholder="Subtitle / description (optional)..."
                            oninput="bindData(${index},'description',this.value,${ctxStr})">
                    </div>
                </div>

                <!-- Button Color & Animation row -->
                <div style="display:flex; align-items:flex-end; gap:1rem; background:var(--surface-2); border-radius:12px; padding:0.85rem 1rem; margin-bottom:1rem; flex-wrap:wrap;">
                    <div>
                        <div class="form-section-label">Button Color</div>
                        <input type="color" value="${item.btnBgColor || '#1e293b'}" oninput="bindData(${index},'btnBgColor',this.value,${ctxStr})" style="width:46px;height:38px;cursor:pointer;">
                    </div>
                    <div style="flex:1;min-width:180px;">
                        <div class="form-section-label">Custom BG (RGBA / Hex)</div>
                        <input type="text" class="form-group-input" value="${item.btnBgColor || ''}" placeholder="e.g. rgba(59,130,246,0.8)"
                            oninput="bindData(${index},'btnBgColor',this.value,${ctxStr})">
                    </div>
                    <div>
                        <div class="form-section-label">Animation</div>
                        <select class="form-select" onchange="bindData(${index},'animation',this.value,${ctxStr})" style="width:auto;">
                            <option value="" ${!item.animation ? 'selected' : ''}>None</option>
                            <option value="bounce" ${item.animation === 'bounce' ? 'selected' : ''}>Bounce</option>
                            <option value="shake" ${item.animation === 'shake' ? 'selected' : ''}>Shake</option>
                        </select>
                    </div>
                </div>

                <!-- Title Shadow row -->
                <div style="background:var(--surface-2); border-radius:12px; padding:0.75rem 1rem; margin-bottom:0.75rem;">
                    <div class="form-section-label" style="margin-bottom:0.5rem;"><i class="fas fa-sun" style="font-size:0.65rem;"></i> Title Shadow</div>
                    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                        <input type="color" value="${item.titleShadowColor || '#000000'}" title="Shadow Color"
                            oninput="bindData(${index},'titleShadowColor',this.value,${ctxStr})" style="width:36px;height:32px;flex-shrink:0;">
                        <input type="range" min="0" max="1" step="0.05" value="${item.titleShadowOpacity || 0.4}"
                            oninput="bindData(${index},'titleShadowOpacity',parseFloat(this.value),${ctxStr})"
                            style="flex:1;min-width:80px;" title="Opacity">
                        <select class="form-select" style="width:auto;flex-shrink:0;"
                            onchange="bindData(${index},'titleShadowDir',this.value,${ctxStr})">
                            <option value="none" ${(!item.titleShadowDir || item.titleShadowDir === 'none') ? 'selected' : ''}>None</option>
                            <option value="bottom" ${item.titleShadowDir === 'bottom' ? 'selected' : ''}>↓ Down</option>
                            <option value="top" ${item.titleShadowDir === 'top' ? 'selected' : ''}>↑ Up</option>
                            <option value="left" ${item.titleShadowDir === 'left' ? 'selected' : ''}>← Left</option>
                            <option value="right" ${item.titleShadowDir === 'right' ? 'selected' : ''}>→ Right</option>
                            <option value="center" ${item.titleShadowDir === 'center' ? 'selected' : ''}>✦ Glow</option>
                        </select>
                    </div>
                </div>

                <!-- Desc Shadow row -->
                <div style="background:var(--surface-2); border-radius:12px; padding:0.75rem 1rem; margin-bottom:1rem;">
                    <div class="form-section-label" style="margin-bottom:0.5rem;"><i class="fas fa-sun" style="font-size:0.65rem;"></i> Description Shadow</div>
                    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                        <input type="color" value="${item.descShadowColor || '#000000'}" title="Shadow Color"
                            oninput="bindData(${index},'descShadowColor',this.value,${ctxStr})" style="width:36px;height:32px;flex-shrink:0;">
                        <input type="range" min="0" max="1" step="0.05" value="${item.descShadowOpacity || 0.4}"
                            oninput="bindData(${index},'descShadowOpacity',parseFloat(this.value),${ctxStr})"
                            style="flex:1;min-width:80px;" title="Opacity">
                        <select class="form-select" style="width:auto;flex-shrink:0;"
                            onchange="bindData(${index},'descShadowDir',this.value,${ctxStr})">
                            <option value="none" ${(!item.descShadowDir || item.descShadowDir === 'none') ? 'selected' : ''}>None</option>
                            <option value="bottom" ${item.descShadowDir === 'bottom' ? 'selected' : ''}>↓ Down</option>
                            <option value="top" ${item.descShadowDir === 'top' ? 'selected' : ''}>↑ Up</option>
                            <option value="left" ${item.descShadowDir === 'left' ? 'selected' : ''}>← Left</option>
                            <option value="right" ${item.descShadowDir === 'right' ? 'selected' : ''}>→ Right</option>
                            <option value="center" ${item.descShadowDir === 'center' ? 'selected' : ''}>✦ Glow</option>
                        </select>
                    </div>
                </div>

                <!-- Password Protection -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); border-radius:12px; padding:0.85rem 1rem; margin-bottom:${item.isProtected ? '0.5' : '0'}rem;">
                    <div>
                        <strong style="color:var(--text-primary);font-size:0.9rem;"><i class="fas fa-lock" style="color:#f59e0b"></i> Require Password?</strong>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:1px;">Visitors must enter a password to access this.</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" ${item.isProtected ? 'checked' : ''} onchange="bindToggleData(${index}, 'isProtected', this, ${ctxStr})">
                        <span class="slider"></span>
                    </label>
                </div>
                ${item.isProtected ? `
                <div style="padding: 0.75rem 1rem; border-radius: 0 0 12px 12px; border:1px solid #fcd34d; border-top:none; background:rgba(251,191,36,0.05); margin-bottom:0.5rem;">
                    <input type="text" class="form-group-input" value="${escapeHtml(item.password || '')}" placeholder="Set a secret password..."
                        oninput="bindData(${index},'password',this.value,${ctxStr})">
                    <p style="font-size:0.7rem;color:#b45309;margin:0.4rem 0 0;"><i class="fas fa-shield-alt"></i> AES-256 encrypted. Click Save to re-encrypt with new password.</p>
                </div>
                ` : ''}
            `;
        } else if (item.type === 'text') {
            formHtml = `
                <div class="form-group">
                    <label>Text Content</label>
                    <input type="text" class="form-group-input" value="${escapeHtml(item.content)}" oninput="bindData(${index}, 'content', this.value, ${ctxStr})">
                </div>
                <div class="form-group">
                    <label>Style</label>
                    <select class="form-select" onchange="bindData(${index}, 'style', this.value, ${ctxStr})">
                        <option value="heading" ${item.style === 'heading' ? 'selected' : ''}>Heading (Large)</option>
                        <option value="paragraph" ${item.style === 'paragraph' ? 'selected' : ''}>Paragraph (Small)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Alignment</label>
                    <select class="form-select" onchange="bindData(${index}, 'textAlign', this.value, ${ctxStr})">
                        <option value="left" ${item.textAlign === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${!item.textAlign || item.textAlign === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${item.textAlign === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Text Color</label>
                    <input type="color" value="${item.textColor || '#f8fafc'}" oninput="bindData(${index}, 'textColor', this.value, ${ctxStr})" style="width: 100px; height: 40px;">
                </div>
                <div class="form-group">
                    <label>Theme Font Size</label>
                    <select class="form-select" onchange="bindData(${index}, 'fontSize', this.value, ${ctxStr})">
                        <option value="" ${!item.fontSize ? 'selected' : ''}>Default CSS Theme</option>
                        <option value="0.875rem" ${item.fontSize === '0.875rem' ? 'selected' : ''}>Small</option>
                        <option value="1.25rem" ${item.fontSize === '1.25rem' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Theme Font Weight</label>
                    <select class="form-select" onchange="bindData(${index}, 'fontWeight', this.value, ${ctxStr})">
                        <option value="" ${!item.fontWeight ? 'selected' : ''}>Default CSS Theme</option>
                        <option value="400" ${item.fontWeight === '400' ? 'selected' : ''}>Normal / Regular</option>
                        <option value="600" ${item.fontWeight === '600' ? 'selected' : ''}>Semi Bold</option>
                    </select>
                </div>
            `;
        } else if (item.type === 'divider') {
            formHtml = `
                <div class="form-group">
                    <label>Style</label>
                    <select class="form-select" onchange="bindData(${index}, 'style', this.value, ${ctxStr})">
                        <option value="solid" ${item.style === 'solid' ? 'selected' : ''}>Solid</option>
                        <option value="dashed" ${item.style === 'dashed' ? 'selected' : ''}>Dashed</option>
                        <option value="dotted" ${item.style === 'dotted' ? 'selected' : ''}>Dotted</option>
                        <option value="double" ${item.style === 'double' ? 'selected' : ''}>Double Line</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" value="${item.color || '#e2e8f0'}" oninput="bindData(${index}, 'color', this.value, ${ctxStr})">
                </div>
                <div class="form-group">
                    <label>Thickness (px)</label>
                    <input type="range" min="1" max="10" value="${item.thickness || 1}" oninput="bindData(${index}, 'thickness', this.value, ${ctxStr})" style="width:100%;">
                </div>
             `;
        }

        acc.innerHTML = `
                    <div class="item-header" onclick="toggleItem(${index},${pfx})">
                        <div class="item-drag-handle"><i class="fas fa-grip-vertical"></i></div>
                        <div class="item-preview">
                            <div class="item-preview-icon">${iconHtml}</div>
                            <div class="item-preview-text">
                                <div class="item-preview-title">${escapeHtml(titleTxt)}</div>
                                <div class="item-preview-sub">${escapeHtml(subTxt)}</div>
                            </div>
                        </div>
                        <div class="item-controls">
                            <button type="button" class="btn-icon" onclick="moveItem(${index}, -1, event, ${ctxStr})" ${index === 0 ? 'disabled style="opacity:0.3"' : ''} title="Move Up"><i class="fas fa-arrow-up"></i></button>
                            <button type="button" class="btn-icon" onclick="moveItem(${index}, 1, event, ${ctxStr})" ${index === itemsArr.length - 1 ? 'disabled style="opacity:0.3"' : ''} title="Move Down"><i class="fas fa-arrow-down"></i></button>
                            <button type="button" class="btn-icon" onclick="duplicateItem(${index}, event, ${ctxStr})" title="Duplicate"><i class="fas fa-copy"></i></button>
                            <button type="button" class="btn-icon danger" onclick="deleteItem(${index}, event, ${ctxStr})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                            <i class="fas fa-chevron-down" style="color:#cbd5e1; margin-left: 0.5rem;"></i>
                        </div>
                    </div>
                    <div class="item-body">
                        ${formHtml}
                    </div>
                    `;
        container.appendChild(acc);
    });
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type}`;
    setTimeout(() => t.className = 'toast hidden', 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] || m));
}
