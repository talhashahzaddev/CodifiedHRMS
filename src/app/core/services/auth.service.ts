import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RegisterRequest, AuthResponse, ApiResponse } from '../../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/Auth`;

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Store auth data if needed
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        }),
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Registration failed');
          }
          return response.data!;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.errors?.length > 0) {
      errorMessage = error.error.errors.join(', ');
    }
    
    return throwError(() => new Error(errorMessage));
  }
}




