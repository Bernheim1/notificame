import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Salida } from '../../shared/models/salida';
import { TipoCedulaEnum, TipoCedulaTexto, TipoMandamientoEnum, TipoMandamientoTexto, TipoSalidaEnum, TipoSalidaTexto } from '../../shared/enums/tipo-salida-enum';
import { PreventEnterDirective } from '../../shared/directives/prevent-enter.directive';
import { DespachoService } from '../../shared/services/despacho.service';

@Component({
  selector: 'app-seleccion-salida',
  standalone: true,
  imports: [CommonModule, FormsModule ,FontAwesomeModule, ReactiveFormsModule, PreventEnterDirective],
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
  formulario: FormGroup;
  textoTitulo = '';

  constructor(private fb: FormBuilder, private despachoService : DespachoService) {
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
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipoSalida'] || changes['subtipoSalida']) {
      this.textoTitulo = TipoSalidaTexto[this.tipoSalida] + ' - ' + 
                         (this.tipoSalida == 1 ? 
                            TipoCedulaTexto[this.subtipoSalida as TipoCedulaEnum] : 
                            TipoMandamientoTexto[this.subtipoSalida as TipoMandamientoEnum]);

    }
  }

  ngOnInit(): void {
    // Llamada al servicio para procesar el despacho
    let datos = this.despachoService.procesarDespacho(this.textoDespacho, this.tipoSalida, this.subtipoSalida);
    
    // Mapear los datos extraídos del despacho a los controles del formulario
    this.formulario.patchValue({
      organo: {
        organo: 'Poder Judicial Provincia de Buenos Aires', // Estos valores deberían estar en el despacho o ser estáticos
        juzgadoInterviniente: datos.juzgadoInterviniente,  // Mapear el juzgado extraído
        juzgadoTribunal: datos.juzgadoTribunal,            // Mapear el tribunal extraído
        direccionJuzgado: datos.direccionJuzgado           // Dirección extraída del despacho
      },
      domicilioRequerido: {
        localidad: datos.localidad,
        domicilio: datos.domicilio,
        nro: datos.nro,
        piso: datos.piso,
        depto: datos.depto,
        unidad: datos.unidad
      },
      expediente: {
        tipoDiligencia: datos.tipoDiligencia,
        caratulaExpediente: datos.caratulaExpediente,
        copiasTraslado: datos.copiasTraslado
      },
      caracter: {
        urgente: datos.urgente,
        habilitacionDiaHora: datos.habilitacionDiaHora,
        bajoResponsabilidad: datos.bajoResponsabilidad
      },
      tipoDomicilio: {
        denunciado: datos.denunciado,
        constituido: datos.constituido
      },
      facultadesAtribuciones: {
        allanamiento: datos.allanamiento,
        allanamientoDomicilioSinOcupantes: datos.allanamientoDomicilioSinOcupantes,
        auxilioFuerzaPublica: datos.auxilioFuerzaPublica,
        conCerrajero: datos.conCerrajero,
        denunciaOtroDomicilio: datos.denunciaOtroDomicilio,
        denunciaBienes: datos.denunciaBienes,
        otros: datos.otros
      }
    });
  }

  onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    console.log(this.formulario.value());

    var retorno = this.mapSalida();

    this.salidaSeleccionada.emit(retorno);
  }

  mapSalida()
  {
    var retorno = new Salida();
    retorno.tipoSalida = this.tipoSalida;
    retorno.localidad = this.formulario.get('localidad')?.value;
    retorno.domicilio = this.formulario.get('domicilio')?.value;
    retorno.nro = this.formulario.get('nro')?.value;
    retorno.piso = this.formulario.get('piso')?.value;
    retorno.depto = this.formulario.get('depto')?.value;
    retorno.unidad = this.formulario.get('unidad')?.value;

    return retorno;
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
