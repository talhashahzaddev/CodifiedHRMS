import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/auth.models';

export interface DomainValidationResponse {
  isValid: boolean;
  domain?: string;
  organizationId?: string;
  organizationName?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DomainService {
  private readonly API_URL = `${environment.apiUrl}/Domain`;

  constructor(private http: HttpClient) {}

  /**
   * Checks if a domain exists in the database
   * @param domain The domain/subdomain to check (e.g., "xyz" from "xyz.briskpeople.com")
   * @returns Observable with true if domain exists (taken), false if available
   */
  checkDomainExists(domain: string): Observable<boolean> {
    if (!domain) {
      return of(false);
    }

    return this.http.get<ApiResponse<DomainValidationResponse>>(`${this.API_URL}/validate/${domain}`)
      .pipe(
        map(response => {
          // If domain is valid (exists in DB), return true (domain is taken)
          // If domain is not valid (doesn't exist), return false (domain is available)
          return response.success && response.data?.isValid === true;
        }),
        catchError((error) => {
          // If 404 or domain not found, domain doesn't exist (available for registration)
          if (error.status === 404 || error.status === 0) {
            return of(false);
          }
          // For other errors, assume domain doesn't exist to allow registration
          return of(false);
        })
      );
  }
}

