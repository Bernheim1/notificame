import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appPreventEnter]',
  standalone: true
})
export class PreventEnterDirective {

  constructor() { }
  
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = (event.clipboardData || (window as any).clipboardData).getData('text');
    const cleanedText = text.replace(/\r?\n|\r/g, ' ');
    document.execCommand('insertText', false, cleanedText);
  }
}
