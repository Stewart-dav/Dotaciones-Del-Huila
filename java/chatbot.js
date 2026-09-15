function toggleChat() {
    const window = document.getElementById("chatWindow");
    window.classList.toggle("hidden");
}

function procesarConsulta(mensaje) {
    const texto = mensaje.toLowerCase().trim();

    if (texto.includes("contacto") || texto.includes("persona") || texto.includes("asesor") || texto.includes("humano") || texto.includes("vendedor") || texto.includes("whatsapp") || texto.includes("hablar con alguien")) {
        return `Claro que sí, puedes comunicarte directamente con un asesor a través de nuestro WhatsApp:<br><br>` +
        `<a href="https://api.whatsapp.com/send/?phone=573138349422" target="_blank" style="display: inline-block; background-color: #2d7547; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem;">💬 Hablar con un asesor</a>`;
    }

    if (texto.includes("gracias") || texto.includes("agradecido") || texto.includes("vale gracias") || texto.includes("muchas gracias")) {
        const respuestasAmables = [
            "¡Con muchísimo gusto! 😊 Estoy para ayudarte. ¿Necesitas consultar algo más?",
            "¡De nada! Es un placer atenderte. Si necesitas algo más del catálogo, me avisas. 👍",
            "¡Para servirte! Recuerda que puedes preguntarme por disponibilidad de productos en cualquier momento. ✨"
        ];
        return respuestasAmables[Math.floor(Math.random() * respuestasAmables.length)];
    }

    if (texto.includes("hola") || texto.includes("buenas") || texto.includes("buenos dias") || texto.includes("buenas tardes") || texto.includes("buenas noches")) {
        const saludos = [
            "¡Hola! 👋 Qué gusto saludarte. Puedes preguntarme por nuestro catálogo de calzado, impermeables, guantes, protección visual, etc.",
            "¡Buenas! 😊 ¿Cómo estás? Dime qué producto necesitas hoy (calzado, impermeables, guantes, etc.) y con gusto te busco la información.",
            "¡Hola, bienvenido! 👋 Estoy aquí para ayudarte a revisar el catálogo. ¿Qué estás buscando hoy?"
        ];
        return saludos[Math.floor(Math.random() * saludos.length)];
    }

    const categoriasSolicitadas = [];

    if (texto.includes("calzado") || texto.includes("zapatos") || texto.includes("botas")) {
        categoriasSolicitadas.push({ id: "calzado", label: "Calzado" });
    }
    if (texto.includes("impermeables") || texto.includes("lluvia") || texto.includes("traje")) {
        categoriasSolicitadas.push({ id: "impermeables", label: "Trajes Impermeables" });
    }
    if (texto.includes("gafas") || texto.includes("lentes") || texto.includes("visual")) {
        categoriasSolicitadas.push({ id: "protección visual", label: "Protección Visual" });
    }
    if (texto.includes("guantes")) {
        categoriasSolicitadas.push({ id: "guantes", label: "Guantes" });
    }

    if (categoriasSolicitadas.length > 0) {
        let respuestaFinal = "";
        categoriasSolicitadas.forEach(item => {
            respuestaFinal += consultarStockCategoria(item.id, item.label) + "<br><br>";
        });
        return respuestaFinal.trim();
    }

    return "No entendí tu consulta. Intenta preguntando por categorías como:<br>• <i>¿Qué calzado e impermeables tienes?</i><br>• O escribe <i>'Quiero hablar con un asesor'</i> si deseas contacto directo.";
}

function consultarStockCategoria(cat, nombreMostrar) {
    const productos = inventario.filter(p => p.categoria === cat);
    
    if (productos.length === 0) {
        return `Actualmente no tenemos productos registrados en la categoría ${nombreMostrar}.`;
    }

    const obtenerPrecioNumerico = (precioStr) => {
        return parseInt(precioStr.replace(/[^0-9]/g, ''), 10);
    };

    productos.sort((a, b) => obtenerPrecioNumerico(a.precio) - obtenerPrecioNumerico(b.precio));

    let html = `Tenemos las siguientes opciones en ${nombreMostrar}:<br><br>`;

    productos.forEach(p => {
        html += `• <b>${p.nombre}</b> ${p.precio}<br>`;
    });
    
    return html;
}

function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val) return;

    appendMsg(val, "user");
    input.value = "";

    setTimeout(() => {
        const resp = procesarConsulta(val);
        appendMsg(resp, "bot");
    }, 400);
}

function appendMsg(text, sender) {
    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.classList.add("chat-msg", sender);
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
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

    chatWin.style.bottom = "auto";
    chatWin.style.right = "auto";

    if (newY > 520) {
    chatWin.style.top = `${newY - 510}px`; // Abre hacia arriba
} else {
    chatWin.style.top = `${newY + 70}px`;  // Abre hacia abajo si está muy arriba
}

    let winLeft = newX - 300;
    if (winLeft < 10) winLeft = 10;
    if (winLeft + 360 > window.innerWidth) winLeft = window.innerWidth - 370;
    chatWin.style.left = `${winLeft}px`;
}

function dragEnd() {
    isDragging = false;
}

function toggleChat() {
    if (hasMoved) {
    hasMoved = false;
    return;
}
    chatWin.classList.toggle("hidden");
}