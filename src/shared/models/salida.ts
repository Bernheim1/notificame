import { TipoSalidaEnum } from "../enums/tipo-salida-enum";

// shared/models/salida.ts
export class Salida {
  // --- metadatos / control ---
  tipoSalida: TipoSalidaEnum = TipoSalidaEnum.SinAsignar;

  // --- organo ---
  organo: string = '';
  juzgadoInterviniente: string = '';
  juzgadoTribunal: string = '';
  direccionJuzgado: string = '';

  // --- domicilioRequerido ---
  localidad: string = '';
  domicilio: string = '';
  nro: number | null = null;
  piso: number | null = null;
  depto: string = '';
  unidad: string = '';

  // --- expediente ---
  tipoDiligencia: string = '';
  caratulaExpediente: string = '';
  copiasTraslado: boolean = false;

  // --- caracter ---
  urgente: boolean = false;
  habilitacionDiaHora: boolean = false;
  bajoResponsabilidad: boolean = false;

  // --- tipoDomicilio ---
  denunciado: boolean = false;
  constituido: boolean = false;

  // --- facultadesAtribuciones ---
  allanamiento: boolean = false;
  allanamientoDomicilioSinOcupantes: boolean = false;
  auxilioFuerzaPublica: boolean = false;
  conCerrajero: boolean = false;
  denunciaOtroDomicilio: boolean = false;
  denunciaBienes: boolean = false;
  otrosFacultades: string = ''; // texto opcional

  // --- textoContenido (nuevo) ---
  // 'requerido' es un texto libre; los montos hay versión texto y versión numérica
  textoRequerido: string = '';
  montoCapitalTexto: string = '';
  montoCapitalNumerico: number | null = null;
  montoInteresesTexto: string = '';
  montoInteresesNumerico: number | null = null;

  constructor(init?: Partial<Salida>) {
    if (init) Object.assign(this, init);
  }
}