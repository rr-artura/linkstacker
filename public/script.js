// public/script.js

let config = null;
let pageHistory = []; // Stack to keep track of folder navigation ([ {items: [], title: ""} ])

// Build a CSS text-shadow string from stored config fields
function buildTextShadow(color, opacity, dir) {
    if (!color || dir === 'none') return null;
    const c = color || '#000000';
    const o = opacity !== undefined ? parseFloat(opacity) : 0.4;
    // Convert hex to rgba
    const hex = c.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0, g = parseInt(hex.substring(2, 4), 16) || 0, b = parseInt(hex.substring(4, 6), 16) || 0;
    const rgba = `rgba(${r},${g},${b},${o})`;
    const offsets = { top: '0 -2px 4px', bottom: '0 2px 4px', left: '-2px 0 4px', right: '2px 0 4px', center: '0 0 6px' };
    const offset = offsets[dir || 'bottom'] || '0 2px 4px';
    return `${offset} ${rgba}`;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
});

async function fetchConfig() {
    try {
        const cacheBust = `?v=${Date.now()}`;
        let response;
        try { response = await fetch('/data/config.json' + cacheBust); }
        catch (e) { response = { ok: false }; }

        // Fallback for local dev - use public-config endpoint (NOT /api/config which is private)
        if (!response.ok) {
            try { response = await fetch('http://localhost:8080/api/public-config' + cacheBust); }
            catch (e) { throw new Error("Could not load config."); }
        }

        if (!response.ok) throw new Error("HTTP " + response.status);

        config = await response.json();
        applyGlobalSettings();

        // Push root to history
        pageHistory.push({ items: config.items, title: "Home" });
        renderCurrentPage();
    } catch (error) {
        console.error(error);
        document.getElementById('links-container').innerHTML =
            '<div class="error-state"><i class="fas fa-exclamation-triangle fa-2x"></i><p>Unable to load links at the moment.</p></div>';
    }
}

function applyGlobalSettings() {
    if (!config || !config.settings) return;
    const s = config.settings;

    // Title & Favicon
    if (s.siteTitle) document.title = s.siteTitle;
    if (s.favicon) document.getElementById('dynamic-favicon').href = resolveUrl(s.favicon);

    // Background
    const body = document.getElementById('dynamic-body');
    const presetBg = document.getElementById('bg-preset');

    // Reset background classes
    body.className = '';
    presetBg.style.display = 'none';
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = 'var(--bg-base)';

    if (s.background) {
        if (s.background.type === 'preset') {
            if (s.background.value === 'blob-animation') {
                presetBg.style.display = 'block';
            } else {
                body.classList.add(`bg-${s.background.value}`);
            }
        } else if (s.background.type === 'color') {
            body.style.backgroundColor = s.background.value;
        } else if (s.background.type === 'gradient') {
            const parts = (s.background.value || '').split(',');
            if (parts.length === 2) {
                body.style.backgroundImage = `linear-gradient(135deg, ${parts[0]}, ${parts[1]})`;
            }
        } else if (s.background.type === 'url' || s.background.type === 'upload') {
            body.style.backgroundImage = `url('${resolveUrl(s.background.value)}')`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundAttachment = 'fixed';
        }
    }

    // Footer
    if (s.footer) {
        const footerBranding = document.getElementById('footer-branding');
        if (s.footer.text) footerBranding.textContent = s.footer.text;
        if (s.footer.url) footerBranding.href = resolveUrl(s.footer.url);
        if (s.footer.color) footerBranding.style.color = s.footer.color;
    }
}

function resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('/uploads') && window.location.port === '3000') {
        return `http://localhost:8080${url}`;
    }
    return url;
}

// ---- RENDERING ENGINE ----
function renderCurrentPage() {
    const parent = document.getElementById('links-container');
    parent.innerHTML = '';

    const currentPage = pageHistory[pageHistory.length - 1];
    const items = currentPage.items;

    if (!items || items.length === 0) {
        parent.innerHTML = '<p style="text-align:center; color:var(--text-secondary)">No items found.</p>';
        // Still render back button if not root
        if (pageHistory.length > 1) {
            parent.prepend(createBackButton());
        }
        return;
    }

    // Add back button if we are in a sub-folder
    if (pageHistory.length > 1) {
        parent.appendChild(createBackButton());
    }

    items.forEach((item, index) => {
        const el = createItemElement(item, index);
        if (el) parent.appendChild(el);
    });

    // Scroll to top smoothly on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createBackButton() {
    const btn = document.createElement('button');
    btn.className = 'btn-paginate';
    btn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
    btn.style.marginBottom = '1rem';
    btn.onclick = () => {
        pageHistory.pop();
        renderCurrentPage();
    };
    return btn;
}

function createItemElement(item, index) {
    let animDelay = `${(index * 0.05)}s`;

    if (item.type === 'profile') {
        const div = document.createElement('div');
        div.className = 'profile-section';
        div.style.animationDelay = animDelay;

        // ── Banner (behind everything) ──
        const hasBanner = item.bannerColor || item.bannerImage || item.bgColor;
        if (hasBanner) {
            const banner = document.createElement('div');
            banner.className = 'profile-banner';

            // Background image
            if (item.bannerImage) {
                const fit = item.bannerFit || 'cover';
                if (fit === 'repeat') {
                    banner.style.backgroundImage = `url(${resolveUrl(item.bannerImage)})`;
                    banner.style.backgroundRepeat = 'repeat';
                    banner.style.backgroundSize = 'auto';
                } else {
                    banner.style.backgroundImage = `url(${resolveUrl(item.bannerImage)})`;
                    banner.style.backgroundRepeat = 'no-repeat';
                    banner.style.backgroundPosition = 'center';
                    banner.style.backgroundSize = fit === 'contain' ? 'contain' : 'cover';
                }
            }

            // Solid color with opacity overlay
            const color = item.bannerColor || item.bgColor || '#3b82f6';
            const opacity = item.bannerOpacity !== undefined ? item.bannerOpacity : 1;
            if (!item.bannerImage) {
                banner.style.backgroundColor = color;
                banner.style.opacity = opacity;
            } else if (color && color !== '#000000') {
                // Color overlay on top of image
                banner.style.backgroundColor = color;
                banner.style.mixBlendMode = 'multiply';
                banner.style.opacity = opacity;
            }

            div.appendChild(banner);
        }

        // ── Profile photo ──
        const container = document.createElement('div');
        container.className = `profile-image-container ${item.style || 'framed'}`;
        container.style.marginTop = hasBanner ? '2rem' : '0';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const img = document.createElement('img');
        img.src = resolveUrl(item.url || '');
        img.alt = 'Profile';
        img.className = 'profile-image';
        container.appendChild(img);
        div.appendChild(container);

        // ── Name ──
        if (item.name) {
            const nameEl = document.createElement('div');
            nameEl.textContent = item.name;
            const nameShadow = buildTextShadow(item.nameShadowColor, item.nameShadowOpacity, item.nameShadowDir);
            nameEl.style.cssText = `
                position: relative; z-index: 1;
                text-align: center; margin-top: 0.75rem;
                font-size: ${item.nameFontSize || '1.25rem'};
                font-weight: ${item.nameBold ? '700' : '500'};
                font-style: ${item.nameItalic ? 'italic' : 'normal'};
                color: ${item.nameColor || 'var(--text-primary)'};
                ${nameShadow ? `text-shadow: ${nameShadow};` : ''}
            `;
            div.appendChild(nameEl);
        }

        // ── Bio ──
        if (item.bio) {
            const bioEl = document.createElement('div');
            bioEl.textContent = item.bio;
            const bioShadow = buildTextShadow(item.bioShadowColor, item.bioShadowOpacity, item.bioShadowDir);
            bioEl.style.cssText = `
                position: relative; z-index: 1;
                text-align: center; margin-top: 0.25rem;
                font-size: 0.9rem;
                font-weight: ${item.bioBold ? '700' : '400'};
                font-style: ${item.bioItalic ? 'italic' : 'normal'};
                color: ${item.bioColor || 'var(--text-secondary)'};
                ${bioShadow ? `text-shadow: ${bioShadow};` : ''}
            `;
            div.appendChild(bioEl);
        }

        return div;
    }

    if (item.type === 'link' || item.type === 'folder') {
        const isFolder = item.type === 'folder';
        const a = document.createElement('a');

        a.className = 'link-item';
        a.style.animationDelay = animDelay;
        a.style.cursor = 'pointer';

        if (item.animation === 'bounce') a.classList.add('anim-bounce');
        if (item.animation === 'shake') a.classList.add('anim-shake');

        if (item.btnBgColor) {
            a.style.background = item.btnBgColor;
            a.style.borderColor = 'transparent';
        }

        const tc = item.btnTextColor || '';
        const iconHtml = item.icon ? `<div class="link-icon" ${tc ? `style="color:${tc}"` : ''}><i class="${item.icon}"></i></div>` : '';
        const descStyle = [
            item.descColor ? `color:${item.descColor}` : (tc ? `color:${tc}; opacity:0.9` : ''),
            item.descBold ? 'font-weight:700' : '',
            item.descItalic ? 'font-style:italic' : '',
            item.descAlign ? `text-align:${item.descAlign}` : '',
        ].filter(Boolean).join(';');
        const descHtml = item.description ? `<div class="link-desc" ${descStyle ? `style="${descStyle}"` : ''}>${escapeHtml(item.description)}</div>` : '';
        const alignStyle = (!item.icon && !item.description) ? 'align-items: center;' : '';
        const titleStyle = [
            item.titleColor ? `color:${item.titleColor}` : (tc ? `color:${tc}` : ''),
            item.titleBold ? 'font-weight:700' : '',
            item.titleItalic ? 'font-style:italic' : '',
            item.titleAlign ? `text-align:${item.titleAlign}` : '',
            buildTextShadow(item.titleShadowColor, item.titleShadowOpacity, item.titleShadowDir) ?
                `text-shadow:${buildTextShadow(item.titleShadowColor, item.titleShadowOpacity, item.titleShadowDir)}` : '',
        ].filter(Boolean).join(';');

        const descStyle2 = [...descStyle.split(';'),
        buildTextShadow(item.descShadowColor, item.descShadowOpacity, item.descShadowDir) ?
            `text-shadow:${buildTextShadow(item.descShadowColor, item.descShadowOpacity, item.descShadowDir)}` : ''
        ].filter(Boolean).join(';');
        const finalDescHtml = item.description ? `<div class="link-desc" ${descStyle2 ? `style="${descStyle2}"` : ''}>${escapeHtml(item.description)}</div>` : '';

        a.innerHTML = `
            <div class="link-content-wrapper" style="${alignStyle}">
                ${iconHtml}
                <div class="link-text-block">
                    <div class="link-title" ${titleStyle ? `style="${titleStyle}"` : ''}>${escapeHtml(item.title)}</div>
                    ${finalDescHtml || descHtml}
                </div>
            </div>
            <div class="link-arrow" ${tc ? `style="color:${tc}"` : ''}>
                <i class="${item.isProtected ? 'fas fa-lock' : (isFolder ? 'fas fa-folder-open' : 'fas fa-chevron-right')}"></i>
            </div>
        `;

        a.onclick = (e) => {
            e.preventDefault();
            handleInteraction(item);
        };

        return a;
    }

    if (item.type === 'text') {
        const p = document.createElement('div');
        p.className = `item-text ${item.style === 'paragraph' ? 'paragraph' : 'heading'}`;
        p.style.animationDelay = animDelay;
        if (item.textAlign) p.style.textAlign = item.textAlign;
        if (item.textColor) p.style.color = item.textColor;
        if (item.fontSize) p.style.fontSize = item.fontSize;
        if (item.fontWeight) p.style.fontWeight = item.fontWeight;
        const contentShadow = buildTextShadow(item.contentShadowColor, item.contentShadowOpacity, item.contentShadowDir);
        if (contentShadow) p.style.textShadow = contentShadow;
        p.textContent = item.content;
        return p;
    }

    if (item.type === 'divider') {
        const hr = document.createElement('hr');
        hr.className = 'item-divider';
        hr.style.animationDelay = animDelay;
        hr.style.borderTopStyle = item.style || 'solid';
        hr.style.borderTopColor = item.color || '#e2e8f0';
        hr.style.borderTopWidth = `${item.thickness || 1}px`;
        hr.style.background = 'transparent'; // Override default gradient
        return hr;
    }
    return null;
}

// ---- INTERACTION & CRYPTO LOGIC ----

function handleInteraction(item) {
    if (item.isProtected) {
        promptPassword(item);
    } else {
        executeAction(item);
    }
}

function executeAction(item, decryptedData = null) {
    if (item.type === 'link') {
        const urlToOpen = decryptedData || item.url;
        window.open(resolveUrl(urlToOpen), '_blank', 'noopener,noreferrer');
    } else if (item.type === 'folder') {
        const itemsToLoad = decryptedData ? JSON.parse(decryptedData) : item.items;
        pageHistory.push({ items: itemsToLoad, title: item.title });
        renderCurrentPage();
    }
}

// Password Modal State
let currentProtectedItem = null;

function promptPassword(item) {
    currentProtectedItem = item;
    const modal = document.getElementById('password-modal');
    const pwdInput = document.getElementById('unlock-pwd');
    const errText = document.getElementById('pwd-error');

    pwdInput.value = '';
    errText.style.display = 'none';
    modal.classList.remove('hidden');
    pwdInput.focus();
}

// Bind modal events once
document.getElementById('pwd-cancel').addEventListener('click', () => {
    document.getElementById('password-modal').classList.add('hidden');
    currentProtectedItem = null;
});

document.getElementById('pwd-submit').addEventListener('click', attemptUnlock);
document.getElementById('unlock-pwd').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptUnlock();
});

function attemptUnlock() {
    if (!currentProtectedItem) return;

    const pwd = document.getElementById('unlock-pwd').value.trim();
    const errText = document.getElementById('pwd-error');

    try {
        const ciphertext = currentProtectedItem.encryptedData;
        const bytes = CryptoJS.AES.decrypt(ciphertext, pwd);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) throw new Error("Decryption resulted in empty string");

        // Success!
        document.getElementById('password-modal').classList.add('hidden');
        executeAction(currentProtectedItem, originalText);

    } catch (e) {
        errText.style.display = 'block';
        // Shake modal
        const content = document.querySelector('.pwd-content');
        content.style.animation = 'none';
        content.offsetHeight; // trigger reflow
        content.style.animation = 'shake 0.5s';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] || m));
}
