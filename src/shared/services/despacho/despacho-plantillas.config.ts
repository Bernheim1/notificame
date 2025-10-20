export const PLANTILLAS: {
  [tipo: string]: {
    [subtipo: string]: {
      [campo: string]: any
    }
  }
} = {
  Mandamiento: {
    IntimacionPago: { tipoDomicilio: { denunciado: true, constituido: false }, expediente: { copiasTraslado: true, tipoDiligencia: 'Mandamiento de intimación de pago y citación de remate' } },
  },
  Cedula: {
    TrasladoDemanda: { urgente: true },
  }
};