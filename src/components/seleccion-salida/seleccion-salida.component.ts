import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Salida } from '../../shared/models/salida';
import { TipoSalidaEnum } from '../../shared/enums/tipo-salida-enum';
import { PreventEnterDirective } from '../../shared/directives/prevent-enter.directive';

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
  tipoSalida = TipoSalidaEnum.SinAsignar;
  formulario: FormGroup;

  constructor(private fb: FormBuilder) {
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
