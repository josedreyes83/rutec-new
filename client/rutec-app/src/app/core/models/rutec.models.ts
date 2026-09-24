export interface PaginatedList<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TrabajadorList {
  id: number;
  numeroCedulaExtranjeria: string | null;
  primerNombre: string | null;
  primerApellido: string | null;
  segundoNombre: string | null;
  segundoApellido: string | null;
  codigoGenero: string | null;
  generoDescripcion: string | null;
  paisNacimientoNombre: string | null;
  idOrganizacion: number;
  fechaRegistro: string | null;
}

export interface TrabajadorDetail {
  id: number;
  idOrganizacion: number;
  numeroCedulaExtranjeria: string | null;
  numeroPep: string | null;
  numeroPasaporte: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  codigoGenero: string | null;
  generoDescripcion: string | null;
  codigoEstadoCivil: string | null;
  estadoCivilDescripcion: string | null;
  fechaNacimiento: string | null;
  codigoPaisNacimiento: string | null;
  paisNacimientoNombre: string | null;
  codigoPaisCiudadania: string | null;
  paisCiudadaniaNombre: string | null;
  tipoDeVisa: number | null;
  tipoVisaDescripcion: string | null;
  tipoDocumento: string | null;
  fechaRegistro: string | null;
  idiomas: Idioma[];
  nivelesEducativos: NivelEducativo[];
  cantidadContratos: number;
}

export interface Idioma {
  id: number;
  idioma: string | null;
  nivelHablado: string | null;
  nivelEscrito: string | null;
  nivelLeido: string | null;
}

export interface NivelEducativo {
  id: number;
  nivelEducativo: string | null;
  semestresCursados: number | null;
  obtuvoTitulo: string | null;
  titulo: string | null;
}

export interface ContratoList {
  id: number;
  idMigranteTrabajador: number;
  denominacionContrato: string | null;
  tipoContratoDescripcion: string | null;
  cargoTrabajador: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  eliminado: boolean;
  aclaracion: string | null;
}

export interface ContratoDetail {
  id: number;
  idMigranteTrabajador: number;
  idOrganizacion: number | null;
  denominacionContrato: string | null;
  tipoContratoTrabajador: string | null;
  tipoContratoDescripcion: string | null;
  cargoTrabajador: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  codigoDepto: string | null;
  deptoNombre: string | null;
  codigoMpio: string | null;
  mpioNombre: string | null;
  profesion: string | null;
  descripcionContrato: string | null;
  eliminado: boolean;
  motivoEliminado: string | null;
  fechaRegistro: string | null;
}

export interface CodigoReferencia {
  id: number;
  codigo: string;
  nombre: string;
  grupo: string;
}
