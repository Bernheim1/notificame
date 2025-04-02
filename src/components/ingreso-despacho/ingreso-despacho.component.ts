import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';


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
  
  onSubmit() {
    this.textoIngresado.emit(this.primerDespacho);
  }
}
