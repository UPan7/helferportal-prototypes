// ================================================================
// HELFERPORTAL — SHARED SCRIPTS
// Consolidated from per-page inline scripts
// ================================================================

// ========================================
// MOBILE MENU (all pages, ≤768px)
// ========================================
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

if (mobileMenu && mobileMenuBtn) {
    function openMobileMenu() {
        mobileMenu.classList.add('active');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
        document.body.classList.add('mobile-menu-open');
    }
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }

    mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMobileMenu();
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setTimeout(closeMobileMenu, 100));
    });
}

// ========================================
// HERO SLIDER (index.html) — dot indicators
// ========================================
const slides = document.querySelectorAll('.slide');
const sliderDots = document.querySelectorAll('.slider-dot');

if (slides.length > 0 && sliderDots.length > 0) {
    let currentSlide = 0;
    let slideInterval;
    const slideDuration = 6000;

    function showSlide(index) {
        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }
        });

        // Update dot indicators
        sliderDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        currentSlide = index;
    }

    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startSlider() {
        // Disable autoplay in CMS preview (bridge sets flag async)
        if (window.__CMS_PREVIEW__) return;
        slideInterval = setInterval(nextSlide, slideDuration);
    }

    function resetSlider() {
        clearInterval(slideInterval);
        startSlider();
    }

    // Click on dots to jump to slide
    sliderDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.getAttribute('data-slide'), 10);
            showSlide(slideIndex);
            resetSlider();
        });
    });

    // Set initial aria-hidden on inactive slides
    slides.forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    // Start slider
    startSlider();
}

// ========================================
// TAB GROUP HELPER — shared init for all tab-like components
// ========================================
function initTabGroup(btnSelector, panelSelector, btnDataAttr, panelDataAttr) {
    const buttons = document.querySelectorAll(btnSelector);
    const panels = document.querySelectorAll(panelSelector);
    if (buttons.length === 0) return;
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute(btnDataAttr);
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.getAttribute(panelDataAttr) === tabId) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// TABS (index, hilfe-finden, engagieren, fuer-kommunen)
initTabGroup('.tab-btn', '.tab-panel', 'data-tab', 'data-panel');

// ========================================
// MOBILE TAB PICKER (all pages with tabs)
// "Active tab + Noch X" → bottom-sheet popup
// Replaces horizontal scroll at ≤768px
// ========================================
(function() {
    const tabsNav = document.querySelector('.tabs-nav');
    if (!tabsNav) return;

    const tabsContainer = tabsNav.closest('.tabs-container');
    if (!tabsContainer) return;

    const allTabBtns = Array.from(tabsNav.querySelectorAll('.tab-btn'));
    if (allTabBtns.length < 2) return;

    const body = document.body;
    const isStartseite = body.classList.contains('page-startseite');

    // Helpers
    function getTabColor(btn) {
        if (btn.classList.contains('blue')) return 'blue';
        if (btn.classList.contains('orange')) return 'orange';
        if (btn.classList.contains('purple')) return 'purple';
        if (btn.classList.contains('green')) return 'green';
        return 'blue';
    }

    function getTabLabel(btn) {
        const cw = btn.querySelector('.tab-btn-content');
        if (cw) return cw.querySelector('span').textContent.trim();
        return btn.querySelector('span').textContent.trim();
    }

    function getTabSubtitle(btn) {
        const small = btn.querySelector('.tab-btn-content small');
        return small ? small.textContent.trim() : '';
    }

    function cloneIcon(btn) {
        const icon = btn.querySelector('.tab-icon');
        return icon ? icon.cloneNode(true) : null;
    }

    // --- Build picker bar ---
    const pickerBar = document.createElement('div');
    pickerBar.className = 'tabs-mobile-picker';

    const activePill = document.createElement('button');
    activePill.className = 'tabs-mobile-active';
    activePill.type = 'button';

    const activeLabel = document.createElement('span');
    activeLabel.className = 'tabs-mobile-active-label';
    activePill.appendChild(activeLabel);

    const moreBtn = document.createElement('button');
    moreBtn.className = 'tabs-mobile-more';
    moreBtn.type = 'button';

    const moreLabel = document.createElement('span');
    moreLabel.textContent = 'Noch ' + (allTabBtns.length - 1);

    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevronSvg.setAttribute('viewBox', '0 0 24 24');
    chevronSvg.setAttribute('fill', 'none');
    chevronSvg.setAttribute('stroke', 'currentColor');
    chevronSvg.setAttribute('stroke-width', '2.5');
    chevronSvg.classList.add('tabs-mobile-more-chevron');
    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevronPath.setAttribute('d', 'M6 9l6 6 6-6');
    chevronSvg.appendChild(chevronPath);

    moreBtn.appendChild(moreLabel);
    moreBtn.appendChild(chevronSvg);

    pickerBar.appendChild(activePill);
    pickerBar.appendChild(moreBtn);

    tabsContainer.insertBefore(pickerBar, tabsNav);
    tabsNav.classList.add('has-mobile-picker');

    // --- Build bottom-sheet popup ---
    const overlay = document.createElement('div');
    overlay.className = 'tabs-picker-overlay';

    const modal = document.createElement('div');
    modal.className = 'tabs-picker-modal';

    // Handle
    const handle = document.createElement('div');
    handle.className = 'tabs-picker-handle';
    modal.appendChild(handle);

    // List
    const list = document.createElement('div');
    list.className = 'tabs-picker-list';

    allTabBtns.forEach(function(btn, idx) {
        const item = document.createElement('button');
        item.className = 'tabs-picker-item';
        item.type = 'button';
        item.dataset.tab = btn.dataset.tab;

        const iconClone = cloneIcon(btn);
        if (iconClone) item.appendChild(iconClone);

        const textWrap = document.createElement('div');
        const labelEl = document.createElement('div');
        labelEl.className = 'tabs-picker-item-label';
        labelEl.textContent = getTabLabel(btn);
        textWrap.appendChild(labelEl);

        const subtitle = getTabSubtitle(btn);
        if (subtitle) {
            const descEl = document.createElement('div');
            descEl.className = 'tabs-picker-item-desc';
            descEl.textContent = subtitle;
            textWrap.appendChild(descEl);
        }
        item.appendChild(textWrap);

        // Checkmark SVG
        const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        check.setAttribute('viewBox', '0 0 24 24');
        check.setAttribute('fill', 'none');
        check.setAttribute('stroke', 'currentColor');
        check.setAttribute('stroke-width', '2.5');
        check.classList.add('check-icon');
        const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        checkPath.setAttribute('d', 'M20 6L9 17l-5-5');
        check.appendChild(checkPath);
        item.appendChild(check);

        if (btn.classList.contains('active')) item.classList.add('active');

        list.appendChild(item);
    });

    modal.appendChild(list);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'tabs-picker-footer';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tabs-picker-close-btn';
    closeBtn.type = 'button';
    closeBtn.textContent = 'Schließen';
    footer.appendChild(closeBtn);
    modal.appendChild(footer);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // --- Update active pill ---
    function updateActivePill() {
        const activeBtn = tabsNav.querySelector('.tab-btn.active');
        if (!activeBtn) return;

        activeLabel.textContent = getTabLabel(activeBtn);

        const existingIcon = activePill.querySelector('.tab-icon');
        if (existingIcon) existingIcon.remove();
        const iconClone = cloneIcon(activeBtn);
        if (iconClone) activePill.insertBefore(iconClone, activeLabel);

        if (isStartseite) {
            activePill.dataset.color = getTabColor(activeBtn);
        }

        list.querySelectorAll('.tabs-picker-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.tab === activeBtn.dataset.tab);
        });
    }

    updateActivePill();

    // --- Open / close popup ---
    function openPicker() {
        overlay.classList.add('active');
        modal.classList.add('active');
        body.classList.add('tabs-picker-open');
    }

    function closePicker() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        body.classList.remove('tabs-picker-open');
    }

    activePill.addEventListener('click', openPicker);
    moreBtn.addEventListener('click', openPicker);
    overlay.addEventListener('click', closePicker);
    closeBtn.addEventListener('click', closePicker);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) closePicker();
    });

    // --- Tab selection from popup ---
    list.querySelectorAll('.tabs-picker-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const tabId = item.dataset.tab;
            const originalBtn = tabsNav.querySelector('.tab-btn[data-tab="' + tabId + '"]');
            if (originalBtn) originalBtn.click();
            updateActivePill();
            closePicker();
        });
    });

    // --- MutationObserver: sync pill when tabs change programmatically ---
    var observer = new MutationObserver(function() { updateActivePill(); });
    allTabBtns.forEach(function(btn) {
        observer.observe(btn, { attributes: true, attributeFilter: ['class'] });
    });
})();

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ========================================
// FAQ ACCORDION (all subpages)
// Single class system: .faq-item.active
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

if (faqItems.length > 0) {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');

            question.addEventListener('click', () => {
                const wasActive = item.classList.contains('active');
                // Close others
                faqItems.forEach(other => {
                    if (other !== item) {
                        other.classList.remove('active');
                        const otherQ = other.querySelector('.faq-question');
                        if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
                    }
                });
                // Toggle current
                item.classList.toggle('active', !wasActive);
                question.setAttribute('aria-expanded', !wasActive ? 'true' : 'false');
            });
        }
    });
}

// ========================================
// CONTACT FORM (kontakt.html)
// ========================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Vielen Dank für Ihre Nachricht! Wir melden uns in Kürze bei Ihnen.');
    });
}

// INFO TABS (index.html — "Gut zu wissen")
initTabGroup('.info-tab-pill', '.info-tab-panel', 'data-info-tab', 'data-info-panel');

// ========================================
// APP DOWNLOAD STRIP — dismiss with sessionStorage
// ========================================
const appStrip = document.querySelector('.app-download-strip');
const appStripClose = document.querySelector('.app-download-strip-close');

if (appStrip) {
    // Check if already dismissed this session
    if (sessionStorage.getItem('app-strip-dismissed') === '1') {
        appStrip.classList.add('hidden');
        document.body.classList.add('strip-hidden');
    }

    if (appStripClose) {
        appStripClose.addEventListener('click', () => {
            appStrip.classList.add('hidden');
            document.body.classList.add('strip-hidden');
            sessionStorage.setItem('app-strip-dismissed', '1');
        });
    }
}

// ========================================
// PARTNERS TOGGLE (index.html — expandable logos)
// ========================================
const partnersToggle = document.querySelector('.partners-toggle-btn');
const partnersLogos = document.querySelector('.partners-logos.partners-collapsible');

if (partnersToggle && partnersLogos) {
    partnersToggle.addEventListener('click', () => {
        const isExpanded = partnersLogos.classList.toggle('expanded');
        partnersToggle.classList.toggle('expanded', isExpanded);
        const textEl = partnersToggle.querySelector('.partners-toggle-text');
        if (textEl) {
            textEl.textContent = isExpanded ? 'Weniger anzeigen' : 'Alle Partner anzeigen';
        }
    });
}

// ========================================
// PREVIEW BRIDGE LOADER
// Dynamically loads preview-bridge.js which
// self-activates only inside an iframe (CMS).
// Zero overhead in production.
// ========================================
(function() {
    const bridgeScript = document.createElement('script');
    bridgeScript.src = '/assets/preview-bridge.js';
    bridgeScript.defer = true;
    document.head.appendChild(bridgeScript);
})();
