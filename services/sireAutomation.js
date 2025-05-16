const fs = require("fs"); // Módulo para guardar HTML como respaldo (debug)
const puppeteer = require("puppeteer"); // Librería para automatizar navegador

// Función principal para consultar un registro de hospedaje en el sistema SIRE
exports.consultarDatosFormularioSIRE = async (datos) => {
  const browser = await puppeteer.launch({
    headless: false, // Mostrar navegador (útil para pruebas visuales)
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Configuración para entornos sin permisos elevados
  });

  // Crear una nueva pestaña en el navegador y establecer tamaño
  // const page = await browser.newPage();
  // await page.setViewport({ width: 1280, height: 800 });

  try {
    // Ir a la página de inicio de sesión del sistema SIRE
    await page.goto(
      "https://apps.migracioncolombia.gov.co/sire/public/login.jsf",
      {
        waitUntil: "networkidle2", // Esperar hasta que se detenga la carga de red
      }
    );

    // Login
    await page.select("#formLogin\\:tipoDocumento", datos.tipoDocumento); // Seleccionar tipo de documento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:numeroDocumento", datos.numeroDocumento); // Digitar número de documento

    // Disparar evento change (necesario para que el sitio lo reconozca)
    await page.evaluate(() => {
      const input = document.querySelector("#formLogin\\:numeroDocumento");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:password", datos.clave); // Digitar clave

    // Seleccionar empresa habilitada
    await page.waitForSelector("#formLogin\\:listaEmpresa");
    const opciones = await page.$$eval(
      "#formLogin\\:listaEmpresa option",
      (opts) => opts.map((opt) => ({ value: opt.value, text: opt.textContent }))
    );
    const opcionValida = opciones.find((opt) => opt.value !== "-1");
    if (!opcionValida) throw new Error("No hay empresa seleccionable.");

    await page.select("#formLogin\\:listaEmpresa", opcionValida.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Ingresar al sistema
    await Promise.all([
      page.click("#formLogin\\:button1"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Navegar a "Consultar Extranjeros"
    await page.waitForSelector("#tablehideitemConsultarExtranjeros", {
      visible: true,
    });
    await page.evaluate(() => {
      const celda = document.querySelector("#row_itemConsultarExtranjeros");
      if (celda) celda.click(); // Hacer clic en la celda
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Llenar formulario
    await page.select(
      "select[name='formConsultarCargas:j_id51']",
      datos.tipoCarga
    );
    await page.select(
      "#formConsultarCargas\\:tiposDocumento",
      datos.tipoDocConsulta
    );
    await page.type(
      "#formConsultarCargas\\:numeroDocumento",
      datos.numeroDocConsulta
    );
    await page.type("#formConsultarCargas\\:nombres", datos.nombres || "");
    await page.type(
      "#formConsultarCargas\\:PrimerApellido",
      datos.primerApellido || ""
    );
    await page.type(
      "#formConsultarCargas\\:SegundoApellido",
      datos.segundoApellido || ""
    );

    // Buscar registros
    await page.click("#formConsultarCargas\\:j_id66");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Cerrar ventana emergente si aparece
    const botonEmergente = "#messagesForm\\:messagesButton";
    try {
      await page.waitForSelector(botonEmergente, { timeout: 3000 });
      await page.click(botonEmergente);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {}

    // Esperar que cargue la tabla
    await page.waitForSelector("#formConsultarCargas\\:registros\\:tb");

    // Obtener número de filas
    const filas = await page.$$("#formConsultarCargas\\:registros\\:tb > tr");

    const resultados = [];

    for (let i = 0; i < filas.length; i++) {
      // Extraer datos visibles de la fila
      const datosFila = await page.evaluate((index) => {
        const fila = document.querySelectorAll(
          `#formConsultarCargas\\:registros\\:tb > tr`
        )[index];
        const celdas = fila.querySelectorAll("td span.texto");
        const nombres = [
          "Documento",
          "Fecha Ingreso",
          "Fecha Salida",
          "Nombres",
          "Apellido 1",
          "Apellido 2",
        ];
        const filaInfo = {};
        celdas.forEach((celda, idx) => {
          filaInfo[nombres[idx] || `Campo${idx}`] = celda.textContent.trim();
        });
        return filaInfo;
      }, i);

      // Clic en botón de detalle
      const btnDetalleSelector = `#formConsultarCargas\\:registros\\:${i}\\:j_id92`;
      await page.click(btnDetalleSelector);
      await page.waitForSelector("#j_id125\\:j_id126", { visible: true });

      // Extraer información del modal
      const detalle = await page.evaluate(() => {
        const etiquetas = Array.from(
          document.querySelectorAll("#j_id125\\:j_id126 td.col40")
        );
        const valores = Array.from(
          document.querySelectorAll("#j_id125\\:j_id126 td.col60")
        );
        const resultado = {};
        for (let j = 0; j < etiquetas.length; j++) {
          const clave = etiquetas[j].innerText.trim().replace(":", "");
          const valor = valores[j].innerText.trim();
          resultado[clave] = valor;
        }
        return resultado;
      });

      resultados.push({
        fila: datosFila,
        detalle: detalle,
      });

      // Cerrar modal
      await page.click("#j_id125\\:j_id145");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await browser.close();
    return resultados;
  } catch (err) {
    await browser.close();
    throw new Error(
      `No se encontraron registros. Error en el proceso: ${err.message}`
    );
  }
};

// Función principal para enviar un registro de hospedaje al sistema SIRE
exports.enviarFormularioSIRE = async (datos) => {
  const browser = await puppeteer.launch({
    headless: false, // Mostrar navegador (útil para pruebas visuales)
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Configuración para entornos sin permisos elevados
  });

  // Crear una nueva pestaña en el navegador y establecer tamaño
  // const page = await browser.newPage();
  // await page.setViewport({ width: 1280, height: 800 });

  try {
    // Ir a la página de login de SIRE
    await page.goto(
      "https://apps.migracioncolombia.gov.co/sire/public/login.jsf",
      {
        waitUntil: "networkidle2",
      }
    );

    // Login
    await page.select("#formLogin\\:tipoDocumento", datos.tipoDocumento); // Seleccionar tipo de documento
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera
    await page.type("#formLogin\\:numeroDocumento", datos.numeroDocumento); // Digitar número de documento
    
    // Forzar evento de cambio para activar lógica del sitio
    await page.evaluate(() => {
      const input = document.querySelector("#formLogin\\:numeroDocumento");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.type("#formLogin\\:password", datos.clave); // Digitar clave

    // Seleccionar empresa habilitada
    await page.waitForSelector("#formLogin\\:listaEmpresa");
    const opciones = await page.$$eval(
      "#formLogin\\:listaEmpresa option",
      (opts) => opts.map((opt) => ({ value: opt.value, text: opt.textContent }))
    );
    const opcionValida = opciones.find((opt) => opt.value !== "-1");
    if (!opcionValida) throw new Error("No hay empresa seleccionable.");
    await page.select("#formLogin\\:listaEmpresa", opcionValida.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Ingresar al sistema
    await Promise.all([
      page.click("#formLogin\\:button1"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Navegar a "Cargar Información"
    await page.waitForSelector("#itemCargarInformacion");
    await page.click("#itemCargarInformacion");

    // Seleccionar pestaña "Alojamiento y Hospedaje"
    await page.waitForSelector("#HOTEL_cell table");
    await page.evaluate(() => {
      document.querySelector("#HOTEL_cell table").click();
    });

    // Esperar formulario
    await page.waitForSelector("#cargueFormHospedaje\\:tipoMovimiento");

    // Llenar formulario
    await page.select(
      "#cargueFormHospedaje\\:tipoMovimiento",
      datos.tipoMovimiento
    );

    // Remover atributo readonly y llenar fecha de movimiento
    await page.evaluate(() => {
      const input = document.querySelector(
        "#cargueFormHospedaje\\:fechaMovimientoInputDate"
      );
      if (input) input.removeAttribute("readonly");
    });
    await page.type(
      "#cargueFormHospedaje\\:fechaMovimientoInputDate",
      datos.fechaMovimiento
    );
    await page.select(
      "#cargueFormHospedaje\\:tipoDocumento",
      datos.tipoDocExtranjero
    );
    await page.type(
      "#cargueFormHospedaje\\:numeroDocumento",
      datos.docExtranjero
    );

    // Remover readonly y llenar fecha de nacimiento
    await page.evaluate(() => {
      const input = document.querySelector(
        "#cargueFormHospedaje\\:fechaNacimientoInputDate"
      );
      if (input) input.removeAttribute("readonly");
    });
    await page.type(
      "#cargueFormHospedaje\\:fechaNacimientoInputDate",
      datos.fechaNacimiento
    );

    // Nombres y apellidos
    await page.type(
      "#cargueFormHospedaje\\:primerApellido",
      datos.primerApellido
    );
    await page.type(
      "#cargueFormHospedaje\\:segundoApellido",
      datos.segundoApellido
    );
    await page.type("#cargueFormHospedaje\\:nombres", datos.nombres);

    // Selección de nacionalidad, procedencia y destino
    await page.select(
      "#cargueFormHospedaje\\:nacionalidad",
      datos.nacionalidad
    );
    await page.select("#cargueFormHospedaje\\:procedencia", datos.procedencia);
    await page.select("#cargueFormHospedaje\\:destino", datos.destino);

    // --- OPCIONAL: Guardar HTML actual por si el botón no hace nada (debug) ---
    // const htmlContent = await page.content();
    // fs.writeFileSync("antes_agregar_registro.html", htmlContent);

    // --- CLIC EN "Agregar Registro" ---
    // Este botón lanza un proceso AJAX que genera una tabla nueva en el DOM
    await page.evaluate(() => {
      const btn = document.querySelector("#cargueFormHospedaje\\:j_id877");
      if (btn) btn.click();
    });

    // Esperar a que la tabla de registros aparezca (verifica si se generó correctamente)
    await page.waitForSelector("#cargueFormHospedaje\\:listaRegHospedaje", {
      visible: true,
      timeout: 20000,
    });

    // Esperar a que aparezca el botón "Guardar"
    await page.waitForSelector("#cargueFormHospedaje\\:j_id902", {
      visible: true,
      timeout: 20000,
    });

    // Clic en Guardar
    await page.click("#cargueFormHospedaje\\:j_id902");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await browser.close();
    return "Formulario enviado correctamente.";
  } catch (err) {
    await browser.close();
    throw new Error(`Error en el proceso: ${err.message}`);
  }
};
