'use strict';

var getRespuesta = function (name) {
    return 'Hola ' + name;
};

var getFuncionAMockear = function (parametro) {
    return 'Original ' + parametro;
};

//Exporto las funciones de la librería utils para que puedan accederse desde fuera
module.exports = {
    getRespuesta: getRespuesta,
    getFuncionAMockear: getFuncionAMockear
};
