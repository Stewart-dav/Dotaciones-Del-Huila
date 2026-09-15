function normalizarTexto(str) {
    return str
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

const CATEGORIAS = [
    { id: "calzado", label: "Calzado", keywords: ["calzado", "zapatos", "zapato", "botas", "bota", "botin", "tenis"] },
    { id: "protección visual", label: "Protección Visual", keywords: ["proteccion visual", "gafas", "lentes", "visual"] },
    { id: "protección manual", label: "Protección Manual", keywords: ["proteccion manual", "guantes", "guante", "manos", "manual"] },
    { id: "impermeables", label: "Trajes Impermeables", keywords: ["impermeable", "impermeables", "lluvia", "traje"] },
    { id: "primeros auxilios", label: "Primeros Auxilios", keywords: ["primeros auxilios", "botiquin", "auxilios"] },
    { id: "señalización", label: "Señalización", keywords: ["senalizacion", "senales", "carteles", "avisos"] },
    { id: "uniformes dama", label: "Uniformes Dama", keywords: ["uniformes dama", "dama", "mujer", "femenino"] },
    { id: "alturas", label: "Alturas", keywords: ["alturas", "lineas de vida", "arnes"] },
    { id: "uniformes hombre", label: "Uniformes Hombre", keywords: ["uniformes hombre", "hombre", "masculino"] },
    { id: "protección personal", label: "Protección Personal", keywords: ["proteccion personal", "proteccion", "personal"] },
    { id: "higiene y aseo", label: "Higiene y Aseo", keywords: ["higiene y aseo", "higiene", "aseo", "limpieza"] },
    { id: "mascotas", label: "Mascotas", keywords: ["mascotas", "perro", "gato", "animal"] },
];

const CATEGORIAS_RAPIDAS = ["calzado", "impermeables", "protección manual", "protección visual", "alturas", "mascotas"];

let ultimoContexto = { categorias: [] };
let sugerirBotones = false;

const PALABRAS_CONTINUACION = [
    "otro", "otra", "otros", "otras", "algo mas", "alguno", "algunas",
    "tambien", "mas opciones", "y que mas", "hay mas", "tienes mas", "ese", "esos"
];

function esContinuacion(textoNormalizado) {
    return PALABRAS_CONTINUACION.some(p => textoNormalizado.includes(p));
}

function extraerFiltroPrecio(textoNormalizado) {
    let match = textoNormalizado.match(/entre\s*\$?\s*([\d.,]+)\s*y\s*\$?\s*([\d.,]+)/);
    if (match) {
        return {
            tipo: "rango",
            min: parseInt(match[1].replace(/[.,]/g, ""), 10),
            max: parseInt(match[2].replace(/[.,]/g, ""), 10)
        };
    }

    match = textoNormalizado.match(/(menos de|maximo|por debajo de|menor a|hasta)\s*\$?\s*([\d.,]+)/);
    if (match) {
        return { tipo: "max", valor: parseInt(match[2].replace(/[.,]/g, ""), 10) };
    }

    match = textoNormalizado.match(/(mas de|minimo|superior a|mayor a)\s*\$?\s*([\d.,]+)/);
    if (match) {
        return { tipo: "min", valor: parseInt(match[2].replace(/[.,]/g, ""), 10) };
    }

    return null;
}

function buscarProductoPorNombre(textoNormalizado) {
    const palabras = textoNormalizado.split(/\s+/).filter(w => w.length >= 4);
    if (palabras.length === 0) return [];

    return inventario
        .filter(p => {
            const nombreNorm = normalizarTexto(p.nombre);
            return palabras.some(w => nombreNorm.includes(w));
        })
        .slice(0, 8);
}

function procesarConsulta(mensaje) {
    sugerirBotones = false;
    const texto = normalizarTexto(mensaje);

    if (["contacto", "asesor", "humano", "vendedor", "whatsapp", "hablar con alguien"].some(k => texto.includes(k))) {
        return `Claro que sí, puedes comunicarte directamente con un asesor a través de nuestro WhatsApp:<br><br>` +
        `<a href="https://api.whatsapp.com/send/?phone=573138349422" target="_blank" style="display: inline-block; background-color: #2d7547; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem;">💬 Hablar con un asesor</a>`;
    }

    if (["gracias", "agradecido", "vale gracias", "muchas gracias"].some(k => texto.includes(k))) {
        const respuestasAmables = [
            "¡Con muchísimo gusto! 😊 Estoy para ayudarte. ¿Necesitas consultar algo más?",
            "¡De nada! Es un placer atenderte. Si necesitas algo más del catálogo, me avisas. 👍",
            "¡Para servirte! Recuerda que puedes preguntarme por disponibilidad de productos en cualquier momento. ✨"
        ];
        return respuestasAmables[Math.floor(Math.random() * respuestasAmables.length)];
    }

    if (["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches"].some(k => texto.includes(k))) {
        const saludos = [
            "¡Hola! 👋 Qué gusto saludarte. Puedes preguntarme por nuestro catálogo de calzado, impermeables, guantes, protección visual, etc.",
            "¡Buenas! 😊 ¿Cómo estás? Dime qué producto necesitas hoy (calzado, impermeables, guantes, etc.) y con gusto te busco la información.",
            "¡Hola, bienvenido! 👋 Estoy aquí para ayudarte a revisar el catálogo. ¿Qué estás buscando hoy?"
        ];
        sugerirBotones = true;
        return saludos[Math.floor(Math.random() * saludos.length)];
    }

    const filtroPrecio = extraerFiltroPrecio(texto);

    let categoriasSolicitadas = CATEGORIAS
        .filter(cat => cat.keywords.some(k => texto.includes(k)))
        .map(cat => ({ id: cat.id, label: cat.label }));

    // Memoria de contexto: si el mensaje no trae una categoría nueva pero
    // "suena" a seguimiento de la respuesta anterior, reutilizamos la
    // última categoría consultada.
    if (categoriasSolicitadas.length === 0 && ultimoContexto.categorias.length > 0 && esContinuacion(texto)) {
        categoriasSolicitadas = ultimoContexto.categorias;
    }

    if (categoriasSolicitadas.length > 0) {
        ultimoContexto.categorias = categoriasSolicitadas;

        let respuestaFinal = "";
        categoriasSolicitadas.forEach(item => {
            respuestaFinal += consultarStockCategoria(item.id, item.label, filtroPrecio) + "<br><br>";
        });
        return respuestaFinal.trim();
    }

    const coincidencias = buscarProductoPorNombre(texto);
    if (coincidencias.length > 0) {
        let html = `Encontré estas coincidencias en el catálogo:<br><br>`;
        coincidencias.forEach(p => {
            const precioMostrar = p.precio && p.precio.trim() !== "" ? p.precio : "Precio a consultar";
            html += `• <b>${p.nombre}</b> ${precioMostrar}<br>`;
        });
        return html;
    }

    const palabrasClave = texto.split(/\s+/).filter(w => w.length >= 4);
    if (palabrasClave.length > 0) {
        sugerirBotones = true;
        return "Lo siento, no contamos con esa marca o producto disponible en este momento. 😕<br><br>Puedes preguntarme por nuestras categorías (calzado, impermeables, guantes, protección visual, etc.) o escribir <i>'Quiero hablar con un asesor'</i> para consultar directamente.";
    }

    sugerirBotones = true;
    return "No entendí tu consulta. Intenta preguntando por categorías como:<br>• <i>¿Qué calzado e impermeables tienes?</i><br>• O escribe <i>'Quiero hablar con un asesor'</i> si deseas contacto directo.";
}

function consultarStockCategoria(cat, nombreMostrar, filtroPrecio) {
    let productos = inventario.filter(p => p.categoria === cat);

    if (productos.length === 0) {
        return `Actualmente no tenemos productos registrados en la categoría ${nombreMostrar}.`;
    }

    const obtenerPrecioNumerico = (precioStr) => {
        if (!precioStr) return NaN;
        const n = parseInt(precioStr.replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(n) ? n : NaN;
    };

    if (filtroPrecio) {
        productos = productos.filter(p => {
            const precioNum = obtenerPrecioNumerico(p.precio);
            if (!Number.isFinite(precioNum)) return false; // sin precio cargado aún
            if (filtroPrecio.tipo === "max") return precioNum <= filtroPrecio.valor;
            if (filtroPrecio.tipo === "min") return precioNum >= filtroPrecio.valor;
            if (filtroPrecio.tipo === "rango") return precioNum >= filtroPrecio.min && precioNum <= filtroPrecio.max;
            return true;
        });

        if (productos.length === 0) {
            return `No encontré productos de ${nombreMostrar} en ese rango de precio (o todavía no tenemos el precio cargado para poder filtrar).`;
        }
    }

    productos.sort((a, b) => {
        const pa = obtenerPrecioNumerico(a.precio);
        const pb = obtenerPrecioNumerico(b.precio);
        if (!Number.isFinite(pa) && !Number.isFinite(pb)) return 0;
        if (!Number.isFinite(pa)) return 1;
        if (!Number.isFinite(pb)) return -1;
        return pa - pb;
    });

    let html = `Tenemos las siguientes opciones en ${nombreMostrar}:<br><br>`;

    productos.forEach(p => {
        const precioMostrar = p.precio && p.precio.trim() !== "" ? p.precio : "Precio a consultar";
        html += `• <b>${p.nombre}</b> ${precioMostrar}<br>`;
    });

    return html;
}

const CHAT_HISTORY_KEY = "chatbotHistorial";
const CHAT_HISTORY_MAX = 20;

function guardarMensajeHistorial(text, sender) {
    try {
        const historial = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || [];
        historial.push({ text, sender });
        while (historial.length > CHAT_HISTORY_MAX) historial.shift();
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historial));
    } catch (e) {
        console.warn("No se pudo guardar el historial del chat:", e);
    }
}

function cargarHistorial() {
    try {
        const historial = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || [];
        historial.forEach(msg => appendMsg(msg.text, msg.sender, false));
    } catch (e) {
        console.warn("No se pudo cargar el historial del chat:", e);
    }
}

let contadorNoLeidos = 0;

function crearBadge() {
    let badge = document.getElementById("chatBadge");
    if (!badge) {
        badge = document.createElement("span");
        badge.id = "chatBadge";
        badge.className = "cb-badge";
        badge.style.display = "none";
        bubble.appendChild(badge);
    }
    return badge;
}

function mostrarBadge() {
    contadorNoLeidos++;
    const badge = crearBadge();
    badge.textContent = contadorNoLeidos > 9 ? "9+" : String(contadorNoLeidos);
    badge.style.display = "flex";
}

function limpiarBadge() {
    contadorNoLeidos = 0;
    const badge = document.getElementById("chatBadge");
    if (badge) badge.style.display = "none";
}

function mostrarTyping() {
    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.classList.add("chat-msg", "bot", "cb-typing");
    div.id = "chatTypingIndicator";
    div.innerHTML = `<span></span><span></span><span></span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function ocultarTyping() {
    const typing = document.getElementById("chatTypingIndicator");
    if (typing) typing.remove();
}

function mostrarBotonesRapidos() {
    ocultarBotonesRapidos();
    const container = document.getElementById("chatMessages");
    const wrap = document.createElement("div");
    wrap.id = "chatQuickReplies";
    wrap.className = "cb-quick-replies";

    CATEGORIAS_RAPIDAS.forEach(id => {
        const cat = CATEGORIAS.find(c => c.id === id);
        if (!cat) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cb-quick-btn";
        btn.textContent = cat.label;
        btn.addEventListener("click", () => sendChatMessage(cat.label));
        wrap.appendChild(btn);
    });

    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}

function ocultarBotonesRapidos() {
    const wrap = document.getElementById("chatQuickReplies");
    if (wrap) wrap.remove();
}

function sendChatMessage(mensajeForzado) {
    const input = document.getElementById("chatInput");
    const usandoBoton = mensajeForzado !== undefined;
    const val = (usandoBoton ? mensajeForzado : input.value).trim();
    if (!val) return;

    appendMsg(val, "user");
    if (!usandoBoton) input.value = "";
    ocultarBotonesRapidos();

    mostrarTyping();

    setTimeout(() => {
        ocultarTyping();
        const resp = procesarConsulta(val);
        appendMsg(resp, "bot");
        if (sugerirBotones) mostrarBotonesRapidos();
    }, 700);
}

function appendMsg(text, sender, guardar = true) {
    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.classList.add("chat-msg", sender);
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (guardar) guardarMensajeHistorial(text, sender);

    if (sender === "bot" && chatWin.classList.contains("hidden")) {
        mostrarBadge();
    }
}

function handleChatKey(e) {
    if (e.key === "Enter") sendChatMessage();
}

const bubble = document.getElementById("chatBubble");
const chatWin = document.getElementById("chatWindow");

let isDragging = false;
let startX, startY, initialX, initialY;
let hasMoved = false;

bubble.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

bubble.addEventListener("touchstart", dragStart, { passive: false });
document.addEventListener("touchmove", drag, { passive: false });
document.addEventListener("touchend", dragEnd);

function toggleChat() {
    if (hasMoved) {
        hasMoved = false;
        return;
    }
    chatWin.classList.toggle("hidden");

    if (!chatWin.classList.contains("hidden")) {
        positionChatWindow();
        limpiarBadge();
    }
}

function dragStart(e) {
    isDragging = true;
    hasMoved = false;

    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    const rect = bubble.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    bubble.style.bottom = "auto";
    bubble.style.right = "auto";
    bubble.style.left = `${initialX}px`;
    bubble.style.top = `${initialY}px`;
}

function drag(e) {
    if (!isDragging) return;

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
        if (e.cancelable) e.preventDefault();
    }

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    const maxX = window.innerWidth - bubble.offsetWidth;
    const maxY = window.innerHeight - bubble.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    bubble.style.left = `${newX}px`;
    bubble.style.top = `${newY}px`;

    positionChatWindow();
}

function dragEnd() {
    isDragging = false;
}

function positionChatWindow() {
    const rect = bubble.getBoundingClientRect();
    const newX = rect.left;
    const newY = rect.top;

    chatWin.style.bottom = "auto";
    chatWin.style.right = "auto";

    const winHeight = chatWin.offsetHeight || 400;
    const winWidth = chatWin.offsetWidth || 320;

    if (newY > winHeight + 10) {
        chatWin.style.top = `${newY - winHeight - 10}px`; // Abre hacia arriba
    } else {
        chatWin.style.top = `${newY + 70}px`;  // Abre hacia abajo si está muy arriba
    }

    let winLeft = newX - (winWidth - 60);
    if (winLeft < 10) winLeft = 10;
    if (winLeft + winWidth > window.innerWidth) winLeft = window.innerWidth - winWidth - 10;
    chatWin.style.left = `${winLeft}px`;
}

if (typeof ResizeObserver !== "undefined") {
    const chatResizeObserver = new ResizeObserver(() => {
        if (!chatWin.classList.contains("hidden")) {
            positionChatWindow();
        }
    });
    chatResizeObserver.observe(chatWin);
}

bubble.style.zIndex = "10000";
chatWin.style.zIndex = "9999";

function inyectarBotonCerrar() {
    if (document.getElementById("chatCloseBtn")) return;

    const btn = document.createElement("button");
    btn.id = "chatCloseBtn";
    btn.type = "button";
    btn.innerHTML = "&times;";
    btn.title = "Cerrar chat";
    btn.className = "cb-close-btn";
    btn.addEventListener("click", () => {
        chatWin.classList.add("hidden");
    });

    if (getComputedStyle(chatWin).position === "static") {
        chatWin.style.position = "relative";
    }
    chatWin.appendChild(btn);
}

(function inyectarEstilosChatbot() {
    if (document.getElementById("chatbotEstilosDinamicos")) return;

    const style = document.createElement("style");
    style.id = "chatbotEstilosDinamicos";
    style.textContent = `
        .cb-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #e53935;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-shadow: 0 0 0 2px #fff;
        }
        .cb-quick-replies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 6px 0;
        }
        .cb-quick-btn {
            border: 1px solid #2d7547;
            color: #2d7547;
            background: #fff;
            border-radius: 14px;
            padding: 5px 10px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .cb-quick-btn:hover {
            background: #2d7547;
            color: #fff;
        }
        .cb-typing {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 6px 10px;
        }
        .cb-typing span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #999;
            animation: cbTypingBlink 1.2s infinite ease-in-out;
        }
        .cb-typing span:nth-child(2) { animation-delay: 0.2s; }
        .cb-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cbTypingBlink {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
        .cb-close-btn {
            position: absolute;
            top: 6px;
            right: 8px;
            background: transparent;
            border: none;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            color: #666;
        }
    `;
    document.head.appendChild(style);
})();

inyectarBotonCerrar();
cargarHistorial();