import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cosecha',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-page">
      <div class="empty-content">
        <div class="empty-icon">🌾</div>
        <h2>Planificación de Cosecha</h2>
        <p>Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  `,
  styles: [`
    .empty-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .empty-content {
      text-align: center;
    }
    
    .empty-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #333;
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    p {
      color: #999;
      font-size: 16px;
    }
  `]
})
export class CosechaComponent {}
