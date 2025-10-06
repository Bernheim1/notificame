export const PLANTILLAS: {
  [tipo: string]: {
    [subtipo: string]: {
      [campo: string]: any
    }
  }
} = {
  Mandamiento: {
    IntimacionPago: { tipoDomicilio: { denunciado: true }, expediente: { copiasTraslado: true } },
  },
  Cedula: {
    TrasladoDemanda: { urgente: true },
  }
};