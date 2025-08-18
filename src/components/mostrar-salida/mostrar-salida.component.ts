import { Component, Input } from '@angular/core';
import { faArrowRight, faClone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Salida } from '../../shared/models/salida';

@Component({
  selector: 'app-mostrar-salida',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mostrar-salida.component.html',
  styleUrl: './mostrar-salida.component.scss'
})
export class MostrarSalidaComponent {
    faArrowRight = faArrowRight;
    faClone = faClone;
    @Input({ required: true }) salida!: Salida;
    textoTerminado = '';
}
