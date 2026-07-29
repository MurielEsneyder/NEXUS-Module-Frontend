import { Injectable } from '@angular/core';
import { SecurityService } from '../../../commons/services/security.service';

export interface ColaboradorData {
  nombreCompleto?: string;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  email?: string;
  correo?: string;
  cargo?: string;
  sede?: string;
  idPersona?: number;
  codUser?: string;
}

@Injectable({ providedIn: 'root' })
export class NexusSecurityService {

  constructor(private securityService: SecurityService) {}

  public getNombreCompleto(): string {
    const token = this.securityService.getLocalToken();
    return token?.sub || 'Usuario';
  }

  public getEmail(): string {
    const token = this.securityService.getLocalToken();
    return token?.email || token?.sub + '@asmetsalud.com' || 'usuario@asmetsalud.com';
  }

  public getCargo(): string {
    const token = this.securityService.getLocalToken();
    return token?.cargo || 'Colaborador';
  }

  public getSede(): string {
    const token = this.securityService.getLocalToken();
    return token?.sede || 'Sede Principal';
  }

  public getDatosColaborador(): ColaboradorData {
    const token = this.securityService.getLocalToken();
    return {
      nombreCompleto: token?.sub || 'Usuario',
      email: token?.email || token?.sub + '@asmetsalud.com' || 'usuario@asmetsalud.com',
      cargo: token?.cargo || 'Colaborador',
      sede: token?.sede || 'Sede Principal',
      idPersona: token?.idPersona,
      codUser: token?.codUser
    };
  }

  public hasRole(role: string): boolean {
    const token = this.securityService.getLocalToken();
    if (!token) return false;
    const roles = token.aud || token.roles || [];
    return roles.includes(role);
  }

  public hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  public isAuthorizedPath(expectedRoles: string[]): boolean {
    return this.securityService.isAuthorizedPath(expectedRoles);
  }

  public getAfilInfo(): any {
    try {
      const raw = sessionStorage.getItem('usrAfilInfo');
      if (!raw || raw.trim() === '') return null;
      return this.securityService.getAfilInfo();
    } catch (e) {
      console.warn('⚠️ NexusSecurityService.getAfilInfo(): sesión no disponible o corrupta.', e);
      return null;
    }
  }

  public getLocalToken(): any {
    return this.securityService.getLocalToken();
  }

  public getUserOnSession(): any {
    return this.securityService.getUserOnSession();
  }
}
