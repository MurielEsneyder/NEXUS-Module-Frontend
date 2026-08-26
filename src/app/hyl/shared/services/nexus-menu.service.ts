import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NexusMenuService {
  private drawerActionSubject = new BehaviorSubject<'open' | 'close' | 'toggle' | null>(null);
  public drawerAction$ = this.drawerActionSubject.asObservable();

  public openMenu(): void {
    this.drawerActionSubject.next('open');
  }

  public closeMenu(): void {
    this.drawerActionSubject.next('close');
  }

  public toggleMenu(): void {
    this.drawerActionSubject.next('toggle');
  }
}
