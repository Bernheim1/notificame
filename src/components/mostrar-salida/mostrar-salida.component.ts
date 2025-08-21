import { Component, Input } from '@angular/core';
import { faArrowRight, faClone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Salida } from '../../shared/models/salida';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-mostrar-salida',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mostrar-salida.component.html',
  styleUrl: './mostrar-salida.component.scss'
})
export class MostrarSalidaComponent {
  rawHtml: string = '';
  processedHtml: string = '';
  processedHtmlSafe: SafeHtml | null = null;
  showRawTextarea = true;
  loading = false;
  error: string | null = null;

  formData: Record<string, string> = {
    Ciudad: '',
    Fecha: '',
    Nombre: '',
    Domicilio: '',
    Monto: '',
    Plazo: '',
    Observaciones: '',
    Firma: ''
  };

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadTemplate();
  }

  // Cargar plantilla HTML desde assets
  loadTemplate(path: string = 'assets/templates/mandamiento.html') {
    this.loading = true;
    this.error = null;
    this.http.get(path, { responseType: 'text' }).subscribe({
      next: (text) => {
        this.rawHtml = text;
        this.replacePlaceholders(this.formData);
        this.loading = false;
      },
      error: (err) => {
        this.error = `No se pudo cargar la plantilla: ${err?.message || err}`;
        this.loading = false;
      }
    });
  }

  // Reemplazar placeholders {{Campo}} con valores del formulario
  replacePlaceholders(data: Record<string, string>) {
    let result = this.rawHtml || '';
    for (const [key, value] of Object.entries(data)) {
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`{{\\s*${safeKey}\\s*}}`, 'g');
      result = result.replace(re, value || '');
    }
    this.applyProcessedHtml(result);
  }

  private applyProcessedHtml(html: string) {
    this.processedHtml = html;
    this.processedHtmlSafe = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Datos de ejemplo
  applySampleData() {
    const sample = {
      Ciudad: 'Buenos Aires',
      Fecha: new Date().toLocaleDateString(),
      Nombre: 'Agustín Bernheim',
      Domicilio: 'Calle Falsa 123, CABA',
      Monto: '$ 12.345,00',
      Plazo: '10 días hábiles',
      Observaciones: 'Sin observaciones',
      Firma: 'Juzgado N° 5'
    };
    this.formData = { ...sample };
    this.replacePlaceholders(this.formData);
  }

  copyRenderedText() {
    const temp = document.createElement('div');
    temp.innerHTML = this.processedHtml;
    const textToCopy = temp.innerText || temp.textContent || '';
    navigator.clipboard.writeText(textToCopy).then(() => alert('Texto copiado al portapapeles'));
  }

  copyRawHtml() {
    navigator.clipboard.writeText(this.processedHtml).then(() => alert('HTML copiado al portapapeles'));
  }

  // Para iterar en el template sobre formData
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
