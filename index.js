// Importa el framework Express para crear la API
const express = require('express');
// Importa CORS para permitir solicitudes desde otros orígenes (por ejemplo, desde el frontend)
const cors = require('cors');
// Importa body-parser para procesar cuerpos de tipo JSON en las solicitudes
const bodyParser = require('body-parser');
// Importa el controlador que maneja la lógica para consultar y enviar datos al SIRE
const sireController = require('./controllers/sireController');

// Crea una instancia de la aplicación Express
const app = express();
// Define el puerto donde correrá el servidor (por defecto 3000 si no hay variable de entorno)
const PORT = process.env.PORT || 3000;

// Habilita CORS para que se puedan hacer peticiones desde otros dominios
app.use(cors());
// Habilita el procesamiento de cuerpos JSON en las peticiones
app.use(bodyParser.json());

// Define la ruta POST para consultar datos de un extranjero en SIRE
app.post('/api/consultar-extranjero', sireController.consultarDatosSIRE);
// Define la ruta POST para enviar un nuevo registro al SIRE
app.post('/api/enviar-sire', sireController.enviarDatosSIRE);

// Inicia el servidor y escucha en el puerto definido
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
