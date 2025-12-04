import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ApiService } from '../../core/services/api.service';
import { DemoRequest } from '../../models/demo-request.model';

@Component({
  selector: 'app-demo-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CardComponent],
  templateUrl: './demo-request.component.html',
  styleUrls: ['./demo-request.component.scss']
})
export class DemoRequestComponent {
  demoForm: FormGroup;
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

  modules = [
    { id: 'payroll', label: 'Payroll' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'time-tracking', label: 'Time Tracking' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'performance', label: 'Performance' },
    { id: 'recruitment', label: 'Recruitment' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.demoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      companySize: ['', [Validators.required]],
      interestedModules: [[], [this.arrayMinLengthValidator(1)]],
      message: ['']
    });
  }

  arrayMinLengthValidator(minLength: number): (control: FormControl) => { [key: string]: any } | null {
    return (control: FormControl) => {
      const value = control.value;
      if (!value || !Array.isArray(value) || value.length < minLength) {
        return { minLength: true };
      }
      return null;
    };
  }

  toggleModule(moduleId: string): void {
    const modulesControl = this.demoForm.get('interestedModules') as FormControl;
    const currentModules: string[] = modulesControl.value || [];
    
    if (currentModules.includes(moduleId)) {
      modulesControl.setValue(currentModules.filter((m: string) => m !== moduleId));
    } else {
      modulesControl.setValue([...currentModules, moduleId]);
    }
    modulesControl.markAsTouched();
  }

  isModuleSelected(moduleId: string): boolean {
    const modulesArray: string[] = this.demoForm.get('interestedModules')?.value || [];
    return modulesArray.includes(moduleId);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.demoForm.valid) {
      this.isSubmitting = true;
      
      const formData: DemoRequest = this.demoForm.value;
      
      this.apiService.submitDemoRequest(formData).subscribe({
        next: () => {
          this.submitSuccess = true;
          this.isSubmitting = false;
          this.demoForm.reset();
          this.submitted = false;
          
          // Reset success message after 5 seconds
          setTimeout(() => {
            this.submitSuccess = false;
          }, 5000);
        },
        error: (error) => {
          console.error('Error submitting demo request:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.demoForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone Number',
      companyName: 'Company Name',
      companySize: 'Company Size',
      interestedModules: 'Interested Modules'
    };
    return labels[fieldName] || fieldName;
  }
}

