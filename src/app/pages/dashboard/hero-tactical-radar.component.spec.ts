import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GlobalActionService } from '@praxisui/core';
import { reconcilePersistedDashboardPage } from './dashboard-page.definition';
import { HeroTacticalRadarComponent, type HeroRadarContact } from './hero-tactical-radar.component';

describe('HeroTacticalRadarComponent', () => {
  let fixture: ComponentFixture<HeroTacticalRadarComponent>;
  let component: HeroTacticalRadarComponent;
  let executedActions: Array<{ actionId: string; payload?: Record<string, unknown> }>;
  let navigatedUrls: string[];

  beforeEach(async () => {
    executedActions = [];
    navigatedUrls = [];

    await TestBed.configureTestingModule({
      imports: [HeroTacticalRadarComponent],
      providers: [
        {
          provide: GlobalActionService,
          useValue: {
            has: (actionId: string) => actionId === 'navigation.openRoute',
            execute: (actionId: string, payload?: Record<string, unknown>) => {
              executedActions.push({ actionId, payload });
              return Promise.resolve({ handled: true });
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigatedUrls.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroTacticalRadarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sanitizes unresolved ${...} interpolation placeholders in radar labels and contact labels', () => {
    fixture.componentRef.setInput('label', 'IFF · PRONTIDÃO ${readinessRate}%');
    fixture.componentRef.setInput('contacts', [
      {
        id: 'TRK-01',
        bearing: 42,
        range: 0.5,
        classification: 'friendly',
        label: 'Heróis Ativos (${activeHeroes})',
        route: '/rh/funcionarios',
      },
    ]);
    fixture.detectChanges();

    expect((component as any).hudTargetText).toBe('IFF · PRONTIDÃO');
    expect(component.hudDisplayTargetText).toBe('PRONTIDÃO');
    expect(component.compassLabels.some((item) => item.text === '180°')).toBe(false);
    const contacts = (component as any).runtimeContacts as Array<{ label: string }>;
    expect(contacts[0].label).toBe('Heróis Ativos');
  });

  it('preserves kinematic positions, trails, and phosphor state across non-structural input updates', () => {
    const initialContacts = (component as any).runtimeContacts as Array<{
      id: string;
      x: number;
      y: number;
      phosphor: number;
      trails: Array<{ x: number; y: number }>;
    }>;
    expect(initialContacts.length).toBeGreaterThan(0);

    // Mutate runtime kinematic state to simulate active radar sweep
    initialContacts[0].x = 148.5;
    initialContacts[0].y = 92.25;
    initialContacts[0].phosphor = 0.88;
    initialContacts[0].trails = [{ x: 147.0, y: 91.5 }];

    // Trigger non-structural input change (e.g., telemetry label refresh)
    fixture.componentRef.setInput('label', 'IFF · PRONTIDÃO 52.5%');
    fixture.detectChanges();

    const updatedContacts = (component as any).runtimeContacts;
    expect(updatedContacts[0].id).toBe(initialContacts[0].id);
    expect(updatedContacts[0].x).toBe(148.5);
    expect(updatedContacts[0].y).toBe(92.25);
    expect(updatedContacts[0].phosphor).toBe(0.88);
    expect(updatedContacts[0].trails.length).toBe(1);
  });

  it('supports WCAG 2.1 AA keyboard target cycling and Enter/Space tactical drill-down', () => {
    const customContacts: HeroRadarContact[] = [
      {
        id: 'INC-901',
        bearing: 45,
        range: 0.5,
        classification: 'critical',
        label: 'INC-901 · Ruptura Dimensional',
        route: '/operacoes/incidentes',
      },
      {
        id: 'RSK-204',
        bearing: 180,
        range: 0.7,
        classification: 'warning',
        label: 'RSK-204 · Anomalia Orbital',
        route: '/risco/ameacas',
      },
    ];
    fixture.componentRef.setInput('contacts', customContacts);
    fixture.detectChanges();

    expect((component as any).lockedContactId).toBeNull();

    // Lock first contact via ArrowRight
    component.onScopeKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect((component as any).lockedContactId).toBe('INC-901');

    // Cycle to second contact via ArrowRight
    component.onScopeKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect((component as any).lockedContactId).toBe('RSK-204');

    // Trigger route drill-down via Enter
    component.onScopeKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(executedActions.length).toBe(1);
    expect(executedActions[0]).toEqual({
      actionId: 'navigation.openRoute',
      payload: { path: '/risco/ameacas' },
    });

    // Clear lock via Escape
    component.onScopeKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect((component as any).lockedContactId).toBeNull();
  });

  it('reconciles legacy persisted heroBanner snapshots to hero-hq-tactical-radar while preserving custom widgets', () => {
    const legacySnapshot = {
      widgets: [
        {
          key: 'heroBanner',
          definition: {
            id: 'praxis-rich-content',
            inputs: {
              document: {
                kind: 'praxis.rich-content',
                version: '1.0.0',
                nodes: [
                  {
                    type: 'card',
                    variant: 'hero',
                    media: {
                      kind: 'icon',
                      icon: 'radar',
                    },
                  },
                ],
              },
            },
          },
        },
        {
          key: 'customUserWidget',
          definition: { id: 'praxis-rich-content', inputs: {} },
        },
      ],
    };

    const reconciled = reconcilePersistedDashboardPage(legacySnapshot);
    expect(reconciled.widgets.length).toBe(2);
    expect(reconciled.widgets[1].key).toBe('customUserWidget');

    const upgradedMedia = (reconciled.widgets[0].definition as any)?.inputs?.document?.nodes?.[0]?.media;
    expect(upgradedMedia?.kind).toBe('component');
    expect(upgradedMedia?.componentId).toBe('hero-hq-tactical-radar');
  });

  it('defaults to the semantic theme palette and cycles through theme, emerald, cyan, and amber', () => {
    expect(component.activePaletteKey()).toBe('theme');
    expect(component.activePalette().primary).toContain('--primary');
    expect(component.resolveContactColor({ classification: 'critical' } as any)).toContain('--destructive');
    expect(component.resolveContactColor({ classification: 'warning' } as any)).toContain('--warning');
    expect(component.resolveContactColor({ classification: 'neutral' } as any)).toContain('--category-sky');

    const clickEvent = new MouseEvent('click');
    component.onPaletteCycleClick(clickEvent);
    expect(component.activePaletteKey()).toBe('emerald');
    component.onPaletteCycleClick(clickEvent);
    expect(component.activePaletteKey()).toBe('cyan');
    component.onPaletteCycleClick(clickEvent);
    expect(component.activePaletteKey()).toBe('amber');
    component.onPaletteCycleClick(clickEvent);
    expect(component.activePaletteKey()).toBe('theme');
  });
});

