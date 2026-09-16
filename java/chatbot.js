function normalizarTexto(str) {
    return str
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

const CATEGORIAS = [
    { id: "calzado", label: "Calzado", keywords: ["calzado", "zapatos", "zapato", "botas", "bota", "botin", "botines", "tenis", "sueco", "suecos"] },
    { id: "protección visual", label: "Protección Visual", keywords: ["proteccion visual", "gafas", "lentes", "visual", "anteojos"] },
    { id: "protección manual", label: "Protección Manual", keywords: ["proteccion manual", "guantes", "guante", "manos", "manual"] },
    { id: "impermeables", label: "Trajes Impermeables", keywords: ["impermeable", "impermeables", "lluvia", "traje", "poncho", "delantal"] },
    { id: "primeros auxilios", label: "Primeros Auxilios", keywords: ["primeros auxilios", "botiquin", "botiquines", "auxilios", "extintor", "extintores", "camilla"] },
    { id: "señalización", label: "Señalización", keywords: ["senalizacion", "senales", "senal", "carteles", "avisos", "conos", "chaleco reflectivo"] },
    { id: "uniformes dama", label: "Uniformes Dama", keywords: ["uniformes dama", "uniforme dama", "dama", "mujer", "femenino"] },
    { id: "alturas", label: "Alturas", keywords: ["alturas", "lineas de vida", "linea de vida", "arnes", "eslinga", "mosqueton"] },
    { id: "uniformes hombre", label: "Uniformes Hombre", keywords: ["uniformes hombre", "uniforme hombre", "hombre", "masculino"] },
    { id: "protección personal", label: "Protección Personal", keywords: ["proteccion personal", "proteccion", "personal", "casco", "cascos", "tapabocas", "careta", "mascara", "protector auditivo"] },
    { id: "higiene y aseo", label: "Higiene y Aseo", keywords: ["higiene y aseo", "higiene", "aseo", "limpieza", "jabon", "detergente", "escoba", "trapeador"] },
    { id: "mascotas", label: "Mascotas", keywords: ["mascotas", "perro", "perros", "gato", "gatos", "animal", "cachorro", "alimento"] },
];

const CATEGORIAS_RAPIDAS = ["calzado", "impermeables", "protección manual", "protección visual", "alturas", "mascotas"];

/* Atributos comunes para filtrar dentro de categorías */
const ATRIBUTOS = [
    { id: "con_puntera", label: "Con puntera", keywords: ["con puntera", "puntera", "punta de acero", "acero"] },
    { id: "sin_puntera", label: "Sin puntera", keywords: ["sin puntera", "sin punta"] },
    { id: "dama", label: "Dama / Mujer", keywords: ["dama", "mujer", "femenino"] },
    { id: "hombre", label: "Hombre", keywords: ["hombre", "masculino"] },
    { id: "dielectrica", label: "Dieléctrica", keywords: ["dielectrica", "dielectrico", "aislante"] },
    { id: "waterproof", label: "Waterproof / Impermeable", keywords: ["waterproof", "impermeable", "agua"] },
    { id: "soldador", label: "Soldador", keywords: ["soldador", "soldadura", "soldar"] },
    { id: "nitrilo", label: "Nitrilo", keywords: ["nitrilo"] },
    { id: "latex", label: "Látex", keywords: ["latex"] },
    { id: "carnaza", label: "Carnaza", keywords: ["carnaza"] },
    { id: "vaqueta", label: "Vaqueta", keywords: ["vaqueta"] },
    { id: "reflectivo", label: "Reflectivo", keywords: ["reflectivo", "reflectante"] },
    { id: "antifluido", label: "Antifluido", keywords: ["antifluido"] },
    { id: "claro", label: "Lente claro", keywords: ["claro"] },
    { id: "oscuro", label: "Lente oscuro", keywords: ["oscuro", "gris"] },
];

const POR_PAGINA = 7;

function raizPalabra(palabra) {
    let r = palabra;
    if (r.length > 5 && r.endsWith("es")) {
        r = r.slice(0, -2);
    } else if (r.length > 4 && r.endsWith("s")) {
        r = r.slice(0, -1);
    }
    if (r.length > 4 && (r.endsWith("o") || r.endsWith("a"))) {
        r = r.slice(0, -1);
    }
    return r;
}

function coincidePalabraConNombre(nombreNormalizado, palabra) {
    if (nombreNormalizado.includes(palabra)) return true;

    const raizBuscada = raizPalabra(palabra);
    if (raizBuscada.length < 3) return false;

    return nombreNormalizado.split(/\s+/).some(token => {
        if (token.length < 3) return false; // ignora "a", "de", "4", etc.
        const raizToken = raizPalabra(token);
        if (raizToken.length < 3) return false;
        return raizToken === raizBuscada
            || (raizToken.length >= 4 && raizToken.startsWith(raizBuscada))
            || (raizBuscada.length >= 4 && raizBuscada.startsWith(raizToken));
    });
}

const PALABRAS_CATEGORIA_TODAS = new Set(
    CATEGORIAS.flatMap(c => c.keywords.flatMap(k => k.split(" ")))
);

const PALABRAS_ATRIBUTO_TODAS = new Set(
    ATRIBUTOS.flatMap(a => a.keywords.flatMap(k => k.split(" ")))
);

const PALABRAS_RELLENO = new Set([
    "tienes", "tienen", "tengo", "necesito", "busco", "buscando", "quiero",
    "quisiera", "cuales", "cual", "que", "hay", "algun", "alguna", "algunas",
    "algunos", "tambien", "porfavor", "favor", "gracias", "precio", "precios",
    "cuanto", "cuanta", "cuesta", "cuestan", "disponible", "disponibles",
    "catalogo", "informacion", "dame", "muestrame", "mostrar", "para", "como",
    "donde", "puedo", "puedes", "podrias", "manejan", "manejas", "venden", "vendes",
    "opciones", "opcion", "producto", "productos", "ver", "lista", "listado",
    "info", "datos", "modelo", "modelos", "tipo", "tipos", "algo", "unos", "unas"
]);

/* Estado de conversación */
let ultimoContexto = {
    categorias: [],
    atributos: [],
    productos: [],
    pagina: 0,
    total: 0,
    encabezado: "",
    filtroPrecio: null
};

let sugerirBotones = false;
let botonesContexto = []; // botones dinámicos según la última respuesta

/* Carrito se inicializa al final; declaración anticipada */
let carritoCotizacion = [];

const PALABRAS_CONTINUACION = [
    "otro", "otra", "otros", "otras", "algo mas", "alguno", "alguna", "algunas",
    "tambien", "mas opciones", "y que mas", "hay mas", "tienes mas", "ese", "esos",
    "ver mas", "mostrar mas", "siguientes", "siguiente", "continuar", "mas",
    "pagina siguiente", "los demas", "el resto"
];

const PALABRAS_BARATO = ["mas barata", "mas barato", "mas economica", "mas economico", "la mas barata", "el mas barato", "barata", "barato", "economica", "economico"];
const PALABRAS_CARO = ["mas cara", "mas caro", "la mas cara", "el mas caro", "cara", "caro", "premium"];

const PALABRAS_CONTINUACION_INDIVIDUALES = new Set(
    PALABRAS_CONTINUACION.flatMap(f => f.split(" "))
);
 
function esContinuacion(textoNormalizado) {
    return PALABRAS_CONTINUACION.some(p => textoNormalizado.includes(p));
}

function esPedirMas(textoNormalizado) {
    const frases = ["ver mas", "mostrar mas", "siguientes", "siguiente", "continuar", "hay mas", "tienes mas", "mas opciones", "los demas", "el resto", "pagina siguiente"];
    if (frases.some(f => textoNormalizado.includes(f))) return true;
    // "mas" solo si hay resultados previos
    if (textoNormalizado === "mas" || textoNormalizado === "mas por favor" || textoNormalizado === "mas productos") return true;
    return false;
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

function extraerAtributos(textoNormalizado) {
    return ATRIBUTOS.filter(attr =>
        attr.keywords.some(k => textoNormalizado.includes(k))
    );
}

function obtenerPrecioNumerico(precioStr) {
    if (!precioStr) return NaN;
    const n = parseInt(String(precioStr).replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : NaN;
}

function productoCoincideAtributo(nombreNorm, attr) {
    // Casos especiales para no confundir "con puntera" vs "sin puntera"
    if (attr.id === "con_puntera") {
        return (nombreNorm.includes("con puntera") || nombreNorm.includes("puntera de acero") || nombreNorm.includes("punta de acero"))
            && !nombreNorm.includes("sin puntera");
    }
    if (attr.id === "sin_puntera") {
        return nombreNorm.includes("sin puntera");
    }
    if (attr.id === "dama") {
        return nombreNorm.includes("dama") || nombreNorm.includes("mujer") || nombreNorm.includes("femenino");
    }
    if (attr.id === "hombre") {
        // Evitar que "hombre" matchee productos que solo dicen "dama"
        return (nombreNorm.includes("hombre") || nombreNorm.includes("masculino")) && !nombreNorm.includes("dama");
    }
    return attr.keywords.some(k => nombreNorm.includes(k));
}

function aplicarFiltrosProductos(productos, filtroPrecio, atributos, palabrasFiltro) {
    let resultado = productos.slice();

    if (atributos && atributos.length > 0) {
        resultado = resultado.filter(p => {
            const nombreNorm = normalizarTexto(p.nombre);
            return atributos.every(attr => productoCoincideAtributo(nombreNorm, attr));
        });
    }

    if (palabrasFiltro && palabrasFiltro.length > 0) {
        resultado = resultado.filter(p => {
            const nombreNorm = normalizarTexto(p.nombre);
            return palabrasFiltro.every(w => coincidePalabraConNombre(nombreNorm, w));
        });
    }

    if (filtroPrecio) {
        resultado = resultado.filter(p => {
            const precioNum = obtenerPrecioNumerico(p.precio);
            if (!Number.isFinite(precioNum)) return false;
            if (filtroPrecio.tipo === "max") return precioNum <= filtroPrecio.valor;
            if (filtroPrecio.tipo === "min") return precioNum >= filtroPrecio.valor;
            if (filtroPrecio.tipo === "rango") return precioNum >= filtroPrecio.min && precioNum <= filtroPrecio.max;
            return true;
        });
    }

    // Ordenar por precio (los sin precio al final)
    resultado.sort((a, b) => {
        const pa = obtenerPrecioNumerico(a.precio);
        const pb = obtenerPrecioNumerico(b.precio);
        if (!Number.isFinite(pa) && !Number.isFinite(pb)) return 0;
        if (!Number.isFinite(pa)) return 1;
        if (!Number.isFinite(pb)) return -1;
        return pa - pb;
    });

    return resultado;
}

function buscarProductoPorNombre(textoNormalizado) {
    const palabras = textoNormalizado
        .split(/\s+/)
        .filter(w => w.length >= 3 && !PALABRAS_RELLENO.has(w) && !PALABRAS_CATEGORIA_TODAS.has(w) && !PALABRAS_CONTINUACION_INDIVIDUALES.has(w));

    if (palabras.length === 0) return [];

    // Scoring: más coincidencias = más relevante
    const scored = inventario.map(p => {
        const nombreNorm = normalizarTexto(p.nombre);
        let score = 0;
        palabras.forEach(w => {
            if (nombreNorm.includes(w)) score += 3;
            else if (coincidePalabraConNombre(nombreNorm, w)) score += 1;
        });
        return { producto: p, score };
    }).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map(x => x.producto);
}

function formatearListaProductos(productos, desde, cantidad) {
    const slice = productos.slice(desde, desde + cantidad);
    return slice.map(p => {
        const precioMostrar = formatearPrecio(p);
        const yaEnCarrito = carritoCotizacion.some(c => c.id === p.id);
        const btnLabel = yaEnCarrito ? "✓ En cotización" : "+ Agregar a cotización";
        const btnClass = yaEnCarrito ? "cb-add-cart cb-add-cart-done" : "cb-add-cart";
        const btnDisabled = yaEnCarrito ? " disabled" : "";
        return `• <b>${p.nombre}</b><br>${precioMostrar}<br>` +
            `<button type="button" class="${btnClass}" data-pid="${p.id}"${btnDisabled}>${btnLabel}</button>`;
    }).join("<br><br>");
}

function mensajePiePaginacion(total, pagina, porPagina) {
    const mostrados = Math.min((pagina + 1) * porPagina, total);
    if (mostrados >= total) {
        return `<br><br><i>✅ Esos son todos (${total} productos).</i>`;
    }
    const restantes = total - mostrados;
    return `<br><br><i>Mostrando ${mostrados} de ${total}. Escribe <b>"ver más"</b> para ver ${Math.min(restantes, porPagina)} más.</i>`;
}

function generarBotonesAtributos(categoriaId, productosActuales) {
    const botones = [];
    // Solo sugerir atributos que realmente existan en los productos actuales
    ATRIBUTOS.forEach(attr => {
        const tiene = productosActuales.some(p => productoCoincideAtributo(normalizarTexto(p.nombre), attr));
        if (tiene) botones.push(attr.label);
    });
    // Máximo 5 botones de atributos + "Ver más" si aplica
    return botones.slice(0, 5);
}

function consultarStockCategoria(cat, nombreMostrar, filtroPrecio, palabrasFiltro, atributos, resetPagina = true) {
    let productos = inventario.filter(p => p.categoria === cat);

    if (productos.length === 0) {
        return `Actualmente no tenemos productos registrados en la categoría <b>${nombreMostrar}</b>.`;
    }

    productos = aplicarFiltrosProductos(productos, filtroPrecio, atributos, palabrasFiltro);

    if (productos.length === 0) {
        let msg = `No encontré productos de <b>${nombreMostrar}</b>`;
        const detalles = [];
        if (palabrasFiltro && palabrasFiltro.length > 0) {
            detalles.push(`que coincidan con "${palabrasFiltro.join(" ")}"`);
        }
        if (atributos.length > 0) {
            detalles.push(`con los filtros: ${atributos.map(a => a.label).join(", ")}`);
        }
        if (filtroPrecio) {
            detalles.push(`en ese rango de precio`);
        }
        if (detalles.length > 0) {
            msg += " " + detalles.join(" ni ");
        }
        msg += `.<br><br>Prueba sin filtros o escribe <i>"quiero hablar con un asesor"</i>.`;
        sugerirBotones = true;
        return msg;
    }

    let encabezado = `📦 <b>${nombreMostrar}</b> — ${productos.length} ${productos.length === 1 ? "opción" : "opciones"}`;
    if (atributos.length > 0) {
        encabezado += ` <i>(${atributos.map(a => a.label).join(", ")})</i>`;
    }
    encabezado += `:<br><br>`;

    if (palabrasFiltro && palabrasFiltro.length > 0) {
        const todosCoinciden = productos.every(p => {
            const n = normalizarTexto(p.nombre);
            return palabrasFiltro.every(w => coincidePalabraConNombre(n, w));
        });
        if (todosCoinciden) {
            encabezado = `🔍 En <b>${nombreMostrar}</b> que coinciden con "<i>${palabrasFiltro.join(" ")}</i>" (${productos.length}):<br><br>`;
        }
    }

    // Guardar estado para paginación
    if (resetPagina) {
        ultimoContexto.productos = productos;
        ultimoContexto.pagina = 0;
        ultimoContexto.total = productos.length;
        ultimoContexto.encabezado = encabezado;
        ultimoContexto.filtroPrecio = filtroPrecio;
    }

    const pagina = resetPagina ? 0 : ultimoContexto.pagina;
    const lista = formatearListaProductos(productos, pagina * POR_PAGINA, POR_PAGINA);
    const pie = mensajePiePaginacion(productos.length, pagina, POR_PAGINA);

    // Botones de atributos útiles
    botonesContexto = generarBotonesAtributos(cat, productos);
    if (productos.length > POR_PAGINA) {
        botonesContexto.unshift("Ver más");
    }

    return encabezado + lista + pie;
}

function mostrarSiguientePagina() {
    if (!ultimoContexto.productos || ultimoContexto.productos.length === 0) {
        sugerirBotones = true;
        return "No hay una lista anterior para continuar. Pregúntame por una categoría (calzado, guantes, impermeables...).";
    }

    const total = ultimoContexto.productos.length;
    const siguientePagina = ultimoContexto.pagina + 1;
    const desde = siguientePagina * POR_PAGINA;

    if (desde >= total) {
        return `Ya te mostré todos los productos de esa lista (${total}). ¿Buscas otra categoría o quieres filtrar por algo específico?`;
    }

    ultimoContexto.pagina = siguientePagina;
    const lista = formatearListaProductos(ultimoContexto.productos, desde, POR_PAGINA);
    const pie = mensajePiePaginacion(total, siguientePagina, POR_PAGINA);

    botonesContexto = [];
    if ((siguientePagina + 1) * POR_PAGINA < total) {
        botonesContexto.push("Ver más");
    }

    return `📄 Continuación:<br><br>` + lista + pie;
}

function procesarOrdenPrecio(texto, productosBase) {
    const quiereBarato = PALABRAS_BARATO.some(p => texto.includes(p));
    const quiereCaro = PALABRAS_CARO.some(p => texto.includes(p));
    if (!quiereBarato && !quiereCaro) return null;

    const conPrecio = productosBase.filter(p => Number.isFinite(obtenerPrecioNumerico(p.precio)));
    if (conPrecio.length === 0) {
        return `Todavía no tenemos precios cargados para ordenar por valor.<br><br>Puedes escribir <i>"quiero hablar con un asesor"</i> y te cotizamos al instante.`;
    }

    const ordenados = conPrecio.slice().sort((a, b) => {
        const pa = obtenerPrecioNumerico(a.precio);
        const pb = obtenerPrecioNumerico(b.precio);
        return quiereBarato ? pa - pb : pb - pa;
    });

    const top = ordenados.slice(0, 5);
    const titulo = quiereBarato ? "Las opciones más económicas" : "Las opciones de mayor valor";
    const bloques = top.map(p => `• <b>${p.nombre}</b><br>${formatearPrecio(p)}`);
    return `${titulo}:<br><br>` + bloques.join("<br><br>");
}

function procesarConsulta(mensaje) {
    sugerirBotones = false;
    botonesContexto = [];
    const texto = normalizarTexto(mensaje);

    // --- Contacto / asesor ---
    if (["contacto", "asesor", "humano", "vendedor", "whatsapp", "hablar con alguien", "cotizar", "cotizacion"].some(k => texto.includes(k))) {
        return `Claro que sí, puedes comunicarte directamente con un asesor a través de nuestro WhatsApp:<br><br>` +
            `<a href="https://api.whatsapp.com/send/?phone=573138349422" target="_blank" style="display: inline-block; background-color: #2d7547; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem;">💬 Hablar con un asesor</a>`;
    }

    // --- Gracias ---
    if (["gracias", "agradecido", "vale gracias", "muchas gracias", "ok gracias", "listo gracias"].some(k => texto.includes(k))) {
        const respuestasAmables = [
            "¡Con muchísimo gusto! 😊 ¿Necesitas consultar algo más del catálogo?",
            "¡De nada! Si necesitas otra categoría o un filtro, me avisas. 👍",
            "¡Para servirte! Puedes preguntarme por calzado, guantes, impermeables, alturas, etc. ✨"
        ];
        sugerirBotones = true;
        return respuestasAmables[Math.floor(Math.random() * respuestasAmables.length)];
    }

    // --- Saludos ---
    if (["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "buen dia"].some(k => texto.includes(k))) {
        const saludos = [
            "¡Hola! 👋 Bienvenido. Puedes preguntarme por <b>calzado</b>, <b>guantes</b>, <b>impermeables</b>, <b>protección visual</b>, <b>alturas</b>, <b>mascotas</b> y más.",
            "¡Buenas! 😊 Dime qué necesitas (calzado, impermeables, guantes, cascos...) y te muestro las opciones.",
            "¡Hola! 👋 Estoy aquí para ayudarte con el catálogo. ¿Qué estás buscando hoy?"
        ];
        sugerirBotones = true;
        return saludos[Math.floor(Math.random() * saludos.length)];
    }

    // --- Ayuda ---
    if (["ayuda", "help", "que puedes hacer", "como funciona", "opciones"].some(k => texto.includes(k))) {
        sugerirBotones = true;
        return `Puedo ayudarte con el catálogo de seguridad industrial y más. Prueba con:<br><br>` +
            `• <i>"¿Qué calzado tienes?"</i><br>` +
            `• <i>"Guantes de nitrilo"</i><br>` +
            `• <i>"Botas con puntera"</i><br>` +
            `• <i>"Impermeables"</i><br>` +
            `• <i>"Ver más"</i> (para continuar una lista)<br>` +
            `• <i>"Quiero hablar con un asesor"</i><br><br>` +
            `También puedes usar los botones de abajo 👇`;
    }

    // --- Paginación: "ver más" ---
    // Se maneja SIEMPRE aquí mismo, exista o no una lista previa. Si dejáramos
    // pasar el texto de largo cuando no hay contexto (ej. tras recargar la
    // página, ya que la paginación solo vive en memoria), "ver mas" terminaba
    // buscándose como si fuera un producto, y la palabra suelta "mas" generaba
    // coincidencias falsas (MASTER, Thomas, MASCULINA, etc.).
    if (esPedirMas(texto)) {
        if (ultimoContexto.productos && ultimoContexto.productos.length > 0) {
            return mostrarSiguientePagina();
        }
        sugerirBotones = true;
        return "No tengo una lista anterior para continuar (puede que se haya perdido al recargar la página). Pregúntame de nuevo por una categoría, por ejemplo: <i>calzado</i>, <i>guantes</i>, <i>impermeables</i>...";
    }

    const filtroPrecio = extraerFiltroPrecio(texto);
    const atributosDetectados = extraerAtributos(texto);

    // Detectar categorías
    let categoriasSolicitadas = CATEGORIAS
        .filter(cat => cat.keywords.some(k => texto.includes(k)))
        .map(cat => ({ id: cat.id, label: cat.label }));

    // Si no hay categoría nueva pero hay contexto + continuación o solo atributos → reutilizar
    if (categoriasSolicitadas.length === 0 && ultimoContexto.categorias.length > 0) {
        if (esContinuacion(texto) || atributosDetectados.length > 0 || filtroPrecio) {
            categoriasSolicitadas = ultimoContexto.categorias;
        }
    }

    // Orden por precio sobre el contexto actual
    if (categoriasSolicitadas.length === 0 && ultimoContexto.productos.length > 0) {
        const orden = procesarOrdenPrecio(texto, ultimoContexto.productos);
        if (orden) return orden;
    }

    if (categoriasSolicitadas.length > 0) {
        ultimoContexto.categorias = categoriasSolicitadas;
        ultimoContexto.atributos = atributosDetectados;

        // Palabras extra que no son categoría ni atributo ni relleno
        const palabrasFiltro = texto
            .split(/\s+/)
            .filter(w =>
                w.length >= 4 &&
                !PALABRAS_CATEGORIA_TODAS.has(w) &&
                !PALABRAS_ATRIBUTO_TODAS.has(w) &&
                !PALABRAS_RELLENO.has(w) &&
                !PALABRAS_CONTINUACION.some(c => c.includes(w))
            );

        // Si pidió "más barata/cara" dentro de categoría
        if (PALABRAS_BARATO.some(p => texto.includes(p)) || PALABRAS_CARO.some(p => texto.includes(p))) {
            let productos = inventario.filter(p => categoriasSolicitadas.some(c => c.id === p.categoria));
            productos = aplicarFiltrosProductos(productos, filtroPrecio, atributosDetectados, palabrasFiltro);
            const orden = procesarOrdenPrecio(texto, productos);
            if (orden) return orden;
        }

        let respuestaFinal = "";
        categoriasSolicitadas.forEach(item => {
            respuestaFinal += consultarStockCategoria(
                item.id,
                item.label,
                filtroPrecio,
                palabrasFiltro,
                atributosDetectados,
                true
            ) + "<br><br>";
        });
        return respuestaFinal.trim();
    }

    // Búsqueda libre por nombre de producto
    const coincidencias = buscarProductoPorNombre(texto);
    if (coincidencias.length > 0) {
        // Guardar para posible paginación
        ultimoContexto.productos = coincidencias;
        ultimoContexto.pagina = 0;
        ultimoContexto.total = coincidencias.length;
        ultimoContexto.categorias = [];
        ultimoContexto.atributos = [];

        const lista = formatearListaProductos(coincidencias, 0, POR_PAGINA);
        const pie = mensajePiePaginacion(coincidencias.length, 0, POR_PAGINA);

        botonesContexto = [];
        if (coincidencias.length > POR_PAGINA) botonesContexto.push("Ver más");

        return `🔍 Encontré <b>${coincidencias.length}</b> coincidencia${coincidencias.length === 1 ? "" : "s"}:<br><br>` + lista + pie;
    }

    // Si solo escribió atributos sin categoría y hay contexto previo
    if (atributosDetectados.length > 0 && ultimoContexto.categorias.length > 0) {
        ultimoContexto.atributos = atributosDetectados;
        let respuestaFinal = "";
        ultimoContexto.categorias.forEach(item => {
            respuestaFinal += consultarStockCategoria(
                item.id,
                item.label,
                filtroPrecio,
                [],
                atributosDetectados,
                true
            ) + "<br><br>";
        });
        return respuestaFinal.trim();
    }

    const palabrasClave = texto.split(/\s+/).filter(w => w.length >= 4 && !PALABRAS_RELLENO.has(w));
    if (palabrasClave.length > 0) {
        sugerirBotones = true;
        return `No encontré ese producto o marca en el catálogo actual. 😕<br><br>` +
            `Puedes preguntarme por: <b>calzado, guantes, impermeables, gafas, alturas, uniformes, mascotas</b>...<br>` +
            `O escribe <i>"quiero hablar con un asesor"</i> para consultar directamente.`;
    }

    sugerirBotones = true;
    return `No entendí tu consulta. Prueba con algo como:<br><br>` +
        `• <i>"¿Qué calzado tienes?"</i><br>` +
        `• <i>"Guantes de nitrilo"</i><br>` +
        `• <i>"Botas con puntera dama"</i><br>` +
        `• <i>"Quiero hablar con un asesor"</i>`;
}

/* ========== Precios, historial, UI ========== */

const CHAT_HISTORY_KEY = "chatbotHistorial";
const CHAT_HISTORY_MAX = 50;
const PRECIOS_CACHE_KEY = "chatbotPreciosVistos";

function leerCachePrecios() {
    try {
        return JSON.parse(localStorage.getItem(PRECIOS_CACHE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function guardarCachePrecios(cache) {
    try {
        localStorage.setItem(PRECIOS_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn("No se pudo guardar el caché de precios:", e);
    }
}

function formatearPrecio(producto) {
    const precioActual = producto.precio && producto.precio.trim() !== "" ? producto.precio.trim() : "";
    if (!precioActual) {
        return `<span style="color:#888;">Precio a consultar</span> · <a href="https://api.whatsapp.com/send/?phone=573138349422&text=${encodeURIComponent("Hola, quiero cotizar: " + producto.nombre)}" target="_blank" style="color:#2d7547; font-size:0.8rem;">Cotizar por WhatsApp</a>`;
    }

    const cache = leerCachePrecios();
    const clave = String(producto.id);
    const precioVistoAntes = cache[clave];

    let precioAnteriorMostrar = null;

    if (producto.precioAnterior && producto.precioAnterior.trim() !== "" && producto.precioAnterior.trim() !== precioActual) {
        precioAnteriorMostrar = producto.precioAnterior.trim();
    } else if (precioVistoAntes && precioVistoAntes !== precioActual) {
        precioAnteriorMostrar = precioVistoAntes;
    }

    cache[clave] = precioActual;
    guardarCachePrecios(cache);

    if (!precioAnteriorMostrar) return precioActual;

    const numAnterior = parseInt(precioAnteriorMostrar.replace(/[^0-9]/g, ""), 10);
    const numActual = parseInt(precioActual.replace(/[^0-9]/g, ""), 10);
    let icono = "";
    if (Number.isFinite(numAnterior) && Number.isFinite(numActual)) {
        icono = numActual > numAnterior ? " 🔺" : (numActual < numAnterior ? " 🔻" : "");
    }

    return `<s style="opacity:0.6;">${precioAnteriorMostrar}</s> ➜ <b>${precioActual}</b>${icono}`;
}

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

const COMANDOS_LIMPIAR = [
    "limpiar chat", "borrar chat", "limpiar historial", "borrar historial",
    "reiniciar chat", "limpiar conversacion", "borrar conversacion", "reset chat"
];

function esComandoLimpiar(textoNormalizado) {
    return COMANDOS_LIMPIAR.some(c => textoNormalizado === c || textoNormalizado.includes(c));
}

function limpiarChat() {
    const container = document.getElementById("chatMessages");
    if (container) container.innerHTML = "";

    try {
        localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (e) {
        console.warn("No se pudo borrar el historial del chat:", e);
    }

    ultimoContexto = { categorias: [], atributos: [], productos: [], pagina: 0, total: 0, encabezado: "", filtroPrecio: null };
    botonesContexto = [];
    ocultarBotonesRapidos();
    appendMsg("🧹 Listo, borré la conversación. ¿En qué más te puedo ayudar?", "bot");
    sugerirBotones = true;
    mostrarBotonesRapidos();
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

    // Primero botones de contexto (atributos / ver más), luego categorías
    const labelsMostrados = new Set();

    botonesContexto.forEach(label => {
        if (labelsMostrados.has(label)) return;
        labelsMostrados.add(label);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cb-quick-btn cb-quick-btn-context";
        btn.textContent = label;
        btn.addEventListener("click", () => sendChatMessage(label));
        wrap.appendChild(btn);
    });

    if (sugerirBotones || botonesContexto.length === 0) {
        CATEGORIAS_RAPIDAS.forEach(id => {
            const cat = CATEGORIAS.find(c => c.id === id);
            if (!cat || labelsMostrados.has(cat.label)) return;
            labelsMostrados.add(cat.label);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cb-quick-btn";
            btn.textContent = cat.label;
            btn.addEventListener("click", () => sendChatMessage(cat.label));
            wrap.appendChild(btn);
        });
    }

    if (wrap.children.length > 0) {
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
    }
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

    if (!usandoBoton) input.value = "";

    if (esComandoLimpiar(normalizarTexto(val))) {
        limpiarChat();
        return;
    }

    appendMsg(val, "user");
    ocultarBotonesRapidos();

    mostrarTyping();

    setTimeout(() => {
        ocultarTyping();
        const resp = procesarConsulta(val);
        appendMsg(resp, "bot");
        // Mostrar botones de contexto o categorías
        if (sugerirBotones || botonesContexto.length > 0) {
            mostrarBotonesRapidos();
        }
    }, 550);
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

function esEscritorio() {
    // Solo arrastrar en pantallas grandes con puntero fino (PC)
    return window.matchMedia("(min-width: 769px) and (pointer: fine)").matches;
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
    if (!esEscritorio()) return;
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
        chatWin.style.top = `${newY - winHeight - 10}px`;
    } else {
        chatWin.style.top = `${newY + 70}px`;
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
            display: flex;
        }
        .cb-quick-replies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 8px 0 4px;
        }
        .cb-quick-btn {
            border: 1px solid #2d7547;
            color: #2d7547;
            background: #fff;
            border-radius: 14px;
            padding: 5px 11px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .cb-quick-btn:hover {
            background: #2d7547;
            color: #fff;
        }
        .cb-quick-btn-context {
            border-color: #1565c0;
            color: #1565c0;
            background: #e3f2fd;
        }
        .cb-quick-btn-context:hover {
            background: #1565c0;
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
            z-index: 2;
        }
        .cb-close-btn:hover { color: #111; }
    `;
    document.head.appendChild(style);
})();

cargarHistorial();

/* ========== Carrito de cotización (independiente del chat) ========== */

const CARRITO_KEY = "carritoCotizacionDH";

function cargarCarrito() {
    try {
        carritoCotizacion = JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
    } catch (e) {
        carritoCotizacion = [];
    }
}

function guardarCarrito() {
    try {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(carritoCotizacion));
    } catch (e) {
        console.warn("No se pudo guardar el carrito:", e);
    }
    actualizarBadgeCarrito();
    renderizarCarrito();
}

function agregarAlCarrito(idProducto) {
    const id = Number(idProducto);
    if (carritoCotizacion.some(c => c.id === id)) return;

    const prod = typeof inventario !== "undefined"
        ? inventario.find(p => p.id === id)
        : null;
    if (!prod) return;

    carritoCotizacion.push({
        id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio || "",
        categoria: prod.categoria || ""
    });
    guardarCarrito();

    // Feedback rápido en el botón si sigue visible
    document.querySelectorAll('.cb-add-cart[data-pid="' + id + '"]').forEach(btn => {
        btn.textContent = "✓ En cotización";
        btn.classList.add("cb-add-cart-done");
        btn.disabled = true;
    });
}

function quitarDelCarrito(idProducto) {
    const id = Number(idProducto);
    carritoCotizacion = carritoCotizacion.filter(c => c.id !== id);
    guardarCarrito();
}


function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
    const prev = document.getElementById("dhModalOverlay");
    if (prev) prev.remove();

    const overlay = document.createElement("div");
    overlay.id = "dhModalOverlay";
    overlay.className = "dh-modal-overlay";
    overlay.innerHTML =
        '<div class="dh-modal" role="dialog" aria-modal="true">' +
            '<div class="dh-modal-title">' + titulo + '</div>' +
            '<div class="dh-modal-msg">' + mensaje + '</div>' +
            '<div class="dh-modal-actions">' +
                '<button type="button" class="dh-modal-btn dh-modal-cancel" id="dhModalCancel">Cancelar</button>' +
                '<button type="button" class="dh-modal-btn dh-modal-ok" id="dhModalOk">Aceptar</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    function cerrar() {
        overlay.classList.add("dh-modal-out");
        setTimeout(function () { overlay.remove(); }, 180);
        document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
        if (e.key === "Escape") cerrar();
    }
    document.addEventListener("keydown", onKey);

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cerrar();
    });
    document.getElementById("dhModalCancel").addEventListener("click", cerrar);
    document.getElementById("dhModalOk").addEventListener("click", function () {
        cerrar();
        if (typeof onConfirm === "function") onConfirm();
    });

    // Focus primary action
    setTimeout(function () {
        const ok = document.getElementById("dhModalOk");
        if (ok) ok.focus();
    }, 30);
}

function vaciarCarrito() {
    carritoCotizacion = [];
    guardarCarrito();
}

function actualizarBadgeCarrito() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const n = carritoCotizacion.length;
    if (n > 0) {
        badge.textContent = n > 9 ? "9+" : String(n);
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}

function generarMensajeWhatsApp() {
    if (carritoCotizacion.length === 0) return "";

    const lineas = [];
    lineas.push("Hola, me comunico desde la página web. Quisiera cotizar los siguientes productos:");
    lineas.push("");
    carritoCotizacion.forEach((p, i) => {
        let linea = (i + 1) + ". " + p.nombre;
        if (p.precio && String(p.precio).trim()) {
            linea += " — " + String(p.precio).trim();
        }
        lineas.push(linea);
    });
    lineas.push("");
    lineas.push("¿Me podrían enviar precios y disponibilidad? Gracias.");
    return lineas.join("\n");
}

function enviarCotizacionWhatsApp() {
    if (carritoCotizacion.length === 0) {
        alert("Tu carrito de cotización está vacío. Agrega productos desde el chat.");
        return;
    }
    const texto = generarMensajeWhatsApp();
    const url = "https://api.whatsapp.com/send/?phone=573138349422&text=" + encodeURIComponent(texto);
    window.open(url, "_blank");
}

function renderizarCarrito() {
    const lista = document.getElementById("cartItemsList");
    const vacio = document.getElementById("cartEmpty");
    const acciones = document.getElementById("cartActions");
    if (!lista) return;

    lista.innerHTML = "";

    if (carritoCotizacion.length === 0) {
        if (vacio) vacio.style.display = "block";
        if (acciones) acciones.style.display = "none";
        return;
    }

    if (vacio) vacio.style.display = "none";
    if (acciones) acciones.style.display = "flex";

    carritoCotizacion.forEach(p => {
        const item = document.createElement("div");
        item.className = "cart-item";
        const precioTxt = p.precio && p.precio.trim()
            ? p.precio.trim()
            : "Precio a consultar";
        item.innerHTML =
            '<div class="cart-item-info">' +
                "<b>" + escapeHtml(p.nombre) + "</b>" +
                '<span class="cart-item-precio">' + escapeHtml(precioTxt) + "</span>" +
            "</div>" +
            '<button type="button" class="cart-item-remove" data-remove-id="' + p.id + '" title="Quitar">×</button>';
        lista.appendChild(item);
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


function positionCartWindow() {
    const cartBubble = document.getElementById("cartBubble");
    const cartWin = document.getElementById("cartWindow");
    if (!cartBubble || !cartWin) return;

    const rect = cartBubble.getBoundingClientRect();
    const newX = rect.left;
    const newY = rect.top;

    cartWin.style.bottom = "auto";
    cartWin.style.right = "auto";

    const winHeight = cartWin.offsetHeight || 400;
    const winWidth = cartWin.offsetWidth || 320;

    // Preferir abrir debajo (útil en esquina superior); si no cabe, arriba
    if (newY + 70 + winHeight < window.innerHeight - 10) {
        cartWin.style.top = (newY + 70) + "px";
    } else if (newY > winHeight + 10) {
        cartWin.style.top = (newY - winHeight - 10) + "px";
    } else {
        cartWin.style.top = "10px";
    }

    let winLeft = newX - (winWidth - 60);
    if (winLeft < 10) winLeft = 10;
    if (winLeft + winWidth > window.innerWidth) {
        winLeft = window.innerWidth - winWidth - 10;
    }
    cartWin.style.left = winLeft + "px";
}

function setupCartDrag() {
    const cartBubble = document.getElementById("cartBubble");
    if (!cartBubble || cartBubble.dataset.dragReady === "1") return;
    cartBubble.dataset.dragReady = "1";

    cartBubble.style.cursor = esEscritorio() ? "grab" : "pointer";
    cartBubble.style.userSelect = "none";
    cartBubble.style.touchAction = esEscritorio() ? "none" : "manipulation";
    cartBubble.style.zIndex = "10000";

    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0, initialX = 0, initialY = 0;

    function onStart(e) {
        if (!esEscritorio()) return;
        dragging = true;
        moved = false;
        const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        const rect = cartBubble.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        cartBubble.style.bottom = "auto";
        cartBubble.style.right = "auto";
        cartBubble.style.left = initialX + "px";
        cartBubble.style.top = initialY + "px";
        cartBubble.style.cursor = "grabbing";
    }

    function onMove(e) {
        if (!dragging) return;
        const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            moved = true;
            if (e.cancelable) e.preventDefault();
        }
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        const maxX = window.innerWidth - cartBubble.offsetWidth;
        const maxY = window.innerHeight - cartBubble.offsetHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        cartBubble.style.left = newX + "px";
        cartBubble.style.top = newY + "px";
        positionCartWindow();
    }

    function onEnd() {
        if (!dragging) return;
        dragging = false;
        cartBubble.style.cursor = "grab";
        // Evitar que el click de soltar abra/cierre el carrito
        if (moved) {
            cartBubble.dataset.justDragged = "1";
            setTimeout(function () {
                delete cartBubble.dataset.justDragged;
            }, 50);
        }
    }

    cartBubble.addEventListener("mousedown", onStart);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    cartBubble.addEventListener("touchstart", onStart, { passive: false });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);

    if (typeof ResizeObserver !== "undefined") {
        const cartWin = document.getElementById("cartWindow");
        if (cartWin) {
            new ResizeObserver(function () {
                if (!cartWin.classList.contains("hidden")) positionCartWindow();
            }).observe(cartWin);
        }
    }
}

function toggleCarrito() {
    const cartBubble = document.getElementById("cartBubble");
    if (cartBubble && cartBubble.dataset.justDragged === "1") return;

    const win = document.getElementById("cartWindow");
    if (!win) return;
    win.classList.toggle("hidden");
    if (!win.classList.contains("hidden")) {
        renderizarCarrito();
        positionCartWindow();
    }
}

function inyectarUICarrito() {
    if (document.getElementById("cartBubble")) return;

    // Burbuja del carrito (esquina inferior izquierda)
    const bubble = document.createElement("button");
    bubble.id = "cartBubble";
    bubble.type = "button";
    bubble.className = "cart-bubble";
    bubble.setAttribute("aria-label", "Abrir carrito de cotización");
    bubble.innerHTML =
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
        '<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>' +
        "</svg>" +
        '<span id="cartBadge" class="cart-badge" style="display:none">0</span>';
    bubble.addEventListener("click", toggleCarrito);
    document.body.appendChild(bubble);

    // Ventana del carrito
    const win = document.createElement("div");
    win.id = "cartWindow";
    win.className = "cart-window hidden";
    win.innerHTML =
        '<div class="cart-header">' +
            "<span>📋 Cotización</span>" +
            '<button type="button" class="cart-close" id="cartCloseBtn" aria-label="Cerrar">&times;</button>' +
        "</div>" +
        '<div class="cart-body">' +
            '<p id="cartEmpty" class="cart-empty">Aún no has agregado productos.<br>Usa el chat y pulsa <b>+ Agregar a cotización</b>.</p>' +
            '<div id="cartItemsList" class="cart-items"></div>' +
        "</div>" +
        '<div id="cartActions" class="cart-actions" style="display:none">' +
            '<button type="button" class="cart-btn-whatsapp" id="cartSendWA">💬 Enviar cotización por WhatsApp</button>' +
            '<button type="button" class="cart-btn-clear" id="cartClear">Vaciar lista</button>' +
        "</div>";
    document.body.appendChild(win);

    document.getElementById("cartCloseBtn").addEventListener("click", toggleCarrito);
    document.getElementById("cartSendWA").addEventListener("click", enviarCotizacionWhatsApp);
    document.getElementById("cartClear").addEventListener("click", function () {
        if (!carritoCotizacion.length) return;
        mostrarModalConfirmacion(
            "Vaciar cotización",
            "¿Seguro que quieres vaciar toda la lista de cotización?",
            function () { vaciarCarrito(); }
        );
    });

    // Quitar items
    win.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-remove-id]");
        if (btn) quitarDelCarrito(btn.getAttribute("data-remove-id"));
    });
}

// Clics en botones "+ Agregar" dentro de mensajes del chat
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".cb-add-cart");
    if (!btn || btn.disabled) return;
    const pid = btn.getAttribute("data-pid");
    if (pid) agregarAlCarrito(pid);
});

(function inyectarEstilosCarrito() {
    if (document.getElementById("carritoEstilos")) return;
    const style = document.createElement("style");
    style.id = "carritoEstilos";
    style.textContent = `
        .cb-add-cart {
            margin-top: 6px;
            border: 1px solid #2d7547;
            background: #e8f5e9;
            color: #1b5e20;
            border-radius: 12px;
            padding: 4px 10px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .cb-add-cart:hover:not(:disabled) {
            background: #2d7547;
            color: #fff;
        }
        .cb-add-cart-done,
        .cb-add-cart:disabled {
            border-color: #9e9e9e;
            background: #f5f5f5;
            color: #757575;
            cursor: default;
        }

        .cart-bubble {
            position: fixed;
            top: 25px;
            bottom: auto;
            right: 25px;
            left: auto;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.4);
            background: #1b5e20;
            color: #fff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.22);
            cursor: pointer;
            user-select: none;
            -webkit-user-drag: none;
            touch-action: none;
            z-index: 1050;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, background 0.2s;
        }
        .cart-bubble:hover {
            background: #1b5e20;
            transform: scale(1.08);
        }
        .cart-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            background: #e53935;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-shadow: 0 0 0 2px #fff;
        }

        .cart-window {
            position: fixed;
            top: 95px;
            bottom: auto;
            right: 25px;
            left: auto;
            width: 340px;
            max-width: calc(100vw - 40px);
            max-height: min(480px, calc(100vh - 120px));
            background: #fff;
            border-radius: 16px;
            border: 1px solid #e7e4de;
            box-shadow: 0 12px 32px rgba(0,0,0,0.18);
            z-index: 1050;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: opacity 0.25s, transform 0.25s;
        }
        .cart-window.hidden {
            opacity: 0;
            pointer-events: none;
            transform: translateY(16px) scale(0.96);
        }
        .cart-header {
            background: #1b5e20;
            color: #fff;
            padding: 12px 16px;
            font-weight: 700;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .cart-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.4rem;
            cursor: pointer;
            opacity: 0.85;
            line-height: 1;
        }
        .cart-close:hover { opacity: 1; }
        .cart-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px 14px;
            background: #fbfaf8;
        }
        .cart-empty {
            color: #6b7178;
            font-size: 0.88rem;
            text-align: center;
            margin: 24px 8px;
            line-height: 1.5;
        }
        .cart-items { display: flex; flex-direction: column; gap: 8px; }
        .cart-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            background: #fff;
            border: 1px solid #e7e4de;
            border-radius: 10px;
            padding: 10px 12px;
        }
        .cart-item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 0.85rem;
        }
        .cart-item-info b { color: #15181b; font-size: 0.86rem; }
        .cart-item-precio { color: #6b7178; font-size: 0.78rem; }
        .cart-item-remove {
            border: none;
            background: transparent;
            color: #c62828;
            font-size: 1.25rem;
            cursor: pointer;
            line-height: 1;
            padding: 0 2px;
        }
        .cart-item-remove:hover { color: #b71c1c; }
        .cart-actions {
            padding: 10px 12px;
            border-top: 1px solid #e7e4de;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: #fff;
        }
        .cart-btn-whatsapp {
            background: #2d7547;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 11px 14px;
            font-weight: 700;
            font-size: 0.88rem;
            cursor: pointer;
        }
        .cart-btn-whatsapp:hover { background: #1b5e20; }
        .cart-btn-clear {
            background: transparent;
            border: 1px solid #e0e0e0;
            color: #6b7178;
            border-radius: 10px;
            padding: 8px 12px;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .cart-btn-clear:hover {
            border-color: #c62828;
            color: #c62828;
        }

        @media (max-width: 480px) {
            .cart-bubble { right: 16px; left: auto; top: 88px; bottom: auto; }
            .cart-window { right: 12px; left: 12px; width: auto; top: 158px; bottom: auto; max-height: calc(100vh - 170px); }
        }



        .dh-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(21, 24, 27, 0.45);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: dhModalFadeIn 0.18s ease;
        }
        .dh-modal-overlay.dh-modal-out {
            animation: dhModalFadeOut 0.18s ease forwards;
        }
        @keyframes dhModalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes dhModalFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .dh-modal {
            background: #fff;
            border-radius: 16px;
            border: 1px solid #e7e4de;
            box-shadow: 0 20px 50px rgba(0,0,0,0.22);
            width: 100%;
            max-width: 340px;
            padding: 22px 20px 18px;
            animation: dhModalPop 0.2s ease;
            font-family: 'Manrope', system-ui, sans-serif;
        }
        @keyframes dhModalPop {
            from { opacity: 0; transform: scale(0.94) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dh-modal-title {
            font-family: 'Sora', system-ui, sans-serif;
            font-weight: 700;
            font-size: 1.05rem;
            color: #15181b;
            margin-bottom: 8px;
        }
        .dh-modal-msg {
            color: #6b7178;
            font-size: 0.9rem;
            line-height: 1.45;
            margin-bottom: 20px;
        }
        .dh-modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .dh-modal-btn {
            border-radius: 999px;
            padding: 10px 18px;
            font-size: 0.88rem;
            font-weight: 700;
            cursor: pointer;
            border: 1.5px solid transparent;
            font-family: inherit;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .dh-modal-cancel {
            background: transparent;
            border-color: #e7e4de;
            color: #6b7178;
        }
        .dh-modal-cancel:hover {
            border-color: #15181b;
            color: #15181b;
        }
        .dh-modal-ok {
            background: #c62828;
            color: #fff;
            border-color: #c62828;
        }
        .dh-modal-ok:hover {
            background: #b71c1c;
            border-color: #b71c1c;
        }

        /* cart bajo el nav en movil / tablet (donde aparece hamburguesa) */
        @media (max-width: 900px) {
            .cart-bubble {
                top: 88px !important;
                bottom: auto !important;
                right: 16px !important;
            }
            .cart-window {
                top: 158px !important;
                bottom: auto !important;
                right: 12px !important;
                left: 12px !important;
                width: auto !important;
                max-height: calc(100vh - 170px) !important;
            }
        }

        /* drag solo PC */
        @media (min-width: 769px) and (pointer: fine) {
            .chatbot-bubble,
            .cart-bubble {
                cursor: grab !important;
            }
            .chatbot-bubble:active,
            .cart-bubble:active {
                cursor: grabbing !important;
            }
        }
        @media (max-width: 768px), (pointer: coarse) {
            .chatbot-bubble,
            .cart-bubble {
                cursor: pointer !important;
                touch-action: manipulation;
            }
        }
    `;
    document.head.appendChild(style);
})();

cargarCarrito();
inyectarUICarrito();
setupCartDrag();
actualizarBadgeCarrito();
