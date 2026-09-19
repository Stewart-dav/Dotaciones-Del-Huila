(function () {
    "use strict";

    if (window.DESACTIVAR_TEMPORADAS) return;
    if (document.getElementById("temporada-root")) return;

    const TEMPORADAS_ACTIVAS = {
        navidad: true,
        anio_nuevo: true,
        san_valentin: true,
        amor_amistad: true,
        dia_madre: true,
        dia_padre: true,
        independencia: true,
        halloween: true,
        pascua: true
    };

    function nEsimoDiaSemana(anio, mes, diaSemana, n) {
        let contador = 0;
        for (let d = 1; d <= 31; d++) {
            const fecha = new Date(anio, mes, d);
            if (fecha.getMonth() !== mes) break;
            if (fecha.getDay() === diaSemana) {
                contador++;
                if (contador === n) return fecha;
            }
        }
        return null;
    }

    function enRango(hoy, inicio, fin) {
        const t = new Date(hoy); t.setHours(0, 0, 0, 0);
        const a = new Date(inicio); a.setHours(0, 0, 0, 0);
        const b = new Date(fin); b.setHours(0, 0, 0, 0);
        return t.getTime() >= a.getTime() && t.getTime() <= b.getTime();
    }

    function fechaPascua(anio) {
        const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100;
        const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4), k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31);
        const dia = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(anio, mes - 1, dia);
    }

    function detectarTemporada(hoy) {
        if (window.FORZAR_TEMPORADA) return window.FORZAR_TEMPORADA;

        const anio = hoy.getFullYear();
        const mes = hoy.getMonth();
        const dia = hoy.getDate();

        if ((mes === 11 && dia >= 31) || (mes === 0 && dia <= 2)) return "anio_nuevo";
        if (mes === 1 && dia >= 12 && dia <= 15) return "san_valentin";

        const pascua = fechaPascua(anio);
        const pascuaIni = new Date(pascua); pascuaIni.setDate(pascua.getDate() - 3);
        const pascuaFin = new Date(pascua); pascuaFin.setDate(pascua.getDate() + 1);
        if (enRango(hoy, pascuaIni, pascuaFin)) return "pascua";

        const madre = nEsimoDiaSemana(anio, 4, 0, 2);
        if (madre) {
            const mi = new Date(madre); mi.setDate(madre.getDate() - 1);
            const mf = new Date(madre); mf.setDate(madre.getDate() + 1);
            if (enRango(hoy, mi, mf)) return "dia_madre";
        }

        const padre = nEsimoDiaSemana(anio, 5, 0, 3);
        if (padre) {
            const pi = new Date(padre); pi.setDate(padre.getDate() - 1);
            const pf = new Date(padre); pf.setDate(padre.getDate() + 1);
            if (enRango(hoy, pi, pf)) return "dia_padre";
        }

        if (mes === 6 && dia >= 19 && dia <= 21) return "independencia";
        if (mes === 7 && dia >= 6 && dia <= 8) return "independencia";

        const amor = nEsimoDiaSemana(anio, 8, 6, 3);
        if (amor) {
            const ai = new Date(amor); ai.setDate(amor.getDate() - 2);
            const af = new Date(amor); af.setDate(amor.getDate() + 1);
            if (enRango(hoy, ai, af)) return "amor_amistad";
        }

        if (mes === 9 && dia >= 28 && dia <= 31) return "halloween";
        if (mes === 11) return "navidad";

        return null;
    }

    const TEMPORADAS = {
        navidad: {
            banner: "🎄 ¡Feliz Navidad! 🎄",
            bannerGradient: "linear-gradient(135deg, #c62828, #2e7d32)",
            luces: true,
            coloresLuces: ["#e53935", "#43a047", "#fdd835", "#1e88e5", "#fb8c00", "#e91e63"],
            tipo: "nieve",
            colores: ["#ffffff", "#e8f5e9", "#fce4ec", "#fffde7"]
        },
        anio_nuevo: {
            banner: "✨ ¡Feliz Año Nuevo! ✨",
            bannerGradient: "linear-gradient(135deg, #6a1b9a, #1565c0)",
            luces: false,
            tipo: "fuegos",
            colores: ["#fdd835", "#e91e63", "#00e5ff", "#76ff03", "#ff1744", "#ffffff", "#7c4dff"]
        },
        san_valentin: {
            banner: "💕 ¡Feliz San Valentín! 💕",
            bannerGradient: "linear-gradient(135deg, #c2185b, #e91e63)",
            luces: false,
            tipo: "corazones",
            colores: ["#e91e63", "#f48fb1", "#ff1744", "#ad1457", "#fce4ec"]
        },
        amor_amistad: {
            banner: "💛 Día del Amor y la Amistad 💛",
            bannerGradient: "linear-gradient(135deg, #f9a825, #e91e63)",
            luces: false,
            tipo: "corazones",
            colores: ["#f9a825", "#e91e63", "#ff7043", "#ab47bc", "#42a5f5"]
        },
        dia_madre: {
            banner: "🌷 ¡Feliz Día de la Madre! 🌷",
            bannerGradient: "linear-gradient(135deg, #ad1457, #ec407a)",
            luces: false,
            tipo: "petalos",
            colores: ["#ec407a", "#f48fb1", "#ce93d8", "#ffcdd2", "#f8bbd0"]
        },
        dia_padre: {
            banner: "👔 ¡Feliz Día del Padre! 👔",
            bannerGradient: "linear-gradient(135deg, #1565c0, #0d47a1)",
            luces: false,
            tipo: "confeti",
            colores: ["#1565c0", "#42a5f5", "#90caf9", "#ffd54f", "#66bb6a", "#ffffff"]
        },
        independencia: {
            banner: "🇨🇴 ¡Viva Colombia! 🇨🇴",
            bannerGradient: "linear-gradient(135deg, #ffc107, #1976d2, #c62828)",
            luces: false,
            tipo: "confeti",
            colores: ["#ffc107", "#1976d2", "#c62828", "#ffeb3b", "#42a5f5", "#ef5350"]
        },
        halloween: {
            banner: "🎃 ¡Feliz Halloween! 🎃",
            bannerGradient: "linear-gradient(135deg, #e65100, #4a148c)",
            luces: false,
            tipo: "halloween",
            colores: ["#ff6d00", "#7b1fa2", "#212121", "#ffab00", "#6d4c41"]
        },
        pascua: {
            banner: "🐣 ¡Felices Pascuas! 🐣",
            bannerGradient: "linear-gradient(135deg, #7b1fa2, #43a047)",
            luces: false,
            tipo: "petalos",
            colores: ["#ce93d8", "#a5d6a7", "#fff59d", "#80deea", "#f48fb1"]
        }
    };

    const hoy = new Date();
    const temporada = detectarTemporada(hoy);
    if (!temporada) return;

    if (TEMPORADAS_ACTIVAS[temporada] === false) return;

    const cfg = TEMPORADAS[temporada];
    if (!cfg) return;

    const root = document.createElement("div");
    root.id = "temporada-root";
    root.setAttribute("aria-hidden", "true");
    Object.assign(root.style, {
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        pointerEvents: "none", zIndex: "9997", overflow: "hidden"
    });
    document.body.appendChild(root);

    const style = document.createElement("style");
    style.id = "temporada-estilos";
    style.textContent = `
        #tsparticles-temporada {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 9996 !important;
        }
        #temporada-luces {
            position: absolute; top: 0; left: 0; width: 100%; height: 18px;
            display: flex; justify-content: space-around; align-items: flex-start;
            padding: 4px 8px 0; box-sizing: border-box; z-index: 2;
        }
        .temporada-luz {
            width: 10px; height: 14px; border-radius: 50% 50% 40% 40%;
            position: relative; animation: tempParpadeo 1.4s ease-in-out infinite;
            box-shadow: 0 0 8px 2px currentColor;
        }
        .temporada-luz::before {
            content: ""; position: absolute; top: -5px; left: 50%;
            transform: translateX(-50%); width: 3px; height: 5px;
            background: #555; border-radius: 1px;
        }
        @keyframes tempParpadeo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.85); }
        }
        #temporada-banner {
            position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
            color: #fff; font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            font-size: 0.78rem; font-weight: 600; padding: 5px 14px;
            border-radius: 20px; white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.25); z-index: 3;
            animation: tempBannerIn 0.8s ease-out, tempBannerPulse 3s ease-in-out 1s infinite;
        }
        @keyframes tempBannerIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes tempBannerPulse {
            0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
            50% { box-shadow: 0 2px 16px rgba(255,215,0,0.4); }
        }
        @media (max-width: 480px) {
            #temporada-banner { font-size: 0.68rem; padding: 4px 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
            #tsparticles-temporada { display: none !important; }
        }
    `;
    document.head.appendChild(style);

    if (cfg.luces && cfg.coloresLuces) {
        const lucesWrap = document.createElement("div");
        lucesWrap.id = "temporada-luces";
        for (let i = 0; i < 28; i++) {
            const luz = document.createElement("div");
            luz.className = "temporada-luz";
            const color = cfg.coloresLuces[i % cfg.coloresLuces.length];
            luz.style.color = color;
            luz.style.background = color;
            luz.style.animationDelay = (Math.random() * 1.4).toFixed(2) + "s";
            luz.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + "s";
            lucesWrap.appendChild(luz);
        }
        root.appendChild(lucesWrap);
    }

    const banner = document.createElement("div");
    banner.id = "temporada-banner";
    banner.style.background = cfg.bannerGradient;
    banner.textContent = cfg.banner;
    root.appendChild(banner);
    setTimeout(function () {
        banner.style.transition = "opacity 1s ease, transform 1s ease";
        banner.style.opacity = "0";
        banner.style.transform = "translateX(-50%) translateY(-30px)";
        setTimeout(function () { banner.remove(); }, 1100);
    }, 9000);

    const particlesDiv = document.createElement("div");
    particlesDiv.id = "tsparticles-temporada";
    document.body.appendChild(particlesDiv);

    function opcionesPorTipo(tipo, colores) {
        const base = {
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            detectRetina: true,
            pauseOnBlur: true,
            pauseOnOutsideViewport: true,
            particles: {
                number: { value: 45, density: { enable: true, width: 1920, height: 1080 } },
                color: { value: colores },
                opacity: { value: { min: 0.35, max: 0.85 } },
                size: { value: { min: 2, max: 6 } },
                move: {
                    enable: true,
                    speed: 1.2,
                    direction: "bottom",
                    outModes: { default: "out" }
                }
            }
        };

        if (tipo === "nieve") {
            base.particles.number.value = 70;
            base.particles.shape = { type: "circle" };
            base.particles.size = { value: { min: 1, max: 5 } };
            base.particles.move = {
                enable: true,
                speed: { min: 0.4, max: 1.4 },
                direction: "bottom",
                straight: false,
                outModes: { default: "out" },
                drift: { min: -0.4, max: 0.4 }
            };
            base.particles.opacity = { value: { min: 0.3, max: 0.9 } };
            base.particles.wobble = { enable: true, distance: 8, speed: 8 };
        } else if (tipo === "corazones") {
            base.particles.number.value = 35;
            base.particles.shape = { type: "heart" };
            base.particles.size = { value: { min: 4, max: 12 } };
            base.particles.move = {
                enable: true,
                speed: { min: 0.6, max: 1.8 },
                direction: "bottom",
                outModes: { default: "out" },
                drift: { min: -0.6, max: 0.6 }
            };
        } else if (tipo === "petalos") {
            base.particles.number.value = 40;
            base.particles.shape = { type: "circle" };
            base.particles.size = { value: { min: 3, max: 8 } };
            base.particles.move = {
                enable: true,
                speed: { min: 0.5, max: 1.5 },
                direction: "bottom",
                outModes: { default: "out" },
                drift: { min: -1, max: 1 }
            };
            base.particles.rotate = {
                value: { min: 0, max: 360 },
                animation: { enable: true, speed: 8 },
                direction: "random"
            };
        } else if (tipo === "halloween") {
            base.particles.number.value = 40;
            base.particles.shape = { type: ["circle", "square"] };
            base.particles.size = { value: { min: 2, max: 7 } };
            base.particles.move = {
                enable: true,
                speed: { min: 0.8, max: 2.2 },
                direction: "bottom",
                outModes: { default: "out" }
            };
        } else if (tipo === "fuegos") {
            base.particles.number.value = 0;
            base.emitters = {
                direction: "none",
                rate: { quantity: 5, delay: 0.35 },
                size: { width: 0, height: 0 },
                position: { x: 50, y: 35 },
                particles: {
                    color: { value: colores },
                    shape: { type: ["circle", "square"] },
                    opacity: {
                        value: { min: 0.3, max: 1 },
                        animation: { enable: true, speed: 1.5, startValue: "max", destroy: "min" }
                    },
                    size: { value: { min: 2, max: 5 } },
                    life: { duration: { value: 2 }, count: 1 },
                    move: {
                        enable: true,
                        gravity: { enable: true, acceleration: 3 },
                        speed: { min: 5, max: 18 },
                        decay: 0.05,
                        direction: "none",
                        outModes: { default: "destroy" }
                    }
                }
            };
            // Emisores laterales
            base.emitters = [
                {
                    direction: "top-right",
                    rate: { quantity: 4, delay: 0.5 },
                    position: { x: 15, y: 70 },
                    size: { width: 0, height: 0 },
                    particles: base.emitters.particles
                },
                {
                    direction: "top",
                    rate: { quantity: 6, delay: 0.4 },
                    position: { x: 50, y: 40 },
                    size: { width: 0, height: 0 },
                    particles: base.emitters.particles
                },
                {
                    direction: "top-left",
                    rate: { quantity: 4, delay: 0.5 },
                    position: { x: 85, y: 70 },
                    size: { width: 0, height: 0 },
                    particles: base.emitters.particles
                }
            ];
        } else {
            base.particles.number.value = 50;
            base.particles.shape = { type: ["circle", "square"] };
            base.particles.size = { value: { min: 2, max: 7 } };
            base.particles.move = {
                enable: true,
                speed: { min: 1, max: 3 },
                direction: "bottom",
                outModes: { default: "out" },
                drift: { min: -0.5, max: 0.5 }
            };
            base.particles.rotate = {
                value: { min: 0, max: 360 },
                animation: { enable: true, speed: 12 },
                direction: "random"
            };
        }

        return base;
    }

    function cargarTsParticles(callback) {
        if (window.tsParticles && typeof window.tsParticles.load === "function") {
            callback();
            return;
        }
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/tsparticles@3.5.0/tsparticles.bundle.min.js";
        s.async = true;
        s.onload = callback;
        s.onerror = function () {
            console.warn("No se pudo cargar tsParticles");
        };
        document.head.appendChild(s);
    }

    function arrancar() {
        const opts = opcionesPorTipo(cfg.tipo, cfg.colores);
        window.tsParticles.load("tsparticles-temporada", opts).catch(function (err) {
            console.warn("tsParticles load error:", err);
        });
    }

    cargarTsParticles(arrancar);
})();
