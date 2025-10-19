// words-to-currency.pipe.ts
// Pipe para Angular 19 — versión final
// - Reconoce números escritos en palabras en español (sin y con tildes)
// - Reconoce notaciones numéricas (52.734,59 - 52,734.59 - 52734.59 - 52 734,59)
// - Soporta fracciones tipo 59/100
// - Soporta "con X centavos", "con X" y variantes
// - Devuelve siempre el formato: "($ 52.734,59)"
// - Si no hay valor inicial devuelve ($ 0,00)

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'wordsToCurrency',
  pure: true,
  standalone: true
})
export class TextoMonedaANumeroPipe implements PipeTransform {

  transform(value: string | number | null | undefined): string {
    // Si es number válido -> formatear directo
    if (typeof value === 'number' && isFinite(value)) {
      return this.formatCurrency(value);
    }

    // Si null/undefined/empty -> devolver 0 formateado
    if (value === null || value === undefined) {
      return this.formatCurrency(0);
    }

    const s = String(value).trim();
    if (!s) return this.formatCurrency(0);

    // Normalizar y quitar acentos
    const raw = this.normalizeText(s);

    // 1) Si la cadena tiene una representación numérica clara, usarla (52.734,59 | 52,734.59 | 52734.59)
    const numeric = this.tryParseNumericString(raw);
    if (numeric !== null) {
      return this.formatCurrency(numeric);
    }

    // 2) Prepara extracción de centavos
    let centavosValue: number | null = null;

    // FRACCIONES: buscar cualquier x/y
    const fracAny = raw.match(/(\d{1,3})\s*\/\s*(\d{1,4})/);
    if (fracAny) {
      const num = parseInt(fracAny[1], 10);
      const den = parseInt(fracAny[2], 10);
      if (den !== 0) {
        if (den === 100) {
          centavosValue = Math.round((num / den) * 100);
        } else {
          const frac = num / den;
          if (frac > 0 && frac < 1) centavosValue = Math.round(frac * 100);
        }
      }
    }

    // CENTAVOS explicitos: "... X centavo(s)" (no-greedy)
    if (centavosValue === null) {
      const centMatch = raw.match(/([a-z0-9\-\s]{1,40}?)\s+centavo?s?\b/);
      if (centMatch) {
        const centText = centMatch[1].trim();
        const centNum = this.tryParseNumericString(centText);
        if (centNum !== null && isFinite(centNum)) {
          if (centNum < 1) centavosValue = Math.round(centNum * 100);
          else centavosValue = Math.round(centNum);
        } else {
          const p = this.parseSpanishNumber(centText);
          if (p !== null && !isNaN(p)) centavosValue = Math.round(p);
        }
      }
    }

    // 'con X' caso: si no hay palabra 'centavos', interpretar la porcion despues de 'con'
    let enteroText = raw;
    const conMatch = raw.match(/\bcon\b\s+([a-z0-9\-\s,\.]{1,40})$/);
    if (conMatch) {
      const afterCon = conMatch[1].trim();
      // si no detectamos centavos todavía, intentamos parsear afterCon
      if (centavosValue === null) {
        const mnum = this.tryParseNumericString(afterCon);
        if (mnum !== null && isFinite(mnum)) {
          if (mnum < 1) centavosValue = Math.round(mnum * 100);
          else if (mnum <= 99) centavosValue = Math.round(mnum);
          // si >99, lo consideramos parte de la parte entera (ej: 'con mil') -> no asignar
        } else {
          const p2 = this.parseSpanishNumber(afterCon);
          if (p2 !== null && !isNaN(p2) && p2 >= 0 && p2 <= 99) centavosValue = Math.round(p2);
        }
      }
      // además sacamos la porción 'con ...' de la parte entera para evitar doble conteo
      enteroText = raw.replace(/\bcon\b\s+[a-z0-9\-\s,\.]{1,40}$/, '').trim();
    }

    // Limpiar palabras monetarias y tokens residuales para parsear la parte entera en palabras
    enteroText = enteroText.replace(/\b(peso|pesos|ars|\$|dolares|dólares)\b/g, '').trim();
    if (!enteroText) enteroText = 'cero';

    // Parsear la parte entera (palabras)
    const enteroParsed = this.parseSpanishNumber(enteroText) ?? 0;

    // Normalizar centavos si fueron detectados
    if (centavosValue !== null) {
      // normalizar a 0..99, si vino mayor a 99 usamos modulo 100 para no romper
      if (centavosValue < 0) centavosValue = 0;
      if (centavosValue > 99) centavosValue = centavosValue % 100;
      const final = enteroParsed + centavosValue / 100;
      return this.formatCurrency(final);
    }

    // Si no hubo centavos detectados, devolver entero con .00
    return this.formatCurrency(enteroParsed);
  }

  // ------------------------ Helpers ------------------------

  private formatCurrency(n: number): string {
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    // Asegurar que n sea numérico finito
    const safe = (isFinite(n as number) ? n : 0);
    return `($ ${formatter.format(safe)})`;
  }

  private normalizeText(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[–—−]/g, ' ')
      .replace(/\$/g, ' $ ')
      .replace(/[,;]+/g, ',')
      .replace(/[^a-z0-9,\.\\s\/\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Intenta reconocer cadenas numéricas con separadores y devolver número o null
  private tryParseNumericString(s: string): number | null {
    if (!s) return null;
    // extraer primer token que tenga dígitos
    const tokenMatch = s.match(/[-+]?[0-9][0-9\.\,\s]*([0-9])?/);
    if (!tokenMatch) return null;
    let token = tokenMatch[0];

    // eliminar espacios dentro
    token = token.replace(/\s+/g, '');

    // si token contiene '/', lo dejamos al parser de fracciones
    if (token.includes('/')) return null;

    const hasDot = token.indexOf('.') !== -1;
    const hasComma = token.indexOf(',') !== -1;

    // ambos presentes: decidir por la última aparición
    if (hasDot && hasComma) {
      const lastDot = token.lastIndexOf('.');
      const lastComma = token.lastIndexOf(',');
      if (lastComma > lastDot) {
        // coma decimal, dots miles
        const cleaned = token.replace(/\./g, '').replace(/,/g, '.');
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
      } else {
        // punto decimal
        const cleaned = token.replace(/,/g, '');
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
      }
    }

    // solo coma
    if (!hasDot && hasComma) {
      const lastComma = token.lastIndexOf(',');
      const decimals = token.length - lastComma - 1;
      if (decimals === 2 || decimals === 1) {
        const cleaned = token.replace(/\./g, '').replace(/,/g, '.');
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
      } else {
        // probable separador miles
        const cleaned = token.replace(/,/g, '');
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
      }
    }

    // solo punto
    if (hasDot && !hasComma) {
      const lastDot = token.lastIndexOf('.');
      const decimals = token.length - lastDot - 1;
      if (decimals === 2 || decimals === 1) {
        const parsed = Number(token);
        return isFinite(parsed) ? parsed : null;
      } else {
        // probable thousands
        const cleaned = token.replace(/\./g, '');
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
      }
    }

    // ninguno
    const parsed = Number(token);
    return isFinite(parsed) ? parsed : null;
  }

  // Parser robusto de números en palabras (español, devuelve entero)
  private parseSpanishNumber(text: string): number | null {
    if (!text) return 0;
    text = text.replace(/[^a-z0-9\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 0;

    const units: Record<string, number> = {
      'cero':0,'un':1,'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9,
      'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,'quince':15,'dieciseis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,
      'veinte':20,'veintiuno':21,'veintidos':22,'veintitres':23,'veinticuatro':24,'veinticinco':25,'veintiseis':26,'veintisiete':27,'veintiocho':28,'veintinueve':29
    };

    const tens: Record<string, number> = {
      'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,'noventa':90
    };

    const hundreds: Record<string, number> = {
      'cien':100,'ciento':100,'doscientos':200,'trescientos':300,'cuatrocientos':400,'quinientos':500,'seiscientos':600,'setecientos':700,'ochocientos':800,'novecientos':900
    };

    const scales: Record<string, number> = {
      'mil': 1_000,
      'millon': 1_000_000,
      'millones': 1_000_000,
      'billon': 1_000_000_000_000,
      'billones': 1_000_000_000_000
    };

    const tokens = text.split(' ').filter(t => t && t !== 'y');

    let total = 0;
    let current = 0;

    for (let raw of tokens) {
      let token = raw;

      // veintiX unidos
      if (token.startsWith('veinti') && token.length > 6) {
        const tail = token.slice(6);
        if (units[tail] !== undefined) {
          current += 20 + units[tail];
          continue;
        }
      }

      if (units[token] !== undefined) {
        current += units[token];
        continue;
      }

      if (tens[token] !== undefined) {
        current += tens[token];
        continue;
      }

      if (hundreds[token] !== undefined) {
        // si ya hay current acumulado lo sumamos
        current += hundreds[token];
        continue;
      }

      if (scales[token] !== undefined) {
        const scale = scales[token];
        if (current === 0) current = 1;
        current = current * scale;
        total += current;
        current = 0;
        continue;
      }

      // si token es numero en digitos
      const maybeNum = Number(token.replace(/\./g, ''));
      if (!isNaN(maybeNum)) {
        current += maybeNum;
        continue;
      }

      // desconocido: ignorar
    }

    return total + current;
  }
}
