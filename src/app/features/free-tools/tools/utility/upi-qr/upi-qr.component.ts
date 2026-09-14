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

/** Regex: UPI VPA format — e.g. user@okicici, name@paytm */
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

@Component({
  selector: 'app-upi-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './upi-qr.component.html',
  styleUrls: ['./upi-qr.component.scss']
})
export class UpiQrComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('qrCanvas') qrCanvasRef!: ElementRef<HTMLCanvasElement>;

  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private blobSvc    = inject(BlobDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  upiUri: string | null = null;
  qrGenerated = false;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('event-qr-generator'),
    getToolBySlug('mailto-link-generator'),
    getToolBySlug('add-to-calendar-link-generator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is a UPI ID (VPA)?',
      a: 'A UPI ID (also called a Virtual Payment Address or VPA) is a unique identifier used in India\'s Unified Payments Interface. It looks like a username@bankhandle (e.g., yourname@okicici or business@paytm). Scanning a QR code generated from a UPI VPA instantly pre-fills all payment details in any UPI app like Google Pay, PhonePe, Paytm, or BHIM.'
    },
    {
      q: 'What is the UPI URI format?',
      a: 'The standard UPI deep-link URI is: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&tn=NOTE&cu=INR. The "pa" parameter is the UPI ID, "pn" is the payee name shown in the app, "am" is the pre-filled amount (optional), and "tn" is a transaction note. All values are URL-encoded.'
    },
    {
      q: 'Can I leave the Amount field blank?',
      a: 'Yes. If you leave the Amount field empty, the QR code will open the payment app but allow the payer to enter any amount they choose. This is useful for tip jars, donation links, or situations where the amount varies per transaction.'
    },
    {
      q: 'Which apps can scan this UPI QR code?',
      a: 'Any UPI-enabled app can scan this QR code, including Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, and any other NPCI-compliant UPI app. The QR code follows the official NPCI UPI URI specification.'
    }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      upiId:  ['', [Validators.required, Validators.pattern(UPI_REGEX)]],
      name:   ['', [Validators.required, Validators.maxLength(100)]],
      amount: [null, [Validators.min(0), Validators.max(100000)]],
      note:   ['', Validators.maxLength(50)],
      fgColor: ['#000000'],
      bgColor: ['#FFFFFF']
    });
    this.updateSeo();
    this.injectJsonLd();
  }

  ngAfterViewInit(): void {}

  async generate(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    const v = this.form.getRawValue();
    const params = new URLSearchParams();
    params.set('pa', v.upiId);
    params.set('pn', v.name);
    if (v.amount !== null && v.amount !== '') params.set('am', String(v.amount));
    if (v.note)   params.set('tn', v.note);
    params.set('cu', 'INR');

    this.upiUri = `upi://pay?${params.toString()}`;

    // Dynamically import qrcode to keep initial bundle small
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = this.qrCanvasRef?.nativeElement;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, this.upiUri, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark:  v.fgColor || '#000000',
          light: v.bgColor || '#FFFFFF'
        }
      });

      this.qrGenerated = true;
      this.cdr.markForCheck();
    } catch (err) {
      console.error('QR generation failed', err);
    }
  }

  downloadPng(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.qrCanvasRef?.nativeElement;
    if (!canvas) return;
    this.blobSvc.downloadCanvas(canvas, `upi-qr-${this.form.value.upiId || 'payment'}.png`);
  }

  reset(): void {
    this.form.reset({ fgColor: '#000000', bgColor: '#FFFFFF' });
    this.upiUri = null;
    this.qrGenerated = false;
    // Clear canvas
    if (isPlatformBrowser(this.platformId) && this.qrCanvasRef?.nativeElement) {
      const ctx = this.qrCanvasRef.nativeElement.getContext('2d');
      ctx?.clearRect(0, 0, this.qrCanvasRef.nativeElement.width, this.qrCanvasRef.nativeElement.height);
    }
    this.cdr.markForCheck();
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required'))  return 'This field is required.';
    if (c.hasError('pattern'))   return 'Enter a valid UPI ID (e.g. name@okicici).';
    if (c.hasError('min'))       return 'Amount must be 0 or greater.';
    if (c.hasError('max'))       return 'Amount cannot exceed ₹1,00,000.';
    if (c.hasError('maxlength')) return `Maximum ${c.errors?.['maxlength']?.requiredLength} characters.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free UPI QR Code Generator — Instant UPI Payment QR | BriskPeople';
    const d = 'Generate a UPI QR code from your UPI ID, amount, and payee name. Standard UPI URI format. Works with Google Pay, PhonePe, Paytm & all UPI apps.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'UPI QR code generator, UPI payment QR, GPay QR code, PhonePe QR, UPI ID QR, UPI URI generator' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/upi-qr-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'UPI QR Code Generator', applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/upi-qr-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'UPI QR Code Generator', item: 'https://www.briskpeople.com/free-tools/upi-qr-generator' }
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
