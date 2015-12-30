//Cargo la librería chai y los módulos que necesite
var expect = require('chai').expect,
    mockery = require('mockery');

describe('Test Utils library', function () {
    //Tests de la función 'getRespuesta'
    describe('TestGetRespuesta', function () {
        var utils = require('../../main/modules/utils');
        it('Debería existir la función', function () {
            expect(utils.getRespuesta).to.be.a('function');
        });

        it('Lo que devuelve getRespuesta', function () {
            expect(utils.getRespuesta('Manolo')).to.be.equal('Hola Manolo');
        });
    });

    //Tests de la función 'getFuncionAMockear' sin mockear
    describe('TestGetFuncionAMockear sin mock', function () {
        var utils = require('../../main/modules/utils');

        //Los tests
        it('Debería existir la función', function () {
            expect(utils.getFuncionAMockear).to.be.a('function');
        });

        it('Lo que devuelve getRespuesta', function () {
            expect(utils.getFuncionAMockear('Pedrito')).to.be.equal('Original Pedrito');
        });
    });

    //Tests de la función 'getFuncionAMockear' mockeada
    describe('TestGetFuncionAMockear mockeada', function () {
        var utils;

        //Creo el mock de la función que me interesa
        var utilsMock = {
            getFuncionAMockear: function (parametro) {
                return 'Soy un mock ' + parametro;
            }
        };

        //Antes de nada activo el mockery y lo configuro
        before(function () {
            mockery.enable({
                warnOnReplace: false,
                warnOnUnregistered: false,
                useCleanCache: true
            });

            //Registro mi librería utilsMock como utils
            mockery.registerMock('../../main/modules/utils', utilsMock);

            //Cargo aquí los módulos que necesito para que el Mock haga el
            // "man-in-the-middle" correctamente. Si no, al intentar registrar el mock
            // ya estaría cargada la librería original y no se podría sobrescribir.
            // Puedo cargarlo en los it, si necesitase diferentes módulos para cada uno.
            utils = require('../../main/modules/utils');
        });

        //Antes de cada test podría hacer cosas. Se ejecuta después del before.
        beforeEach(function () {
        });

        //Después de cada test podría hacer cosas
        afterEach(function () {
        });

        //Al terminar hago lo siguiente
        after(function () {
            //Desactivo mockery
            mockery.disable();
        });

        //Los tests
        it('Debería existir la función', function () {
            expect(utils.getFuncionAMockear).to.be.a('function');
        });

        it('Lo que devuelve getRespuesta', function () {
            //Espero que me devuelva el resultado del mock
            expect(utils.getFuncionAMockear('Manolo')).to.be.equal('Soy un mock Manolo');
        });
    });

});
