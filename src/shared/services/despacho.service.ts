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
      facultadesAtribuciones: this.extraerFacultades(despachoTexto),
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
  private extraerCaracter(despachoTexto: string) {
    const urgenteRegex = /URGENTE/;
    const habilitacionRegex = /habilitación de día y hora/;
    const bajoResponsabilidadRegex = /bajo responsabilidad/;

    return {
      urgente: urgenteRegex.test(despachoTexto),
      habilitacionDiaHora: habilitacionRegex.test(despachoTexto),
      bajoResponsabilidad: bajoResponsabilidadRegex.test(despachoTexto),
    };
  }

  // Función para extraer el tipo de domicilio (denunciado, constituido)
  private extraerTipoDomicilio(despachoTexto: string) {
    const denunciadoRegex = /denunciado/;
    const constituidoRegex = /constituido/;

    return {
      denunciado: denunciadoRegex.test(despachoTexto),
      constituido: constituidoRegex.test(despachoTexto),
    };
  }

  // Función para extraer las facultades y atribuciones (allanamiento, auxilio fuerza pública, etc.)
  private extraerFacultades(despachoTexto: string) {
    const allanamientoRegex = /allanamiento/;
    const auxilioFuerzaPublicaRegex = /auxilio de la fuerza pública/;
    const conCerrajeroRegex = /con cerrajero/;
    const denunciaOtroDomicilioRegex = /denuncia otro domicilio/;
    const denunciaBienesRegex = /denuncia bienes/;

    return {
      allanamiento: allanamientoRegex.test(despachoTexto),
      allanamientoDomicilioSinOcupantes: false, // Podría adaptarse si es relevante
      auxilioFuerzaPublica: auxilioFuerzaPublicaRegex.test(despachoTexto),
      conCerrajero: conCerrajeroRegex.test(despachoTexto),
      denunciaOtroDomicilio: denunciaOtroDomicilioRegex.test(despachoTexto),
      denunciaBienes: denunciaBienesRegex.test(despachoTexto),
      otros: false, // Puede ser adaptado si hay más casos
    };
  }
}