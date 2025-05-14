const puppeteer = require("puppeteer");

exports.consultarDatosFormularioSIRE = async (datos) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto("https://apps.migracioncolombia.gov.co/sire/public/login.jsf", {
      waitUntil: "networkidle2",
    });

    // Login
    await page.select("#formLogin\\:tipoDocumento", datos.tipoDocumento);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:numeroDocumento", datos.numeroDocumento);
    await page.evaluate(() => {
      const input = document.querySelector("#formLogin\\:numeroDocumento");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:password", datos.clave);

    await page.waitForSelector("#formLogin\\:listaEmpresa");
    const opciones = await page.$$eval("#formLogin\\:listaEmpresa option", opts =>
      opts.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    const opcionValida = opciones.find(opt => opt.value !== "-1");
    if (!opcionValida) throw new Error("No hay empresa seleccionable.");

    await page.select("#formLogin\\:listaEmpresa", opcionValida.value);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await Promise.all([
      page.click("#formLogin\\:button1"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Navegar a "Consultar Extranjeros"
    await page.waitForSelector("#tablehideitemConsultarExtranjeros", { visible: true });
    await page.evaluate(() => {
      const celda = document.querySelector("#row_itemConsultarExtranjeros");
      if (celda) celda.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Llenar formulario
    await page.select("select[name='formConsultarCargas:j_id51']", datos.tipoCarga);
    await page.select("#formConsultarCargas\\:tiposDocumento", datos.tipoDocConsulta);
    await page.type("#formConsultarCargas\\:numeroDocumento", datos.numeroDocConsulta);
    await page.type("#formConsultarCargas\\:nombres", datos.nombres || "");
    await page.type("#formConsultarCargas\\:PrimerApellido", datos.primerApellido || "");
    await page.type("#formConsultarCargas\\:SegundoApellido", datos.segundoApellido || "");

    // Clic en Buscar
    await page.click("#formConsultarCargas\\:j_id66");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cerrar ventana emergente si aparece
    const botonEmergente = "#messagesForm\\:messagesButton";
    try {
      await page.waitForSelector(botonEmergente, { timeout: 3000 });
      await page.click(botonEmergente);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {}

    // Esperar que cargue la tabla
    await page.waitForSelector("#formConsultarCargas\\:registros\\:tb");

    // Obtener número de filas
    const filas = await page.$$(
      "#formConsultarCargas\\:registros\\:tb > tr"
    );

    const resultados = [];

    for (let i = 0; i < filas.length; i++) {
      // Extraer datos visibles de la fila
      const datosFila = await page.evaluate((index) => {
        const fila = document.querySelectorAll(`#formConsultarCargas\\:registros\\:tb > tr`)[index];
        const celdas = fila.querySelectorAll("td span.texto");
        const nombres = ["Documento", "Fecha Ingreso", "Fecha Salida", "Nombres", "Apellido 1", "Apellido 2"];
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
        const etiquetas = Array.from(document.querySelectorAll("#j_id125\\:j_id126 td.col40"));
        const valores = Array.from(document.querySelectorAll("#j_id125\\:j_id126 td.col60"));
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await browser.close();
    return resultados;
  } catch (err) {
    await browser.close();
    throw new Error(`Error en el proceso: ${err.message}`);
  }
};

exports.enviarFormularioSIRE = async (datos) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto("https://apps.migracioncolombia.gov.co/sire/public/login.jsf", {
      waitUntil: "networkidle2",
    });

    // Login
    await page.select("#formLogin\\:tipoDocumento", datos.tipoDocumento);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:numeroDocumento", datos.numeroDocumento);
    await page.evaluate(() => {
      const input = document.querySelector("#formLogin\\:numeroDocumento");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.type("#formLogin\\:password", datos.clave);

    await page.waitForSelector("#formLogin\\:listaEmpresa");
    const opciones = await page.$$eval("#formLogin\\:listaEmpresa option", opts =>
      opts.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    const opcionValida = opciones.find(opt => opt.value !== "-1");
    if (!opcionValida) throw new Error("No hay empresa seleccionable.");

    await page.select("#formLogin\\:listaEmpresa", opcionValida.value);
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    await page.select("#cargueFormHospedaje\\:tipoMovimiento", "3"); // Entrada

    await page.type("#cargueFormHospedaje\\:numeroDocumento", datos.docExtranjero);

    // Quitar readonly a fecha nacimiento
    await page.evaluate(() => {
      const input = document.querySelector("#cargueFormHospedaje\\:fechaNacimientoInputDate");
      if (input) input.removeAttribute("readonly");
    });
    await page.type("#cargueFormHospedaje\\:fechaNacimientoInputDate", datos.fechaNacimiento); 

    await page.type("#cargueFormHospedaje\\:primerApellido", datos.primerApellido);
    await page.type("#cargueFormHospedaje\\:segundoApellido", datos.segundoApellido || "");
    await page.type("#cargueFormHospedaje\\:nombres", datos.nombres);
    await page.select("#cargueFormHospedaje\\:nacionalidad", datos.nacionalidad); 

    // Guardar
    await page.click("#cargueFormHospedaje\\:guardar");

    // Esperar y capturar pantalla como respaldo
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "formulario-enviado.png" });

    await browser.close();
    return "Formulario enviado correctamente.";
  } catch (err) {
    await page.screenshot({ path: "error.png" });
    await browser.close();
    throw new Error(`Error en el proceso: ${err.message}`);
  }
};