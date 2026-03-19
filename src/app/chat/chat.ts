import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../interfaces/message';
import { ChatService } from '../services/chat.service';

declare const marked: any;
declare const DOMPurify: any;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  history: WritableSignal<Message[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  error: WritableSignal<any> = signal(null);
  message: WritableSignal<string> = signal('');
  copiedId: WritableSignal<number | null> = signal(null);

  private chatService = inject(ChatService);
  private shouldScroll = false;

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  renderMarkdown(text: string): string {
    try {
      const html = marked.parse(text);
      return DOMPurify.sanitize(html);
    } catch {
      return text;
    }
  }

  sendMessage(): void {
    const userMessage = this.message().trim();
    if (!userMessage || this.loading()) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: 'user',
      message: userMessage,
      timestamp: new Date(),
    };

    this.history.update((h) => [...h, newMessage]);
    this.message.set('');
    this.shouldScroll = true;
    this.askLLM(newMessage);
  }

  async askLLM(message: Message): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const botMessage = await this.chatService.sendMessage(message.message);

      const newBotMessage: Message = {
        id: Date.now(),
        sender: 'bot',
        message: botMessage,
        timestamp: new Date(),
      };

      this.history.update((h) => [...h, newBotMessage]);
      this.shouldScroll = true;

    } catch (error: any) {
      console.error('Error communicating with NexusDesk:', error);
      this.error.set('Something went wrong. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  clearChat(): void {
    this.history.set([]);
    this.error.set(null);
  }

  async copyMessage(item: Message): Promise<void> {
    try {
      await navigator.clipboard.writeText(item.message);
      this.copiedId.set(item.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    } catch (e) {}
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  suggestions = [
    'What is your refund policy?',
    'How do I reset my password?',
    'Do you provide phone support?',
    'Is my data secure?'
  ];
}