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
      return this.generarMandamiento(despachoTexto);
    } else {
      return this.generarCedula(despachoTexto);
    }
  }

  // Generar el mandamiento con los datos extraídos
  private generarMandamiento(despachoTexto: string): any {
    return {
      organo: this.extraerJuzgado(despachoTexto),
      expediente: this.extraerExpediente(despachoTexto),
      domicilioRequerido: this.extraerDomicilio(despachoTexto),
      caracter: this.extraerCaracter(despachoTexto),
      tipoDomicilio: this.extraerTipoDomicilio(despachoTexto),
      facultadesAtribuciones: this.extraerFacultades(despachoTexto),
    };
  }

  // Generar la cédula con los datos extraídos (puedes crear otra lógica para la cédula)
  private generarCedula(despachoTexto: string): any {
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
  private extraerJuzgado(despachoTexto: string) {
    const juzgadoRegex = /Juzgado Civil y Comercial N° (\d+).*\n(.*)/;
    const matches = despachoTexto.match(juzgadoRegex);
    if (matches) {
      return {
        organo: 'Poder Judicial Provincia de Buenos Aires',
        juzgadoInterviniente: matches[1], // N° Juzgado
        juzgadoTribunal: matches[2].trim(), // Nombre del juzgado
        direccionJuzgado: '9 de Julio Nº 287, 3 piso- Quilmes', // Dirección fija o extraída si está en el texto
      };
    }
    return {
      organo: '',
      juzgadoInterviniente: '',
      juzgadoTribunal: '',
      direccionJuzgado: '',
    };
  }

  // Función para extraer la información del expediente
  private extraerExpediente(despachoTexto: string) {
    const expedienteRegex = /EXPTE: (\d+)\s+([^\n]+)/;
    const matches = despachoTexto.match(expedienteRegex);
    if (matches) {
      return {
        tipoDiligencia: 'Mandamiento de Intimación de Pago', // Este valor se puede extraer o definir
        caratulaExpediente: matches[2].trim(), // Carátula del expediente
        copiasTraslado: true, // Lo asumimos como true en este caso o se podría extraer
      };
    }
    return {
      tipoDiligencia: '',
      caratulaExpediente: '',
      copiasTraslado: false,
    };
  }

  // Función para extraer el domicilio requerido
  private extraerDomicilio(despachoTexto: string) {
    const domicilioRegex = /Domicilio:\s*(.*)\s+Nro:\s*(\d+)\s*(Piso:\s*(\d+))?/;
    const matches = despachoTexto.match(domicilioRegex);
    if (matches) {
      return {
        localidad: 'Florencio Varela', // Extraído o definido
        domicilio: matches[1]?.trim() || '',
        nro: matches[2]?.trim() || '',
        piso: matches[4] || '',
        depto: '', // Podríamos extraerlo si estuviera en el texto
        unidad: '', // Puede ser extraído o definido
      };
    }
    return {
      localidad: '',
      domicilio: '',
      nro: '',
      piso: '',
      depto: '',
      unidad: '',
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