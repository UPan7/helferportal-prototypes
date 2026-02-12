// Helferportal Shared Scripts
// Auto-extracted from inline scripts

document.addEventListener("DOMContentLoaded", function() {

    // ========================================
    // MEGA MENU (all pages)
    // ========================================
    const mehrBtn = document.getElementById("mehrBtn");
    const megaMenu = document.getElementById("megaMenu");
    const megaOverlay = document.getElementById("megaOverlay");

    if (mehrBtn && megaMenu && megaOverlay) {
        mehrBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            mehrBtn.classList.toggle("active");
            megaMenu.classList.toggle("active");
            megaOverlay.classList.toggle("active");
        });

        megaOverlay.addEventListener("click", function() {
            mehrBtn.classList.remove("active");
            megaMenu.classList.remove("active");
            megaOverlay.classList.remove("active");
        });

        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                mehrBtn.classList.remove("active");
                megaMenu.classList.remove("active");
                megaOverlay.classList.remove("active");
            }
        });

        document.querySelectorAll(".mega-menu a").forEach(function(link) {
            link.addEventListener("click", function() {
                setTimeout(function() {
                    mehrBtn.classList.remove("active");
                    megaMenu.classList.remove("active");
                    megaOverlay.classList.remove("active");
                }, 100);
            });
        });
    }

    // ========================================
    // HERO SLIDER (index.html)
    // ========================================
    const slides = document.querySelectorAll(".slide");
    const progressBars = document.querySelectorAll(".progress-bar");

    if (slides.length > 0 && progressBars.length > 0) {
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(function(s) { s.classList.remove("active"); });
            progressBars.forEach(function(b, i) {
                b.classList.remove("active", "done");
                if (i < index) b.classList.add("done");
            });
            slides[index].classList.add("active");
            progressBars[index].classList.add("active");
            currentSlide = index;
        }

        function nextSlide() {
            showSlide((currentSlide + 1) % slides.length);
        }

        function startAutoplay() {
            slideInterval = setInterval(nextSlide, 5000);
        }

        progressBars.forEach(function(bar, index) {
            bar.addEventListener("click", function() {
                clearInterval(slideInterval);
                showSlide(index);
                startAutoplay();
            });
        });

        showSlide(0);
        startAutoplay();
    }

    // ========================================
    // TABS (shared across multiple pages)
    // ========================================
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    if (tabBtns.length > 0) {
        tabBtns.forEach(function(btn) {
            btn.addEventListener("click", function() {
                tabBtns.forEach(function(b) { b.classList.remove("active"); });
                tabPanels.forEach(function(p) { p.classList.remove("active"); });
                btn.classList.add("active");
                var panel = document.querySelector(btn.dataset.tab || btn.getAttribute("data-tab"));
                if (panel) panel.classList.add("active");
            });
        });
    }

    // ========================================
    // FAQ ACCORDION (shared across multiple pages)
    // ========================================
    const faqQuestions = document.querySelectorAll(".faq-question");

    if (faqQuestions.length > 0) {
        faqQuestions.forEach(function(question) {
            question.addEventListener("click", function() {
                var item = this.closest(".faq-item");
                var isOpen = item.classList.contains("open") || item.classList.contains("active");

                // Close all FAQ items
                document.querySelectorAll(".faq-item").forEach(function(faq) {
                    faq.classList.remove("open");
                    faq.classList.remove("active");
                });

                // Toggle current
                if (!isOpen) {
                    item.classList.add("open");
                }
            });
        });
    }

    // ========================================
    // HEADER BUTTON ACTIONS (index.html)
    // ========================================
    document.querySelectorAll(".nav-btn[data-action]").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var action = btn.getAttribute("data-action");
            var tabsSection = document.querySelector(".tabs-section");
            if (tabsSection) {
                tabsSection.scrollIntoView({ behavior: "smooth" });
                setTimeout(function() {
                    var targetTab = document.querySelector(".tab-btn[data-tab=\"" + action + "\"]");
                    if (targetTab) targetTab.click();
                }, 500);
            }
        });
    });

    // ========================================
    // SMOOTH SCROLL FOR ANCHORS
    // ========================================
    document.querySelectorAll("a[href^=\"#\"]").forEach(function(anchor) {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // ========================================
    // CONTACT FORM (kontakt.html)
    // ========================================
    var contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function(e) {
            e.preventDefault();
            alert("Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen.");
        });
    }

});
