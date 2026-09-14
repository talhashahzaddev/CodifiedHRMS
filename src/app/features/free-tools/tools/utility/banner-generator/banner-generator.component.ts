import {
  Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { BlobDownloadService } from '../../../services/blob-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export type BgType = 'solid' | 'gradient';

export interface PresetSize {
  label: string;
  width: number;
  height: number;
}

export const PRESET_SIZES: PresetSize[] = [
  { label: 'LinkedIn Cover (1584×396)',   width: 1584, height: 396  },
  { label: 'Twitter/X Header (1500×500)', width: 1500, height: 500  },
  { label: 'Facebook Cover (820×312)',    width: 820,  height: 312  },
  { label: 'YouTube Channel (1280×720)', width: 1280, height: 720  },
  { label: 'Instagram Square (1080×1080)',width: 1080, height: 1080 },
  { label: 'Custom Size',                width: 0,    height: 0    },
];

@Component({
  selector: 'app-banner-generator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './banner-generator.component.html',
  styleUrls: ['./banner-generator.component.scss']
})
export class BannerGeneratorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bannerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private blobSvc    = inject(BlobDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  presets = PRESET_SIZES;
  bannerGenerated = false;
  openFaqIndex: number | null = null;

  private uploadedLogo: HTMLImageElement | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('event-qr-generator'),
    getToolBySlug('upi-qr-generator'),
    getToolBySlug('mailto-link-generator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What banner sizes are supported?',
      a: 'We include presets for all major social media platforms: LinkedIn Cover (1584×396), Twitter/X Header (1500×500), Facebook Cover (820×312), YouTube Channel Art (1280×720), Instagram Square (1080×1080), and a fully custom width/height option. The canvas always exports at the full native resolution.'
    },
    {
      q: 'How does the gradient background work?',
      a: 'When you select "Gradient" as the background type, the tool creates a linear left-to-right gradient between your chosen start and end colors using the Canvas 2D API\'s createLinearGradient method. For solid backgrounds, a single fill color is used.'
    },
    {
      q: 'What logo file formats are supported?',
      a: 'The logo upload accepts any image format that the browser supports natively: PNG, JPEG, GIF, WebP, and SVG. PNG with a transparent background works best for overlaying on banner backgrounds. The logo is scaled proportionally and centered on the canvas.'
    },
    {
      q: 'Is the downloaded PNG high resolution?',
      a: 'Yes. The canvas is drawn at the full native resolution of the selected preset (e.g. 1584×396 for LinkedIn). The on-screen preview is CSS-scaled down to fit the screen but does not affect the exported pixel dimensions. The downloaded PNG is print-ready at the original dimensions.'
    }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      heading:    ['', [Validators.required, Validators.maxLength(100)]],
      subheading: ['', Validators.maxLength(150)],
      preset:     [0, Validators.required],
      customW:    [1200],
      customH:    [628],
      bgType:     ['solid'],
      bgColor1:   ['#1a56db'],
      bgColor2:   ['#0d3b9e'],
      textColor:  ['#ffffff'],
      fontSize:   [64, [Validators.required, Validators.min(12), Validators.max(200)]],
      textAlign:  ['center'],
    });
    this.updateSeo();
    this.injectJsonLd();
  }

  ngAfterViewInit(): void {}

  get currentPreset(): PresetSize {
    const idx = Number(this.form.get('preset')?.value ?? 0);
    return this.presets[idx];
  }

  get canvasWidth(): number {
    const p = this.currentPreset;
    return p.width > 0 ? p.width : (this.form.get('customW')?.value || 1200);
  }

  get canvasHeight(): number {
    const p = this.currentPreset;
    return p.height > 0 ? p.height : (this.form.get('customH')?.value || 628);
  }

  onLogoUpload(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedLogo = img;
        if (this.bannerGenerated) this.generate();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    const v    = this.form.getRawValue();
    const w    = this.canvasWidth;
    const h    = this.canvasHeight;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Background ────────────────────────────────────────────────────────────
    if (v.bgType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, v.bgColor1);
      grad.addColorStop(1, v.bgColor2);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = v.bgColor1;
    }
    ctx.fillRect(0, 0, w, h);

    // ── Logo ──────────────────────────────────────────────────────────────────
    if (this.uploadedLogo) {
      const maxLogoH = h * 0.35;
      const logoScale = maxLogoH / this.uploadedLogo.height;
      const logoW = this.uploadedLogo.width * logoScale;
      const logoH = this.uploadedLogo.height * logoScale;
      const logoX = (w - logoW) / 2;
      const logoY = h * 0.08;
      ctx.drawImage(this.uploadedLogo, logoX, logoY, logoW, logoH);
    }

    // ── Heading text ──────────────────────────────────────────────────────────
    ctx.fillStyle = v.textColor;
    ctx.textAlign = v.textAlign as CanvasTextAlign;
    ctx.textBaseline = 'middle';

    const hasLogo      = !!this.uploadedLogo;
    const textAreaTop  = hasLogo ? h * 0.48 : h * 0.30;
    const headingFontSize = Math.min(v.fontSize, w / 8);
    ctx.font = `bold ${headingFontSize}px Inter, Arial, sans-serif`;

    const textX = v.textAlign === 'center' ? w / 2 : v.textAlign === 'left' ? w * 0.06 : w * 0.94;
    this.drawWrappedText(ctx, v.heading, textX, textAreaTop, w * 0.88, headingFontSize * 1.3);

    // ── Subheading text ───────────────────────────────────────────────────────
    if (v.subheading) {
      const subFontSize = Math.max(headingFontSize * 0.45, 18);
      ctx.font = `${subFontSize}px Inter, Arial, sans-serif`;
      ctx.globalAlpha = 0.85;
      const subY = textAreaTop + headingFontSize * 1.8;
      this.drawWrappedText(ctx, v.subheading, textX, subY, w * 0.88, subFontSize * 1.4);
      ctx.globalAlpha = 1;
    }

    this.bannerGenerated = true;
    this.cdr.markForCheck();
  }

  /** Draws text wrapped within maxWidth, line by line */
  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let y = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const { width } = ctx.measureText(testLine);
      if (width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y);
  }

  downloadPng(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const v = this.form.getRawValue();
    const slug = (v.heading || 'banner').toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    this.blobSvc.downloadCanvas(canvas, `${slug}-banner.png`);
  }

  reset(): void {
    this.form.reset({
      heading: '', subheading: '', preset: 0, customW: 1200, customH: 628,
      bgType: 'solid', bgColor1: '#1a56db', bgColor2: '#0d3b9e',
      textColor: '#ffffff', fontSize: 64, textAlign: 'center'
    });
    this.uploadedLogo = null;
    this.bannerGenerated = false;
    if (isPlatformBrowser(this.platformId) && this.canvasRef?.nativeElement) {
      const ctx = this.canvasRef.nativeElement.getContext('2d');
      ctx?.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
    this.cdr.markForCheck();
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required'))   return 'This field is required.';
    if (c.hasError('maxlength'))  return `Max ${c.errors?.['maxlength']?.requiredLength} characters.`;
    if (c.hasError('min'))        return `Minimum value is ${c.errors?.['min']?.min}.`;
    if (c.hasError('max'))        return `Maximum value is ${c.errors?.['max']?.max}.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free Online Banner Generator — Create & Download Web Banners | BriskPeople';
    const d = 'Create custom web banners for LinkedIn, Twitter, Facebook, YouTube & Instagram using HTML5 Canvas. Download as high-resolution PNG. Free, no design skills required.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'banner generator, online banner maker, social media banner creator, LinkedIn cover creator, web banner PNG download' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/banner-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Banner Generator', applicationCategory: 'DesignApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/banner-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Banner Generator', item: 'https://www.briskpeople.com/free-tools/banner-generator' }
        ]
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: this.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }
    ];
    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schemas);
    this.document.head.appendChild(this.jsonLdScript);
  }

  ngOnDestroy(): void {
    this.jsonLdScript?.remove();
    this.titleSvc.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}
