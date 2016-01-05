'use strict';

var cheerio = require('cheerio'),
    utils = require('../../modules/utils');

/**
 * Recorre la web y extrae las sesiones de ella
 */
var extract = function (body) {
    var $ = cheerio.load(body), sesiones = [];

    $('div.fboxinfo').each(function () {
        var titulo = $(this).find('div.fboxtitle h3 a').text();
        var horarios = [], horarios3d = [];

        // Genero el tag de la peli
        var tagData = utils.getTagPeli(titulo);

        // Decoro el título
        titulo = utils.capitalize(titulo);

        $(this).find('div.fboxtext p a').each(function () {
            // Viene en formato Sala XX 16:10, así que cojo los últimos 5 chars
            var hora = $(this).text().slice(-5);

            if (tagData.es3d) {
                console.log("    es 3D");
                horarios3d.push(hora);
            } else {
                console.log("    es normal");
                horarios.push(hora);
            }
        });

        sesiones.push({
            tag: tagData.tag,
            titulo: titulo,
            horarios: horarios,
            horarios3d: horarios3d
        });
    });


    /*
     $('div.CartelInfo div').each(function () {
     var titulo = $(this).find('p').text();
     var horarios = [], horarios3d = [];
     console.log("un div");
     // Genero el tag de la peli
     var tagData = utils.getTagPeli(titulo);

     // Decoro el título
     titulo = utils.capitalize(titulo);

     // Saco las horas
     $(this).find('div').each(function () {
     // Cojo los divs de horas sólo
     if ($(this).attr('style') === 'float: left; width: 33%;') {
     var texto = $(this).text();

     // Miro a ver si es 3D
     if (texto.indexOf('3D') !== -1) {
     horarios3d.push(texto.replace('-3D', ''));
     } else {
     horarios.push(texto);
     }
     }
     });

     sesiones.push({
     tag: tagData.tag,
     titulo: titulo,
     horarios: horarios,
     horarios3d: horarios3d
     });
     });*/

    return sesiones;
};

module.exports = {
    extract: extract
};
