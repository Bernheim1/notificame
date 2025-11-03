import { Injectable } from '@angular/core';
import { TipoCedulaEnum, TipoMandamientoEnum, TipoSalidaEnum } from '../../enums/tipo-salida-enum';
import { PLANTILLAS } from '../despacho/despacho-plantillas.config';

interface OrganoInfo {
  organo: string;
  juzgadoInterviniente: string;
  juzgadoTribunal: string;
  direccionJuzgado: string;
}
interface ExpedienteInfo {
  caratulaExpediente: string;
  numeroExpediente: string;
  copiasTraslado: boolean;
}
interface CaracterInfo {
  urgente: boolean;
  habilitacionDiaHora: boolean;
  bajoResponsabilidad: boolean;
}
interface TipoDomicilioInfo {
  denunciado: boolean;
  constituido: boolean;
}
interface FacultadesInfo {
  allanamiento: boolean;
  allanamientoDomicilioSinOcupantes: boolean;
  auxilioFuerzaPublica: boolean;
  conCerrajero: boolean;
  denunciaOtroDomicilio: boolean;
  denunciaBienes: boolean;
  otros: boolean;
}
interface TextoContenidoInfo {
  requerido: string;
  montoCapitalTexto: string;
  montoCapitalNumerico: string;
  montoInteresesTexto: string;
  montoInteresesNumerico: string;
}

interface JuzgadoCatalogEntry {
  juzgado: string;
  direccion?: string;
  raw?: any;
}

@Injectable({ providedIn: 'root' })
export class DespachoService {
  constructor() {}

  procesarDespacho(
    despachoTexto: string,
    tipoSalida: TipoSalidaEnum,
    subtipoSalida: TipoCedulaEnum | TipoMandamientoEnum
  ): any {
    const tipoKey = TipoSalidaEnum[tipoSalida];
    let subtipoKey = '';
    if (tipoSalida === TipoSalidaEnum.Cedula) subtipoKey = TipoCedulaEnum[subtipoSalida];
    else if (tipoSalida === TipoSalidaEnum.Mandamiento) subtipoKey = TipoMandamientoEnum[subtipoSalida];

    const plantilla = PLANTILLAS[tipoKey]?.[subtipoKey] || {};
    const textoNormalizado = this.normalizarTexto(despachoTexto);

    let resultado = tipoKey === 'Mandamiento'
      ? this.generarMandamiento(textoNormalizado, subtipoKey)
      : this.generarCedula(textoNormalizado, subtipoKey);

    resultado = this.aplicarPlantilla(resultado, plantilla);
    return resultado;
  }

  private generarMandamiento(texto: string, subtipoSalida: string): any {
    return {
      organo: this.extraerJuzgado(texto),
      expediente: this.extraerExpediente(texto),
      caracter: this.extraerCaracter(texto),
      tipoDomicilio: this.extraerTipoDomicilio(texto),
      facultadesAtribuciones: this.extraerFacultadesAtribuciones(texto),
      textoContenido: this.extraerTextoContenido(texto),
      subtipo: subtipoSalida
    };
  }

  private generarCedula(texto: string, subtipoSalida: string): any {
    return {
      organo: this.extraerJuzgado(texto),
      expediente: this.extraerExpediente(texto),
      caracter: this.extraerCaracter(texto),
      tipoDomicilio: this.extraerTipoDomicilio(texto),
      facultadesAtribuciones: this.extraerFacultadesAtribuciones(texto),
      textoContenido: this.extraerTextoContenido(texto),
      subtipo: subtipoSalida
    };
  }

  // ---------------- Normalización ----------------
  private normalizarTexto(raw: string): string {
    return raw
      .replace(/[^\n\rA-Z0-9ÁÉÍÓÚÑa-záéíóúñ\/.,:()"%-]/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/\r/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .replace(/ +/g, ' ')
      .trim();
  }

  private capitalizarFrase(txt: string): string {
    return txt
      .toLowerCase()
      .replace(/\b([a-záéíóúñ]+)/g, w => w.charAt(0).toUpperCase() + w.slice(1));
  }

  private catalogo: JuzgadoCatalogEntry[] = [];

  usarCatalogoJuzgados(rows: JuzgadoCatalogEntry[]) {
    this.catalogo = (rows || []).filter(r => r?.juzgado);
  }

  private normalizarClave(v: string): string {
    return (v || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')     // sin acentos
      .toUpperCase()
      .replace(/N(°|º)/g, 'Nº')            // N° / Nº -> Nº
      .replace(/\bNRO\b/g, 'Nº')           // NRO -> Nº
      .replace(/N\s*(?=\d)/g, 'Nº ')       // N [espacios] dígito -> Nº dígito
      .replace(/\bNO?\b(?=\s*\d)/g, 'Nº')  // N / No antes de número -> Nº
      .replace(/\s*-\s*/g, ' ')            // guiones como espacio
      .replace(/[\.,"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ---------------- Órgano ----------------
  extraerJuzgado(texto: string): OrganoInfo {
    let organo = '';
    let juzgadoInterviniente = '';
    let juzgadoTribunal = '';
    let direccionJuzgado = '';

    const re = /JUZGADO EN LO CIVIL Y COMERCIAL N[º°]?\s*\d+\s*(?:-\s*[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?/i;
    const m = texto.match(re);
    if (m) {
      // uniformar Nº antes de capitalizar
      const detectadoRaw = m[0].replace(/N\s*(\d)/i, 'Nº $1');
      const detectado = this.capitalizarFrase(detectadoRaw);
      organo = detectado;
      juzgadoInterviniente = detectado;
      juzgadoTribunal = detectado;

      const encontrado = this.findCatalogEntry(detectado);
      if (encontrado) {
        organo = encontrado.juzgado;
        juzgadoInterviniente = encontrado.juzgado;
        juzgadoTribunal = encontrado.juzgado;
        direccionJuzgado = encontrado.direccion || '';
      }
    }
    return { organo, juzgadoInterviniente, juzgadoTribunal, direccionJuzgado };
  }

    private extraerNumero(clave: string): string {
    const m = clave.match(/Nº\s+(\d+)/);
    return m ? m[1] : '';
  }

  private findCatalogEntry(detectado: string): JuzgadoCatalogEntry | undefined {
    if (!detectado || !this.catalogo.length) return;
    const claveDet = this.normalizarClave(detectado);
    const numDet = this.extraerNumero(claveDet);

    // 1. exacto
    const exact = this.catalogo.find(c => this.normalizarClave(c.juzgado) === claveDet);
    if (exact) return exact;

    // 2. mismo número
    const mismosNum = this.catalogo.filter(c => this.extraerNumero(this.normalizarClave(c.juzgado)) === numDet);
    if (mismosNum.length) {
      // 2a exacto dentro de subconjunto
      const exactNum = mismosNum.find(c => this.normalizarClave(c.juzgado) === claveDet);
      if (exactNum) return exactNum;
      // 2b inclusión (ciudad puede variar, acentos)
      const inclNum = mismosNum.find(c => {
        const kc = this.normalizarClave(c.juzgado);
        return kc.includes(claveDet) || claveDet.includes(kc);
      });
      if (inclNum) return inclNum;
      // 2c por ciudad (último token después del guión si existe)
      const ciudadDet = claveDet.split(' - ').pop();
      if (ciudadDet && ciudadDet.length > 2) {
        const ciudadMatch = mismosNum.find(c => {
          const kc = this.normalizarClave(c.juzgado);
          return kc.endsWith(ciudadDet);
        });
        if (ciudadMatch) return ciudadMatch;
      }
      // 2d distancia (Levenshtein)
      let mejor: { item: JuzgadoCatalogEntry; dist: number } | null = null;
      for (const c of mismosNum) {
        const kc = this.normalizarClave(c.juzgado);
        const d = this.distancia(claveDet, kc);
        const limite = Math.max(3, Math.floor(kc.length * 0.20));
        if (d <= limite && (!mejor || d < mejor.dist)) {
          mejor = { item: c, dist: d };
        }
      }
      if (mejor) return mejor.item;
    }

    // 3. fallback global inclusión
    const incl = this.catalogo.find(c => {
      const kc = this.normalizarClave(c.juzgado);
      return kc.includes(claveDet) || claveDet.includes(kc);
    });
    if (incl) return incl;

    // 4. distancia global (último recurso)
    let mejorGlobal: { item: JuzgadoCatalogEntry; dist: number } | null = null;
    for (const c of this.catalogo) {
      const kc = this.normalizarClave(c.juzgado);
      const d = this.distancia(claveDet, kc);
      const limite = Math.max(3, Math.floor(kc.length * 0.15));
      if (d <= limite && (!mejorGlobal || d < mejorGlobal.dist)) {
        mejorGlobal = { item: c, dist: d };
      }
    }
    return mejorGlobal?.item;
  }

    private distancia(a: string, b: string): number {
    const A = a, B = b;
    const m = A.length, n = B.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = A[i - 1] === B[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  private catalogMatch(detectado: string): JuzgadoCatalogEntry | undefined {
    // fuerza la variante Nº antes de normalizar
    const detectadoAjustado = detectado.replace(/N\s*(\d)/i, 'Nº $1');
    const claveDet = this.normalizarClave(detectadoAjustado);
    if (!claveDet || !this.catalogo.length) return;

    // exacto
    let exact = this.catalogo.find(c => this.normalizarClave(c.juzgado) === claveDet);
    if (exact) return exact;

    // inclusión
    let incl = this.catalogo.find(c => {
      const k = this.normalizarClave(c.juzgado);
      return k.includes(claveDet) || claveDet.includes(k);
    });
    if (incl) return incl;

    // aproximado
    let mejor: { item: JuzgadoCatalogEntry; score: number } | null = null;
    for (const c of this.catalogo) {
      const k = this.normalizarClave(c.juzgado);
      const d = this.distancia(claveDet, k);
      const lim = Math.max(3, Math.floor(k.length * 0.15));
      if (d <= lim) {
        if (!mejor || d < mejor.score) mejor = { item: c, score: d };
      }
    }
    return mejor?.item;
  }

  // ---------------- Expediente ----------------
  private extraerExpediente(texto: string): ExpedienteInfo {
    const numeroExpedienteMatch = texto.match(/(?:EXPEDIENTE|Número):\s*([A-Z0-9\-]+)/i);
    const numeroExpediente = numeroExpedienteMatch ? numeroExpedienteMatch[1].trim() : '';

    const caratulaMatch =
      texto.match(/Carátula:\s*(.+?)\s*(?:Juzgado:|Número:|\n)/i) ||
      texto.match(/AUTOS:"([^"]+)"/i);

    let caratulaExpediente = caratulaMatch ? caratulaMatch[1].trim() : '';
    caratulaExpediente = caratulaExpediente.replace(/"\.$/, '').replace(/"/g, '');

    const copiasTraslado = /código QR|copias de traslado|traslado.*QR/i.test(texto);

    return { caratulaExpediente, numeroExpediente, copiasTraslado };
  }

  // ---------------- Caracter ----------------
  private extraerCaracter(texto: string): CaracterInfo {
    const urgente = /\b(urgente|urgentemente|carácter urgente|carácter de urgente)\b/i.test(texto);
    const habilitacionDiaHora = /\b(habilitación de d[ií]as y horas(?: inhábiles)?|con habilitación de día y hora(?: inhábiles)?|habilitación de días y horas inhábiles)\b/i.test(texto);
    const bajoResponsabilidad = /\b(bajo responsabilidad(?: de la parte actora)?|bajo su responsabilidad|y bajo responsabilidad(?: de la parte actora)?)\b/i.test(texto);
    return { urgente, habilitacionDiaHora, bajoResponsabilidad };
  }

  // ---------------- Tipo Domicilio ----------------
  extraerTipoDomicilio(texto: string): TipoDomicilioInfo {
    const denunciado = /\b(domicilio denunciado|domicilio que se denuncie|denunciado en autos|domicilio del requerido|domicilio real)\b/i.test(texto);
    const constituido = /\b(domicilio constituido|constituyó domicilio|domicilio procesal|constituido en autos)\b/i.test(texto);
    return { denunciado, constituido };
  }

  // ---------------- Facultades ----------------
  extraerFacultadesAtribuciones(texto: string): FacultadesInfo {
    const allanamiento = /allanamiento del domicilio|facúltese.*allanamiento|autorícese.*allanamiento|con facultad de allanamiento|\ballanamiento\b|para allanar|allanar/i.test(texto);
    const allanamientoDomicilioSinOcupantes = /inmueble.*desocupado|sin ocupantes|aunque no haya ocupantes|allanamiento sin ocupantes|siempre que no haya ocupantes|pudiendo allanar en caso de no haber ocupantes|pudiendose allanar en caso de no haber ocupantes/i.test(texto);
    const auxilioFuerzaPublica = /fuerza pública|intervención policial|pudiendo requerir fuerza pública|con auxilio de la fuerza pública|con el auxilio de la fuerza pública|\bpolicía\b/i.test(texto);
    const conCerrajero = /\b(con\s+cerrajero|con\s+el\s+cerrajero|uso de cerrajero|valerse de cerrajero)\b/i.test(texto);
    const denunciaOtroDomicilio = /denuncie otro domicilio|otro domicilio que se denunciare|denunciar otro domicilio/i.test(texto);
    const denunciaBienes = /denuncie bienes|denunciar bienes|facúltese.*denunciar bienes|denuncia de bienes|denuncia de bienes a embargo|facultad de denunciar bienes|con la facultad de denunciar bienes|individualizar bienes|facultad de individualizar bienes/i.test(texto);
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

  // ---------------- Texto contenido ----------------
  private extraerTextoContenido(texto: string): TextoContenidoInfo {
    let requerido = '';
    const reqPatterns: RegExp[] = [
      /CONTRA\s+(?:EL|LA)?\s*(?:EJECUTAD[OA]\s*)?([A-ZÁÉÍÓÚÑ ]{3,}?)(?=\s+POR\s+LA\s+SUMA|\s+PESOS|\s+CON\b)/i,
      /EJECUTADO\s+([A-ZÁÉÍÓÚÑ ]{3,}?)(?=\s+POR\s+LA\s+SUMA|\s+PESOS|\s+CON\b)/i,
      /C\/\s*([A-ZÁÉÍÓÚÑ ]{3,}?)(?=\s*S\/|$)/i
    ];
    for (const r of reqPatterns) {
      const m = texto.match(r);
      if (m && m[1]) {
        requerido = m[1].trim();
        break;
      }
    }
    if (!requerido) {
      const autos = texto.match(/AUTOS:"[^"]+C\/\s*([A-ZÁÉÍÓÚÑ ]+?)\s*S\/[^"]*"/i);
      if (autos?.[1]) requerido = autos[1].trim();
    }
    if (!requerido) requerido = 'NOMBRE REQUERIDO';
    requerido = requerido.replace(/\s+POR\s+LA\s+SUMA.*$/i, '').trim();

    const capitalRegexes: RegExp[] = [
      /POR LA SUMA(?: RECLAMADA)? DE\s+PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)\s*EN CONCEPTO DE CAPITAL/i,
      /PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)\s*EN CONCEPTO DE CAPITAL/i,
      /PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)/i
    ];
    let montoCapitalTexto = 'MONTO CAPITAL';
    let montoCapitalNumerico = '';
    for (const rg of capitalRegexes) {
      const m = texto.match(rg);
      if (m) {
        montoCapitalTexto = `PESOS ${m[1].trim()} CON ${m[2]}`;
        montoCapitalNumerico = `$ ${m[3]}`;
        break;
      }
    }

    const interesesRegexes: RegExp[] = [
      /CON MÁS LA SUMA DE\s+PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)/i, // (typo bracket fixed below)
      /CON MÁS LA SUMA DE\s+PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)/i,
      /CON MAS LA SUMA DE\s+PESOS\s+([A-ZÁÉÍÓÚÑ0-9\/ ]+?)\s+CON\s+([0-9]{2}\/[0-9]{2})\s*\(\$ ?([\d.,]+)\)/i
    ];
    let montoInteresesTexto = 'MONTO INTERESES';
    let montoInteresesNumerico = '';
    for (const ir of interesesRegexes) {
      const m = texto.match(ir);
      if (m) {
        montoInteresesTexto = `PESOS ${m[1].trim()} CON ${m[2]}`;
        montoInteresesNumerico = `$ ${m[3]}`;
        break;
      }
    }

    return {
      requerido,
      montoCapitalTexto: montoCapitalTexto.replace(/\s+/g, ' ').trim(),
      montoCapitalNumerico,
      montoInteresesTexto: montoInteresesTexto.replace(/\s+/g, ' ').trim(),
      montoInteresesNumerico
    };
  }

  // ---------------- Plantilla ----------------
  private aplicarPlantilla(resultado: any, plantilla: any): any {
    Object.keys(plantilla).forEach(key => {
      if (typeof plantilla[key] === 'object' && plantilla[key] !== null && typeof resultado[key] === 'object') {
        resultado[key] = { ...resultado[key], ...plantilla[key] };
      } else {
        resultado[key] = plantilla[key];
      }
    });
    return resultado;
  }

  // ---------------- Extra ----------------
  private extraerMontoNumericoDesdeTexto(montoTexto: string): string {
    const match = montoTexto.match(/\(\$\s*([\d.,]+)\)/);
    return match ? `$ ${match[1]}` : '';
  }
}