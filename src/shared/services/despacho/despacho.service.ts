import { Injectable } from '@angular/core';
import { TipoCedulaEnum, TipoMandamientoEnum, TipoSalidaEnum } from '../../enums/tipo-salida-enum';
import { PLANTILLAS } from '../despacho/despacho-plantillas.config';

@Injectable({
  providedIn: 'root',
})
export class DespachoService {
  constructor() {}

  // Función que procesa el primer despacho
  procesarDespacho(
    despachoTexto: string,
    tipoSalida: TipoSalidaEnum,
    subtipoSalida: TipoCedulaEnum | TipoMandamientoEnum
  ): any {
    const tipoKey = TipoSalidaEnum[tipoSalida];
    let subtipoKey = '';
    if (tipoSalida === TipoSalidaEnum.Cedula) {
      subtipoKey = TipoCedulaEnum[subtipoSalida];
    } else if (tipoSalida === TipoSalidaEnum.Mandamiento) {
      subtipoKey = TipoMandamientoEnum[subtipoSalida];
    }

    const plantilla = PLANTILLAS[tipoKey]?.[subtipoKey] || {};
    let resultado = tipoKey === 'Mandamiento'
      ? this.generarMandamiento(despachoTexto, subtipoKey)
      : this.generarCedula(despachoTexto, subtipoKey);

    resultado = this.aplicarPlantilla(resultado, plantilla);
    return resultado;
  }

  // Generar el mandamiento con los datos extraídos
  private generarMandamiento(despachoTexto: string, subtipoSalida : any): any {
    return {
      organo: this.extraerJuzgado(despachoTexto),
      expediente: this.extraerExpediente(despachoTexto),
      caracter: this.extraerCaracter(despachoTexto),
      tipoDomicilio: this.extraerTipoDomicilio(despachoTexto),
      facultadesAtribuciones: this.extraerFacultadesAtribuciones(despachoTexto),
      textoContenido: this.extraerTextoContenido(despachoTexto),
    };
  }

  // Generar la cédula con los datos extraídos (puedes crear otra lógica para la cédula)
  private generarCedula(despachoTexto: string, subtipoSalida : any): any {
    // return {
    //   tipo: 'cedula',
    //   montoCapital: datos.montoCapital,
    //   montoIntereses: datos.montoIntereses,
    //   plazoExcepciones: datos.plazoExcepciones,
    //   domicilio: datos.domicilio,
    //   // Estructura de cédula
    // };
  }

  extraerJuzgado(despachoTexto: string): {
    organo: string;
    juzgadoInterviniente: string;
    juzgadoTribunal: string;
    direccionJuzgado: string;
  } {
    let organo = '';
    let juzgadoInterviniente = '';
    let juzgadoTribunal = '';
    let direccionJuzgado = '';

    // Buscar "Juzgado en lo Civil y Comercial Nº X"
    const juzgadoMatch = despachoTexto.match(/Juzgado en lo Civil y Comercial Nº\s*\d+/i);
    if (juzgadoMatch) {
      juzgadoInterviniente = this.capitalizarFrase(juzgadoMatch[0]);
      juzgadoTribunal = juzgadoInterviniente;
      organo = juzgadoInterviniente;
    }

    // Buscar ciudad (ejemplo: Bahía Blanca)
    const ciudadMatch = despachoTexto.match(/Bahía Blanca/i);
    if (ciudadMatch) {
      direccionJuzgado = ciudadMatch[0];
    }

    return {
      organo,
      juzgadoInterviniente,
      juzgadoTribunal,
      direccionJuzgado
    };
  }

  private capitalizarFrase(texto: string): string {
    return texto.replace(/\b\w+/g, palabra =>
      palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    );
  }

  private extraerExpediente(texto: string) {
    // Carátula
    let caratulaMatch = texto.match(/Carátula:\s*(.+)/i);
    let caratulaExpediente = caratulaMatch ? caratulaMatch[1].trim() : '';

    // Copias para traslado (mantiene lógica anterior)
    let copiasTraslado = /con\s+copias|copias\s+para\s+traslado/i.test(texto);

    return {
      caratulaExpediente,
      copiasTraslado
    };
  }

  private extraerCaracter(texto: string): {
    urgente: boolean;
    habilitacionDiaHora: boolean;
    bajoResponsabilidad: boolean;
  } {
    const urgente = /\b(urgente|urgentemente|con carácter de urgente|con carácter urgente)\b/i.test(texto);
    const habilitacionDiaHora = /\b(habilitación (de )?d[ií]as y horas|habilítese d[ií]a y hora|habilitando d[ií]a y hora|con habilitación|con habilitación de días y horas|con habilitación de días y horas inhábiles|con habilitación de día y hora|con habilitación de día y hora inhabil)\b/i.test(texto);
    const bajoResponsabilidad = /\b(bajo (exclusiva )?responsabilidad|bajo su responsabilidad|bajo responsabilidad de la parte|bajo responsabilidad de la parte actora|y bajo responsabilidad de la parte|y bajo responsabilidad de la parte actora)\b/i.test(texto);

    return {
      urgente,
      habilitacionDiaHora,
      bajoResponsabilidad
    };
  }

  // Función para extraer el tipo de domicilio (denunciado, constituido)
  extraerTipoDomicilio(texto: string): {
    denunciado: boolean;
    constituido: boolean;
  } {
    const denunciado = /\b(domicilio denunciado|domicilio que denunciare|domicilio del requerido|domicilio real)\b/i.test(texto);
    const constituido = /\b(domicilio constituido|constituyó domicilio|domicilio procesal|constituido en autos)\b/i.test(texto);

    return {
      denunciado,
      constituido
    };
  }

  // Función para extraer las facultades y atribuciones (allanamiento, auxilio fuerza pública, etc.)
  extraerFacultadesAtribuciones(texto: string): {
    allanamiento: boolean;
    allanamientoDomicilioSinOcupantes: boolean;
    auxilioFuerzaPublica: boolean;
    conCerrajero: boolean;
    denunciaOtroDomicilio: boolean;
    denunciaBienes: boolean;
    otros: boolean;
  } {
    const allanamiento = /allanamiento del domicilio|facúltese.*allanamiento|autorícese.*allanamiento|con facultad de allanamiento|allanamiento|para allanar|allanar/i.test(texto);
    const allanamientoDomicilioSinOcupantes = /inmueble.*desocupado|sin ocupantes|aunque no haya ocupantes|allanamiento sin ocupantes|siempre que no haya ocupantes|pudiendo allanar en caso de no haber ocupantes|pudiendose allanar en caso de no haber ocupantes/i.test(texto);
    const auxilioFuerzaPublica = /fuerza pública|intervención policial|pudiendo requerir fuerza pública|con auxilio de la fuerza pública|con el auxilio de la fuerza pública|policía/i.test(texto);
    const conCerrajero = /\b(con\s+cerrajero|con\s+el\s+cerrajero|sin\s+cerrajero|cerrajero|uso de cerrajero|valerse de cerrajero)\b/i.test(texto);
    const denunciaOtroDomicilio = /denuncie otro domicilio|otro domicilio que se denunciare/i.test(texto);
    const denunciaBienes = /denuncie bienes|denunciar bienes|facúltese.*denunciar bienes|denuncia de bienes|denuncia de bienes a embargo|facultad de denunciar bienes|con la facultad de denunciar bienes|individualizar bienes|facultad de individualizar bienes/i.test(texto);

    // Detectar "otros" si se menciona "facúltese" o "autorícese" pero no cae en ninguno de los casos anteriores
    const algunaFacultad = /facúltese|autorícese/i.test(texto);
    const algunaDetectada = allanamiento || allanamientoDomicilioSinOcupantes || auxilioFuerzaPublica || conCerrajero || denunciaOtroDomicilio || denunciaBienes;
    const otros = algunaFacultad && !algunaDetectada;

    return {
      allanamiento,
      allanamientoDomicilioSinOcupantes,
      auxilioFuerzaPublica,
      conCerrajero,
      denunciaOtroDomicilio,
      denunciaBienes,
      otros
    };
  }

  private extraerTextoContenido(texto: string) {
    const nombreMatch = texto.match(/líbrese mandamiento contra\s+"([^"]+)"|líbrese mandamiento de intimación de pago contra\s+"([^"]+)"|Carátula:\s*.+c\/\s*([^\s]+)/i);
    const montoLetrasMatch = texto.match(/(por la suma de|por las sumas de|pesos|en concepto de capital)\s+([A-Z\sÁÉÍÓÚÑ]+)\s*\(\$\s*[\d.,]+\)/i);
    const montoInteresesMatch = texto.match(/(para responder a intereses|intereses|en concepto de intereses|para responder intereses|por intereses|para intereses|por interes|para interes)\s*([A-Z\sÁÉÍÓÚÑ]+)\s*\(\$\s*[\d.,]+\)/i);

    return {
      requerido: nombreMatch?.[1]?.trim() || nombreMatch?.[2]?.trim() || nombreMatch?.[3]?.trim() || 'NOMBRE REQUERIDO',
      montoCapitalTexto: montoLetrasMatch?.[2]?.trim() || 'MONTO CAPITAL',
      montoCapitalNumerico: montoLetrasMatch ? this.extraerMontoNumericoDesdeTexto(montoLetrasMatch[0]) : '',
      montoInteresesTexto: montoInteresesMatch?.[2]?.trim() || 'MONTO INTERESES',
      montoInteresesNumerico: montoInteresesMatch ? this.extraerMontoNumericoDesdeTexto(montoInteresesMatch[0]) : ''
    };
  }

  private aplicarPlantilla(resultado: any, plantilla: any): any {
    Object.keys(plantilla).forEach(key => {
      if (
        typeof plantilla[key] === 'object' &&
        plantilla[key] !== null &&
        resultado[key] !== undefined
      ) {
        resultado[key] = { ...resultado[key], ...plantilla[key] };
      } else {
        resultado[key] = plantilla[key];
      }
    });
    return resultado;
  }

  private extraerMontoNumericoDesdeTexto(montoTexto: string): string {
  const match = montoTexto.match(/\(\$\s*([\d.,]+)\)/);
  return match ? `$ ${match[1]}` : '';
}
}