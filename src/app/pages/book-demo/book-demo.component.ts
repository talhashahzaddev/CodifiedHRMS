import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT, CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CountryOption {
  name: string;
  code: string;
  dialCode: string;
}

@Component({
  selector: 'app-book-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './book-demo.component.html',
  styleUrls: ['./book-demo.component.scss']
})
export class BookDemoComponent implements OnInit, AfterViewInit, OnDestroy {
  demoForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  submitError = '';
  showCalendly = false;

  @ViewChild('countryInput')  countryInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('industryInput') industryInputRef?: ElementRef<HTMLInputElement>;

  companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  readonly allIndustries = [
    'Information Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Construction',
    'Hospitality',
    'Logistics',
    'Telecommunications',
    'Consulting',
    'Non-Profit',
    'Other'
  ];
  filteredIndustries: string[] = [...this.allIndustries];
  industrySearch = '';
  industryDropdownOpen = false;

  countries: CountryOption[] = [];
  filteredCountries: CountryOption[] = [];
  countrySearch = '';
  countryDropdownOpen = false;
  countryLoading = false;

  get selectedCountry(): CountryOption | null {
    const code = this.demoForm.get('country')?.value;
    return code ? (this.countries.find(c => c.code === code) ?? null) : null;
  }

  private readonly isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private elRef: ElementRef,
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.demoForm = this.fb.group({
      fullName:     ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      companySize:  ['', [Validators.required]],
      country:      ['', [Validators.required]],
      phoneNumber:  ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      companyName:  ['', [Validators.required]],
      industry:     ['', [Validators.required]],
      message:      ['']
    });
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    if (!this.doc.getElementById('calendly-script')) {
      const script = this.doc.createElement('script');
      script.id = 'calendly-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      this.doc.head.appendChild(script);
    }
  }

  ngOnDestroy(): void {}

  loadCountries(): void {
    this.countryLoading = true;
    this.http
      .get<any[]>('https://restcountries.com/v3.1/all?fields=name,idd,cca2')
      .subscribe({
        next: (data) => {
          this.countries = data
            .filter(c => c.idd?.root && c.idd?.suffixes?.length)
            .map(c => {
              const dialCode = c.idd.root + (c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : '');
              return { name: c.name.common, code: c.cca2, dialCode };
            })
            .filter(c => c.dialCode.length > 1)
            .sort((a, b) => a.name.localeCompare(b.name));
          this.filteredCountries = [...this.countries];
          this.countryLoading = false;
        },
        error: () => {
          this.countries = [
            { name: 'Pakistan',             code: 'PK', dialCode: '+92'  },
            { name: 'United States',        code: 'US', dialCode: '+1'   },
            { name: 'United Kingdom',       code: 'GB', dialCode: '+44'  },
            { name: 'India',                code: 'IN', dialCode: '+91'  },
            { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' }
          ];
          this.filteredCountries = [...this.countries];
          this.countryLoading = false;
        }
      });
  }

  private countrySelecting = false;

  openCountryDropdown(): void {
    if (this.countryLoading || this.countryDropdownOpen) return;
    this.countryDropdownOpen = true;
    this.countrySearch = '';
    this.filteredCountries = [...this.countries];
    setTimeout(() => {
      const input = this.countryInputRef?.nativeElement;
      if (input) {
        input.removeAttribute('readonly');
        input.value = '';
        input.focus();
      }
    }, 0);
  }

  closeCountryDropdown(): void {
    this.countryDropdownOpen = false;
    this.countrySearch = '';
    this.filteredCountries = [...this.countries];
    const input = this.countryInputRef?.nativeElement;
    if (input) {
      input.setAttribute('readonly', 'true');
      input.value = this.selectedCountry?.name || '';
    }
  }

  toggleCountryDropdown(): void {
    if (this.countryDropdownOpen) {
      this.closeCountryDropdown();
    } else {
      this.countryInputRef?.nativeElement?.focus();
    }
  }

  onCountryBlur(): void {
    if (this.countrySelecting) {
      this.countrySelecting = false;
      return;
    }
    this.closeCountryDropdown();
  }

  onCountrySearch(value: string): void {
    this.countrySearch = value;
    const q = value.toLowerCase().trim();
    this.filteredCountries = q
      ? this.countries.filter(c =>
          c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
        )
      : [...this.countries];
  }

  selectCountry(country: CountryOption): void {
    this.countrySelecting = true;
    this.demoForm.patchValue({ country: country.code });
    this.demoForm.get('country')?.markAsTouched();
    this.closeCountryDropdown();
  }

  private industrySelecting = false;

  openIndustryDropdown(): void {
    if (this.industryDropdownOpen) return;
    this.industryDropdownOpen = true;
    this.industrySearch = '';
    this.filteredIndustries = [...this.allIndustries];
    setTimeout(() => {
      const input = this.industryInputRef?.nativeElement;
      if (input) {
        input.removeAttribute('readonly');
        input.value = '';
        input.focus();
      }
    }, 0);
  }

  closeIndustryDropdown(): void {
    this.industryDropdownOpen = false;
    this.industrySearch = '';
    this.filteredIndustries = [...this.allIndustries];
    const input = this.industryInputRef?.nativeElement;
    if (input) {
      input.setAttribute('readonly', 'true');
      input.value = this.demoForm.get('industry')?.value || '';
    }
  }

  toggleIndustryDropdown(): void {
    if (this.industryDropdownOpen) {
      this.closeIndustryDropdown();
    } else {
      this.industryInputRef?.nativeElement?.focus();
    }
  }

  onIndustryBlur(): void {
    if (this.industrySelecting) {
      this.industrySelecting = false;
      return;
    }
    this.closeIndustryDropdown();
  }

  onIndustrySearch(value: string): void {
    this.industrySearch = value;
    const q = value.toLowerCase().trim();
    this.filteredIndustries = q
      ? this.allIndustries.filter(i => i.toLowerCase().includes(q))
      : [...this.allIndustries];
  }

  selectIndustry(industry: string): void {
    this.industrySelecting = true;
    this.demoForm.patchValue({ industry });
    this.demoForm.get('industry')?.markAsTouched();
    this.closeIndustryDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      if (this.countryDropdownOpen)  this.closeCountryDropdown();
      if (this.industryDropdownOpen) this.closeIndustryDropdown();
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.submitError = '';

    if (this.demoForm.invalid) return;

    this.isSubmitting = true;
    const val = this.demoForm.value;

    const fullPhone = this.selectedCountry
      ? `${this.selectedCountry.dialCode}${val.phoneNumber}`
      : val.phoneNumber;

    const payload = {
      fullName:     val.fullName,
      emailAddress: val.emailAddress,
      companySize:  val.companySize,
      country:      this.selectedCountry?.name ?? val.country,
      phoneNumber:  fullPhone,
      companyName:  val.companyName,
      industry:     val.industry,
      message:      val.message ?? ''
    };

    this.http.post<any>(`${environment.apiUrl}/DemoInquiry/book-demo`, payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.success) {
          // Show the calendly section
          this.showCalendly = true;

          if (this.isBrowser) {
            // *ngIf creates the #calendly-embed div fresh in the DOM.
            // We wait for Angular's change detection + DOM render to finish,
            // then call initInlineWidget() pointing at that div by its id.
            setTimeout(() => {
              const win = window as any;
              const el = this.doc.getElementById('calendly-embed');
              if (!el) return;

              const init = () => {
                win.Calendly.initInlineWidget({
                  url: 'https://calendly.com/briskpeople/brisk-people-demo',
                  parentElement: el,
                });
              };

              if (win.Calendly?.initInlineWidget) {
                init();
              } else {
                // Script still loading — attach to its load event
                const scriptEl = this.doc.getElementById('calendly-script');
                scriptEl?.addEventListener('load', init, { once: true });
              }
            }, 150);
          }
        } else {
          this.submitError = response?.message ?? 'Something went wrong. Please try again.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError =
          err?.error?.message ?? 'Failed to submit. Please check your details and try again.';
      }
    });
  }

  onPhoneKeypress(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^0-9]/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
      this.demoForm.get('phoneNumber')?.setValue(cleaned, { emitEvent: false });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.demoForm.get(fieldName);
    if (field?.hasError('required'))  return `${this.getFieldLabel(fieldName)} is required`;
    if (field?.hasError('email'))     return 'Email address must be valid';
    if (field?.hasError('pattern') && fieldName === 'phoneNumber') return 'Phone number must contain digits only';
    if (field?.hasError('minlength')) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      fullName:     'Full Name',
      emailAddress: 'Email Address',
      companySize:  'Company Size',
      country:      'Country',
      phoneNumber:  'Phone Number',
      companyName:  'Organization Name',
      industry:     'Industry',
      message:      'Additional Information'
    };
    return labels[fieldName] ?? fieldName;
  }
}