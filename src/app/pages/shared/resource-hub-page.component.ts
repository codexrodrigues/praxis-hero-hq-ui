import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-resource-hub-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hub-container">
      <header class="hub-header">
        <div class="domain-pill">
          <span class="material-symbols-outlined">dataset</span>
          Recurso Governança Praxis
        </div>
        <h1 class="title-gradient page-title">{{ title() }}</h1>
        <p class="page-subtitle">{{ description() }}</p>
      </header>

      <section class="glass-panel hub-card">
        <div class="status-indicator">
          <span class="material-symbols-outlined icon">hub</span>
          <div>
            <h3>Contrato Metadata-Driven Ativo</h3>
            <p>Este módulo consome diretamente a rota de contrato público da API:</p>
            <code>{{ resourcePath() }}</code>
          </div>
        </div>

        <div class="card-actions">
          <a routerLink="/rh/funcionarios" class="action-btn primary-gradient">
            <span class="material-symbols-outlined">group</span>
            Ver Quadro de Heróis (Âncora CRUD)
          </a>
          <a routerLink="/" class="action-btn outline-btn">
            <span class="material-symbols-outlined">dashboard</span>
            Retornar ao Dashboard Executivo
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hub-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .domain-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 30%, transparent);
      color: var(--primary);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;

      span { font-size: 14px; }
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.9rem;
      color: var(--muted-foreground);
    }

    .hub-card {
      border-radius: 20px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .status-indicator {
      display: flex;
      gap: 20px;
      align-items: flex-start;

      .icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: color-mix(in oklab, var(--primary) 14%, transparent);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        flex-shrink: 0;
      }

      h3 {
        margin: 0 0 6px;
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 700;
      }

      p {
        margin: 0 0 8px;
        font-size: 0.85rem;
        color: var(--muted-foreground);
      }

      code {
        padding: 4px 10px;
        border-radius: 6px;
        background: var(--muted);
        color: var(--foreground);
        font-family: var(--font-mono);
        font-size: 0.85rem;
      }
    }

    .card-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      border-top: 1px solid var(--border);
      padding-top: 24px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      padding: 0 18px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;

      span { font-size: 18px; }
    }

    .outline-btn {
      background: var(--muted);
      border: 1px solid var(--border);
      color: var(--foreground);
    }
  `],
})
export class ResourceHubPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = computed(() => this.route.snapshot.data['title'] ?? 'Módulo Operacional');
  protected readonly description = computed(() => this.route.snapshot.data['description'] ?? 'Recurso governado da plataforma.');
  protected readonly resourcePath = computed(() => this.route.snapshot.data['resourcePath'] ?? 'api/human-resources');
}
