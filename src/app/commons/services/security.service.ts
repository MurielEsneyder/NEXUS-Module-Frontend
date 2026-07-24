import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AfilInfo } from './constants';
import { localStorageMock } from './local-storage.mock';

export interface tokenData {
  jti: string;
  iat: number;
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  localTime: number;
  key: string;
  origin: any;
  cargo?: string;
  sede?: string;
  email?: string;
}

export interface ldapUsrData {
  username: string;
  info: { name: string; email: string; position: string };
}

export interface usrSession {
  status: boolean;
  username: string;
  context: any;
}

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
export class SecurityService {

  private authKey: any;
  private usrOnSession: usrSession = { status: false, username: '', context: null };
  public userSession: BehaviorSubject<usrSession> = new BehaviorSubject<usrSession>(this.usrOnSession);
  private localStorage: Storage;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.localStorage = window.localStorage;
      try {
        if (this.getLocalToken() == null) {
          this.setLocalAuthKey('Public');
        } else {
          const tkn: tokenData = this.getLocalToken();
          this.setUserOnSession(tkn.sub, tkn.origin);
        }
      } catch {
        this.setLocalAuthKey('Public');
      }
    } else {
      this.localStorage = localStorageMock as unknown as Storage;
    }
  }

  // ============================================================
  // MÉTODOS EXISTENTES
  // ============================================================
  public requestAuth(pass: string): Observable<Object> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(environment.auth, {}, { headers });
  }

  public getUserOnSession(): usrSession {
    return this.usrOnSession;
  }

  public setUserOnSession(username: string, context: string): void {
    try {
      const sysTime = new Date().getTime() / 1000;
      if (sysTime < this.getLocalToken().exp) {
        this.usrOnSession.status = true;
        this.usrOnSession.username = username;
        this.usrOnSession.context = context;
        this.userSession.next(this.usrOnSession);
      } else {
        throw 'invalid token';
      }
    } catch (Err) {
      this.usrOnSession.status = false;
      this.usrOnSession.username = '';
      this.usrOnSession.context = null;
      this.userSession.next(this.usrOnSession);
    }
  }

  public destroySession(): void {
    localStorage.removeItem('authTokenKey');
    this.setLocalAuthKey('Public');
    this.usrOnSession = { status: false, username: '', context: null };
    this.userSession.next(this.usrOnSession);
    sessionStorage.clear();
  }

  public setLocalAuthKey(mode: string, key: string = ''): void {
    this.authKey = mode + ' ' + key;
    localStorage.setItem('authKey', btoa(this.authKey));
  }

  public getLocalAuthKey(): string {
    const x = localStorage.getItem('authKey') || '';
    return atob(x).trim();
  }

  public getLocalToken(): tokenData | any {
    try {
      const components: string[] = this.getLocalAuthKey().split('.');
      const tokenInfo: tokenData = JSON.parse(atob(components[1]));
      return tokenInfo;
    } catch (Err) {
      return null;
    }
  }

  public isAuthorizedPath(expectedRoles: string[]): boolean {
    const token = this.getLocalToken();
    if (token == null) return false;
    if (token.origin === environment.origin) {
      if (expectedRoles != null) {
        for (let i = 0; i < expectedRoles.length; i++) {
          try {
            const aud: string[] = JSON.parse(token.roles);
            if (aud.find((role) => role === expectedRoles[i])) return true;
          } catch {}
        }
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  // ============================================================
  // 🔥 AFIL INFO CON CORRECCIÓN DE NOMBRE COMPLETO
  // ============================================================
  public setAfilInfo(info: AfilInfo): void {
    // ============================================================
    // SI YA TIENE NOMBRE COMPLETO, MANTENERLO
    // ============================================================
    if (info.nombreCompleto && info.nombreCompleto.trim() !== '') {
      sessionStorage.setItem("usrAfilInfo", btoa(JSON.stringify(info)));
      return;
    }

    // Si no tiene nombre completo, construirlo desde los componentes
    info.nombreCompleto = info.nombre1 + ' ' + info.nombre2 + ' ' + info.apellido1 + ' ' + info.apellido2;
    info.nombreCompleto = info.nombreCompleto.replace('undefined', '').replace("  ", " ").trim();
    sessionStorage.setItem("usrAfilInfo", btoa(JSON.stringify(info)));
  }

  public getAfilInfo(): AfilInfo {
    const y = sessionStorage.getItem("usrAfilInfo") || '';
    return JSON.parse(atob(y));
  }

  // ============================================================
  // NUEVOS MÉTODOS PARA OBTENER DATOS DEL COLABORADOR
  // ============================================================
  public getNombreCompleto(): string {
    const token = this.getLocalToken();
    return token?.sub || 'Usuario';
  }

  public getEmail(): string {
    const token = this.getLocalToken();
    return token?.email || token?.sub + '@asmetsalud.com' || 'usuario@asmetsalud.com';
  }

  public getCargo(): string {
    const token = this.getLocalToken();
    return token?.cargo || 'Colaborador';
  }

  public getSede(): string {
    const token = this.getLocalToken();
    return token?.sede || 'Sede Principal';
  }

  public getDatosColaborador(): ColaboradorData {
    const token = this.getLocalToken();
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
    const token = this.getLocalToken();
    if (!token) return false;
    const roles = token.aud || token.roles || [];
    return roles.includes(role);
  }

  public hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}