'use strict';

module.exports = function (app) {
    //Cargo los diferentes ficheros de rutas
    require('./cines')(app);
    require('./peliculas')(app);
    require('./provincias')(app);

    //Cualquier otra ruta a la que se acceda, devuelve error
    app.get('/!*', function (req, res) {
        res.status(404).send('Aquí no hay nada ┌∩┐(◣_◢)┌∩┐');
    });
};

