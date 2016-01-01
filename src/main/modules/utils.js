'use strict';


/**
 * Devuelve un error en JSON
 * @param res
 * @param code
 * @param errCode
 */
var error = function (res, code, errCode) {
    var response = {};

    switch (code) {
        case 401:
        case 403:
        case 400:
        case 500:
            response = {
                "error": errCode
            };
            break;
    }

    console.error(code + ' ' + errCode);

    res.status(code).json(response);
};

/**
 * Comprueba si el time está actualizado
 * @param time Tiempoque quiero comprobar
 * @param caducidad Caducidad en horas
 */
var isUpdated = function (time, caducidad) {
    var now = new Date.getTime();

    caducidad = caducidad * 60 * 60 * 1000;

    if (time + caducidad > now) {
        // Ta actualizao
        return true;
    } else {
        return false;
    }
};

var getTagPeli = function (title) {
    var tag = '', es3d = false;

    title = title.toLowerCase();

    if (title.indexOf('3D') !== -1) {
        es3d = true;
    }

    title = title.replace('_', '');
    title = title.replace('á', 'a');
    title = title.replace('é', 'e');
    title = title.replace('í', 'i');
    title = title.replace('ó', 'o');
    title = title.replace('ú', 'u');
    title = title.replace('ü', 'u');
    title = title.replace('ñ', 'nn');

    //Me cargo lo que haya dentro de los paréntesis
    var patron = /\(.*\)/i;
    title = title.replace(patron, '');

    title = title.replace(/\W+/g, ' '); //dejo <<A-Za-z0-9_ >>

    var words = title.split(' ');
    words.sort();
    words.forEach(function (word) {
        // Si la cadena es 3d es que la peli es en 3d
        if (word === '3d') {
            es3d = true;
        } else {
            tag += replacer(word);
        }
    });

    return {
        tag: tag,
        es3d: es3d
    };
};

function replacer(txt) {
    var words = ['a', 'ante', 'con', 'de', 'en', 'para', 'por', 'so', 'tras', 'e', 'y', 'o', 'u', 'el', 'la', 'los',
        'las', 'le', 'lo', 'yo', 'tu', 't', 'el', 'l', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
        'its', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'mine', 'yours', 'ours', 'yours', 'theirs', 'the',
        'to', 'of', 'and', 'as', 'too', 'by', 'if', 'but'];

    if (words.indexOf(txt) !== -1) {
        return '';
    } else {
        return txt;
    }
}

//Exporto las funciones de la librería utils para que puedan accederse desde fuera
module.exports = {
    error: error,
    isUpdated: isUpdated,
    getTagPeli: getTagPeli
};
