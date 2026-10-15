import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { GlobalActionService, type ComponentDocMeta } from '@praxisui/core';

export type HeroRadarContactClassification =
  | 'friendly'
  | 'neutral'
  | 'warning'
  | 'critical';

export type HeroRadarPalette = 'emerald' | 'cyan' | 'amber';

export interface HeroRadarContact {
  id: string;
  bearing: number;
  range: number;
  heading?: number;
  classification?: HeroRadarContactClassification;
  label?: string;
  route?: string;
}

interface CompassTick {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  strokeWidth: string;
}

interface CompassLabel {
  x: string;
  y: string;
  text: string;
}

interface ConicWedgeSlice {
  d: string;
  opacity: string;
}

interface RuntimeRadarContact {
  id: string;
  classification: HeroRadarContactClassification;
  label: string;
  route?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stepX: number;
  stepY: number;
  trails: Array<{ x: number; y: number }>;
  phosphor: number;
  flashRing: number;
}

interface ClutterSpeck {
  x: number;
  y: number;
  bearing: number;
  opacity: string;
}

interface PhosphorPaletteSpec {
  primary: string;
  friendly: string;
  bg1: string;
  bg2: string;
  bg3: string;
  containerBg: string;
  borderAlpha: string;
}

const SCOPE_CENTER = 120;
const SCOPE_RADIUS = 94;

const PALETTE_SPECS: Record<HeroRadarPalette, PhosphorPaletteSpec> = {
  emerald: {
    primary: '#00ff66',
    friendly: '#00ff66',
    bg1: '#072b18',
    bg2: '#03140b',
    bg3: '#010804',
    containerBg: '#03120b',
    borderAlpha: 'rgba(16, 185, 129, 0.38)',
  },
  cyan: {
    primary: '#00e5ff',
    friendly: '#00e5ff',
    bg1: '#07253b',
    bg2: '#041322',
    bg3: '#020810',
    containerBg: '#030d18',
    borderAlpha: 'rgba(6, 182, 212, 0.38)',
  },
  amber: {
    primary: '#ff9f0a',
    friendly: '#38bdf8',
    bg1: '#2e1206',
    bg2: '#180804',
    bg3: '#0a0302',
    containerBg: '#120604',
    borderAlpha: 'rgba(245, 158, 11, 0.38)',
  },
};

const DEFAULT_HERO_RADAR_CONTACTS: HeroRadarContact[] = [
  {
    id: 'TRK-01',
    bearing: 42,
    range: 0.48,
    heading: 135,
    classification: 'friendly',
    label: 'Patrulha Alfa',
    route: '/rh/funcionarios',
  },
  {
    id: 'TRK-02',
    bearing: 118,
    range: 0.72,
    heading: 290,
    classification: 'warning',
    label: 'Eco Não-ID',
    route: '/operacoes/incidentes',
  },
  {
    id: 'TRK-03',
    bearing: 215,
    range: 0.34,
    heading: 45,
    classification: 'friendly',
    label: 'Unidade Aérea',
    route: '/operacoes/missoes',
  },
  {
    id: 'TRK-04',
    bearing: 308,
    range: 0.56,
    heading: 120,
    classification: 'critical',
    label: 'Ameaça Nv.4',
    route: '/risco/ameacas',
  },
  {
    id: 'TRK-05',
    bearing: 348,
    range: 0.84,
    heading: 195,
    classification: 'neutral',
    label: 'Satélite Relé',
    route: '/ativos/equipamentos',
  },
];

const STATIC_COMPASS_TICKS: CompassTick[] = (() => {
  const ticks: CompassTick[] = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const isMajor = deg % 30 === 0;
    const isMid = deg % 10 === 0;
    const rInner = SCOPE_RADIUS;
    const rOuter = isMajor ? 100.5 : isMid ? 98 : 96.2;
    const rad = (deg - 90) * (Math.PI / 180);
    ticks.push({
      x1: (SCOPE_CENTER + rInner * Math.cos(rad)).toFixed(1),
      y1: (SCOPE_CENTER + rInner * Math.sin(rad)).toFixed(1),
      x2: (SCOPE_CENTER + rOuter * Math.cos(rad)).toFixed(1),
      y2: (SCOPE_CENTER + rOuter * Math.sin(rad)).toFixed(1),
      strokeWidth: isMajor ? '1.25' : '0.7',
    });
  }
  return ticks;
})();

const STATIC_COMPASS_LABELS: CompassLabel[] = (() => {
  const labels: CompassLabel[] = [];
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg - 90) * (Math.PI / 180);
    const rLabel = 105.8;
    labels.push({
      x: (SCOPE_CENTER + rLabel * Math.cos(rad)).toFixed(1),
      y: (SCOPE_CENTER + rLabel * Math.sin(rad) + 2.1).toFixed(1),
      text: `${String(deg).padStart(3, '0')}°`,
    });
  }
  return labels;
})();

const STATIC_CONIC_WEDGE_SLICES: ConicWedgeSlice[] = (() => {
  const slices: ConicWedgeSlice[] = [];
  const sliceCount = 18;
  const sliceSpanDeg = 4;
  for (let i = 0; i < sliceCount; i++) {
    const startDeg = -(i + 1) * sliceSpanDeg - 0.35;
    const endDeg = -i * sliceSpanDeg;
    const startRad = (startDeg - 90) * (Math.PI / 180);
    const endRad = (endDeg - 90) * (Math.PI / 180);
    const x1 = SCOPE_CENTER + SCOPE_RADIUS * Math.cos(startRad);
    const y1 = SCOPE_CENTER + SCOPE_RADIUS * Math.sin(startRad);
    const x2 = SCOPE_CENTER + SCOPE_RADIUS * Math.cos(endRad);
    const y2 = SCOPE_CENTER + SCOPE_RADIUS * Math.sin(endRad);
    const t = i / sliceCount;
    const opacity = (0.42 * Math.pow(1 - t, 1.85)).toFixed(3);
    slices.push({
      d: `M ${SCOPE_CENTER} ${SCOPE_CENTER} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${SCOPE_RADIUS} ${SCOPE_RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      opacity,
    });
  }
  return slices;
})();

@Component({
  selector: 'app-hero-tactical-radar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="hero-radar-scope"
      role="region"
      [attr.aria-label]="resolveScopeAriaLabel()"
      [attr.tabindex]="interactive() ? 0 : null"
      [class.hero-radar-scope--interactive]="interactive()"
      [class.hero-radar-scope--target-locked]="lockedContactHasRoute"
      [attr.data-palette]="activePaletteKey()"
      [style.background]="activePalette().containerBg"
      [style.border-color]="activePalette().borderAlpha"
      (mousemove)="onPointerMove($event)"
      (mouseleave)="onPointerLeave()"
      (click)="onScopeClick($event)"
      (keydown)="onScopeKeydown($event)"
      (blur)="onPointerLeave()"
    >
      <div class="hero-radar-scope__scanlines" aria-hidden="true"></div>
      <div class="hero-radar-scope__vignette" aria-hidden="true"></div>

      <svg
        #radarSvg
        class="hero-radar-scope__svg"
        viewBox="0 0 240 240"
        aria-hidden="true"
      >
        <defs>
          <clipPath [attr.id]="clipId">
            <circle cx="120" cy="120" r="94" />
          </clipPath>
          <radialGradient [attr.id]="bgGradId" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              [attr.stop-color]="activePalette().bg1"
              stop-opacity="0.96"
            />
            <stop
              offset="70%"
              [attr.stop-color]="activePalette().bg2"
              stop-opacity="0.98"
            />
            <stop
              offset="100%"
              [attr.stop-color]="activePalette().bg3"
              stop-opacity="1"
            />
          </radialGradient>
          <filter
            [attr.id]="glowFilterId"
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Outer Bezel & Scope Ring -->
        <circle
          cx="120"
          cy="120"
          r="112"
          [attr.fill]="'url(#' + bgGradId + ')'"
          [attr.stroke]="activePalette().primary"
          stroke-opacity="0.45"
          stroke-width="1.5"
        />
        <circle
          cx="120"
          cy="120"
          r="94"
          fill="none"
          [attr.stroke]="activePalette().primary"
          stroke-opacity="0.38"
          stroke-width="1"
        />

        <!-- 72 Compass Rose Ticks & 12 Azimuth Labels -->
        <g [attr.stroke]="activePalette().primary" stroke-opacity="0.55">
          @for (tick of compassTicks; track $index) {
            <line
              class="hero-radar-scope__tick"
              [attr.x1]="tick.x1"
              [attr.y1]="tick.y1"
              [attr.x2]="tick.x2"
              [attr.y2]="tick.y2"
              [attr.stroke-width]="tick.strokeWidth"
            />
          }
        </g>
        <g
          [attr.fill]="activePalette().primary"
          fill-opacity="0.72"
          font-family="monospace"
          font-size="6.2"
          font-weight="700"
          text-anchor="middle"
        >
          @for (label of compassLabels; track label.text) {
            <text [attr.x]="label.x" [attr.y]="label.y">{{ label.text }}</text>
          }
        </g>

        <!-- Clipped Active Scope Area (r = 94) -->
        <g [attr.clip-path]="'url(#' + clipId + ')'">
          <!-- Fixed Range Rings & Orthogonal/Diagonal Axes -->
          <g
            fill="none"
            [attr.stroke]="activePalette().primary"
            stroke-opacity="0.22"
            stroke-width="0.8"
          >
            <circle cx="120" cy="120" r="23.5" />
            <circle cx="120" cy="120" r="47" />
            <circle cx="120" cy="120" r="70.5" />
            <line x1="26" y1="120" x2="214" y2="120" stroke-opacity="0.2" />
            <line x1="120" y1="26" x2="120" y2="214" stroke-opacity="0.2" />
            <line
              x1="53.5"
              y1="53.5"
              x2="186.5"
              y2="186.5"
              stroke-opacity="0.12"
              stroke-dasharray="2 3"
            />
            <line
              x1="186.5"
              y1="53.5"
              x2="53.5"
              y2="186.5"
              stroke-opacity="0.12"
              stroke-dasharray="2 3"
            />
          </g>

          <!-- Range Ring Scale Numbers -->
          <g
            [attr.fill]="activePalette().primary"
            fill-opacity="0.45"
            font-family="monospace"
            font-size="6"
          >
            <text x="122.5" y="98.5">{{ rangeRings()[0] }}</text>
            <text x="122.5" y="75">{{ rangeRings()[1] }}</text>
            <text x="122.5" y="51.5">{{ rangeRings()[2] }}</text>
          </g>

          <!-- Atmospheric / Clutter Specks -->
          <g>
            @for (speck of clutterSpecks; track $index) {
              <circle
                [attr.cx]="speck.x"
                [attr.cy]="speck.y"
                r="1"
                [attr.fill]="activePalette().primary"
                [attr.fill-opacity]="speck.opacity"
              />
            }
          </g>

          <!-- True Conical Phosphor Sweep (18 Angular Slices + Leading Beam) -->
          <g [attr.transform]="sweepTransform">
            @for (slice of conicSlices; track $index) {
              <path
                [attr.d]="slice.d"
                [attr.fill]="activePalette().primary"
                [attr.fill-opacity]="slice.opacity"
              />
            }
            <line
              x1="120"
              y1="120"
              x2="120"
              y2="26"
              [attr.stroke]="activePalette().primary"
              stroke-width="1.9"
              [attr.filter]="'url(#' + glowFilterId + ')'"
            />
          </g>

          <!-- Interactive EBL (Electronic Bearing Line) & VRM (Variable Range Marker) -->
          <g [attr.opacity]="pointerInside ? '1' : '0'">
            <circle
              cx="120"
              cy="120"
              [attr.r]="vrmRadius.toFixed(1)"
              fill="none"
              [attr.stroke]="activePalette().primary"
              stroke-opacity="0.55"
              stroke-width="0.95"
              stroke-dasharray="3.5 2.5"
            />
            <line
              x1="120"
              y1="120"
              [attr.x2]="eblEndX.toFixed(1)"
              [attr.y2]="eblEndY.toFixed(1)"
              [attr.stroke]="activePalette().primary"
              stroke-opacity="0.65"
              stroke-width="0.95"
              stroke-dasharray="2 2"
            />
            <g
              [attr.transform]="
                'translate(' + cursorX.toFixed(1) + ', ' + cursorY.toFixed(1) + ')'
              "
            >
              <circle
                r="8.5"
                fill="none"
                [attr.stroke]="activePalette().primary"
                stroke-width="1.15"
                stroke-opacity="0.9"
              />
              <line
                x1="-12.5"
                y1="0"
                x2="-4.5"
                y2="0"
                [attr.stroke]="activePalette().primary"
                stroke-width="1.15"
              />
              <line
                x1="4.5"
                y1="0"
                x2="12.5"
                y2="0"
                [attr.stroke]="activePalette().primary"
                stroke-width="1.15"
              />
              <line
                x1="0"
                y1="-12.5"
                x2="0"
                y2="-4.5"
                [attr.stroke]="activePalette().primary"
                stroke-width="1.15"
              />
              <line
                x1="0"
                y1="4.5"
                x2="0"
                y2="12.5"
                [attr.stroke]="activePalette().primary"
                stroke-width="1.15"
              />
            </g>
          </g>

          <!-- Dynamic Contacts Layer -->
          <g>
            @for (contact of runtimeContacts; track contact.id) {
              <g
                class="hero-radar-scope__contact"
                [attr.data-contact-id]="contact.id"
                [attr.data-classification]="contact.classification"
              >
                @for (trail of contact.trails; track $index) {
                  <circle
                    [attr.cx]="trail.x.toFixed(1)"
                    [attr.cy]="trail.y.toFixed(1)"
                    [attr.r]="(1.05 + $index * 0.35).toFixed(2)"
                    [attr.fill]="resolveContactColor(contact)"
                    [attr.fill-opacity]="
                      (($index + 1) * 0.22 * resolveContactOpacity(contact)).toFixed(2)
                    "
                  />
                }

                @if (contact.flashRing > 0.02) {
                  <circle
                    [attr.cx]="contact.x.toFixed(1)"
                    [attr.cy]="contact.y.toFixed(1)"
                    [attr.r]="(5 + (1 - contact.flashRing) * 11).toFixed(1)"
                    fill="none"
                    [attr.stroke]="resolveContactColor(contact)"
                    stroke-width="1.1"
                    [attr.stroke-opacity]="(contact.flashRing * 0.85).toFixed(2)"
                  />
                }

                <line
                  [attr.x1]="contact.x.toFixed(1)"
                  [attr.y1]="contact.y.toFixed(1)"
                  [attr.x2]="(contact.x + contact.vx).toFixed(1)"
                  [attr.y2]="(contact.y + contact.vy).toFixed(1)"
                  [attr.stroke]="resolveContactColor(contact)"
                  stroke-width="1.2"
                  [attr.stroke-opacity]="(0.9 * resolveContactOpacity(contact)).toFixed(2)"
                />

                @switch (contact.classification) {
                  @case ('critical') {
                    <polygon
                      [attr.points]="buildDiamondPoints(contact)"
                      [attr.fill]="resolveContactColor(contact)"
                      [attr.fill-opacity]="(0.22 * resolveContactOpacity(contact)).toFixed(2)"
                      [attr.stroke]="resolveContactColor(contact)"
                      stroke-width="1.35"
                      [attr.stroke-opacity]="resolveContactOpacity(contact).toFixed(2)"
                      class="hero-radar-scope__critical-symbol"
                    />
                  }
                  @case ('warning') {
                    <path
                      [attr.d]="buildBracketPath(contact)"
                      fill="none"
                      [attr.stroke]="resolveContactColor(contact)"
                      stroke-width="1.35"
                      [attr.stroke-opacity]="resolveContactOpacity(contact).toFixed(2)"
                    />
                  }
                  @default {
                    <circle
                      [attr.cx]="contact.x.toFixed(1)"
                      [attr.cy]="contact.y.toFixed(1)"
                      r="5.3"
                      [attr.fill]="resolveContactColor(contact)"
                      [attr.fill-opacity]="(0.16 * resolveContactOpacity(contact)).toFixed(2)"
                      [attr.stroke]="resolveContactColor(contact)"
                      stroke-width="1.25"
                      [attr.stroke-opacity]="resolveContactOpacity(contact).toFixed(2)"
                    />
                  }
                }

                <circle
                  [attr.cx]="contact.x.toFixed(1)"
                  [attr.cy]="contact.y.toFixed(1)"
                  r="1.95"
                  fill="#e2f8ee"
                  [attr.fill-opacity]="
                    Math.min(1, resolveContactOpacity(contact) + 0.15).toFixed(2)
                  "
                />

                <text
                  [attr.x]="(contact.x + 8).toFixed(1)"
                  [attr.y]="(contact.y - 4).toFixed(1)"
                  [attr.fill]="resolveContactColor(contact)"
                  font-family="monospace"
                  font-size="6.4"
                  font-weight="700"
                  [attr.opacity]="(resolveContactOpacity(contact) * 0.95).toFixed(2)"
                >
                  {{ contact.id }}
                </text>

                @if (lockedContactId === contact.id) {
                  <g stroke="#e2f8ee" stroke-width="1.35" fill="none">
                    <path [attr.d]="buildLockBracketsPath(contact)" />
                  </g>
                }
              </g>
            }
          </g>

          <!-- Click Sonar Wave Ring -->
          @if (sonarPulseOpacity > 0.01) {
            <circle
              cx="120"
              cy="120"
              [attr.r]="sonarPulseRadius.toFixed(1)"
              fill="none"
              [attr.stroke]="activePalette().primary"
              [attr.stroke-width]="(0.6 + sonarPulseOpacity * 1.8).toFixed(2)"
              [attr.stroke-opacity]="sonarPulseOpacity.toFixed(2)"
            />
          }
        </g>

        <!-- Center Transmitter Hub -->
        <circle
          cx="120"
          cy="120"
          r="4.2"
          [attr.fill]="activePalette().bg3"
          [attr.stroke]="activePalette().primary"
          stroke-width="1.3"
        />
        <circle cx="120" cy="120" r="1.5" [attr.fill]="activePalette().primary" />
      </svg>

      <!-- Micro Telemetry Status Bar -->
      <div
        class="hero-radar-scope__hud"
        aria-live="polite"
        aria-atomic="true"
        [style.color]="activePalette().primary"
        (click)="onPaletteCycleClick($event)"
        title="Alternar paleta de fósforo do escopo"
      >
        <span class="hero-radar-scope__hud-bearing">{{ hudBearingText }}</span>
        <span class="hero-radar-scope__hud-sep">·</span>
        <span class="hero-radar-scope__hud-target">{{ hudTargetText }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .hero-radar-scope {
      position: relative;
      width: 100%;
      height: 100%;
      min-width: 168px;
      min-height: 168px;
      max-width: 240px;
      max-height: 240px;
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      border: 1px solid rgba(16, 185, 129, 0.38);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        inset 0 0 28px rgba(0, 0, 0, 0.85),
        0 8px 24px -10px rgba(0, 0, 0, 0.55);
      user-select: none;
    }

    .hero-radar-scope:focus-visible {
      outline: 2px solid rgba(16, 185, 129, 0.9);
      outline-offset: 2px;
    }

    .hero-radar-scope--interactive {
      cursor: crosshair;
    }

    .hero-radar-scope--interactive.hero-radar-scope--target-locked {
      cursor: pointer;
    }

    .hero-radar-scope__svg {
      width: 100%;
      height: 100%;
      display: block;
      position: relative;
      z-index: 1;
    }

    .hero-radar-scope__scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
      opacity: 0.22;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0) 0px,
        rgba(0, 0, 0, 0) 2px,
        rgba(0, 0, 0, 0.42) 3px
      );
    }

    .hero-radar-scope__vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(
        circle at center,
        transparent 58%,
        rgba(0, 0, 0, 0.55) 100%
      );
    }

    .hero-radar-scope__critical-symbol {
      transform-box: fill-box;
      transform-origin: center;
      animation: hero-radar-critical-pulse 1.4s ease-in-out infinite;
    }

    @keyframes hero-radar-critical-pulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
    }

    .hero-radar-scope__hud {
      position: absolute;
      bottom: 5px;
      left: 8px;
      right: 8px;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(2, 8, 14, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.18);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    .hero-radar-scope__hud-sep {
      opacity: 0.55;
    }

    .hero-radar-scope__hud-target {
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.92;
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-radar-scope__critical-symbol {
        animation: none !important;
      }
    }
  `,
})
export class HeroTacticalRadarComponent
  implements OnInit, OnChanges, AfterViewInit
{
  private static nextInstanceId = 0;

  private readonly hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router, { optional: true });
  private readonly globalActions = inject(GlobalActionService, { optional: true });

  @ViewChild('radarSvg') radarSvgRef?: ElementRef<SVGSVGElement>;

  readonly palette = input<HeroRadarPalette>('emerald');
  readonly speed = input<'slow' | 'normal' | 'fast'>('normal');
  readonly interactive = input<boolean>(true);
  readonly maxRange = input<number>(120);
  readonly label = input<string>('VARREDURA TÁTICA IFF');
  readonly contacts = input<HeroRadarContact[] | undefined>(undefined);

  readonly Math = Math;
  readonly instanceId = ++HeroTacticalRadarComponent.nextInstanceId;
  readonly clipId = `hero-radar-clip-${this.instanceId}`;
  readonly bgGradId = `hero-radar-bg-${this.instanceId}`;
  readonly glowFilterId = `hero-radar-glow-${this.instanceId}`;

  readonly compassTicks = STATIC_COMPASS_TICKS;
  readonly compassLabels = STATIC_COMPASS_LABELS;
  readonly conicSlices = STATIC_CONIC_WEDGE_SLICES;

  private readonly paletteOverride = signal<HeroRadarPalette | null>(null);

  readonly activePaletteKey = computed<HeroRadarPalette>(
    () => this.paletteOverride() ?? this.palette() ?? 'emerald',
  );

  readonly activePalette = computed<PhosphorPaletteSpec>(() => {
    const configuredPalette = this.activePaletteKey();
    return PALETTE_SPECS[configuredPalette] ?? PALETTE_SPECS.emerald;
  });

  readonly maxScaleRange = computed<number>(() => {
    const raw = this.maxRange();
    return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : 120;
  });

  readonly rangeRings = computed<[number, number, number]>(() => {
    const max = this.maxScaleRange();
    return [
      Math.round(max * 0.25),
      Math.round(max * 0.5),
      Math.round(max * 0.75),
    ];
  });

  sweepAngle = 42;
  sweepTransform = `rotate(42 120 120)`;

  pointerInside = false;
  cursorX = SCOPE_CENTER;
  cursorY = SCOPE_CENTER;
  vrmRadius = 0;
  eblEndX = SCOPE_CENTER;
  eblEndY = SCOPE_CENTER - SCOPE_RADIUS;
  lockedContactId: string | null = null;
  lockedContactHasRoute = false;

  sonarPulseRadius = 0;
  sonarPulseOpacity = 0;

  hudBearingText = 'EBL ---° · VRM ---';
  hudTargetText = 'SCAN ATIVO';

  runtimeContacts: RuntimeRadarContact[] = [];

  readonly clutterSpecks: ClutterSpeck[] = [
    { x: 96, y: 84, bearing: 325, opacity: '0.08' },
    { x: 151, y: 98, bearing: 62, opacity: '0.08' },
    { x: 138, y: 154, bearing: 152, opacity: '0.08' },
    { x: 82, y: 144, bearing: 234, opacity: '0.08' },
    { x: 108, y: 66, bearing: 348, opacity: '0.08' },
    { x: 164, y: 132, bearing: 105, opacity: '0.08' },
  ];

  private rafId: number | null = null;
  private lastFrameTime = 0;
  private isViewportVisible = true;
  private isDocumentVisible = true;

  constructor() {
    effect(() => {
      this.contacts();
      this.label();
      this.rebuildRuntimeContacts();
      if (!this.pointerInside) {
        this.updateDefaultHudSummary();
      }
    });
  }

  ngOnInit(): void {
    this.rebuildRuntimeContacts();
    this.updateDefaultHudSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contacts'] || changes['label']) {
      this.rebuildRuntimeContacts();
      if (!this.pointerInside) {
        this.updateDefaultHudSummary();
      }
    }
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return;
    }

    this.isDocumentVisible =
      typeof document === 'undefined' || document.visibilityState !== 'hidden';

    const syncLoopState = () => {
      if (this.isViewportVisible && this.isDocumentVisible) {
        this.startAnimationLoop();
      } else {
        this.stopAnimationLoop();
      }
    };

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && this.hostElementRef?.nativeElement) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            this.isViewportVisible = entry.isIntersecting;
            syncLoopState();
          }
        },
        { threshold: 0.05 },
      );
      intersectionObserver.observe(this.hostElementRef.nativeElement);
    }

    const onVisibilityChange = () => {
      this.isDocumentVisible =
        typeof document === 'undefined' || document.visibilityState !== 'hidden';
      syncLoopState();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    syncLoopState();

    this.destroyRef.onDestroy(() => {
      intersectionObserver?.disconnect();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      this.stopAnimationLoop();
    });
  }

  private startAnimationLoop(): void {
    if (this.rafId !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.lastFrameTime = performance.now();
      const tick = (now: number) => {
        if (!this.isViewportVisible || !this.isDocumentVisible) {
          this.rafId = null;
          return;
        }
        const dt = Math.min(64, Math.max(8, now - this.lastFrameTime));
        this.lastFrameTime = now;
        this.stepSimulation(dt);
        this.cdr.detectChanges();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  private stopAnimationLoop(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resolveScopeAriaLabel(): string {
    return `Radar Tático PPI: ${this.hudBearingText} · ${this.hudTargetText}`;
  }

  onPaletteCycleClick(event: MouseEvent): void {
    event.stopPropagation();
    const order: HeroRadarPalette[] = ['emerald', 'cyan', 'amber'];
    const current = this.activePaletteKey();
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.paletteOverride.set(next);
  }

  onScopeClick(event: MouseEvent): void {
    if (!this.interactive()) {
      return;
    }
    event.stopPropagation();
    this.engageLockedContact();
  }

  onScopeKeydown(event: KeyboardEvent): void {
    if (!this.interactive()) {
      return;
    }
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.cycleContactLock(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.cycleContactLock(-1);
        break;
      case 'Escape':
        if (this.pointerInside || this.lockedContactId) {
          event.preventDefault();
          this.onPointerLeave();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.engageLockedContact();
        break;
    }
  }

  private cycleContactLock(delta: 1 | -1): void {
    if (!this.runtimeContacts.length) {
      return;
    }
    const currentIndex = this.lockedContactId
      ? this.runtimeContacts.findIndex((c) => c.id === this.lockedContactId)
      : -1;
    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = delta > 0 ? 0 : this.runtimeContacts.length - 1;
    } else {
      nextIndex =
        (currentIndex + delta + this.runtimeContacts.length) %
        this.runtimeContacts.length;
    }
    const target = this.runtimeContacts[nextIndex];
    if (target) {
      this.lockOntoContact(target);
    }
  }

  private isSafeInternalRoute(route: string | undefined): boolean {
    if (typeof route !== 'string') {
      return false;
    }
    const trimmed = route.trim();
    return trimmed.startsWith('/') && !trimmed.startsWith('//');
  }

  private lockOntoContact(contact: RuntimeRadarContact): void {
    this.lockedContactId = contact.id;
    this.lockedContactHasRoute = this.isSafeInternalRoute(contact.route);
    this.pointerInside = true;
    this.updateCursorTelemetry(contact.x, contact.y, contact);
  }

  private updateCursorTelemetry(
    targetX: number,
    targetY: number,
    lockedContact: RuntimeRadarContact | null,
  ): void {
    this.cursorX = targetX;
    this.cursorY = targetY;

    const finalDx = targetX - SCOPE_CENTER;
    const finalDy = targetY - SCOPE_CENTER;
    const clampedDist = Math.min(SCOPE_RADIUS, Math.hypot(finalDx, finalDy));
    this.vrmRadius = clampedDist;

    const angleRad = Math.atan2(finalDy, finalDx);
    this.eblEndX = SCOPE_CENTER + SCOPE_RADIUS * Math.cos(angleRad);
    this.eblEndY = SCOPE_CENTER + SCOPE_RADIUS * Math.sin(angleRad);

    const bearingDeg = Math.round(((angleRad * 180) / Math.PI + 90 + 360) % 360);
    const rangeUnits = ((clampedDist / SCOPE_RADIUS) * this.maxScaleRange()).toFixed(1);

    this.hudBearingText = `EBL ${String(bearingDeg).padStart(3, '0')}° · VRM ${rangeUnits}`;
    this.hudTargetText = lockedContact
      ? `LOCK ${lockedContact.id} (${lockedContact.label})${this.isSafeInternalRoute(lockedContact.route) ? ' ↗' : ''}`
      : 'VARREDURA MANUAL';
  }

  private engageLockedContact(): void {
    this.sonarPulseRadius = 4;
    this.sonarPulseOpacity = 0.92;

    if (!this.lockedContactId) {
      return;
    }
    const lockedContact = this.runtimeContacts.find(
      (c) => c.id === this.lockedContactId,
    );
    if (!lockedContact) {
      return;
    }
    lockedContact.phosphor = 1;
    lockedContact.flashRing = 1;

    if (!this.isSafeInternalRoute(lockedContact.route)) {
      return;
    }
    const targetRoute = lockedContact.route!.trim();
    if (this.globalActions?.has('navigation.openRoute')) {
      void this.globalActions.execute('navigation.openRoute', {
        path: targetRoute,
      });
    } else if (this.router) {
      void this.router.navigateByUrl(targetRoute);
    }
  }

  onPointerMove(event: MouseEvent): void {
    if (!this.interactive()) {
      return;
    }
    const svg = this.radarSvgRef?.nativeElement;
    if (!svg) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const rawX = ((event.clientX - rect.left) / rect.width) * 240;
    const rawY = ((event.clientY - rect.top) / rect.height) * 240;

    let dx = rawX - SCOPE_CENTER;
    let dy = rawY - SCOPE_CENTER;
    const rawDist = Math.hypot(dx, dy);
    if (rawDist > SCOPE_RADIUS) {
      const scale = SCOPE_RADIUS / rawDist;
      dx *= scale;
      dy *= scale;
    }

    let targetX = SCOPE_CENTER + dx;
    let targetY = SCOPE_CENTER + dy;

    let nearest: RuntimeRadarContact | null = null;
    let minD = 17;
    for (const c of this.runtimeContacts) {
      const d = Math.hypot(targetX - c.x, targetY - c.y);
      if (d < minD) {
        minD = d;
        nearest = c;
      }
    }

    if (nearest) {
      targetX = nearest.x;
      targetY = nearest.y;
      this.lockedContactId = nearest.id;
      this.lockedContactHasRoute = this.isSafeInternalRoute(nearest.route);
    } else {
      this.lockedContactId = null;
      this.lockedContactHasRoute = false;
    }

    this.pointerInside = true;
    this.updateCursorTelemetry(targetX, targetY, nearest);
  }

  onPointerLeave(): void {
    this.pointerInside = false;
    this.lockedContactId = null;
    this.lockedContactHasRoute = false;
    this.updateDefaultHudSummary();
  }

  resolveContactColor(contact: RuntimeRadarContact): string {
    switch (contact.classification) {
      case 'critical':
        return '#ff3b5c';
      case 'warning':
        return '#ffbf00';
      case 'neutral':
        return '#38bdf8';
      case 'friendly':
      default:
        return this.activePalette().friendly;
    }
  }

  resolveContactOpacity(contact: RuntimeRadarContact): number {
    if (this.lockedContactId === contact.id) {
      return 1;
    }
    return Math.min(1, 0.24 + contact.phosphor * 0.76);
  }

  buildDiamondPoints(c: RuntimeRadarContact): string {
    const r = 6;
    return `${c.x.toFixed(1)},${(c.y - r).toFixed(1)} ${(c.x + r).toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${(c.y + r).toFixed(1)} ${(c.x - r).toFixed(1)},${c.y.toFixed(1)}`;
  }

  buildBracketPath(c: RuntimeRadarContact): string {
    const r = 5.4;
    const x = c.x;
    const y = c.y;
    return `M ${(x - r).toFixed(1)} ${(y - 2).toFixed(1)} L ${(x - r).toFixed(1)} ${(y - r).toFixed(1)} L ${(x + r).toFixed(1)} ${(y - r).toFixed(1)} L ${(x + r).toFixed(1)} ${(y - 2).toFixed(1)} M ${(x - r).toFixed(1)} ${(y + 2).toFixed(1)} L ${(x - r).toFixed(1)} ${(y + r).toFixed(1)} L ${(x + r).toFixed(1)} ${(y + r).toFixed(1)} L ${(x + r).toFixed(1)} ${(y + 2).toFixed(1)}`;
  }

  buildLockBracketsPath(c: RuntimeRadarContact): string {
    const s = 9.5;
    const l = 3.6;
    const x = c.x;
    const y = c.y;
    return [
      `M ${(x - s).toFixed(1)} ${(y - s + l).toFixed(1)} L ${(x - s).toFixed(1)} ${(y - s).toFixed(1)} L ${(x - s + l).toFixed(1)} ${(y - s).toFixed(1)}`,
      `M ${(x + s - l).toFixed(1)} ${(y - s).toFixed(1)} L ${(x + s).toFixed(1)} ${(y - s).toFixed(1)} L ${(x + s).toFixed(1)} ${(y - s + l).toFixed(1)}`,
      `M ${(x + s).toFixed(1)} ${(y + s - l).toFixed(1)} L ${(x + s).toFixed(1)} ${(y + s).toFixed(1)} L ${(x + s - l).toFixed(1)} ${(y + s).toFixed(1)}`,
      `M ${(x - s + l).toFixed(1)} ${(y + s).toFixed(1)} L ${(x - s).toFixed(1)} ${(y + s).toFixed(1)} L ${(x - s).toFixed(1)} ${(y + s - l).toFixed(1)}`,
    ].join(' ');
  }

  private sanitizeResolvedText(raw: string | undefined, fallback: string): string {
    if (!raw) {
      return fallback;
    }
    const cleaned = raw
      .replace(/\(\s*\$\{[^}]+\}\s*[%a-zA-Z]*\s*\)/g, '')
      .replace(/\$\{[^}]+\}\s*%?/g, '')
      .replace(/\(\s*\)/g, '')
      .replace(/[\s·\-:]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned || fallback;
  }

  private rebuildRuntimeContacts(): void {
    const configured = this.contacts();
    const source =
      Array.isArray(configured) && configured.length > 0
        ? configured
        : DEFAULT_HERO_RADAR_CONTACTS;

    const previousById = new Map(
      this.runtimeContacts.map((contact) => [contact.id, contact]),
    );

    this.runtimeContacts = source.map((item, idx) => {
      const id = item.id || `TRK-0${idx + 1}`;
      const existing = previousById.get(id);
      const bearingDeg = ((Number(item.bearing) || 0) % 360 + 360) % 360;
      const normRange = Math.min(0.9, Math.max(0.14, Number(item.range) || 0.5));
      const rad = (bearingDeg - 90) * (Math.PI / 180);
      const rPx = normRange * SCOPE_RADIUS;
      const initialX = SCOPE_CENTER + rPx * Math.cos(rad);
      const initialY = SCOPE_CENTER + rPx * Math.sin(rad);

      const headingDeg =
        typeof item.heading === 'number' && Number.isFinite(item.heading)
          ? item.heading
          : (bearingDeg + 90) % 360;
      const headingRad = (headingDeg - 90) * (Math.PI / 180);
      const vectorLen = item.classification === 'critical' ? 12.5 : 9.5;
      const vx = Math.cos(headingRad) * vectorLen;
      const vy = Math.sin(headingRad) * vectorLen;
      const stepX = Math.cos(headingRad) * 0.015;
      const stepY = Math.sin(headingRad) * 0.015;
      const x = existing ? existing.x : initialX;
      const y = existing ? existing.y : initialY;

      return {
        id,
        classification: item.classification ?? 'friendly',
        label: this.sanitizeResolvedText(
          item.label,
          item.classification?.toUpperCase() || 'ACTIVE',
        ),
        route: item.route,
        x,
        y,
        vx,
        vy,
        stepX,
        stepY,
        trails: existing
          ? existing.trails
          : [
              { x: x - vx * 0.9, y: y - vy * 0.9 },
              { x: x - vx * 0.6, y: y - vy * 0.6 },
              { x: x - vx * 0.3, y: y - vy * 0.3 },
            ],
        phosphor: existing ? existing.phosphor : 0.72,
        flashRing: existing ? existing.flashRing : 0,
      };
    });
  }

  private updateDefaultHudSummary(): void {
    const count = this.runtimeContacts.length;
    const criticalCount = this.runtimeContacts.filter(
      (c) => c.classification === 'critical',
    ).length;
    const customLabel = this.sanitizeResolvedText(this.label(), '');
    this.hudBearingText = `IFF ${count} ALVOS`;
    this.hudTargetText =
      customLabel ||
      (criticalCount > 0 ? `${criticalCount} CRÍTICO(S)` : 'PERÍMETRO NOMINAL');
  }

  private stepSimulation(dtMs: number): void {
    const speedMode = this.speed() ?? 'normal';
    const degPerSec = speedMode === 'fast' ? 140 : speedMode === 'slow' ? 48 : 82;
    this.sweepAngle = (this.sweepAngle + (degPerSec * dtMs) / 1000) % 360;
    this.sweepTransform = `rotate(${this.sweepAngle.toFixed(1)} 120 120)`;

    for (const speck of this.clutterSpecks) {
      const diff = Math.abs(
        ((this.sweepAngle - speck.bearing + 540) % 360) - 180,
      );
      if (diff < 8) {
        speck.opacity = '0.52';
      } else {
        const cur = parseFloat(speck.opacity) || 0.06;
        speck.opacity = Math.max(0.05, cur * 0.965).toFixed(3);
      }
    }

    for (const c of this.runtimeContacts) {
      c.x += c.stepX * (dtMs / 16);
      c.y += c.stepY * (dtMs / 16);
      const distFromCenter = Math.hypot(c.x - SCOPE_CENTER, c.y - SCOPE_CENTER);
      if (distFromCenter > SCOPE_RADIUS - 10 || distFromCenter < 14) {
        c.stepX = -c.stepX;
        c.stepY = -c.stepY;
        c.vx = -c.vx;
        c.vy = -c.vy;
      }
      c.trails[0].x = c.x - c.vx * 0.85;
      c.trails[0].y = c.y - c.vy * 0.85;
      c.trails[1].x = c.x - c.vx * 0.55;
      c.trails[1].y = c.y - c.vy * 0.55;
      c.trails[2].x = c.x - c.vx * 0.28;
      c.trails[2].y = c.y - c.vy * 0.28;

      if (this.pointerInside && this.lockedContactId === c.id) {
        this.updateCursorTelemetry(c.x, c.y, c);
      }

      const contactBearing =
        ((Math.atan2(c.y - SCOPE_CENTER, c.x - SCOPE_CENTER) * 180) / Math.PI +
          90 +
          360) %
        360;
      const angleDiff = Math.abs(
        ((this.sweepAngle - contactBearing + 540) % 360) - 180,
      );
      if (angleDiff < 7.5) {
        c.phosphor = 1;
        c.flashRing = 1;
      } else {
        c.phosphor = Math.max(0.18, c.phosphor * 0.989);
        c.flashRing = Math.max(0, c.flashRing - 0.032);
      }
    }

    if (this.sonarPulseOpacity > 0.01) {
      this.sonarPulseRadius += 2.1 * (dtMs / 16);
      this.sonarPulseOpacity = Math.max(
        0,
        1 - this.sonarPulseRadius / SCOPE_RADIUS,
      );
      if (this.sonarPulseRadius >= SCOPE_RADIUS) {
        this.sonarPulseOpacity = 0;
      }
    }
  }
}

export const HERO_TACTICAL_RADAR_METADATA: ComponentDocMeta = {
  id: 'hero-hq-tactical-radar',
  selector: 'app-hero-tactical-radar',
  friendlyName: 'Radar Tático PPI IFF (Hero HQ)',
  description:
    'Escopo de radar vetorial PPI interativo exclusivo do host Hero HQ com persistência de fósforo P7, EBL/VRM e lock magnético.',
  component: HeroTacticalRadarComponent,
  lib: 'praxis-hero-hq-ui',
  inputs: [
    { name: 'palette', type: 'string', description: 'Paleta de fósforo (emerald, cyan, amber).' },
    { name: 'speed', type: 'string', description: 'Velocidade de varredura (slow, normal, fast).' },
    { name: 'interactive', type: 'boolean', description: 'Habilita cursor EBL/VRM e target lock.' },
    { name: 'maxRange', type: 'number', description: 'Alcance radial máximo em km.' },
    { name: 'label', type: 'string', description: 'Rótulo tático exibido na barra inferior.' },
    { name: 'contacts', type: 'array', description: 'Lista de contatos táticos IFF no escopo.' },
  ],
};
