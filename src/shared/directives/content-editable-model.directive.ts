// src/app/shared/directives/contenteditable-value-accessor.directive.ts
import { Directive, ElementRef, forwardRef, HostListener, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[contenteditableModel]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContenteditableValueAccessorDirective),
      multi: true
    }
  ],
  standalone: true
})
export class ContenteditableValueAccessorDirective implements ControlValueAccessor, OnInit {
  /** 
   * Si true -> cuando el usuario está editando, las escrituras externas se guardan y se aplican en blur.
   * Si false -> las escrituras externas se aplican inmediatamente aunque el usuario esté editando.
   * Si undefined -> se decide automáticamente según formControlName (busca 'num','numer','monto','amount').
   */
  @Input() deferWritesWhenEditing?: boolean | string;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  private isEditing = false;
  private pendingWriteValue: any | undefined = undefined;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // Normalizar input booleano si viene como string por atributo
    if (typeof this.deferWritesWhenEditing === 'string') {
      const v = String(this.deferWritesWhenEditing).toLowerCase();
      this.deferWritesWhenEditing = v === 'true' || v === '' ? true : v === 'false' ? false : undefined;
    }

    // Si no se indicó explícitamente, inferir por formControlName: si contiene 'num','numer','monto' => defer
    if (this.deferWritesWhenEditing === undefined) {
      const fcName = (this.elementRef.nativeElement.getAttribute('formcontrolname') || '').toLowerCase();
      this.deferWritesWhenEditing = /num|numer|monto|amount/.test(fcName);
    }

    // Asegurar que el elemento tiene contenteditable (por si no está en el marcado)
    if (!this.elementRef.nativeElement.hasAttribute('contenteditable')) {
      this.elementRef.nativeElement.setAttribute('contenteditable', 'true');
    }
  }

  // Usuario escribe → propagar al FormControl
  @HostListener('input')
  onInput() {
    const value = this.elementRef.nativeElement.innerText;
    this.onChange(value);
  }

  // Usuario hizo focus → marcar edición activa
  @HostListener('focus')
  onFocus() {
    this.isEditing = true;
  }

  // Usuario blur → aplicar pending si corresponde y notificar touched
  @HostListener('blur')
  onBlur() {
    this.isEditing = false;
    this.onTouched();

    if (this.pendingWriteValue !== undefined) {
      // Aplicar el valor pendiente SIN disparar onChange (ya viene del FormControl original)
      this.elementRef.nativeElement.innerText = this.pendingWriteValue ?? '';
      this.pendingWriteValue = undefined;
    }
  }

  // Angular escribe en el view desde el FormControl
  writeValue(value: any): void {
    const text = value ?? '';

    // Si estamos editando y la política es defer -> guardar pending; si no -> aplicar inmediatamente
    if (this.isEditing && this.deferWritesWhenEditing) {
      this.pendingWriteValue = text;
    } else {
      // aplicar ya
      this.elementRef.nativeElement.innerText = text;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // contentEditable espera 'true'/'false' strings en los atributos; en DOM también funciona con property
    this.elementRef.nativeElement.contentEditable = (!isDisabled).toString();
    // feedback visual opcional
    this.elementRef.nativeElement.style.pointerEvents = isDisabled ? 'none' : '';
    this.elementRef.nativeElement.style.opacity = isDisabled ? '0.6' : '';
  }
}
