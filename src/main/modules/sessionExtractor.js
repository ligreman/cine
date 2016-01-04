'use strict';

var cheerio = require('cheerio'),
    vangogh = require('../modules/extractors/extractorVangogh'),
    odeon = require('../modules/extractors/extractorOdeon');

var extractSessionsFromCine = function (body, queCine) {
    var sesiones = [];

    switch (queCine) {
        case 'vangogh':
            sesiones = vangogh.extract(body);
            break;

        case 'odeon':
            sesiones = odeon.extract(body);
            break;
    }

    return sesiones;
};

module.exports = {
    extract: extractSessionsFromCine
};
