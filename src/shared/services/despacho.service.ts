import { Injectable } from '@angular/core';
import { TipoSalidaEnum } from '../enums/tipo-salida-enum';

@Injectable({
  providedIn: 'root',
})
export class DespachoService {
  constructor() {}

  // Función que procesa el primer despacho
  procesarDespacho(despachoTexto: string, tipoSalida: TipoSalidaEnum, subtipoSalida : any): any {
    if (tipoSalida === TipoSalidaEnum.Mandamiento) {
      return this.generarMandamiento(despachoTexto, subtipoSalida);
    } else {
      return this.generarCedula(despachoTexto, subtipoSalida);
    }
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

  // Función para extraer la información del juzgado
  extraerJuzgado(despachoTexto: string): {
    organo: string;
    juzgadoInterviniente: string;
    juzgadoTribunal: string;
    direccionJuzgado: string;
  } {
    const lineas = despachoTexto.split('\n').map(linea => linea.trim()).filter(Boolean);

    // Buscamos la última línea que tenga la palabra "juzgado"
    const lineaJuzgado = [...lineas].reverse().find(linea =>
      /juzgado.*n.?º?\s*\d+/i.test(linea)
    );

    const juzgadoLimpio = lineaJuzgado ? this.capitalizarFrase(lineaJuzgado.toLowerCase()) : '';

    return {
      organo: '',
      juzgadoInterviniente: juzgadoLimpio,
      juzgadoTribunal: juzgadoLimpio,
      direccionJuzgado: ''
    };
  }

  private capitalizarFrase(texto: string): string {
    return texto.replace(/\b\w+/g, palabra =>
      palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    );
  }

  // Función para extraer la información del expediente
  private extraerExpediente(texto: string){
    // 1. Carátula
    let caratulaMatch = texto.match(/CARATULA:\s*(.*)/i);
    let caratulaExpediente = caratulaMatch ? caratulaMatch[1].trim() : '';

    // 2. Tipo de diligencia
    let diligenciaRegex = /líbrese\s+(mandamiento|cédula)[^\n.,;]*?(de[^.]+?remate|de[^.]+?\.)/i;
    let diligenciaMatch = texto.match(diligenciaRegex);
    let tipoDiligencia = '';
    if (diligenciaMatch) {
      tipoDiligencia =
        diligenciaMatch[0]
          .replace(/^líbrese\s+/i, '')  // quitar "líbrese"
          .replace(/\s+contra.*$/i, '') // evitar que tome "contra Fulano"
          .replace(/\.+$/, '')          // quitar puntos finales
          .trim()
    }

    // 3. Copias para traslado
    let copiasTraslado = /con\s+copias|copias\s+para\s+traslado/i.test(texto);

    return {
      tipoDiligencia,
      caratulaExpediente,
      copiasTraslado
    };
  }

  // Función para extraer la parte de "carácter" (urgente, habilitación de día y hora, etc.)
  private extraerCaracter(texto: string): {
    urgente: boolean;
    habilitacionDiaHora: boolean;
    bajoResponsabilidad: boolean;
  } {
    const urgente = /\b(urgente|urgentemente|con carácter de urgente)\b/i.test(texto);
    const habilitacionDiaHora = /\b(habilitación (de )?d[ií]as y horas|habilítese d[ií]a y hora)\b/i.test(texto);
    const bajoResponsabilidad = /\b(bajo (exclusiva )?responsabilidad)\b/i.test(texto);

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
    const allanamiento = /allanamiento del domicilio|facúltese.*allanamiento|autorícese.*allanamiento/i.test(texto);
    const allanamientoDomicilioSinOcupantes = /inmueble.*desocupado|sin ocupantes|aunque no haya ocupantes/i.test(texto);
    const auxilioFuerzaPublica = /fuerza pública|intervención policial|pudiendo requerir fuerza pública/i.test(texto);
    const conCerrajero = /con cerrajero|uso de cerrajero|valerse de cerrajero/i.test(texto);
    const denunciaOtroDomicilio = /denuncie otro domicilio|otro domicilio que se denunciare/i.test(texto);
    const denunciaBienes = /denuncie bienes|denunciar bienes|facúltese.*denunciar bienes/i.test(texto);

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
    const nombreMatch = texto.match(/contra\s+([A-ZÁÉÍÓÚÑ\s]+),?\s+por la suma/i);
    const montoLetrasMatch = texto.match(/por la suma de\s+([A-Z\sÁÉÍÓÚÑ]+)\s+\(\$\s*[\d.,]+\)/i);
    const montoNumericoMatch = texto.match(/por la suma de\s+[A-Z\sÁÉÍÓÚÑ]+\s+\(\$\s*([\d.,]+)\)/i);
    const interesesLetrasMatch = texto.match(/más la de\s+([A-Z\sÁÉÍÓÚÑ]+)\s+\(\$\s*[\d.,]+\)/i);
    const interesesNumericoMatch = texto.match(/más la de\s+[A-Z\sÁÉÍÓÚÑ]+\s+\(\$\s*([\d.,]+)\)/i);

    return {
      requerido: nombreMatch ? nombreMatch[1].trim() : 'NOMBRE REQUERIDO',
      montoCapitalTexto: montoLetrasMatch ? montoLetrasMatch[1].trim() : 'MONTO CAPITAL',
      montoCapitalNumerico: montoNumericoMatch ? montoNumericoMatch[1].replace(/\./g, '').replace(',', '.') : '',
      montoInteresesTexto: interesesLetrasMatch ? interesesLetrasMatch[1].trim() : 'MONTO INTERESES',
      montoInteresesNumerico: interesesNumericoMatch ? interesesNumericoMatch[1].replace(/\./g, '').replace(',', '.') : ''
    };
  }


}