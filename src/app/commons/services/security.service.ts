import { Injectable, InjectionToken, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AfilInfo } from './constants';
import { localStorageMock } from './local-storage.mock';
export interface tokenData {
  jti: string, iat: number, sub: string; iss: string; aud: string; exp: number; localTime: number, key: string, origin: any
};

export interface ldapUsrData {
  username: string, info: { name: string, email: string, position: string },
};

export interface usrSession {
  status: boolean,
  username: string,
  context: any
}

@Injectable({ providedIn: 'root' })
export class SecurityService {

  private authKey: any;

  private usrOnSession: usrSession = { status: false, username: '', context: null };
  public userSession: BehaviorSubject<usrSession> = new BehaviorSubject<usrSession>(this.usrOnSession);
  private localStorage: Storage;
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {


    if (isPlatformBrowser(this.platformId)) {
      this.localStorage = window.localStorage;
      try {

        if (this.getLocalToken() == null) {
          this.setLocalAuthKey("Public");
        }
        else {
          let tkn: tokenData = this.getLocalToken();
          // let sub = JSON.parse(tkn.sub);
          this.setUserOnSession(tkn.sub, tkn.origin);
        }
      }
      catch { this.setLocalAuthKey("Public"); }

    } else {

      this.localStorage = localStorageMock as unknown as Storage;
    }

  }



  public requestAuth(pass: string): Observable<Object> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    let options = { headers: headers };
    return this.http.post(environment.auth, {}, options);
  }



  public getUserOnSession(): usrSession {
    return this.usrOnSession;
  }

  /**
   * Registra una sesión de usuario cuando se ha superado login
   * @param username Nombre de usuario
   * @param context Contexto de seguridad
   */
  public setUserOnSession(username: string, context: string): void {
    try {
      let sysTime = (new Date().getTime()) / 1000;

      if ((sysTime < this.getLocalToken().exp)) {
        this.usrOnSession.status = true;
        this.usrOnSession.username = username;
        this.usrOnSession.context = context;
        this.userSession.next(this.usrOnSession);
      }
      else {
        throw "invalid token";
      }
    }
    catch (Err) {
      this.usrOnSession.status = false;
      this.usrOnSession.username = '';
      this.usrOnSession.context = null;
      this.userSession.next(this.usrOnSession);
    }

  }


  public destroySession(): void {
    localStorage.removeItem('authTokenKey');
    this.setLocalAuthKey("Public");
    this.usrOnSession = { status: false, username: '', context: null };
    this.userSession.next(this.usrOnSession);
    sessionStorage.clear();
  }

  /**
   * Guarda con marca de método de autenticación y token en localStorage
   * @param mode método de autenticación de la sesión
   * @param key token
   */
  public setLocalAuthKey(mode: string, key: string = ""): void {
    this.authKey = mode + " " + key;
    localStorage.setItem("authKey", btoa(this.authKey));
  }


  public getLocalAuthKey(): string {
    let x = localStorage.getItem("authKey") || '';
    return atob(x);
  }


  public getLocalToken(): tokenData | any {
    try {
      let components: string[] = this.getLocalAuthKey().split('.');
      let tokenInfo: tokenData = JSON.parse(atob(components[1]));

      return tokenInfo;
    }
    catch (Err) {
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene permisos de acceso a una ruta
   * @param expectedRoles Roles esperados
   * @param expectTokenType Tipo de token esperado
   */
  isAuthorizedPath(expectedRoles: string[]): boolean {
    //
    let token = this.getLocalToken();
    if (token == null) {
      return false;
    }

    if (token.origin === environment.origin) {
      if (expectedRoles != null) {
        for (let i = 0; i < expectedRoles.length; i++) {
          try {
            let aud: string[] = JSON.parse(token.roles);
            if (aud.find(role => role === expectedRoles[i])) {
              return true;
            }
          }
          catch { }
        }
        return false;
      }
      else {
        return true;
      }
    }
    else {
      return false;
    }
  }

  public setAfilInfo(info: AfilInfo): void {
    info.nombreCompleto = info.nombre1 + ' ' + info.nombre2 + ' ' + info.apellido1 + ' ' + info.apellido2;
    info.nombreCompleto = info.nombreCompleto.replace('undefined', '').replace("  ", " ");
    sessionStorage.setItem("usrAfilInfo", btoa(JSON.stringify(info)));
  }

  public getAfilInfo(): AfilInfo {
    let y = sessionStorage.getItem("usrAfilInfo") || '';
    return JSON.parse(atob(y));
  }

}
