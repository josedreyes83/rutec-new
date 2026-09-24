import { Component } from '@angular/core';

@Component({
  selector: 'app-institutional-footer',
  standalone: true,
  template: `
    <footer class="institutional-footer">
      <div class="footer-content">
        <div class="footer-col">
          <strong>Ministerio del Trabajo:</strong><br>
          Direccion: Carrera 7 # 31 - 10 Edificio Worktech<br>
          Center II P. H. - WTC pisos 5, 8, 9, 10, 12, 17, 18, 19,<br>
          20, 21, 22, 23, 24 y 25, Bogota DC - Colombia<br>
          Codigo Postal: 110221
        </div>
        <div class="footer-col">
          <strong>Telefonos PBX:</strong><br>
          (601)- 5185830<br>
          <strong>Linea Gratuita:</strong><br>
          018000 112518<br>
          <strong>Correo Institucional:</strong><br>
          <a href="mailto:admin.rutec&#64;mintrabajo.gov.co">admin.rutec&#64;mintrabajo.gov.co</a>
        </div>
        <div class="footer-col footer-social">
          <a href="https://www.facebook.com/Mintrabajocol" target="_blank" rel="noopener"><i class="pi pi-facebook"></i> &#64;Mintrabajocol</a>
          <a href="https://twitter.com/MinTrabajoCol" target="_blank" rel="noopener"><i class="pi pi-twitter"></i> &#64;MinTrabajoCol</a>
          <a href="https://www.youtube.com/MinTrabajoCol" target="_blank" rel="noopener"><i class="pi pi-youtube"></i> &#64;MinTrabajoCol</a>
          <a href="https://www.instagram.com/MinTrabajoCol" target="_blank" rel="noopener"><i class="pi pi-instagram"></i> &#64;MinTrabajoCol</a>
        </div>
      </div>
      <div class="footer-copyright">
        &#64;copyright 2026 - Todos los derechos reservados Ministerio de Trabajo.
      </div>
    </footer>
  `,
  styles: [`
    .institutional-footer {
      background: #1a237e;
      color: white;
      padding: 1.5rem 2rem 0.75rem;
      font-size: 0.8rem;
      line-height: 1.6;
      margin-top: auto;
    }
    .footer-content {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer-col a { color: #bbdefb; text-decoration: none; }
    .footer-col a:hover { text-decoration: underline; }
    .footer-social { display: flex; flex-direction: column; gap: 0.4rem; }
    .footer-social a { display: flex; align-items: center; gap: 0.5rem; }
    .footer-social i { font-size: 1rem; }
    .footer-copyright {
      text-align: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.2);
      font-size: 0.75rem;
      opacity: 0.8;
    }
  `]
})
export class InstitutionalFooterComponent {}
