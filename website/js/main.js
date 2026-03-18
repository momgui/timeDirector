/**
 * Eôs — Main JavaScript v2.0
 * Handles: Noise Canvas, Header Scroll, Reveal Animations, Hero 3D Tilt
 */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       1. NOISE CANVAS
       A subtle film grain texture overlay rendered on a canvas to add depth.
       ========================================================================= */
    const canvas = document.getElementById('noiseCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let frame = 0;

        function generateNoise() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = value; // R
                data[i + 1] = value; // G
                data[i + 2] = value; // B
                data[i + 3] = 255;   // A
            }

            ctx.putImageData(imageData, 0, 0);
        }

        function animateNoise() {
            frame++;
            // Regenerate noise every 3 frames for a subtle grain effect without being distracting
            if (frame % 3 === 0) {
                generateNoise();
            }
            requestAnimationFrame(animateNoise);
        }

        generateNoise();
        animateNoise();
        window.addEventListener('resize', generateNoise, { passive: true });
    }


    /* =========================================================================
       2. HEADER — Scroll glass effect
       ========================================================================= */
    const header = document.getElementById('siteHeader');
    if (header) {
        const toggleHeader = () => {
            header.classList.toggle('scrolled', window.scrollY > 30);
        };
        toggleHeader();
        window.addEventListener('scroll', toggleHeader, { passive: true });
    }


    /* =========================================================================
       3. REVEAL ANIMATIONS (Intersection Observer)
       Elements with .reveal class fade in with translateY when entering viewport.
       data-delay attribute adds staggered delay in ms.
       ========================================================================= */
    const revealEls = document.querySelectorAll('.reveal');

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.dataset.delay || 0;
                setTimeout(() => {
                    el.classList.add('active');
                }, Number(delay));
                revealObs.unobserve(el); // Only animate once
            }
        });
    }, {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
    });

    revealEls.forEach(el => revealObs.observe(el));


    /* =========================================================================
       4. HERO 3D TILT EFFECT
       The hero mockup follows the mouse in a subtle 3D tilt, desktop only.
       ========================================================================= */
    const heroVisual = document.getElementById('heroVisual');
    const heroMockup = document.getElementById('heroMockup');

    if (heroVisual && heroMockup && window.innerWidth > 900) {
        const MAX_TILT = 12; // degrees

        heroVisual.addEventListener('mousemove', (e) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotY = ((x - cx) / cx) * MAX_TILT;
            const rotX = -((y - cy) / cy) * MAX_TILT;

            heroMockup.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04, 1.04, 1.04)`;
        });

        heroVisual.addEventListener('mouseleave', () => {
            heroMockup.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            heroMockup.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            setTimeout(() => {
                heroMockup.style.transition = 'transform 0.1s linear';
            }, 600);
        });
    }


    /* =========================================================================
       5. SMOOTH ANCHOR NAVIGATION (Offset for fixed header)
       ========================================================================= */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').slice(1);
            if (!targetId) return;
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80; // Header height
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });


    /* =========================================================================
       6. HAMBURGER (Mobile Nav toggle — simple implementation)
       ========================================================================= */
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !expanded);
            // Simple toggle: you can enhance this with a mobile menu overlay
        });
    }
});
