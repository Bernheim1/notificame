export enum TipoSalidaEnum {
    SinAsignar = 0,
    Cedula = 1,
    Mandamiento = 2
}

export enum TipoCedulaEnum {
    TrasladoDemanda = 0
}

export enum TipoMandamientoEnum {
    IntimacionPago = 0
}

export const TipoSalidaTexto: Record<TipoSalidaEnum, string> = {
  [TipoSalidaEnum.SinAsignar]: 'Sin asignar',
  [TipoSalidaEnum.Cedula]: 'Cédula',
  [TipoSalidaEnum.Mandamiento]: 'Mandamiento',
};

export const TipoCedulaTexto: Record<TipoCedulaEnum, string> = {
  [TipoCedulaEnum.TrasladoDemanda]: 'Traslado de Demanda',
};

export const TipoMandamientoTexto: Record<TipoMandamientoEnum, string> = {
  [TipoMandamientoEnum.IntimacionPago]: 'Intimación de Pago',
};