import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DemoRequest } from '../../models/demo-request.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Submit demo request
   * TODO: Replace with actual API endpoint when backend is ready
   * Currently returns a mock success response for development
   */
  submitDemoRequest(request: DemoRequest): Observable<any> {
    console.log('Demo request submitted:', request);
    
    // For development: simulate API call and return success
    // Replace this with actual API call when backend is ready:
    // return this.http.post(`${this.apiUrl}/demo-request`, request);
    
    return of({ success: true, message: 'Demo request received' }).pipe(
      delay(1000), // Simulate network delay
      catchError((error: HttpErrorResponse) => {
        console.error('Error submitting demo request:', error);
        // For now, still return success for development
        return of({ success: true, message: 'Demo request received (simulated)' });
      })
    );
  }

  /**
   * Get blog posts
   * TODO: Replace with actual API endpoint when backend is ready
   */
  getBlogPosts(): Observable<any> {
    // Placeholder - will be replaced with actual API call
    return this.http.get(`${this.apiUrl}/blog/posts`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching blog posts:', error);
        // Return empty array for development
        return of([]);
      })
    );
  }
}

