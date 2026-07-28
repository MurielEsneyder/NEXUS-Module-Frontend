export interface PersonalElement {
  cargoNombre: string;
  estado: string;
  idCargoEvaluador: number;
  idPersona: number;
  nombre: string;
  numeroIdentificacion: string;
  primerApellido: string;
  segundoApellido: string;
  tipoCargo: ComListaValores;
  nivelCargo: ComListaValores;
}
export interface ComListaValores {
  idListaValor: number;
  descripcion: string;
  orden: number;
  usuarioCreacion: string;
  fechaRegistro: string;

}

// Interface para el objeto "cuestionario"
export interface Cuestionario {
  idCuestionario: number;
  descripcion: string;
  porcentaje: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  estado: number;
}

// Interface para el objeto "itemsCuestionario"
export interface ItemsCuestionario {
  idItemsCuestionario: number;
  cuestionario: Cuestionario;
  descripcion: string;
  valorPonderado: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  estado: number;
}

// Interface para el objeto principal
export interface Pregunta {
  idPregunta: number;
  pregunta: string;
  itemsCuestionario: ItemsCuestionario;
  fechaCreacion: string;
  usuarioCreacion: string;
  estado: number;
  idArea: number | null;
}

export interface OpcinesEvaluador {
  codigoCargo: string;
  descripcionArea: string;
  descripcionCargo: string;
  idListaValor: number
}

export interface PorcentajeCuestionario {
  idPorcentajeCuestionario: number;
  valorPonderado: number;
  vigencia: number;
  idClasificacion: ComListaValores;
  idCuestionario: Cuestionario;
}

export interface PorcentajeItemsCuestionario {
  idPorcentajeCuestionario: number;
  valorPonderado: number;
  vigencia: number;
  idClasificacion: ComListaValores;
  idItemsCuestionario: Cuestionario;
}
