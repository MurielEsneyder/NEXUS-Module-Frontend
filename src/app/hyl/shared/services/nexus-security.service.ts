import { Injectable } from '@angular/core';
import { SecurityService } from '../../../commons/services/security.service';

@Injectable({
  providedIn: 'root'
})
export class NexusSecurityService {
  constructor(private securityService: SecurityService) {}

  getAfilInfo(): any {
    return this.securityService.getAfilInfo();
  }

  getLocalToken(): any {
    return this.securityService.getLocalToken();
  }
}
