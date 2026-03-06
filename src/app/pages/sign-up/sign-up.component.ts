import { Component, OnInit, ElementRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CardComponent } from '../../shared/components/card/card.component';
import { AuthService } from '../../core/services/auth.service';
import { DomainService } from '../../core/services/domain.service';
import { RegisterRequest, ApiResponse, AuthResponse } from '../../models/auth.models';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

interface CurrencyOption {
  code: string;    // e.g. "usd"
  name: string;    // e.g. "US Dollar"
  label: string;   // e.g. "US Dollar (USD)"
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  submitSuccess = false;
  verificationEmailSent = false;

  @ViewChild('currencyInput') currencyInputRef?: ElementRef<HTMLInputElement>;

  // ── Currency dropdown state ──────────────────────────────────
  currencies: CurrencyOption[] = [];
  filteredCurrencies: CurrencyOption[] = [];
  currencySearch = '';
  currencyDropdownOpen = false;
  currencyLoading = false;
  currencyLoadError = false;

  /** The currently selected currency option (for display) */
  get selectedCurrency(): CurrencyOption | null {
    const code = this.signUpForm.get('currency')?.value;
    return code ? (this.currencies.find(c => c.code === code) ?? null) : null;
  }

  companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private domainService: DomainService,
    private http: HttpClient,
    private elRef: ElementRef
  ) {
    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      companySize: ['', [Validators.required]],
      website: ['', 
        [
          Validators.required,
          this.domainFormatValidator()
        ],
        [
          this.domainExistsValidator()
        ]
      ],
      currency: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadCurrencies();
  }

  // ── Load currencies from open API ────────────────────────────
  loadCurrencies(): void {
    this.currencyLoading = true;
    this.currencyLoadError = false;

    this.http.get<Record<string, string>>(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json'
    ).subscribe({
      next: (data) => {
        // Filter out entries with empty names, sort alphabetically by name
        this.currencies = Object.entries(data)
          .filter(([code, name]) => name && name.trim() !== '')
          .map(([code, name]) => ({
            code: code.toUpperCase(),
            name,
            label: `${name} (${code.toUpperCase()})`
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        this.filteredCurrencies = [...this.currencies];
        this.currencyLoading = false;
        // No default — user must explicitly select
      },
      error: () => {
        // Fallback to 4 hardcoded currencies if API fails
        this.currencies = [
          { code: 'USD', name: 'US Dollar',       label: 'US Dollar (USD)' },
          { code: 'PKR', name: 'Pakistani Rupee', label: 'Pakistani Rupee (PKR)' },
          { code: 'EUR', name: 'Euro',             label: 'Euro (EUR)' },
          { code: 'GBP', name: 'British Pound',    label: 'British Pound (GBP)' }
        ];
        this.filteredCurrencies = [...this.currencies];
        this.currencyLoadError = true;
        this.currencyLoading = false;
        // No default — user must explicitly select
      }
    });
  }

  // ── Dropdown interaction ──────────────────────────────────────
  openCurrencyDropdown(): void {
    if (this.currencyLoading || this.currencyDropdownOpen) return;
    this.currencyDropdownOpen = true;
    this.currencySearch = '';
    this.filteredCurrencies = [...this.currencies];
    // Make input editable and focus it after open
    setTimeout(() => {
      const input = this.currencyInputRef?.nativeElement;
      if (input) {
        input.removeAttribute('readonly');
        input.value = '';
        input.focus();
      }
    }, 0);
  }

  closeCurrencyDropdown(): void {
    this.currencyDropdownOpen = false;
    this.currencySearch = '';
    this.filteredCurrencies = [...this.currencies];
    // Restore readonly so it can't be typed into while closed
    const input = this.currencyInputRef?.nativeElement;
    if (input) {
      input.setAttribute('readonly', 'true');
      // Show selected value or empty
      input.value = this.selectedCurrency?.label || '';
    }
  }

  toggleCurrencyDropdown(): void {
    if (this.currencyDropdownOpen) {
      this.closeCurrencyDropdown();
    } else {
      this.openCurrencyDropdown();
    }
  }

  onCurrencySearch(value: string): void {
    this.currencySearch = value;
    const q = value.toLowerCase().trim();
    this.filteredCurrencies = q
      ? this.currencies.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
        )
      : [...this.currencies];
  }

  selectCurrency(currency: CurrencyOption): void {
    this.signUpForm.patchValue({ currency: currency.code });
    this.signUpForm.get('currency')?.markAsTouched();
    this.closeCurrencyDropdown();
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeCurrencyDropdown();
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Handles domain input to prevent special characters and spaces
   */
  onDomainInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any spaces
    value = value.replace(/\s/g, '');

    // Remove special characters except hyphens and alphanumeric
    value = value.replace(/[^a-zA-Z0-9-]/g, '');

    // Prevent consecutive hyphens
    value = value.replace(/--+/g, '-');

    // Prevent leading/trailing hyphens
    value = value.replace(/^-+|-+$/g, '');

    // Convert to lowercase
    value = value.toLowerCase();

    // Update the form control value
    if (value !== input.value) {
      this.signUpForm.patchValue({ website: value }, { emitEvent: false });
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.signUpForm.valid) {
      this.isSubmitting = true;
      
      const formValue = this.signUpForm.value;
      const registerRequest: RegisterRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        companyName: formValue.companyName,
        companySize: formValue.companySize,
        website: formValue.website,
        currency: formValue.currency
      };
      
      this.authService.register(registerRequest).subscribe({
        next: (response: AuthResponse) => {
          this.isSubmitting = false;

          // Check if the message indicates verification email was sent
          if (response.token == null) {
            // Show verification email sent message and keep user on the page
            this.verificationEmailSent = true;
            this.submitted = false;
          } else if (response) {
            // Handle other success scenarios (e.g., direct login with token)
            const subdomain = this.extractSubdomainIdentifier(response.domain, formValue.companyName);
            
            if (subdomain) {
              // Redirect user to their HRMS app subdomain
              window.location.href = `https://login.briskpeople.com`;
            } else {
              // Fallback if no subdomain can be determined
              this.submitSuccess = true;
              this.signUpForm.reset();
              this.submitted = false;

              setTimeout(() => {
                this.submitSuccess = false;
              }, 5000);
            }
          }
        },
        error: (error) => {
          console.error('Error during sign up:', error);
          this.isSubmitting = false;
          // Optionally show error message in UI
        }
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signUpForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    if (field?.hasError('invalidFormat')) {
      return 'Domain can only contain letters, numbers, and hyphens. No spaces or special characters allowed.';
    }
    if (field?.hasError('domainExists')) {
      return 'This domain already exists. Please choose a different domain.';
    }
    if (fieldName === 'confirmPassword' && this.signUpForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Validates domain format (no special characters, no spaces)
   */
  private domainFormatValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }

      const value = control.value.trim();
      
      // Allow only alphanumeric characters and hyphens
      // No spaces, no special characters except hyphens
      const domainPattern = /^[a-zA-Z0-9-]+$/;
      
      if (!domainPattern.test(value)) {
        return { invalidFormat: true };
      }

      // Check for consecutive hyphens
      if (value.includes('--')) {
        return { invalidFormat: true };
      }

      // Check for leading or trailing hyphens
      if (value.startsWith('-') || value.endsWith('-')) {
        return { invalidFormat: true };
      }

      return null;
    };
  }

  /**
   * Async validator to check if domain already exists in database
   */
  private domainExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      const domain = control.value.trim().toLowerCase();

      // Skip validation if format is invalid (let format validator handle it first)
      const formatValidator = this.domainFormatValidator();
      if (formatValidator(control)) {
        return of(null);
      }

      // Debounce API calls to avoid too many requests
      return of(domain).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((domainValue) => {
          return this.domainService.checkDomainExists(domainValue).pipe(
            map((exists) => {
              // If domain exists, return error
              if (exists) {
                return { domainExists: true };
              }
              return null;
            }),
            catchError(() => {
              // On error, assume domain doesn't exist (allow registration)
              return of(null);
            })
          );
        })
      );
    };
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      companyName: 'Company Name',
      companySize: 'Company Size',
      website: 'Website or Domain',
      currency: 'Currency'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Extracts a clean subdomain identifier from a domain string
   * Examples:
   * - "example.com" -> "example"
   * - "www.example.com" -> "example"
   * - "subdomain.example.com" -> "subdomain"
   * - "example" -> "example"
   * Falls back to sanitized company name if domain is not available
   */
  private extractSubdomainIdentifier(domain: string | undefined, companyName: string): string | null {
    if (domain) {
      try {
        // Remove protocol if present
        let cleanDomain = domain.replace(/^https?:\/\//, '');
        
        // Remove www. prefix
        cleanDomain = cleanDomain.replace(/^www\./, '');
        
        // Extract the first part before the first dot (subdomain or domain name)
        const parts = cleanDomain.split('.');
        const identifier = parts[0];
        
        // Sanitize: lowercase, remove special characters, keep only alphanumeric and hyphens
        const sanitized = identifier
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        
        return sanitized || null;
      } catch (error) {
        console.warn('Error extracting subdomain from domain:', error);
      }
    }
    
    // Fallback to sanitized company name
    if (companyName) {
      const sanitized = companyName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      return sanitized || null;
    }
    
    return null;
  }
}
