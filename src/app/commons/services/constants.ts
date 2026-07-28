export interface AfilInfo {
    idAfiliado: number,
    nroIdentificacion: string,
    codigoDocumento: number,
    codigoTipoDocumento: string,
    codigoGenero: string,
    nombre1: string,
    nombre2: string,
    apellido1: string,
    apellido2: string,
    descripcionTipoAfiliacion: string
    descripcionRegimen: string,
    afiliadoActivo: boolean,
    habeasDataAcepta: boolean,
    portabilidad: boolean,
    datosContacto: boolean,
    registrado: boolean,
    email: string,
    username: string,
    public: boolean,
    sessionDateTime: number,
    sessionIP: string,
    nombreCompleto: string,
  };
  
  export interface DepartamentoList {
    departamentos: [{ nombre: string, id: number, cod: string }], municipios: [{ nombre: string, id: number, cod: string, id_dpto: number }];
  }
  