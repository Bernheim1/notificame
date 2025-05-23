// src/app/shared/directives/contenteditable-value-accessor.directive.ts
import { Directive, ElementRef, forwardRef, HostListener } from '@angular/core';
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
export class ContenteditableValueAccessorDirective implements ControlValueAccessor {
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('input')
  onInput() {
    const value = this.elementRef.nativeElement.innerText;
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
  }

  writeValue(value: any): void {
    this.elementRef.nativeElement.innerText = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.elementRef.nativeElement.contentEditable = !isDisabled;
  }
}
