import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/chat';

  async sendMessage(message: string): Promise<string> {
    try {
      const { reply } = await firstValueFrom(
        this.http.post<{ reply: string }>(this.apiUrl, { message })
      );
      return reply;
    } catch (error) {
      throw error;
    }
  }
}