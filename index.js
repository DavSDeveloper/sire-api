const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sireController = require('./controllers/sireController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/consultar-extranjero', sireController.consultarDatosSIRE);
app.post('/api/enviar-sire', sireController.enviarDatosSIRE);

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
