const sireAutomation = require('../services/sireAutomation');

exports.enviarDatosSIRE = async (req, res) => {
  try {
    const datos = req.body;
    const resultado = await sireAutomation.enviarFormularioSIRE(datos);
    res.status(200).json({ success: true, resultado });
  } catch (error) {
    console.error('Error al enviar al SIRE:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
