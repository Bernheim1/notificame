import { Component, Input, ViewEncapsulation, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as bootstrap from 'bootstrap';
import { TipoSalidaEnum } from '../../shared/enums/tipo-salida-enum';
import { Salida } from '../../shared/models/salida';

@Component({
  selector: 'app-mostrar-salida',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mostrar-salida.component.html',
  styleUrl: './mostrar-salida.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MostrarSalidaComponent implements OnInit, OnChanges {
  @Input() tipoSalida : TipoSalidaEnum = TipoSalidaEnum.Mandamiento;
  @Input() salida?: Salida;
  @Input() textoDespacho?: string;

  faCheck = faCheck;
  rawHtml: string = '';
  processedHtml: string = '';
  processedHtmlSafe: SafeHtml | null = null;
  mostrarTest = false;
  loading = false;
  error: string | null = null;

  // FormData con todas las claves que usa tu plantilla (valores por defecto '')
  formData: Record<string, string> = {
    organo: '',
    juzgadoInterviniente: '',
    direccion: '',
    juzgadoTribunal: '',
    tipoDiligencia: '',
    caratulaExpediente: '',
    copiasTraslado: '',
    urgente: '',
    habilitacionDiaHora: '',
    denunciado: '',
    constituido: '',
    bajoResposabilidad: '',
    allanamiento: '',
    allanamientoDomicilioSinOcupantes: '',
    auxilioFuerzaPublica: '',
    conCerrajero: '',
    denunciaOtroDomicilio: '',
    denunciaDeBienes: '',
    otros: '',
    otrosFacultades: '',
    // textoContenido
    textoRequerido: '',
    montoCapitalTexto: '',
    montoCapitalNumerico: '',
    montoInteresesTexto: '',
    montoInteresesNumerico: '',
    // domicilio / direccion extras
    domicilio: '',
    localidad: '',
    nro: '',
    piso: '',
    depto: '',
    unidad: '',
    // utilitarios de plantilla
    Fecha: '',
    Ciudad: '',
    textoDespacho: ''
  };

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Si al inicializar ya tenés una salida, aplicala antes de cargar template
    if (this.salida) {
      this.applySalidaToFormData(this.salida);
      if ((this.salida as any).tipoSalida !== undefined && (this.salida as any).tipoSalida !== null) {
        this.tipoSalida = (this.salida as any).tipoSalida;
      }
    }
    this.loadTemplate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salida'] && changes['salida'].currentValue) {
      this.applySalidaToFormData(changes['salida'].currentValue as Salida);
      // si la plantilla ya está cargada, forzamos re-reemplazo ahora mismo
      if (this.rawHtml) {
        this.replacePlaceholders(this.formData);
      }
    }
  }

  // Convierte booleanos a "SI"/"NO"
  private boolToSiNo(value: any): string {
    return value ? 'SI' : 'NO';
  }

  // Mapea Salida -> formData asegurando que todas las claves existan
  applySalidaToFormData(s: Salida) {
    const fd: Record<string,string> = {
      organo: s.organo || '',
      juzgadoInterviniente: s.juzgadoInterviniente || '',
      direccion: s.direccionJuzgado || (s.domicilio || ''), // preferencia: direccionJuzgado, sino domicilio
      juzgadoTribunal: s.juzgadoTribunal || '',
      tipoDiligencia: s.tipoDiligencia || '',
      caratulaExpediente: s.caratulaExpediente || '',
      copiasTraslado: this.boolToSiNo(s.copiasTraslado),
      urgente: this.boolToSiNo(s.urgente),
      habilitacionDiaHora: this.boolToSiNo(s.habilitacionDiaHora),
      denunciado: this.boolToSiNo(s.denunciado),
      constituido: this.boolToSiNo(s.constituido),
      bajoResposabilidad: this.boolToSiNo(s.bajoResponsabilidad), // mantengo typo en formData por compatibilidad
      allanamiento: this.boolToSiNo(s.allanamiento),
      allanamientoDomicilioSinOcupantes: this.boolToSiNo(s.allanamientoDomicilioSinOcupantes),
      auxilioFuerzaPublica: this.boolToSiNo(s.auxilioFuerzaPublica),
      conCerrajero: this.boolToSiNo(s.conCerrajero),
      denunciaOtroDomicilio: this.boolToSiNo(s.denunciaOtroDomicilio),
      denunciaDeBienes: this.boolToSiNo(s.denunciaBienes),
      otros: s.otrosFacultades || '',    // texto libre que pusiste en Salida
      otrosFacultades: s.otrosFacultades || '',
      textoDespacho: this.textoDespacho || ''
    };

    // textoContenido
    fd['textoRequerido'] = s.textoRequerido || '';
    fd['montoCapitalTexto'] = s.montoCapitalTexto || '';
    fd['montoCapitalNumerico'] = (s.montoCapitalNumerico !== null && s.montoCapitalNumerico !== undefined) ? String(s.montoCapitalNumerico) : '';
    fd['montoInteresesTexto'] = s.montoInteresesTexto || '';
    fd['montoInteresesNumerico'] = (s.montoInteresesNumerico !== null && s.montoInteresesNumerico !== undefined) ? String(s.montoInteresesNumerico) : '';

    // domicilio/datos de ubicación
    fd['domicilio'] = s.domicilio || '';
    fd['localidad'] = s.localidad || '';
    fd['nro'] = (s.nro !== null && s.nro !== undefined) ? String(s.nro) : '';
    fd['piso'] = (s.piso !== null && s.piso !== undefined) ? String(s.piso) : '';
    fd['depto'] = s.depto || '';
    fd['unidad'] = s.unidad || '';

  // Fecha actual
  const hoy = new Date();

  // Si querés que la ciudad se cargue dinámicamente, poné tu valor aquí:
  fd['Ciudad'] = s.localidad || '';  // o la ciudad que corresponda

  // Día del mes (número)
  fd['FechaDia'] = String(hoy.getDate());

  // Mes en texto (en español)
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  fd['FechaMes'] = meses[hoy.getMonth()];

  // Año en número
  fd['FechaAño'] = String(hoy.getFullYear());
    fd['Ciudad'] = fd['Ciudad'] || '';

    // Mezclamos con los defaults actuales (asegura que no falte ninguna clave)
    this.formData = { ...this.formData, ...fd };

    // si la plantilla ya está cargada, reemplazamos ahora
    if (this.rawHtml) {
      this.replacePlaceholders(this.formData);
    }
  }

  // Carga plantilla y reemplaza placeholders
  loadTemplate(path: string = 'assets/templates/mandamiento.html') {
    this.loading = true;
    this.error = null;
    this.http.get(path, { responseType: 'text' }).subscribe({
      next: (text) => {
        this.rawHtml = text;
        // Si ya tenemos salida/formData, reemplazamos. Si no, usamos defaults vacíos.
        this.replacePlaceholders(this.formData);
        this.loading = false;
      },
      error: (err) => {
        this.error = `No se pudo cargar la plantilla: ${err?.message || err}`;
        this.loading = false;
      }
    });
  }

  // Reemplaza placeholders {{campo}} con valores desde data.
  // Además elimina comentarios tipo {{# ... }} y limpia los placeholders sin valor.
  replacePlaceholders(data: Record<string, string>) {
    let result = this.rawHtml || '';

    // 1) eliminar comentarios Handlebars del tipo {{# ... }} o {{!-- ... --}} si existen
    result = result.replace(/{{#.*?}}/gs, '');
    result = result.replace(/{{!--[\s\S]*?--}}/gs, '');

    // 2) reemplazar claves explícitas
    for (const [key, value] of Object.entries(data)) {
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`{{\\s*${safeKey}\\s*}}`, 'g');
      result = result.replace(re, value ?? '');
    }

    // 3) Limpiar cualquier placeholder restante: los dejamos vacíos en lugar de mostrar {{...}}
    result = result.replace(/{{\s*[^}]+\s*}}/g, '');

    this.applyProcessedHtml(result);
  }

  private applyProcessedHtml(html: string) {
    this.processedHtml = html;
    this.processedHtmlSafe = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  copyRenderedText() {
    const temp = document.createElement('div');
    temp.innerHTML = this.processedHtml;
    const textToCopy = temp.innerText || temp.textContent || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      let toastEl = document.getElementById('myToast');
      if (toastEl) {
        let toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
      }
    });
  }

  copyRawHtml() {
    navigator.clipboard.writeText(this.processedHtml).then(() => {
      let toastEl = document.getElementById('myToast');
      if (toastEl) {
        let toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
      }
    });
  }

  // util
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
