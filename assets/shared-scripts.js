// ================================================================
// HELFERPORTAL — SHARED SCRIPTS
// Consolidated from per-page inline scripts
// ================================================================

// ========================================
// MEGA MENU (all pages)
// ========================================
const mehrBtn = document.getElementById('mehrBtn');
const megaMenu = document.getElementById('megaMenu');
const megaOverlay = document.getElementById('megaOverlay');

if (mehrBtn && megaMenu && megaOverlay) {
    function openMegaMenu() {
        mehrBtn.classList.add('active');
        megaMenu.classList.add('active');
        megaOverlay.classList.add('active');
    }
    function closeMegaMenu() {
        mehrBtn.classList.remove('active');
        megaMenu.classList.remove('active');
        megaOverlay.classList.remove('active');
    }
    mehrBtn.addEventListener('click', () => {
        megaMenu.classList.contains('active') ? closeMegaMenu() : openMegaMenu();
    });
    megaOverlay.addEventListener('click', closeMegaMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMegaMenu();
    });
    megaMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setTimeout(closeMegaMenu, 100));
    });
}

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
// HERO SLIDER (index.html)
// ========================================
const slides = document.querySelectorAll('.slide');
const progressBars = document.querySelectorAll('.progress-bar');

if (slides.length > 0 && progressBars.length > 0) {
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

        // Update progress bars
        progressBars.forEach((bar, i) => {
            bar.classList.remove('active', 'done');
            if (i < index) {
                bar.classList.add('done');
            } else if (i === index) {
                bar.classList.add('active');
            }
        });

        currentSlide = index;
    }

    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startSlider() {
        slideInterval = setInterval(nextSlide, slideDuration);
    }

    function resetSlider() {
        clearInterval(slideInterval);
        startSlider();
    }

    // Click on progress bars
    progressBars.forEach((bar, index) => {
        bar.addEventListener('click', () => {
            showSlide(index);
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
// TABS (index, hilfe-finden, engagieren, fuer-kommunen)
// Uses data-tab on buttons and data-panel on panels
// ========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

if (tabButtons.length > 0) {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update panels
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.getAttribute('data-panel') === tabId) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

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
// HEADER BUTTONS (index.html)
// ========================================
const navButtons = document.querySelectorAll('.nav-btn[data-action]');

if (navButtons.length > 0) {
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');

            if (action === 'hilfe') {
                // Scroll to tabs and activate "Hilfesuchende"
                document.querySelector('.tabs-section').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    document.querySelector('[data-tab="hilfesuchende"]').click();
                }, 500);
            } else if (action === 'engagieren') {
                // Scroll to tabs and activate "Engagierte"
                document.querySelector('.tabs-section').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    document.querySelector('[data-tab="engagierte"]').click();
                }, 500);
            }
        });
    });
}

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
// FAQ ACCORDION (hilfe-finden, engagieren, fuer-kommunen, kontakt, muenchen)
// Supports both 'open' and 'active' class toggling
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

if (faqItems.length > 0) {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            // Set initial aria-expanded state
            const isOpen = item.classList.contains('open') || item.classList.contains('active');
            question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            question.addEventListener('click', () => {
                const wasOpen = item.classList.contains('open') || item.classList.contains('active');
                // Close others
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('open');
                        otherItem.classList.remove('active');
                        const otherQ = otherItem.querySelector('.faq-question');
                        if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
                    }
                });
                // Toggle current
                if (wasOpen) {
                    item.classList.remove('open');
                    item.classList.remove('active');
                    question.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('open');
                    item.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                }
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
