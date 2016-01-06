/^(.*)( - )(([0-9]{1,2})[ºª] Temporada)( )*(\[[0-9]+[p]+\])?(\[Dual.*\])?(\.)?$/

[original, nombre, -, textoTemporada, numTemporada, -, calidad, idiomas, -]

res = patron.exec(a)
["Agents of S.H.I.E.L.D. - 1ª Temporada [720p]", "Agents of S.H.I.E.L.D.", " - ", "1ª Temporada", "1", " ", "[720p]", undefined, undefined]
res2 = patron.exec(b)
["Agent X - 1ª Temporada", "Agent X", " - ", "1ª Temporada", "1", undefined, undefined, undefined, undefined]
res3 = patron.exec(c)
["Arriba y Abajo - 1ª Temporada [Dual Castellano/Inglés].", "Arriba y Abajo", " - ", "1ª Temporada", "1", " ", undefined, "[Dual Castellano/Inglés]", "."]

/*
en node un endpoint que se acceda pasando md5 por url para generar un html con un listado de urls con los enlaces a las paginas de temporadas de series a sacar los episodios. Serán las ultimas temporadas de cada serie sólo. Si solo tienen una temporada pues esa.
Este html del endpoint lo consumira un API de Kimono. Luego otro api consume como entrada este API anterior para acceder a esas páginas y sacar por fin el json con los episodios. Diariamente.

Para los enlaces de los torrents ya lo hará el nodejs, acceder a la web del episodio y sacar de ahí el ID para el enlace al torrent.
*/

/********************************/
function transform(data) {
  // filter functions are passed the whole API response object
  // you may manipulate or add to this data as you want

  // query parameters exist in the global scope, for example:
  // http://www.kimonolabs.com/apis/<API_ID>/?apikey=<API_KEY>&myparam=test
  // query.myparam == 'test'; // true
  var patron = new RegExp(/^(.*)( - )(([0-9]{1,2})[ºª] Temporada)( )*(\[[0-9]+[p]+\])?(\[Dual.*\])?(\.)?$/);
  
  data.results.Series.forEach(function(serie){
    //[original, nombre, -, textoTemporada, numTemporada, -, calidad, idiomas, -]
    var res = patron.exec(serie.nombre.text);
    
    if (res === null) {
      var titulo = serie.nombre.text.split(' - ');
      
      var temporada = '';
      if (serie.nombre.text.indexOf('Miniserie')!==-1) {
        temporada = 'Miniserie';
      }
      
      serie.info = {
        titulo: titulo[0],
        temporada: temporada
      };
    } else {
      var titulo = res[1];
      var numTemporada = res[4];
      var calidad, idiomas;
      
      if (res[6]) {
        calidad = res[6].replace('[', '').replace(']', '');
      } else {
        calidad = 'Estandar';
      }
      
      if (res[7]) {
        idiomas = res[7].replace('[', '').replace(']', '');
      } else {
        idiomas = 'Castellano';
      }
      
      serie.info = {
        titulo: titulo,
        temporada: numTemporada,
        calidad: calidad,
        idiomas: idiomas
      };
    }
    
  });

  return data;
}
