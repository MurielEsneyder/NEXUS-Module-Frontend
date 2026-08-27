import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NexusMenuService {
  private menuCommandSubject = new Subject<'open' | 'close' | 'toggle'>();
  public menuCommand$ = this.menuCommandSubject.asObservable();

  openMenu(): void {
    this.menuCommandSubject.next('open');
  }

  closeMenu(): void {
    this.menuCommandSubject.next('close');
  }

  toggleMenu(): void {
    this.menuCommandSubject.next('toggle');
  }
}
