import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AfilInfo } from './constants';
import { localStorageMock } from './local-storage.mock';

// ============================================================
// INTERFACES EXPORTADAS
// ============================================================

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
}

// ============================================================
// SERVICIO
// ============================================================

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
  // MÉTODOS DE AUTENTICACIÓN
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

  // ============================================================
  // MÉTODOS DE TOKEN
  // ============================================================

  public setLocalAuthKey(mode: string, key: string = ''): void {
    this.authKey = mode + ' ' + key;
    localStorage.setItem('authKey', btoa(this.authKey));
  }

  public getLocalAuthKey(): string {
    const x = localStorage.getItem('authKey') || '';
    return atob(x);
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
  // AFIL INFO (sessionStorage)
  // ============================================================

  public setAfilInfo(info: AfilInfo): void {
    info.nombreCompleto =
      (info.nombre1 || '') +
      ' ' +
      (info.nombre2 || '') +
      ' ' +
      (info.apellido1 || '') +
      ' ' +
      (info.apellido2 || '');
    info.nombreCompleto = info.nombreCompleto.replace('undefined', '').replace('  ', ' ').trim();
    sessionStorage.setItem('usrAfilInfo', btoa(JSON.stringify(info)));
  }

  public getAfilInfo(): AfilInfo {
    const y = sessionStorage.getItem('usrAfilInfo') || '';
    return JSON.parse(atob(y));
  }

  // ============================================================
  // OBTENER DATOS DEL COLABORADOR DESDE EL BACKEND
  // ============================================================

  public obtenerDatosColaborador(): Observable<ColaboradorData> {
    const url = environment.services + '/colaborador/actual';
    return this.http.get<ColaboradorData>(url);
  }
}