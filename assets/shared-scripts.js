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
            if (i === index) slide.classList.add('active');
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
            question.addEventListener('click', () => {
                const wasOpen = item.classList.contains('open') || item.classList.contains('active');
                // Close others
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('open');
                        otherItem.classList.remove('active');
                    }
                });
                // Toggle current
                if (wasOpen) {
                    item.classList.remove('open');
                    item.classList.remove('active');
                } else {
                    item.classList.add('open');
                    item.classList.add('active');
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
