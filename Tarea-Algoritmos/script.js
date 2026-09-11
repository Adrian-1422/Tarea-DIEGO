const hoja = document.getElementById("hoja");

const cantidadFilas = 10;
const cantidadColumnas = 5;

const columnas = ["A", "B", "C", "D", "E"];

const datos = {};

function crearHoja() {
    const encabezado = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");

    const esquina = document.createElement("th");
    filaEncabezado.appendChild(esquina);

    for (let columna = 0; columna < cantidadColumnas; columna++) {
        const th = document.createElement("th");
        th.textContent = columnas[columna];
        filaEncabezado.appendChild(th);
    }

    encabezado.appendChild(filaEncabezado);
    hoja.appendChild(encabezado);

    const cuerpo = document.createElement("tbody");

    for (let fila = 1; fila <= cantidadFilas; fila++) {
        const filaHTML = document.createElement("tr");

        const numeroFila = document.createElement("th");
        numeroFila.textContent = fila;
        filaHTML.appendChild(numeroFila);

        for (let columna = 0; columna < cantidadColumnas; columna++) {
            const celda = document.createElement("td");

            const posicion = columnas[columna] + fila;

            celda.contentEditable = "true";
            celda.dataset.posicion = posicion;

            datos[posicion] = {
                formula: "",
                valor: ""
            };

            filaHTML.appendChild(celda);
        }

        cuerpo.appendChild(filaHTML);
    }

    hoja.appendChild(cuerpo);
}

function esError(valor) {
    return (
        valor === "#ERROR!" ||
        valor === "#DIV/0!" ||
        valor === "#CIRCULAR!"
    );
}

function tokenizar(operacion) {
    const tokens = [];
    let contenido = "";

    for (let i = 0; i < operacion.length; i++) {
        const caracter = operacion[i];

        if (
            caracter === "+" ||
            caracter === "-" ||
            caracter === "*" ||
            caracter === "/" ||
            caracter === "(" ||
            caracter === ")"
        ) {
            if (contenido !== "") {
                tokens.push(contenido);
                contenido = "";
            }

            tokens.push(caracter);

        } else if (caracter !== " ") {
            contenido += caracter;
        }
    }

    if (contenido !== "") {
        tokens.push(contenido);
    }

    return tokens;
}

function obtenerValorCelda(referencia) {
    const posicion = referencia.toUpperCase();

    if (datos[posicion] == null) {
        return "#ERROR!";
    }

    if (datos[posicion].valor === "") {
        return 0;
    }

    if (esError(datos[posicion].valor)) {
        return datos[posicion].valor;
    }

    const valor = Number(datos[posicion].valor);

    if (isNaN(valor)) {
        return "#ERROR!";
    }

    return valor;
}

function obtenerCeldasRango(inicio, fin) {
    inicio = inicio.toUpperCase();
    fin = fin.toUpperCase();

    if (
        !/^[A-Z]+[0-9]+$/.test(inicio) ||
        !/^[A-Z]+[0-9]+$/.test(fin)
    ) {
        return "#ERROR!";
    }

    const columnaInicio = inicio.match(/[A-Z]+/)[0];
    const filaInicio = Number(inicio.match(/[0-9]+/)[0]);

    const columnaFin = fin.match(/[A-Z]+/)[0];
    const filaFin = Number(fin.match(/[0-9]+/)[0]);

    const indiceColumnaInicio = columnas.indexOf(columnaInicio);
    const indiceColumnaFin = columnas.indexOf(columnaFin);

    if (
        indiceColumnaInicio === -1 ||
        indiceColumnaFin === -1 ||
        filaInicio < 1 ||
        filaFin < 1 ||
        filaInicio > cantidadFilas ||
        filaFin > cantidadFilas
    ) {
        return "#ERROR!";
    }

    const columnaMenor = Math.min(
        indiceColumnaInicio,
        indiceColumnaFin
    );

    const columnaMayor = Math.max(
        indiceColumnaInicio,
        indiceColumnaFin
    );

    const filaMenor = Math.min(filaInicio, filaFin);
    const filaMayor = Math.max(filaInicio, filaFin);

    const valores = [];

    for (let fila = filaMenor; fila <= filaMayor; fila++) {
        for (
            let columna = columnaMenor;
            columna <= columnaMayor;
            columna++
        ) {
            const posicion = columnas[columna] + fila;

            const valor = obtenerValorCelda(posicion);

            if (esError(valor)) {
                return valor;
            }

            valores.push(Number(valor));
        }
    }

    return valores;
}

function calcularFuncion(nombre, inicio, fin) {
    const valores = obtenerCeldasRango(inicio, fin);

    if (esError(valores)) {
        return valores;
    }

    if (valores.length === 0) {
        return "#ERROR!";
    }

    if (nombre === "SUMA") {
        let suma = 0;

        for (let i = 0; i < valores.length; i++) {
            suma += valores[i];
        }

        return suma;
    }

    if (nombre === "PROMEDIO") {
        let suma = 0;

        for (let i = 0; i < valores.length; i++) {
            suma += valores[i];
        }

        return suma / valores.length;
    }

    if (nombre === "MAX") {
        let mayor = valores[0];

        for (let i = 1; i < valores.length; i++) {
            if (valores[i] > mayor) {
                mayor = valores[i];
            }
        }

        return mayor;
    }

    if (nombre === "MIN") {
        let menor = valores[0];

        for (let i = 1; i < valores.length; i++) {
            if (valores[i] < menor) {
                menor = valores[i];
            }
        }

        return menor;
    }

    return "#ERROR!";
}

function resolverFunciones(operacion) {
    let resultadoOperacion = operacion;

    const expresion =
        /(SUMA|PROMEDIO|MAX|MIN)\(([A-Za-z]+[0-9]+):([A-Za-z]+[0-9]+)\)/i;

    while (expresion.test(resultadoOperacion)) {
        const coincidencia = resultadoOperacion.match(expresion);

        const funcion = coincidencia[1].toUpperCase();
        const inicio = coincidencia[2];
        const fin = coincidencia[3];

        const resultado = calcularFuncion(
            funcion,
            inicio,
            fin
        );

        if (esError(resultado)) {
            return resultado;
        }

        resultadoOperacion = resultadoOperacion.replace(
            coincidencia[0],
            resultado
        );
    }

    if (
        /(SUMA|PROMEDIO|MAX|MIN)/i.test(resultadoOperacion)
    ) {
        return "#ERROR!";
    }

    return resultadoOperacion;
}

function convertirReferencias(tokens) {
    const nuevosTokens = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (/^[A-Za-z]+[0-9]+$/.test(token)) {
            const valor = obtenerValorCelda(token);

            if (esError(valor)) {
                return valor;
            }

            nuevosTokens.push(valor);

        } else {
            nuevosTokens.push(token);
        }
    }

    return nuevosTokens;
}

function validarTokens(tokens) {
    if (tokens.length === 0) {
        return false;
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        const esOperador =
            token === "+" ||
            token === "-" ||
            token === "*" ||
            token === "/";

        if (esOperador) {
            if (i === 0 || i === tokens.length - 1) {
                return false;
            }

            const anterior = tokens[i - 1];
            const siguiente = tokens[i + 1];

            const anteriorEsOperador =
                anterior === "+" ||
                anterior === "-" ||
                anterior === "*" ||
                anterior === "/";

            const siguienteEsOperador =
                siguiente === "+" ||
                siguiente === "-" ||
                siguiente === "*" ||
                siguiente === "/";

            if (
                anteriorEsOperador ||
                siguienteEsOperador
            ) {
                return false;
            }
        }
    }

    return true;
}

function resolverTokens(tokens) {
    tokens = convertirReferencias(tokens);

    if (esError(tokens)) {
        return tokens;
    }

    if (!validarTokens(tokens)) {
        return "#ERROR!";
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (
            token !== "+" &&
            token !== "-" &&
            token !== "*" &&
            token !== "/"
        ) {
            const numero = Number(token);

            if (isNaN(numero)) {
                return "#ERROR!";
            }
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "*" || tokens[i] === "/") {
            const numero1 = Number(tokens[i - 1]);
            const numero2 = Number(tokens[i + 1]);

            if (isNaN(numero1) || isNaN(numero2)) {
                return "#ERROR!";
            }

            let resultado;

            if (tokens[i] === "*") {
                resultado = numero1 * numero2;

            } else {
                if (numero2 === 0) {
                    return "#DIV/0!";
                }

                resultado = numero1 / numero2;
            }

            tokens.splice(i - 1, 3, resultado);
            i = i - 1;
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "+" || tokens[i] === "-") {
            const numero1 = Number(tokens[i - 1]);
            const numero2 = Number(tokens[i + 1]);

            if (isNaN(numero1) || isNaN(numero2)) {
                return "#ERROR!";
            }

            let resultado;

            if (tokens[i] === "+") {
                resultado = numero1 + numero2;
            } else {
                resultado = numero1 - numero2;
            }

            tokens.splice(i - 1, 3, resultado);
            i = i - 1;
        }
    }

    if (tokens.length === 1) {
        return tokens[0];
    }

    return "#ERROR!";
}

function calcularOperacion(operacion) {
    if (operacion.trim() === "") {
        return "#ERROR!";
    }

    operacion = resolverFunciones(operacion);

    if (esError(operacion)) {
        return operacion;
    }

    let tokens = tokenizar(operacion);

    let cantidadAbiertos = 0;

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "(") {
            cantidadAbiertos++;
        }

        if (tokens[i] === ")") {
            cantidadAbiertos--;

            if (cantidadAbiertos < 0) {
                return "#ERROR!";
            }
        }
    }

    if (cantidadAbiertos !== 0) {
        return "#ERROR!";
    }

    while (tokens.includes("(") || tokens.includes(")")) {
        let inicio = -1;
        let fin = -1;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === "(") {
                inicio = i;
            }

            if (tokens[i] === ")" && inicio !== -1) {
                fin = i;
                break;
            }
        }

        if (inicio === -1 || fin === -1) {
            return "#ERROR!";
        }

        const interior = tokens.slice(inicio + 1, fin);

        if (interior.length === 0) {
            return "#ERROR!";
        }

        const resultado = resolverTokens(interior);

        if (esError(resultado)) {
            return resultado;
        }

        tokens.splice(
            inicio,
            fin - inicio + 1,
            resultado
        );
    }

    return resolverTokens(tokens);
}

function obtenerReferencias(formulaCelda) {
    const referencias =
        formulaCelda.match(/[A-Za-z]+[0-9]+/g);

    if (referencias == null) {
        return [];
    }

    return referencias.map(
        (referencia) => referencia.toUpperCase()
    );
}

function hayReferenciaCircular(
    posicionInicial,
    posicionActual,
    visitadas
) {
    if (
        posicionInicial === posicionActual &&
        visitadas.length > 0
    ) {
        return true;
    }

    if (visitadas.includes(posicionActual)) {
        return false;
    }

    if (datos[posicionActual] == null) {
        return false;
    }

    const formulaCelda =
        datos[posicionActual].formula;

    if (formulaCelda === "") {
        return false;
    }

    const nuevasVisitadas = [
        ...visitadas,
        posicionActual
    ];

    const referencias =
        obtenerReferencias(formulaCelda);

    for (let i = 0; i < referencias.length; i++) {
        const referencia = referencias[i];

        if (
            hayReferenciaCircular(
                posicionInicial,
                referencia,
                nuevasVisitadas
            )
        ) {
            return true;
        }
    }

    return false;
}

function guardarValor(celda, contenido) {
    const posicion = celda.dataset.posicion;

    if (contenido.startsWith("=")) {
        datos[posicion].formula = contenido;

        if (
            hayReferenciaCircular(
                posicion,
                posicion,
                []
            )
        ) {
            datos[posicion].valor = "#CIRCULAR!";
            celda.textContent = "#CIRCULAR!";

        } else {
            const operacion = contenido.substring(1);

            const resultado =
                calcularOperacion(operacion);

            datos[posicion].valor = resultado;
            celda.textContent = resultado;
        }

    } else {
        datos[posicion].formula = "";
        datos[posicion].valor = contenido;

        celda.textContent = contenido;
    }

    recalcularHoja(posicion);
}

function dependeDe(formulaCelda, posicion) {
    const referencias =
        obtenerReferencias(formulaCelda);

    return referencias.includes(posicion);
}

function recalcularHoja(posicionCambiada) {
    const pendientes = [posicionCambiada];
    const recalculadas = [];

    while (pendientes.length > 0) {
        const posicionActual = pendientes.shift();

        for (const posicion in datos) {
            if (recalculadas.includes(posicion)) {
                continue;
            }

            const formulaCelda =
                datos[posicion].formula;

            if (
                formulaCelda !== "" &&
                dependeDe(
                    formulaCelda,
                    posicionActual
                )
            ) {
                let resultado;

                if (
                    hayReferenciaCircular(
                        posicion,
                        posicion,
                        []
                    )
                ) {
                    resultado = "#CIRCULAR!";

                } else {
                    const operacion =
                        formulaCelda.substring(1);

                    resultado =
                        calcularOperacion(operacion);
                }

                datos[posicion].valor = resultado;

                const celda = document.querySelector(
                    'td[data-posicion="' +
                    posicion +
                    '"]'
                );

                if (celda != null) {
                    celda.textContent = resultado;
                }

                recalculadas.push(posicion);
                pendientes.push(posicion);
            }
        }
    }
}

crearHoja();

const celdas = document.querySelectorAll("td");

const nombreCelda =
    document.getElementById("nombre-celda");

const formula =
    document.getElementById("formula");

const botonLimpiar =
    document.getElementById("limpiar");

let celdaSeleccionada = null;

celdas.forEach((celda) => {
    celda.addEventListener("click", () => {
        const posicion = celda.dataset.posicion;

        nombreCelda.textContent = posicion;

        if (datos[posicion].formula !== "") {
            formula.value = datos[posicion].formula;
        } else {
            formula.value = datos[posicion].valor;
        }

        celdaSeleccionada = celda;

        console.log(
            "Celda seleccionada:",
            posicion
        );

        console.log(
            "Datos:",
            datos[posicion]
        );
    });

    celda.addEventListener("blur", () => {
        const contenido = celda.textContent;

        guardarValor(celda, contenido);
    });
});

formula.addEventListener("input", () => {
    if (celdaSeleccionada != null) {
        celdaSeleccionada.textContent =
            formula.value;
    }
});

formula.addEventListener(
    "keydown",
    (evento) => {
        if (evento.key === "Enter") {
            if (celdaSeleccionada == null) {
                return;
            }

            guardarValor(
                celdaSeleccionada,
                formula.value
            );

            const posicion =
                celdaSeleccionada.dataset.posicion;

            if (datos[posicion].formula !== "") {
                formula.value =
                    datos[posicion].formula;
            } else {
                formula.value =
                    datos[posicion].valor;
            }
        }
    }
);

botonLimpiar.addEventListener(
    "click",
    () => {
        celdas.forEach((celda) => {
            const posicion =
                celda.dataset.posicion;

            celda.textContent = "";

            datos[posicion].formula = "";
            datos[posicion].valor = "";
        });

        formula.value = "";
        nombreCelda.textContent = "A1";
        celdaSeleccionada = null;
    }
);