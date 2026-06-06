/* ===================================================================
   Blockchain Beyond Cryptocurrency — Interactive Presentation Engine
   =================================================================== */

(function () {
    'use strict';

    // ───── State ─────
    const state = {
        currentSlide: 0,
        totalSlides: 0,
        isTransitioning: false,
        slides: [],
        animationFrames: [],
    };

    // ───── DOM References ─────
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    // ───── Initialization ─────
    function init() {
        state.slides = $$('.slide');
        state.totalSlides = state.slides.length;
        buildNavDots();
        bindEvents();
        initBackgroundCanvas();
        initHeartbeatChart();
        animateHeroStats();

        // Loader
        setTimeout(() => {
            const loader = $('#loader');
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
                $('#main-nav').classList.add('visible');
            }, 800);
        }, 2800);
    }

    // ───── Nav Dots ─────
    function buildNavDots() {
        const container = $('#nav-dots');
        for (let i = 0; i < state.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', () => goToSlide(i));
            container.appendChild(dot);
        }
    }

    function updateNavDots() {
        $$('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === state.currentSlide);
        });
    }

    // ───── Slide Navigation ─────
    function goToSlide(index) {
        if (state.isTransitioning || index === state.currentSlide || index < 0 || index >= state.totalSlides) return;
        state.isTransitioning = true;

        const current = state.slides[state.currentSlide];
        const next = state.slides[index];

        // Exit current
        current.classList.remove('active');
        current.classList.add('slide-exit');

        // Enter next
        setTimeout(() => {
            current.classList.remove('slide-exit');
            next.classList.add('active', 'slide-enter');
            state.currentSlide = index;
            updateUI();

            setTimeout(() => {
                next.classList.remove('slide-enter');
                state.isTransitioning = false;
            }, 700);
        }, 350);
    }

    function nextSlide() {
        if (state.currentSlide < state.totalSlides - 1) goToSlide(state.currentSlide + 1);
    }
    function prevSlide() {
        if (state.currentSlide > 0) goToSlide(state.currentSlide - 1);
    }

    function updateUI() {
        updateNavDots();
        const num = String(state.currentSlide + 1).padStart(2, '0');
        const total = String(state.totalSlides).padStart(2, '0');
        $('#slide-counter').textContent = `${num} / ${total}`;
        const pct = ((state.currentSlide) / (state.totalSlides - 1)) * 100;
        $('#progress-fill').style.width = pct + '%';
    }

    // ───── Fullscreen ─────
    function toggleFullscreen() {
        const docEl = document.documentElement;
        const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

        if (!fsElement) {
            if (requestFS) {
                requestFS.call(docEl).catch((err) => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            }
        } else {
            if (exitFS) {
                exitFS.call(document);
            }
        }
    }

    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    }

    function updateFullscreenIcon() {
        const btn = $('#nav-fullscreen');
        if (!btn) return;
        
        if (isFullscreen()) {
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
                </svg>
            `;
        } else {
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
            `;
        }
    }

    // ───── Events ─────
    function bindEvents() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                prevSlide();
            }
        });

        // Nav buttons
        $('#nav-prev').addEventListener('click', prevSlide);
        $('#nav-next').addEventListener('click', nextSlide);
        $('#hero-start-btn').addEventListener('click', () => goToSlide(1));

        const fullscreenBtn = $('#nav-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

        // Touch/Swipe
        let touchStartX = 0, touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                if (dx < 0) nextSlide(); else prevSlide();
            }
        }, { passive: true });

        // Mouse wheel
        let wheelTimeout = null;
        document.addEventListener('wheel', (e) => {
            if (wheelTimeout) return;
            wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 1000);
            if (e.deltaY > 30) nextSlide();
            else if (e.deltaY < -30) prevSlide();
        }, { passive: true });
    }

    // ───── Background Particle Canvas ─────
    function initBackgroundCanvas() {
        const canvas = $('#bg-canvas');
        const ctx = canvas.getContext('2d');
        let w, h, nodes = [], connections = [];
        const NODE_COUNT = 60;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        function createNodes() {
            nodes = [];
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    r: Math.random() * 2 + 1,
                    pulse: Math.random() * Math.PI * 2,
                    type: Math.random() > 0.7 ? 'block' : 'node',
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);

            // Connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        const alpha = (1 - dist / 180) * 0.12;
                        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Nodes
            nodes.forEach((n) => {
                n.pulse += 0.02;
                const glow = 0.3 + Math.sin(n.pulse) * 0.2;

                if (n.type === 'block') {
                    const size = n.r * 3;
                    ctx.strokeStyle = `rgba(0, 229, 255, ${glow})`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(n.x - size / 2, n.y - size / 2, size, size);
                } else {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 229, 255, ${glow})`;
                    ctx.fill();
                }

                // Move
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
            });

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => {
            resize();
        });

        resize();
        createNodes();
        draw();
    }

    // ───── Heartbeat Chart (Healthcare Section) ─────
    function initHeartbeatChart() {
        const svg = $('.heartbeat-svg');
        if (!svg) return;

        const line = svg.querySelector('.heartbeat-line');
        const w = 300, h = 80;
        let points = [];

        function generateHeartbeat() {
            points = [];
            let x = 0;
            while (x < w) {
                const segment = Math.random();
                if (segment > 0.7 && x > 30 && x < w - 60) {
                    // Heartbeat spike
                    points.push(`${x},${h * 0.5}`);
                    points.push(`${x + 5},${h * 0.3}`);
                    points.push(`${x + 10},${h * 0.15}`);
                    points.push(`${x + 14},${h * 0.7}`);
                    points.push(`${x + 18},${h * 0.4}`);
                    points.push(`${x + 24},${h * 0.5}`);
                    x += 30;
                } else {
                    points.push(`${x},${h * 0.5 + (Math.random() - 0.5) * 4}`);
                    x += 6;
                }
            }
            line.setAttribute('points', points.join(' '));
        }

        generateHeartbeat();
        setInterval(generateHeartbeat, 3000);
    }

    // ───── Hero Stats Counter ─────
    function animateHeroStats() {
        $$('.hero-stat-num').forEach(el => {
            const target = parseInt(el.dataset.count);
            let current = 0;
            const duration = 2000;
            const start = performance.now();

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                current = Math.round(eased * target);
                el.textContent = current;
                if (progress < 1) requestAnimationFrame(tick);
            }

            // Delay until hero is visible
            setTimeout(() => requestAnimationFrame(tick), 3200);
        });
    }

    // ───── Start ─────
    document.addEventListener('DOMContentLoaded', init);
})();
