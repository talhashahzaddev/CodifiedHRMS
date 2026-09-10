import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ClipboardService } from '../../../services/clipboard.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface MailtoResult {
  rawLink:   string;
  htmlSnippet: string;
}

@Component({
  selector: 'app-mailto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './mailto.component.html',
  styleUrls: ['./mailto.component.scss']
})
export class MailtoComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private clipboard  = inject(ClipboardService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: MailtoResult | null = null;
  copiedKey: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('add-to-calendar-link-generator'),
    getToolBySlug('event-qr-generator'),
    getToolBySlug('banner-generator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is a mailto: link?',
      a: 'A mailto: link is a special hyperlink that opens the visitor\'s default email client with pre-filled fields (To, CC, BCC, Subject, and Body). When placed on a website or in a button, clicking it immediately composes a new email without needing to copy-paste the address.'
    },
    {
      q: 'Why do special characters break my mailto link?',
      a: 'Email clients and browsers parse the URL strictly. Characters like spaces, ampersands (&), question marks (?), and line breaks must be URL-encoded. For example, a space becomes %20, a line break becomes %0A, and an ampersand becomes %26. Our generator applies encodeURIComponent() to every field automatically, so the link always works correctly.'
    },
    {
      q: 'Can I add multiple recipients in the "To" field?',
      a: 'Yes. Separate multiple email addresses with a comma in the "To", "CC", or "BCC" fields (e.g., alice@company.com,bob@company.com). Most email clients handle comma-separated lists in all mailto fields.'
    },
    {
      q: 'How do I use the mailto link in HTML?',
      a: 'Copy the HTML snippet and paste it anywhere in your webpage. The snippet looks like: <a href="mailto:...">Email Us</a>. You can change the link text ("Email Us") to anything you prefer. The href attribute contains the complete, properly-encoded mailto URL.'
    }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      to:      ['', [Validators.required, Validators.email]],
      cc:      [''],
      bcc:     [''],
      subject: ['', Validators.required],
      body:    ['']
    });
    this.updateSeo();
    this.injectJsonLd();
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    const parts: string[] = [];
    if (v.cc)      parts.push(`cc=${encodeURIComponent(v.cc)}`);
    if (v.bcc)     parts.push(`bcc=${encodeURIComponent(v.bcc)}`);
    if (v.subject) parts.push(`subject=${encodeURIComponent(v.subject)}`);
    if (v.body)    parts.push(`body=${encodeURIComponent(v.body).replace(/%0A/g, '%0A')}`);

    const rawLink = `mailto:${v.to}${parts.length ? '?' + parts.join('&') : ''}`;
    const htmlSnippet = `<a href="${rawLink.replace(/"/g, '&quot;')}">Send Email</a>`;

    this.result = { rawLink, htmlSnippet };
    this.cdr.markForCheck();
  }

  async copy(key: string, value: string): Promise<void> {
    const ok = await this.clipboard.copy(value);
    if (ok) {
      this.copiedKey = key;
      this.cdr.markForCheck();
      setTimeout(() => { this.copiedKey = null; this.cdr.markForCheck(); }, 2000);
    }
  }

  openMailto(): void {
    if (!this.result || !isPlatformBrowser(this.platformId)) return;
    window.location.href = this.result.rawLink;
  }

  reset(): void {
    this.form.reset();
    this.result = null;
    this.copiedKey = null;
    this.cdr.markForCheck();
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required')) return 'This field is required.';
    if (c.hasError('email'))    return 'Enter a valid email address.';
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free Mailto Link Generator — Encoded Email Link Builder | BriskPeople';
    const d = 'Generate properly URL-encoded mailto links with pre-filled To, CC, BCC, Subject, and Body. Free email link builder — no signup required.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'mailto link generator, email link builder, mailto URL encoder, mailto with subject body, html mailto link' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/mailto-link-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Mailto Link Generator', applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/mailto-link-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Mailto Link Generator', item: 'https://www.briskpeople.com/free-tools/mailto-link-generator' }
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
