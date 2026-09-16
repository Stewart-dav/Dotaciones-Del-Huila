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
        const raizToken = raizPalabra(token);
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

const PALABRAS_CONTINUACION = [
    "otro", "otra", "otros", "otras", "algo mas", "alguno", "alguna", "algunas",
    "tambien", "mas opciones", "y que mas", "hay mas", "tienes mas", "ese", "esos",
    "ver mas", "mostrar mas", "siguientes", "siguiente", "continuar", "mas",
    "pagina siguiente", "los demas", "el resto"
];

const PALABRAS_BARATO = ["mas barata", "mas barato", "mas economica", "mas economico", "la mas barata", "el mas barato", "barata", "barato", "economica", "economico"];
const PALABRAS_CARO = ["mas cara", "mas caro", "la mas cara", "el mas caro", "cara", "caro", "premium"];

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
        const filtrados = resultado.filter(p => {
            const nombreNorm = normalizarTexto(p.nombre);
            return palabrasFiltro.every(w => coincidePalabraConNombre(nombreNorm, w));
        });
        if (filtrados.length > 0) {
            resultado = filtrados;
        }
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
        .filter(w => w.length >= 3 && !PALABRAS_RELLENO.has(w) && !PALABRAS_CATEGORIA_TODAS.has(w));

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
        return `• <b>${p.nombre}</b><br>${precioMostrar}`;
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
        if (atributos.length > 0) {
            msg += ` con los filtros: ${atributos.map(a => a.label).join(", ")}`;
        }
        if (filtroPrecio) {
            msg += ` en ese rango de precio`;
        }
        msg += `.<br><br>Prueba sin filtros o escribe <i>"quiero hablar con un asesor"</i>.`;
        sugerirBotones = true;
        return msg;
    }

    let encabezado = `📦 <b>${nombreMostrar}</b> — ${productos.length} opción${productos.length === 1 ? "" : "es"}`;
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
    if (esPedirMas(texto) && ultimoContexto.productos && ultimoContexto.productos.length > 0) {
        return mostrarSiguientePagina();
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

inyectarBotonCerrar();
cargarHistorial();
