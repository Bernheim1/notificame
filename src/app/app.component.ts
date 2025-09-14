import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGavel, faRepeat  } from '@fortawesome/free-solid-svg-icons';
import { IngresoDespachoComponent } from '../components/ingreso-despacho/ingreso-despacho.component';
import { TipoStepEnum } from '../shared/enums/tipo-step-enum';
import { SeleccionSalidaComponent } from '../components/seleccion-salida/seleccion-salida.component';
import { Salida } from '../shared/models/salida';
import { MostrarSalidaComponent } from '../components/mostrar-salida/mostrar-salida.component';
import { TipoSalidaEnum } from '../shared/enums/tipo-salida-enum';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FontAwesomeModule, IngresoDespachoComponent, SeleccionSalidaComponent, MostrarSalidaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  faGavel = faGavel;
  faRepeat = faRepeat;
  step : TipoStepEnum = TipoStepEnum.Inicio;
  textoDespacho : string = '';
  tipoSalida = TipoSalidaEnum.SinAsignar;
  subtipoSalida : any;
  salida : Salida = new Salida();

  onTextoIngresado(event : string) 
  {
    if (event.length > 0)
    {
      this.textoDespacho = event;
    }
  }

  onTipoSalidaSeleccionado(event : TipoSalidaEnum)
  {
    if (this.textoDespacho.length > 0)
    {
      this.tipoSalida = event;
    }
  }

  onSubtipoSalidaSeleccionado(event : any)
  {
    if (this.textoDespacho.length > 0 && this.tipoSalida != TipoSalidaEnum.SinAsignar)
    {
      this.subtipoSalida = event;
      this.step = TipoStepEnum.SeleccionSalida;
    }
  }


  onSalidaSeleccionada(event : Salida) 
  {
    this.salida = event;
    this.step = TipoStepEnum.MostrarSalida;
  }

  onReingresar() 
  {
    this.step = TipoStepEnum.Inicio;
    this.textoDespacho = '';
    this.salida = new Salida();
  }
}