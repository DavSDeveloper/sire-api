const puppeteer = require("puppeteer");

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

    // Navegar a "Consultar Extranjeros"
    await page.waitForSelector("#tablehideitemConsultarExtranjeros", { visible: true });
    await page.evaluate(() => {
      const celda = document.querySelector("#row_itemConsultarExtranjeros");
      if (celda) celda.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Llenar formulario de "Consultar Extranjeros"
    await page.select("select[name='formConsultarCargas:j_id51']", datos.tipoCarga);
    await page.select("#formConsultarCargas\\:tiposDocumento", datos.tipoDocConsulta);
    await page.type("#formConsultarCargas\\:numeroDocumento", datos.numeroDocConsulta);
    await page.type("#formConsultarCargas\\:nombres", datos.nombres || "");
    await page.type("#formConsultarCargas\\:PrimerApellido", datos.primerApellido || "");
    await page.type("#formConsultarCargas\\:SegundoApellido", datos.segundoApellido || "");

    // Clic en Buscar
    await page.click("#formConsultarCargas\\:j_id66");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Captura de pantalla como evidencia
    await page.screenshot({ path: "resultado_busqueda.png" });

    await browser.close();
    return "Formulario enviado correctamente.";
  } catch (err) {
    await page.screenshot({ path: "error.png" });
    await browser.close();
    throw new Error(`Error en el proceso: ${err.message}`);
  }
};
