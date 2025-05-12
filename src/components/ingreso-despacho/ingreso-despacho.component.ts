import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { TipoCedulaEnum, TipoCedulaTexto, TipoMandamientoEnum, TipoMandamientoTexto, TipoSalidaEnum, TipoSalidaTexto } from '../../shared/enums/tipo-salida-enum';


@Component({
  selector: 'app-ingreso-despacho',
  standalone: true,
  imports: [CommonModule, FormsModule ,FontAwesomeModule],
  templateUrl: './ingreso-despacho.component.html',
  styleUrl: './ingreso-despacho.component.scss'
})
export class IngresoDespachoComponent {
  primerDespacho : string = '';
  faArrowRight = faArrowRight;
  @Output() textoIngresado = new EventEmitter<string>();
  @Output() tipoSalidaOutput = new EventEmitter<TipoSalidaEnum>();
  @Output() subtipoSalidaOutput = new EventEmitter<any>();
  tipoSalida = TipoSalidaEnum.SinAsignar;
  subtipoSalida : any;
  tipoCedula = TipoCedulaEnum;
  tipoMandamiento = TipoMandamientoEnum;
  textoSalida = 'Seleccione tipo de salida'
  
  onSubmit() {
    this.textoIngresado.emit(this.primerDespacho);
    this.tipoSalidaOutput.emit(this.tipoSalida);
    this.subtipoSalidaOutput.emit(this.subtipoSalida);
  }

  seleccionTipoSalida(tipo: number, subtipo: number) {
    if (tipo === 0) { // Cédula
      this.tipoSalida = TipoSalidaEnum.Cedula;
      this.subtipoSalida = subtipo;
      this.textoSalida = TipoSalidaTexto[this.tipoSalida] + ' - ' + TipoCedulaTexto[subtipo as TipoCedulaEnum];
    } else {
      this.tipoSalida = TipoSalidaEnum.Mandamiento;
      this.subtipoSalida = subtipo;
      this.textoSalida = TipoSalidaTexto[this.tipoSalida] + ' - ' + TipoMandamientoTexto[subtipo as TipoMandamientoEnum];
    }
  }
}
