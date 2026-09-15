const inventario = [
    { id: 1, categoria: "calzado", nombre: "Bota Dieléctrica Titanium", precio: "$145.000", stock: 12 },
    { id: 2, categoria: "calzado", nombre: "Zapato Ejecutivo con Puntera", precio: "$120.000", stock: 20 }, 
    { id: 3, categoria: "calzado", nombre: "Bota Caucho Caña Alta", precio: "$65.000", stock: 1 },
    { id: 4, categoria: "impermeables", nombre: "Traje Impermeable PVC Dos Piezas", precio: "$85.000", stock: 15 },
    { id: 5, categoria: "impermeables", nombre: "Capote Impermeable Reflectivo", precio: "$45.000", stock: 1 },
    { id: 6, categoria: "protección visual", nombre: "Gafas de Seguridad Anti-empañante", precio: "$18.000", stock: 50 },
    { id: 7, categoria: "guantes", nombre: "Guantes de Carnaza Reforzados", precio: "$15.000", stock: 0 }
];

function toggleChat() {
    const window = document.getElementById("chatWindow");
    window.classList.toggle("hidden");
}

function procesarConsulta(mensaje) {
    const texto = mensaje.toLowerCase().trim();

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
    "¡Buenas! 😊 ¿Cómo estás? Dime qué producto necesitas hoy (calzado, impermeables, guantes, etc.) y con gusto te busco la disponibilidad.",
    "¡Hola, bienvenido! 👋 Estoy aquí para ayudarte a revisar el inventario. ¿Qué estás buscando hoy?"
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

    return "No entendí tu consulta. Intenta preguntando por categorías como:<br>• <i>¿Qué calzado e impermeables tienes?</i><br>• O salúdame con un <i>'Hola'</i>.";
}

function consultarStockCategoria(cat, nombreMostrar) {
    const productos = inventario.filter(p => p.categoria === cat);

    const conStock = productos.filter(p => p.stock > 0);
    if (conStock.length === 0) {
    return `Actualmente no tenemos stock disponible en ${nombreMostrar} 😔.<br><br>` +
    `¿Te gustaría contactar a un asesor por <a href="https://api.whatsapp.com/send/?phone=573138349422" target="_blank" style="color:var(--orange);">WhatsApp</a> para encargar un pedido especial?
    O mira todos nuestros <a href="catalogo.html" target="_blank" style="color:var(--orange);">cátalogos</a>.`;
}

    const obtenerPrecioNumerico = (precioStr) => {
    return parseInt(precioStr.replace(/[^0-9]/g, ''), 10);
};

    productos.sort((a, b) => obtenerPrecioNumerico(a.precio) - obtenerPrecioNumerico(b.precio));

    let html = `Tenemos las siguientes opciones en ${nombreMostrar}:<br><br>`;

    productos.forEach(p => {
    if (p.stock === 0) {

    html += `• <s>${p.nombre}</s> <span class="badge-stock">AGOTADO</span><br>`;
    } else if (p.stock === 1) {

    html += `• <b>${p.nombre}</b> ${p.precio} <span class="badge-last">(¡ÚLTIMA UNIDAD!)</span><br>`;
    } else {

    html += `• <b>${p.nombre}</b> ${p.precio} (${p.stock} dispon.)<br>`;
    }
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
