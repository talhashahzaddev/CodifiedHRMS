import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest, AuthResponse } from '../../models/auth.models';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CardComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  signUpForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  submitSuccess = false;

  companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  currencies = [
    { code: 'USD', name: 'US Dollar (USD)' },
    { code: 'PKR', name: 'Pakistani Rupee (PKR)' },
    { code: 'EUR', name: 'Euro (EUR)' },
    { code: 'GBP', name: 'British Pound (GBP)' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      companySize: ['', [Validators.required]],
      website: ['', [Validators.required]],
      currency: ['USD', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
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

          // Extract subdomain identifier from domain for multi-tenant SaaS redirection
          const subdomain = this.extractSubdomainIdentifier(response.domain, formValue.companyName);
          
          if (subdomain) {
            // Redirect user to their HRMS app subdomain
            window.location.href = `https://${subdomain}.briskpeople.com/login`;
          } else {
            // Fallback if no subdomain can be determined
            this.submitSuccess = true;
            this.signUpForm.reset();
            this.submitted = false;

            setTimeout(() => {
              this.submitSuccess = false;
            }, 5000);
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
    if (fieldName === 'confirmPassword' && this.signUpForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
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
