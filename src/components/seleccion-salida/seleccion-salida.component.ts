import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Salida } from '../../shared/models/salida';
import { TipoCedulaEnum, TipoCedulaTexto, TipoMandamientoEnum, TipoMandamientoTexto, TipoSalidaEnum, TipoSalidaTexto } from '../../shared/enums/tipo-salida-enum';
import { PreventEnterDirective } from '../../shared/directives/prevent-enter.directive';
import { DespachoService } from '../../shared/services/despacho/despacho.service';
import { ContenteditableValueAccessorDirective } from '../../shared/directives/content-editable-model.directive';
import { TextoMonedaANumeroPipe } from '../../shared/pipes/textoMonedaANumero.pipe';
import { HttpClient } from '@angular/common/http';
import Papa from 'papaparse';

@Component({
  selector: 'app-seleccion-salida',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, ReactiveFormsModule, PreventEnterDirective, ContenteditableValueAccessorDirective],
  templateUrl: './seleccion-salida.component.html',
  styleUrl: './seleccion-salida.component.scss'
})
export class SeleccionSalidaComponent implements OnInit {
  faCircleInfo = faCircleInfo;
  faArrowRight = faArrowRight;

  @Output() salidaSeleccionada = new EventEmitter<Salida>();
  @Input() textoDespacho : string = '';
  @Input() tipoSalida : TipoSalidaEnum = TipoSalidaEnum.SinAsignar;
  @Input() subtipoSalida : any;

  formulario!: FormGroup;
  textoTitulo = '';
  private montoTextoPipe = new TextoMonedaANumeroPipe();

  // datos de juzgados (sin id)
  filtroJuzgado: string = '';
  // cada item: { juzgado: string, direccion?: string, raw?: any }
  juzgadosIntervinientes: Array<{ juzgado: string, direccion?: string, raw?: any }> = [];
  juzgadosFiltrados: Array<{ juzgado: string, direccion?: string, raw?: any }> = [];

  // UI / control dropdown
  openDropdown = false;
  highlightedIndex = -1;
  @ViewChild('juzgadoInput') juzgadoInput?: ElementRef<HTMLInputElement>;

  pointerOverList = false;
  preventClose = false;

  suppressOpen = false;

  constructor(private fb: FormBuilder, private despachoService : DespachoService, private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipoSalida'] || changes['subtipoSalida']) {
      this.textoTitulo = TipoSalidaTexto[this.tipoSalida] + ' - ' +
                         (this.tipoSalida == 1 ?
                            TipoCedulaTexto[this.subtipoSalida as TipoCedulaEnum] :
                            TipoMandamientoTexto[this.subtipoSalida as TipoMandamientoEnum]);
    }
  }

  ngOnInit(): void {
    // cargar CSV
    this.cargarJuzgadosIntervinientes();

    // inicializar formulario
    this.formulario = this.fb.group({
      organo: this.fb.group({
        organo: ['', [Validators.required]],
        juzgadoInterviniente: ['', [Validators.required]],
        juzgadoTribunal: ['', [Validators.required]],
        direccionJuzgado: ['', [Validators.required]],
      }),
      domicilioRequerido: this.fb.group({
        localidad: ['', [Validators.required, Validators.minLength(3)]],
        domicilio: ['', [Validators.required]],
        nro: ['', [Validators.required, this.nroValidator]],
        piso: ['', [Validators.pattern(/^\d*$/), Validators.min(0), Validators.max(99)]],
        depto: ['', [Validators.minLength(1)]],
        unidad: ['']
      }),
      expediente: this.fb.group({
        tipoDiligencia: ['', [Validators.required]],
        caratulaExpediente: ['', [Validators.required]],
        copiasTraslado: [false, [Validators.required]],
      }),
      caracter: this.fb.group({
        urgente: [false, [Validators.required]],
        habilitacionDiaHora: [false, [Validators.required]],
        bajoResponsabilidad: [false, [Validators.required]],
      }),
      tipoDomicilio: this.fb.group({
        denunciado: [false, [Validators.required]],
        constituido: [false, [Validators.required]],
      }),
      facultadesAtribuciones: this.fb.group({
        allanamiento: [false, [Validators.required]],
        allanamientoDomicilioSinOcupantes: [false, [Validators.required]],
        auxilioFuerzaPublica: [false, [Validators.required]],
        conCerrajero: [false, [Validators.required]],
        denunciaOtroDomicilio: [false, [Validators.required]],
        denunciaBienes: [false, [Validators.required]],
        otros: [false, [Validators.required]],
      }),
      textoContenido: this.fb.group({
        requerido: [''],
        montoCapitalTexto: [''],
        montoCapitalNumerico: [''],
        montoInteresesTexto: [''],
        montoInteresesNumerico: [''],
      }),
    });

    // Llamada al servicio para procesar el despacho
    let datos = this.despachoService.procesarDespacho(this.textoDespacho, this.tipoSalida, this.subtipoSalida);

    // Mapear los datos al formulario (incluyendo textoContenido)
    this.formulario.patchValue({
      organo: {
        organo: datos.organo.organo,
        juzgadoInterviniente: datos.organo.juzgadoInterviniente,
        juzgadoTribunal: datos.organo.juzgadoTribunal,
        direccionJuzgado: datos.organo.direccionJuzgado
      },
      expediente: {
        tipoDiligencia: datos.expediente.tipoDiligencia,
        caratulaExpediente: datos.expediente.caratulaExpediente,
        copiasTraslado: datos.expediente.copiasTraslado
      },
      caracter: {
        urgente: datos.caracter.urgente,
        habilitacionDiaHora: datos.caracter.habilitacionDiaHora,
        bajoResponsabilidad: datos.caracter.bajoResponsabilidad
      },
      tipoDomicilio: {
        denunciado: datos.tipoDomicilio.denunciado,
        constituido: datos.tipoDomicilio.constituido
      },
      facultadesAtribuciones: {
        allanamiento: datos.facultadesAtribuciones.allanamiento,
        allanamientoDomicilioSinOcupantes: datos.facultadesAtribuciones.allanamientoDomicilioSinOcupantes,
        auxilioFuerzaPublica: datos.facultadesAtribuciones.auxilioFuerzaPublica,
        conCerrajero: datos.facultadesAtribuciones.conCerrajero,
        denunciaOtroDomicilio: datos.facultadesAtribuciones.denunciaOtroDomicilio,
        denunciaBienes: datos.facultadesAtribuciones.denunciaBienes,
        otros: datos.facultadesAtribuciones.otros
      },
      textoContenido: {
        requerido: datos.textoContenido?.requerido || '',
        montoCapitalTexto: datos.textoContenido?.montoCapitalTexto || '',
        montoCapitalNumerico: datos.textoContenido?.montoCapitalNumerico ?? '',
        montoInteresesTexto: datos.textoContenido?.montoInteresesTexto || '',
        montoInteresesNumerico: datos.textoContenido?.montoInteresesNumerico ?? ''
      }
    });

    // transformar montos
    this.formulario.get('textoContenido.montoCapitalTexto')?.valueChanges.subscribe(valor => {
      const numericoControl = this.formulario.get('textoContenido.montoCapitalNumerico');
      const converted = this.montoTextoPipe.transform(valor);
      numericoControl?.setValue(converted, { emitEvent: false });
    });

    this.formulario.get('textoContenido.montoInteresesTexto')?.valueChanges.subscribe(valor => {
      const numericoControl = this.formulario.get('textoContenido.montoInteresesNumerico');
      const converted = this.montoTextoPipe.transform(valor);
      numericoControl?.setValue(converted, { emitEvent: false });
    });

    // Si el form control juzgado cambia desde otra parte, actualizar filtro visible
    this.formulario.get('organo.juzgadoInterviniente')?.valueChanges.subscribe(v => {
      if (v !== this.filtroJuzgado) {
        this.filtroJuzgado = v || '';
        // actualizar la lista filtrada para que coincida con el nuevo valor
        this.applyFilter(this.filtroJuzgado);
      }
    });
  }

  // ---------------- CSV load (sin id) ----------------
  private cargarJuzgadosIntervinientes() {
    this.http.get('assets/database/direcciones-juzgados.csv', { responseType: 'text' })
      .subscribe({
        next: csv => {
          const parseResult = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim()
          });

          let rows = (parseResult.data as any[]).map((row: any) => {
            const juzgado = (row.juzgado || row.JUZGADO || row['Juzgado Interviniente'] || row['Juzgado'] || '').toString().trim();
            const direccion = (row.direccion || row.DIRECCION || row['Direccion'] || row['Dirección'] || '').toString().trim();
            return { juzgado, direccion, raw: row };
          }).filter(r => r.juzgado && r.juzgado.length > 0);

          if (!rows.length) {
            const retry = Papa.parse(csv, { header: false, skipEmptyLines: true });
            rows = (retry.data as any[]).map((r: any) => {
              const juzgado = Array.isArray(r) ? (r[0] || '').toString().trim() : '';
              const direccion = Array.isArray(r) ? (r[1] || '').toString().trim() : '';
              return { juzgado, direccion, raw: r };
            }).filter(r => r.juzgado && r.juzgado.length > 0);
          }

          this.juzgadosIntervinientes = rows;
          this.juzgadosFiltrados = [...this.juzgadosIntervinientes];
        },
        error: err => {
          console.error('Error cargando direcciones-juzgados.csv', err);
          this.juzgadosIntervinientes = [];
          this.juzgadosFiltrados = [];
        }
      });
  }

  // ---------------- FILTRADO EN VIVO (sin debounce) ----------------
  onFiltroJuzgado(valor: string) {
    this.filtroJuzgado = (valor ?? '').toString();
    // Al tipear, permitimos que se abra de nuevo
    this.suppressOpen = false;
    // aplicar filtro en vivo: mostrar solo los que contengan el término (case-insensitive)
    this.applyFilter(this.filtroJuzgado);
    this.openDropdown = true;
    this.highlightedIndex = -1;
  }

  private applyFilter(term: string) {
    const q = (term || '').trim().toLowerCase();
    if (!q) {
      // si no hay término, mostramos todo
      this.juzgadosFiltrados = [...this.juzgadosIntervinientes];
      return;
    }
    this.juzgadosFiltrados = this.juzgadosIntervinientes.filter(item => item.juzgado.toLowerCase().includes(q));
  }

  // ---------------- Selección ----------------
  chooseJuzgado(item: { juzgado: string, direccion?: string }) {
    if (!item) return;
    // setear el form control del juzgado y la direccion
    this.formulario.get('organo.juzgadoInterviniente')?.setValue(item.juzgado);
      this.formulario.get('organo.juzgadoTribunal')?.setValue(item.juzgado);
    this.formulario.get('organo.direccionJuzgado')?.setValue(item.direccion || '');
    // cerrar dropdown y evitar reapertura por focus hasta que se escriba
    this.openDropdown = false;
    this.highlightedIndex = -1;
    this.suppressOpen = true;

    // devolver foco al input por si querés seguir escribiendo (opcional)
    setTimeout(() => {
      try { this.juzgadoInput?.nativeElement.focus(); } catch (e) {}
    }, 0);
  }

  onBlurDropdown() {
    // delay corto para permitir que el click en la lista se procese antes de decidir cerrar
    setTimeout(() => {
      if (this.preventClose) {
        // Se hizo mousedown dentro de la lista; mantener abierto (chooseJuzgado cerrará)
        this.preventClose = false;
        return;
      }
      if (this.pointerOverList) {
        // El mouse está sobre la lista: mantener abierto para permitir scroll/interacción.
        return;
      }
      // Si no hay interacción en la lista, cerrar
      this.openDropdown = false;
    }, 150);
  }

  // ---------------- Navegacion por teclado ----------------
  highlight(i: number) { this.highlightedIndex = i; }

  onKeydown(event: KeyboardEvent) {
    if (!this.openDropdown && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      this.openDropdown = true;
    }

    if (this.openDropdown) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const len = this.juzgadosFiltrados.length;
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, len - 1);
        this.scrollToHighlighted();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.scrollToHighlighted();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.juzgadosFiltrados.length) {
          this.chooseJuzgado(this.juzgadosFiltrados[this.highlightedIndex]);
        } else {
          // si no hay resaltado, intentar hacer match exacto por texto escrito
          const current = (this.filtroJuzgado || '').trim();
          if (current) {
            const found = this.juzgadosIntervinientes.find(i => i.juzgado.toLowerCase() === current.toLowerCase());
            if (found) this.chooseJuzgado(found);
          }
        }
      } else if (event.key === 'Escape') {
        this.openDropdown = false;
      }
    }
  }

  scrollToHighlighted() {
    setTimeout(() => {
      const el = document.querySelector('.list-group .active');
      if (el && el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest' });
    });
  }

  onFocusInput() {
    // Solo abrimos el dropdown con focus si no estamos en modo "suppressOpen"
    if (!this.suppressOpen) {
      this.openDropdown = true;
    } else {
      // si está suprimido, no abrimos; el usuario debe escribir para reiniciar
      this.openDropdown = false;
    }
  }

  // ---------------- Resto de tu código (mapSalida, onSubmit, validators...) ----------------
  onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      Object.keys(this.formulario.controls).forEach(key => {
        const control = this.formulario.get(key);
        if (control?.invalid) {
          console.log(`❌ Campo inválido: ${key}`, control.errors);
        }
      });
      return;
    }

    console.log(this.formulario.value);
    var retorno = this.mapSalida();
    this.salidaSeleccionada.emit(retorno);
  }

  mapSalida(): Salida {
    const retorno = new Salida();
    retorno.tipoSalida = this.tipoSalida;

    // organo
    retorno.organo = this.formulario.get('organo.organo')?.value || '';
    retorno.juzgadoInterviniente = this.formulario.get('organo.juzgadoInterviniente')?.value || '';
    retorno.juzgadoTribunal = this.formulario.get('organo.juzgadoTribunal')?.value || '';
    retorno.direccionJuzgado = this.formulario.get('organo.direccionJuzgado')?.value || '';

    // domicilioRequerido
    retorno.localidad = this.formulario.get('domicilioRequerido.localidad')?.value || '';
    retorno.domicilio = this.formulario.get('domicilioRequerido.domicilio')?.value || '';

    const nroVal = this.formulario.get('domicilioRequerido.nro')?.value;
    retorno.nro = (nroVal === null || nroVal === undefined || nroVal === '') ? null : (isNaN(Number(nroVal)) ? null : Number(nroVal));

    const pisoVal = this.formulario.get('domicilioRequerido.piso')?.value;
    retorno.piso = (pisoVal === null || pisoVal === undefined || pisoVal === '') ? null : (isNaN(Number(pisoVal)) ? null : Number(pisoVal));

    retorno.depto = this.formulario.get('domicilioRequerido.depto')?.value || '';
    retorno.unidad = this.formulario.get('domicilioRequerido.unidad')?.value || '';

    // expediente
    retorno.tipoDiligencia = this.formulario.get('expediente.tipoDiligencia')?.value || '';
    retorno.caratulaExpediente = this.formulario.get('expediente.caratulaExpediente')?.value || '';
    retorno.copiasTraslado = !!this.formulario.get('expediente.copiasTraslado')?.value;

    // caracter
    retorno.urgente = !!this.formulario.get('caracter.urgente')?.value;
    retorno.habilitacionDiaHora = !!this.formulario.get('caracter.habilitacionDiaHora')?.value;
    retorno.bajoResponsabilidad = !!this.formulario.get('caracter.bajoResponsabilidad')?.value;

    // tipoDomicilio
    retorno.denunciado = !!this.formulario.get('tipoDomicilio.denunciado')?.value;
    retorno.constituido = !!this.formulario.get('tipoDomicilio.constituido')?.value;

    // facultadesAtribuciones
    retorno.allanamiento = !!this.formulario.get('facultadesAtribuciones.allanamiento')?.value;
    retorno.allanamientoDomicilioSinOcupantes = !!this.formulario.get('facultadesAtribuciones.allanamientoDomicilioSinOcupantes')?.value;
    retorno.auxilioFuerzaPublica = !!this.formulario.get('facultadesAtribuciones.auxilioFuerzaPublica')?.value;
    retorno.conCerrajero = !!this.formulario.get('facultadesAtribuciones.conCerrajero')?.value;
    retorno.denunciaOtroDomicilio = !!this.formulario.get('facultadesAtribuciones.denunciaOtroDomicilio')?.value;
    retorno.denunciaBienes = !!this.formulario.get('facultadesAtribuciones.denunciaBienes')?.value;

    const otrosFlag = this.formulario.get('facultadesAtribuciones.otros')?.value;
    retorno.otrosFacultades = otrosFlag ? 'SI' : 'NO';

    // textoContenido (nuevo)
    retorno.textoRequerido = this.formulario.get('textoContenido.requerido')?.value || '';
    retorno.montoCapitalTexto = this.formulario.get('textoContenido.montoCapitalTexto')?.value || '';
    const montoCapNumControlVal = this.formulario.get('textoContenido.montoCapitalNumerico')?.value;
    const montoCapNum = (montoCapNumControlVal !== null && montoCapNumControlVal !== undefined)
      ? String(montoCapNumControlVal).replace(/^\(\s*/, '').replace(/\s*\)$/, '')
      : '';
    retorno.montoCapitalNumerico = montoCapNum.trim() !== '' ? montoCapNum : null;

    retorno.montoInteresesTexto = this.formulario.get('textoContenido.montoInteresesTexto')?.value || '';
    const montoIntNumControlVal = this.formulario.get('textoContenido.montoInteresesNumerico')?.value;
    const montoIntNum = (montoIntNumControlVal !== null && montoIntNumControlVal !== undefined)
      ? String(montoIntNumControlVal).replace(/^\(\s*/, '').replace(/\s*\)$/, '')
      : '';
    retorno.montoInteresesNumerico = montoIntNum.trim() !== '' ? montoIntNum : null;

    return retorno;
  }

  // Helper para convertir booleanos a "SI"/"NO"
  private boolToSiNo(value: any): string {
    return value ? 'SI' : 'NO';
  }

  campoInvalido(path: string): boolean {
    let control = this.formulario.get(path);
    return control ? control.invalid && control.touched : false;
  }

  nroValidator(control: any) {
    let value = control.value;
    // Acepta "S/N" o valores numéricos (incluyendo 0)
    if (value === 'S/N' || value === 's/n' || /^[0-9]+$/.test(value)) {
      return null; // Si es válido, no devuelve error
    }
    return { invalidNro: true }; // Si no es válido, devuelve error
  }

  // llamado cuando el puntero entra en la lista (incluye cuando volvés a la lista para scrollear)
  onListMouseEnter() {
    this.pointerOverList = true;
  }

  // llamado cuando el puntero sale de la lista
  onListMouseLeave() {
    this.pointerOverList = false;
    // Si el input no tiene foco, cerramos el dropdown al salir
    setTimeout(() => {
      const inputHasFocus = this.juzgadoInput && document.activeElement === this.juzgadoInput.nativeElement;
      if (!inputHasFocus) this.openDropdown = false;
    }, 100);
  }

  // mousedown en la lista (cuando hacés click): evita que el blur cierre el dropdown
  onListMouseDown(event: MouseEvent) {
    // marcamos preventClose para que onBlurDropdown lo detecte
    this.preventClose = true;
    // liberamos la marca después de un rato para evitar bloqueos
    setTimeout(() => { this.preventClose = false; }, 250);
  }
}
