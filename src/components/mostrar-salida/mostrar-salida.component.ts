import { Component, Input } from '@angular/core';
import { Salida } from '../../shared/models/salida';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mostrar-salida',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mostrar-salida.component.html',
  styleUrl: './mostrar-salida.component.scss'
})
export class MostrarSalidaComponent {
    faArrowRight = faArrowRight;
    faHouse = faHouse;
    formulario: FormGroup;
  @Input({ required: true }) salida!: Salida;

    constructor(private fb: FormBuilder) {
      this.formulario = this.fb.group({
        localidad: ['', [Validators.required, Validators.minLength(3)]],
        domicilio: ['', [Validators.required]],
        nro: ['', [Validators.required, this.nroValidator]],
        piso: ['', [Validators.pattern(/^\d*$/), Validators.min(0), Validators.max(99)]], 
        depto: ['', [Validators.minLength(1)]],
        unidad: ['']
      });
    }

    onSubmit() {
      if (this.formulario.invalid) {
        this.formulario.markAllAsTouched();
        return;
      }
  
      var retorno = this.mapSalida();
  
      // this.salidaSeleccionada.emit(retorno);
    }
  
    mapSalida()
    {
      var retorno = new Salida();
      retorno.localidad = this.formulario.get('localidad')?.value;
      retorno.domicilio = this.formulario.get('domicilio')?.value;
      retorno.nro = this.formulario.get('nro')?.value;
      retorno.piso = this.formulario.get('piso')?.value;
      retorno.depto = this.formulario.get('depto')?.value;
      retorno.unidad = this.formulario.get('unidad')?.value;
  
      return retorno;
    }
  
    campoInvalido(campo: string) {
      return this.formulario.controls[campo].invalid && this.formulario.controls[campo].touched;
    }
  
    nroValidator(control: any) {
      const value = control.value;
      // Acepta "S/N" o valores numéricos (incluyendo 0)
      if (value === 'S/N' || value === 's/n' || /^[0-9]+$/.test(value)) {
        return null; // Si es válido, no devuelve error
      }
      return { invalidNro: true }; // Si no es válido, devuelve error
    }
}
