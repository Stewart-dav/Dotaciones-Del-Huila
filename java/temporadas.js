(function () {
    "use strict";

    if (window.DESACTIVAR_TEMPORADAS) return;
    if (document.getElementById("temporada-root")) return;

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

    function mismoDia(a, b) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function enRango(hoy, inicio, fin) {
        const t = hoy.setHours(0, 0, 0, 0);
        return t >= inicio.setHours(0, 0, 0, 0) && t <= fin.setHours(0, 0, 0, 0);
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
        if (enRango(new Date(hoy), pascuaIni, pascuaFin)) return "pascua";

        const madre = nEsimoDiaSemana(anio, 4, 0, 2);
        if (madre) {
            const mi = new Date(madre); mi.setDate(madre.getDate() - 1);
            const mf = new Date(madre); mf.setDate(madre.getDate() + 1);
            if (enRango(new Date(hoy), mi, mf)) return "dia_madre";
        }

        const padre = nEsimoDiaSemana(anio, 5, 0, 3);
        if (padre) {
            const pi = new Date(padre); pi.setDate(padre.getDate() - 1);
            const pf = new Date(padre); pf.setDate(padre.getDate() + 1);
            if (enRango(new Date(hoy), pi, pf)) return "dia_padre";
        }

        if (mes === 6 && dia >= 19 && dia <= 21) return "independencia";

        if (mes === 7 && dia >= 6 && dia <= 8) return "independencia";

        const amor = nEsimoDiaSemana(anio, 8, 6, 3);
        if (amor) {
            const ai = new Date(amor); ai.setDate(amor.getDate() - 2);
            const af = new Date(amor); af.setDate(amor.getDate() + 1);
            if (enRango(new Date(hoy), ai, af)) return "amor_amistad";
        }

        if (mes === 9 && dia >= 28 && dia <= 31) return "halloween";

        if (mes === 11) return "navidad";

        return null;
    }

    const hoy = new Date();
    const temporada = detectarTemporada(hoy);
    if (!temporada) return;

    const TEMPORADAS = {
        navidad: {
            banner: "🎄 ¡Feliz Navidad! 🎄",
            bannerGradient: "linear-gradient(135deg, #c62828, #2e7d32)",
            luces: ["#e53935", "#43a047", "#fdd835", "#1e88e5", "#fb8c00", "#e91e63"],
            adornos: ["❄", "❅", "❆", "🎄", "⭐", "🎁", "🔔", "✨", "🦌", "🕯️"],
            esquinas: { tl: "🎄", tr: "🎄", bl: "⭐", br: "🎁" },
            particulas: "nieve",
            colorParticula: "255, 255, 255"
        },
        anio_nuevo: {
            banner: "✨ ¡Feliz Año Nuevo! ✨",
            bannerGradient: "linear-gradient(135deg, #6a1b9a, #1565c0)",
            luces: ["#fdd835", "#e91e63", "#00e5ff", "#76ff03", "#ff1744", "#ffffff"],
            adornos: ["🎉", "🎊", "✨", "🥂", "🎆", "⭐", "💫", "🥳"],
            esquinas: { tl: "🎉", tr: "🎊", bl: "✨", br: "🥂" },
            particulas: "confeti",
            colorParticula: null
        },
        san_valentin: {
            banner: "💕 ¡Feliz San Valentín! 💕",
            bannerGradient: "linear-gradient(135deg, #c2185b, #e91e63)",
            luces: ["#e91e63", "#f48fb1", "#ff1744", "#fce4ec", "#ad1457"],
            adornos: ["❤️", "💕", "💗", "💖", "💘", "💝", "🌹", "✨"],
            esquinas: { tl: "💕", tr: "❤️", bl: "🌹", br: "💖" },
            particulas: "corazones",
            colorParticula: null
        },
        amor_amistad: {
            banner: "💛 Día del Amor y la Amistad 💛",
            bannerGradient: "linear-gradient(135deg, #f9a825, #e91e63)",
            luces: ["#f9a825", "#e91e63", "#ff7043", "#ab47bc", "#42a5f5"],
            adornos: ["💛", "❤️", "🧡", "💖", "🌸", "✨", "🎁", "💌"],
            esquinas: { tl: "💛", tr: "❤️", bl: "🌸", br: "🎁" },
            particulas: "corazones",
            colorParticula: null
        },
        dia_madre: {
            banner: "🌷 ¡Feliz Día de la Madre! 🌷",
            bannerGradient: "linear-gradient(135deg, #ad1457, #ec407a)",
            luces: ["#ec407a", "#f48fb1", "#ce93d8", "#ffcdd2", "#fce4ec"],
            adornos: ["🌷", "🌸", "🌺", "💕", "💖", "💐", "✨", "🦋"],
            esquinas: { tl: "🌷", tr: "🌸", bl: "💐", br: "💕" },
            particulas: "petalos",
            colorParticula: null
        },
        dia_padre: {
            banner: "👔 ¡Feliz Día del Padre! 👔",
            bannerGradient: "linear-gradient(135deg, #1565c0, #0d47a1)",
            luces: ["#1565c0", "#42a5f5", "#90caf9", "#ffd54f", "#66bb6a"],
            adornos: ["👔", "🎩", "⭐", "💙", "🏆", "✨", "🎈", "👏"],
            esquinas: { tl: "👔", tr: "🎩", bl: "⭐", br: "💙" },
            particulas: "confeti",
            colorParticula: null
        },
        independencia: {
            banner: "🇨🇴 ¡Viva Colombia! 🇨🇴",
            bannerGradient: "linear-gradient(135deg, #ffc107, #1976d2, #c62828)",
            luces: ["#ffc107", "#1976d2", "#c62828", "#ffeb3b", "#42a5f5", "#ef5350"],
            adornos: ["🇨🇴", "⭐", "🎉", "✨", "🟡", "🔵", "🔴", "🏅"],
            esquinas: { tl: "🇨🇴", tr: "🇨🇴", bl: "⭐", br: "🎉" },
            particulas: "confeti",
            colorParticula: null
        },
        halloween: {
            banner: "🎃 ¡Feliz Halloween! 🎃",
            bannerGradient: "linear-gradient(135deg, #e65100, #4a148c)",
            luces: ["#ff6d00", "#7b1fa2", "#ffab00", "#6a1b9a", "#ff3d00"],
            adornos: ["🎃", "👻", "🦇", "🕷️", "💀", "🕸️", "🌙", "✨"],
            esquinas: { tl: "🎃", tr: "👻", bl: "🦇", br: "🕷️" },
            particulas: "halloween",
            colorParticula: null
        },
        pascua: {
            banner: "🐣 ¡Felices Pascuas! 🐣",
            bannerGradient: "linear-gradient(135deg, #7b1fa2, #43a047)",
            luces: ["#ce93d8", "#a5d6a7", "#fff59d", "#80deea", "#f48fb1"],
            adornos: ["🐣", "🐰", "🥚", "🌷", "🌸", "✨", "🌿", "🕊️"],
            esquinas: { tl: "🐰", tr: "🐣", bl: "🌷", br: "🥚" },
            particulas: "petalos",
            colorParticula: null
        }
    };

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

        #temporada-adornos { position: absolute; inset: 0; z-index: 1; }
        .temporada-adorno {
            position: absolute; font-size: 1.35rem; user-select: none;
            animation: tempFlotar linear infinite;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
        }
        @keyframes tempFlotar {
            0%   { transform: translateY(0) rotate(0deg); }
            25%  { transform: translateY(-12px) rotate(8deg); }
            50%  { transform: translateY(0) rotate(0deg); }
            75%  { transform: translateY(10px) rotate(-8deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }

        #temporada-banner {
            position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
            color: #fff; font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            font-size: 0.78rem; font-weight: 600; padding: 5px 14px;
            border-radius: 20px; white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.25); z-index: 3;
            animation: tempBannerIn 0.8s ease-out, tempBannerPulse 3s ease-in-out 1s infinite;
            letter-spacing: 0.02em;
        }
        @keyframes tempBannerIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes tempBannerPulse {
            0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
            50% { box-shadow: 0 2px 16px rgba(255,215,0,0.4); }
        }

        #temporada-esquinas { position: absolute; inset: 0; z-index: 1; }
        .temporada-esquina {
            position: absolute; font-size: 2rem; opacity: 0.75;
            animation: tempEsquina 4s ease-in-out infinite;
        }
        .temporada-esquina.tl { top: 28px; left: 10px; }
        .temporada-esquina.tr { top: 28px; right: 10px; animation-delay: 0.5s; }
        .temporada-esquina.bl { bottom: 16px; left: 12px; animation-delay: 1s; font-size: 1.6rem; }
        .temporada-esquina.br { bottom: 16px; right: 12px; animation-delay: 1.5s; font-size: 1.6rem; }
        @keyframes tempEsquina {
            0%, 100% { transform: scale(1) rotate(-5deg); }
            50% { transform: scale(1.12) rotate(5deg); }
        }

        @media (max-width: 480px) {
            #temporada-banner { font-size: 0.68rem; padding: 4px 10px; }
            .temporada-esquina { font-size: 1.4rem; }
            .temporada-esquina.bl, .temporada-esquina.br { font-size: 1.2rem; }
        }
    `;
    document.head.appendChild(style);

    // Luces colgantes solo en Navidad
    if (temporada === "navidad") {
        const lucesWrap = document.createElement("div");
        lucesWrap.id = "temporada-luces";
        const numLuces = 28;
        for (let i = 0; i < numLuces; i++) {
            const luz = document.createElement("div");
            luz.className = "temporada-luz";
            const color = cfg.luces[i % cfg.luces.length];
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

    const esquinas = document.createElement("div");
    esquinas.id = "temporada-esquinas";
    esquinas.innerHTML =
        '<span class="temporada-esquina tl">' + cfg.esquinas.tl + "</span>" +
        '<span class="temporada-esquina tr">' + cfg.esquinas.tr + "</span>" +
        '<span class="temporada-esquina bl">' + cfg.esquinas.bl + "</span>" +
        '<span class="temporada-esquina br">' + cfg.esquinas.br + "</span>";
    root.appendChild(esquinas);

    const adornosWrap = document.createElement("div");
    adornosWrap.id = "temporada-adornos";
    const numAdornos = 12;
    for (let i = 0; i < numAdornos; i++) {
        const el = document.createElement("span");
        el.className = "temporada-adorno";
        el.textContent = cfg.adornos[i % cfg.adornos.length];
        el.style.left = (5 + Math.random() * 90) + "%";
        el.style.top = (12 + Math.random() * 70) + "%";
        el.style.fontSize = (1.1 + Math.random() * 0.85) + "rem";
        el.style.animationDuration = (4 + Math.random() * 5).toFixed(1) + "s";
        el.style.animationDelay = (Math.random() * 3).toFixed(1) + "s";
        el.style.opacity = (0.55 + Math.random() * 0.4).toFixed(2);
        adornosWrap.appendChild(el);
    }
    root.appendChild(adornosWrap);

    const canvas = document.createElement("canvas");
    canvas.id = "temporada-canvas";
    Object.assign(canvas.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", pointerEvents: "none", zIndex: "0"
    });
    root.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let ancho, alto, animId;
    const particulas = [];
    const CANTIDAD = 45;

    const COLORES_CONFETI = ["#e53935", "#43a047", "#fdd835", "#1e88e5", "#fb8c00", "#e91e63", "#00acc1", "#ffffff"];
    const COLORES_HALLOWEEN = ["#ff6d00", "#7b1fa2", "#212121", "#ffab00", "#6d4c41"];
    const COLORES_PETALOS = ["#f48fb1", "#ec407a", "#fce4ec", "#ce93d8", "#ffcdd2", "#f8bbd0"];
    const COLORES_CORAZONES = ["#e91e63", "#f06292", "#ff1744", "#ad1457", "#f48fb1"];

    function redimensionar() {
        ancho = window.innerWidth;
        alto = window.innerHeight;
        canvas.width = ancho;
        canvas.height = alto;
    }

    function colorAleatorio(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function crearParticula() {
        const tipo = cfg.particulas;
        const base = {
            x: Math.random() * ancho,
            y: Math.random() * alto - alto,
            velY: 0.5 + Math.random() * 2,
            velX: (Math.random() - 0.5) * 1.2,
            oscilacion: Math.random() * Math.PI * 2,
            rotacion: Math.random() * 360,
            velRot: (Math.random() - 0.5) * 4,
            opacidad: 0.4 + Math.random() * 0.55,
            tamaño: 3 + Math.random() * 7
        };

        if (tipo === "nieve") {
            base.velY = 0.5 + Math.random() * 1.8;
            base.velX = (Math.random() - 0.5) * 0.5;
            base.tamaño = 2.5 + Math.random() * 6;
            base.color = "255,255,255";
            base.forma = "circulo";
        } else if (tipo === "confeti") {
            base.color = colorAleatorio(COLORES_CONFETI);
            base.forma = Math.random() > 0.5 ? "rect" : "circulo";
            base.tamaño = 4 + Math.random() * 6;
            base.velY = 1 + Math.random() * 2.5;
        } else if (tipo === "corazones") {
            base.color = colorAleatorio(COLORES_CORAZONES);
            base.forma = "corazon";
            base.tamaño = 8 + Math.random() * 10;
            base.velY = 0.6 + Math.random() * 1.5;
        } else if (tipo === "petalos") {
            base.color = colorAleatorio(COLORES_PETALOS);
            base.forma = "petalo";
            base.tamaño = 6 + Math.random() * 8;
            base.velY = 0.4 + Math.random() * 1.2;
            base.velX = (Math.random() - 0.5) * 1.5;
        } else if (tipo === "halloween") {
            base.color = colorAleatorio(COLORES_HALLOWEEN);
            base.forma = Math.random() > 0.6 ? "circulo" : "rect";
            base.tamaño = 3 + Math.random() * 6;
            base.velY = 0.7 + Math.random() * 2;
        } else {
            base.color = "255,255,255";
            base.forma = "circulo";
        }
        return base;
    }

    function dibujarCorazon(ctx, x, y, size, color, op) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 16, size / 16);
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-8, -4, -16, 4, 0, 14);
        ctx.bezierCurveTo(16, 4, 8, -4, 0, 4);
        ctx.fillStyle = color;
        ctx.globalAlpha = op;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function dibujarPetalo(ctx, x, y, size, color, rot, op) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.35, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = op;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function initParticulas() {
        redimensionar();
        particulas.length = 0;
        for (let i = 0; i < CANTIDAD; i++) particulas.push(crearParticula());
    }

    function dibujar() {
        ctx.clearRect(0, 0, ancho, alto);

        for (let i = 0; i < particulas.length; i++) {
            const p = particulas[i];
            p.oscilacion += 0.01 + Math.random() * 0.008;
            p.x += p.velX + Math.sin(p.oscilacion) * 0.4;
            p.y += p.velY;
            p.rotacion += p.velRot;

            if (p.y > alto + 15) {
                p.y = -15;
                p.x = Math.random() * ancho;
            }
            if (p.x > ancho + 15) p.x = -15;
            if (p.x < -15) p.x = ancho + 15;

            if (p.forma === "corazon") {
                dibujarCorazon(ctx, p.x, p.y, p.tamaño, p.color, p.opacidad);
            } else if (p.forma === "petalo") {
                dibujarPetalo(ctx, p.x, p.y, p.tamaño, p.color, p.rotacion, p.opacidad);
            } else if (p.forma === "rect") {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotacion * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacidad;
                ctx.fillRect(-p.tamaño / 2, -p.tamaño / 4, p.tamaño, p.tamaño / 2);
                ctx.globalAlpha = 1;
                ctx.restore();
            } else {
                // circulo (nieve u otros)
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.tamaño, 0, Math.PI * 2);
                if (typeof p.color === "string" && p.color.indexOf(",") !== -1) {
                    ctx.fillStyle = "rgba(" + p.color + "," + p.opacidad + ")";
                } else {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.opacidad;
                }
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        animId = requestAnimationFrame(dibujar);
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) cancelAnimationFrame(animId);
        else dibujar();
    });
    window.addEventListener("resize", redimensionar);

    function arrancar() {
        initParticulas();
        dibujar();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", arrancar);
    } else {
        arrancar();
    }
})();