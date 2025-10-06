import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Salida } from '../../shared/models/salida';
import { TipoCedulaEnum, TipoCedulaTexto, TipoMandamientoEnum, TipoMandamientoTexto, TipoSalidaEnum, TipoSalidaTexto } from '../../shared/enums/tipo-salida-enum';
import { PreventEnterDirective } from '../../shared/directives/prevent-enter.directive';
import { DespachoService } from '../../shared/services/despacho/despacho.service';
import { ContenteditableValueAccessorDirective } from '../../shared/directives/content-editable-model.directive';

@Component({
  selector: 'app-seleccion-salida',
  standalone: true,
  imports: [CommonModule, FormsModule ,FontAwesomeModule, ReactiveFormsModule, PreventEnterDirective, ContenteditableValueAccessorDirective],
  templateUrl: './seleccion-salida.component.html',
  styleUrl: './seleccion-salida.component.scss'
})
export class SeleccionSalidaComponent {
  faCircleInfo = faCircleInfo;
  faArrowRight = faArrowRight;
  @Output() salidaSeleccionada = new EventEmitter<Salida>();
  @Input() textoDespacho : string = '';
  @Input() tipoSalida : TipoSalidaEnum = TipoSalidaEnum.SinAsignar;
  @Input() subtipoSalida : any;
  formulario!: FormGroup;
  textoTitulo = '';

  constructor(private fb: FormBuilder, private despachoService : DespachoService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipoSalida'] || changes['subtipoSalida']) {
      this.textoTitulo = TipoSalidaTexto[this.tipoSalida] + ' - ' + 
                         (this.tipoSalida == 1 ? 
                            TipoCedulaTexto[this.subtipoSalida as TipoCedulaEnum] : 
                            TipoMandamientoTexto[this.subtipoSalida as TipoMandamientoEnum]);

    }
  }

  ngOnInit(): void {
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
  }

  onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      // Mostrar en consola qué controles son inválidos
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
    const montoCapNum = this.formulario.get('textoContenido.montoCapitalNumerico')?.value;
    retorno.montoCapitalNumerico = (montoCapNum === null || montoCapNum === undefined || montoCapNum === '') ? null : (isNaN(Number(montoCapNum)) ? null : Number(montoCapNum));
    retorno.montoInteresesTexto = this.formulario.get('textoContenido.montoInteresesTexto')?.value || '';
    const montoIntNum = this.formulario.get('textoContenido.montoInteresesNumerico')?.value;
    retorno.montoInteresesNumerico = (montoIntNum === null || montoIntNum === undefined || montoIntNum === '') ? null : (isNaN(Number(montoIntNum)) ? null : Number(montoIntNum));

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
}
