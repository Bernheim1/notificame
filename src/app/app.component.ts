import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { IngresoDespachoComponent } from '../components/ingreso-despacho/ingreso-despacho.component';
import { TipoStepEnum } from '../shared/enums/tipo-step-enum';
import { SeleccionSalidaComponent } from '../components/seleccion-salida/seleccion-salida.component';
import { Salida } from '../shared/models/salida';
import { MostrarSalidaComponent } from '../components/mostrar-salida/mostrar-salida.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FontAwesomeModule, IngresoDespachoComponent, SeleccionSalidaComponent, MostrarSalidaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  faEnvelope = faEnvelope;
  faRepeat = faRepeat;
  step : TipoStepEnum = TipoStepEnum.Inicio;
  textoPrimerDespacho : string = '';
  salida : Salida = new Salida();

  onTextoIngresado(event : string) {
    if (event.length > 0)
    {
      this.textoPrimerDespacho = event;
      this.step = TipoStepEnum.SeleccionSalida;
    }
  }

  onSalidaSeleccionada(event : Salida) {
    this.salida = event;
    this.step = TipoStepEnum.MostrarSalida;
  }

  onReingresar() {
    this.step = TipoStepEnum.Inicio;
    this.textoPrimerDespacho = '';
    this.salida = new Salida();
  }
}