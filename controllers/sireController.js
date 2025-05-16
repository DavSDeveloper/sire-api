// Importa los servicios que automatizan el sistema SIRE con Puppeteer
const sireAutomation = require('../services/sireAutomation');

// --- CONTROLADOR PARA CONSULTAR DATOS EN SIRE ---
exports.consultarDatosSIRE = async (req, res) => {
  try {
    // Obtiene los datos enviados en el cuerpo de la petición HTTP (POST)
    const datos = req.body;

    // Llama al servicio que automatiza el llenado y consulta en el sistema SIRE
    const resultado = await sireAutomation.consultarDatosFormularioSIRE(datos);

    // Devuelve una respuesta HTTP 200 (OK) con los datos obtenidos
    res.status(200).json({ success: true, resultado });
  } catch (error) {
    // Si ocurre un error, lo muestra en consola y responde con código 500 (error interno del servidor)
    console.error('Error al enviar al SIRE:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- CONTROLADOR PARA ENVIAR UN REGISTRO AL SIRE ---
exports.enviarDatosSIRE = async (req, res) => {
  try {
    // Recoge los datos del cuerpo de la petición
    const datos = req.body;

    // Llama al servicio de Puppeteer para realizar el registro automático en SIRE
    const resultado = await sireAutomation.enviarFormularioSIRE(datos);

    // Devuelve una respuesta exitosa con el resultado del proceso
    res.status(200).json({ success: true, resultado });
  } catch (error) {
    // Captura cualquier error durante el proceso y lo devuelve como error 500
    console.error('Error al enviar al SIRE:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
