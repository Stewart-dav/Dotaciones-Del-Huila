(function () {
    "use strict";

    const CONFIG = {
        // Nieve
        cantidadNieve: 50,
        velocidadMin: 0.5,
        velocidadMax: 2.0,
        tamañoMin: 2.5,
        tamañoMax: 8,
        viento: 0.35,

        // Adornos flotantes (emojis)
        cantidadAdornos: 12,
        adornos: ["❄", "❅", "❆", "🎄", "⭐", "🎁", "🔔", "✨", "🦌", "🕯️"],

        // Luces
        cantidadLuces: 28,

        zIndex: 9997,
        soloDiciembre: true
    };

    function esTemporadaNavidad() {
        if (window.DESACTIVAR_NIEVE) return false;
        if (window.FORZAR_NIEVE) return true;
        if (!CONFIG.soloDiciembre) return true;
        return new Date().getMonth() === 11; // diciembre
    }

    if (!esTemporadaNavidad()) return;
    if (document.getElementById("navidad-root")) return;

    // ——— Contenedor principal ———
    const root = document.createElement("div");
    root.id = "navidad-root";
    root.setAttribute("aria-hidden", "true");
    Object.assign(root.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: String(CONFIG.zIndex),
        overflow: "hidden"
    });
    document.body.appendChild(root);

    // ——— Estilos ———
    const style = document.createElement("style");
    style.id = "navidad-estilos";
    style.textContent = `
        #navidad-luces {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 18px;
            display: flex;
            justify-content: space-around;
            align-items: flex-start;
            padding: 4px 8px 0;
            box-sizing: border-box;
            z-index: 2;
        }
        .navidad-luz {
            width: 10px;
            height: 14px;
            border-radius: 50% 50% 40% 40%;
            position: relative;
            animation: navidadParpadeo 1.4s ease-in-out infinite;
            box-shadow: 0 0 8px 2px currentColor;
        }
        .navidad-luz::before {
            content: "";
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 3px;
            height: 5px;
            background: #555;
            border-radius: 1px;
        }
        @keyframes navidadParpadeo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.85); }
        }

        #navidad-adornos {
            position: absolute;
            inset: 0;
            z-index: 1;
        }
        .navidad-adorno {
            position: absolute;
            font-size: 1.35rem;
            user-select: none;
            animation: navidadFlotar linear infinite;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
            opacity: 0.85;
        }
        @keyframes navidadFlotar {
            0%   { transform: translateY(0) rotate(0deg); }
            25%  { transform: translateY(-12px) rotate(8deg); }
            50%  { transform: translateY(0) rotate(0deg); }
            75%  { transform: translateY(10px) rotate(-8deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }

        #navidad-banner {
            position: absolute;
            top: 22px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #c62828, #2e7d32);
            color: #fff;
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 5px 14px;
            border-radius: 20px;
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.25);
            z-index: 3;
            animation: navidadBannerIn 0.8s ease-out, navidadBannerPulse 3s ease-in-out 1s infinite;
            letter-spacing: 0.02em;
        }
        @keyframes navidadBannerIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes navidadBannerPulse {
            0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
            50% { box-shadow: 0 2px 16px rgba(255,215,0,0.45); }
        }

        #navidad-esquinas {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
        }
        .navidad-esquina {
            position: absolute;
            font-size: 2rem;
            opacity: 0.7;
            animation: navidadEsquina 4s ease-in-out infinite;
        }
        .navidad-esquina.tl { top: 28px; left: 10px; }
        .navidad-esquina.tr { top: 28px; right: 10px; animation-delay: 0.5s; }
        .navidad-esquina.bl { bottom: 16px; left: 12px; animation-delay: 1s; font-size: 1.6rem; }
        .navidad-esquina.br { bottom: 16px; right: 12px; animation-delay: 1.5s; font-size: 1.6rem; }
        @keyframes navidadEsquina {
            0%, 100% { transform: scale(1) rotate(-5deg); }
            50% { transform: scale(1.12) rotate(5deg); }
        }

        @media (max-width: 480px) {
            #navidad-banner { font-size: 0.7rem; padding: 4px 10px; }
            .navidad-esquina { font-size: 1.4rem; }
            .navidad-esquina.bl, .navidad-esquina.br { font-size: 1.2rem; }
        }
    `;
    document.head.appendChild(style);

    // ——— Luces de colores en la parte superior ———
    const coloresLuces = ["#e53935", "#43a047", "#fdd835", "#1e88e5", "#fb8c00", "#e91e63", "#00acc1"];
    const lucesWrap = document.createElement("div");
    lucesWrap.id = "navidad-luces";
    for (let i = 0; i < CONFIG.cantidadLuces; i++) {
        const luz = document.createElement("div");
        luz.className = "navidad-luz";
        const color = coloresLuces[i % coloresLuces.length];
        luz.style.color = color;
        luz.style.background = color;
        luz.style.animationDelay = (Math.random() * 1.4).toFixed(2) + "s";
        luz.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + "s";
        lucesWrap.appendChild(luz);
    }
    root.appendChild(lucesWrap);

    // ——— Banner "Feliz Navidad" ———
    const banner = document.createElement("div");
    banner.id = "navidad-banner";
    banner.textContent = "🎄 ¡Feliz Navidad! 🎄";
    root.appendChild(banner);

    // Ocultar banner después de unos segundos
    setTimeout(() => {
        banner.style.transition = "opacity 1s ease, transform 1s ease";
        banner.style.opacity = "0";
        banner.style.transform = "translateX(-50%) translateY(-30px)";
        setTimeout(() => banner.remove(), 1100);
    }, 8000);

    // ——— Adornos en las esquinas ———
    const esquinas = document.createElement("div");
    esquinas.id = "navidad-esquinas";
    esquinas.innerHTML = `
        <span class="navidad-esquina tl">🎄</span>
        <span class="navidad-esquina tr">🎄</span>
        <span class="navidad-esquina bl">⭐</span>
        <span class="navidad-esquina br">🎁</span>
    `;
    root.appendChild(esquinas);

    // ——— Adornos flotantes (emojis) ———
    const adornosWrap = document.createElement("div");
    adornosWrap.id = "navidad-adornos";
    for (let i = 0; i < CONFIG.cantidadAdornos; i++) {
        const el = document.createElement("span");
        el.className = "navidad-adorno";
        el.textContent = CONFIG.adornos[i % CONFIG.adornos.length];
        el.style.left = (5 + Math.random() * 90) + "%";
        el.style.top = (10 + Math.random() * 75) + "%";
        el.style.fontSize = (1.1 + Math.random() * 0.8) + "rem";
        el.style.animationDuration = (4 + Math.random() * 5).toFixed(1) + "s";
        el.style.animationDelay = (Math.random() * 3).toFixed(1) + "s";
        el.style.opacity = (0.55 + Math.random() * 0.4).toFixed(2);
        adornosWrap.appendChild(el);
    }
    root.appendChild(adornosWrap);

    // ——— Nieve (canvas) ———
    const canvas = document.createElement("canvas");
    canvas.id = "nieve-canvas";
    Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "0"
    });
    root.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let ancho, alto, animId;
    const copos = [];

    function redimensionar() {
        ancho = window.innerWidth;
        alto = window.innerHeight;
        canvas.width = ancho;
        canvas.height = alto;
    }

    function crearCopo() {
        const tamaño = CONFIG.tamañoMin + Math.random() * (CONFIG.tamañoMax - CONFIG.tamañoMin);
        return {
            x: Math.random() * ancho,
            y: Math.random() * alto - alto,
            r: tamaño,
            velY: CONFIG.velocidadMin + Math.random() * (CONFIG.velocidadMax - CONFIG.velocidadMin),
            velX: (Math.random() - 0.5) * CONFIG.viento,
            oscilacion: Math.random() * Math.PI * 2,
            opacidad: 0.3 + Math.random() * 0.65
        };
    }

    function initNieve() {
        redimensionar();
        copos.length = 0;
        for (let i = 0; i < CONFIG.cantidadNieve; i++) {
            copos.push(crearCopo());
        }
    }

    function dibujarNieve() {
        ctx.clearRect(0, 0, ancho, alto);
        for (let i = 0; i < copos.length; i++) {
            const c = copos[i];
            c.oscilacion += 0.01 + Math.random() * 0.008;
            c.x += c.velX + Math.sin(c.oscilacion) * 0.35;
            c.y += c.velY;

            if (c.y > alto + 10) {
                c.y = -10;
                c.x = Math.random() * ancho;
            }
            if (c.x > ancho + 10) c.x = -10;
            if (c.x < -10) c.x = ancho + 10;

            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, " + c.opacidad + ")";
            ctx.fill();

            if (c.r > 5) {
                ctx.beginPath();
                ctx.arc(c.x - c.r * 0.25, c.y - c.r * 0.25, c.r * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, " + (c.opacidad * 0.45) + ")";
                ctx.fill();
            }
        }
        animId = requestAnimationFrame(dibujarNieve);
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            cancelAnimationFrame(animId);
        } else {
            dibujarNieve();
        }
    });

    window.addEventListener("resize", redimensionar);

    function arrancar() {
        initNieve();
        dibujarNieve();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", arrancar);
    } else {
        arrancar();
    }
})();