// 1. INVENTARIO DE PRODUCTOS (BASE DE DATOS SIMULADA)
const inventario = [
    { id: 1, categoria: "calzado", nombre: "Bota Dieléctrica Titanium", precio: "$145.000", stock: 12 },
    { id: 2, categoria: "calzado", nombre: "Zapato Ejecutivo con Puntera", precio: "$120.000", stock: 1 }, 
    { id: 3, categoria: "calzado", nombre: "Bota Caucho Caña Alta", precio: "$65.000", stock: 0 },
    { id: 4, categoria: "impermeables", nombre: "Traje Impermeable PVC Dos Piezas", precio: "$85.000", stock: 15 },
    { id: 5, categoria: "impermeables", nombre: "Capote Impermeable Reflectivo", precio: "$45.000", stock: 1 },
    { id: 6, categoria: "protección visual", nombre: "Gafas de Seguridad Anti-empañante", precio: "$18.000", stock: 50 },
    { id: 7, categoria: "guantes", nombre: "Guantes de Carnaza Reforzados", precio: "$15.000", stock: 0 }
];

  // 2. TOGGLE ABRIR / CERRAR CHAT
function toggleChat() {
    const window = document.getElementById("chatWindow");
    window.classList.toggle("hidden");
}

  // 3. PROCESAMIENTO DE MENSAJES Y LÓGICA DE STOCK
function procesarConsulta(mensaje) {
    const texto = mensaje.toLowerCase().trim();

    if (texto.includes("calzado") || texto.includes("zapatos") || texto.includes("botas")) {
        return consultarStockCategoria("calzado", "calzado");
    }
    else if (texto.includes("impermeables") || texto.includes("lluvia") || texto.includes("traje")) {
        return consultarStockCategoria("impermeables", "trajes impermeables");
    }
    else if (texto.includes("gafas") || texto.includes("lentes") || texto.includes("visual")) {
        return consultarStockCategoria("protección visual", "protección visual");
    }
    else if (texto.includes("guantes")) {
        return consultarStockCategoria("guantes", "guantes");
    } 
    else if (texto.includes("hola") || texto.includes("buenas")) {
        return "¡Hola! Pregúntame por nuestro catálogo disponible de **calzado**, **impermeables**, **guantes** o **protección visual**.";
    } 
    else {
        return "No entendí tu consulta. Intenta preguntando:<br>• <i>¿Qué calzado hay?</i><br>• <i>¿Tienes impermeables?</i><br>• <i>¿Hay guantes?</i>";
    }
}

function consultarStockCategoria(cat, nombreMostrar) {
    const productos = inventario.filter(p => p.categoria === cat);
    
    // CASO 1: No hay productos registrados o todos están sin stock
    const conStock = productos.filter(p => p.stock > 0);
    if (conStock.length === 0) {
        return `Actualmente no tenemos stock disponible en ${nombreMostrar} 😔.<br><br>` +
    `¿Te gustaría contactar a un asesor por <a href="https://api.whatsapp.com/send/?phone=573189262617" target="_blank" style="color:var(--orange);">WhatsApp</a> para encargar un pedido especial?`;
    }

    // CASO 2: Hay stock disponible
    let html = `Tenemos las siguientes opciones en ${nombreMostrar}:<br><br>`;
    
    productos.forEach(p => {
        if (p.stock === 0) {
        // Producto Agotado
        html += `• <s>${p.nombre}</s> — <span class="badge-stock">AGOTADO</span><br>`;
    } else if (p.stock === 1) {
        // ÚLTIMA UNIDAD
        html += `• <b>${p.nombre}</b> — ${p.precio} <span class="badge-last">(¡ÚLTIMA UNIDAD!)</span><br>`;
    } else {
        // Stock normal
        html += `• <b>${p.nombre}</b> — ${p.precio} (${p.stock} dispon.)<br>`;
    }
    });

    return html;
}

  // 4. INTERACCIÓN CON EL DOM
function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val) return;

    appendMsg(val, "user");
    input.value = "";

    setTimeout(() => {
const resp = procesarConsulta(val);
    appendMsg(resp, "bot");
    }, 350);
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