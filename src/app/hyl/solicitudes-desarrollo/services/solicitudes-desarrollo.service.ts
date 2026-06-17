// src/app/services/solicitudes-desarrollo.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudDesarrollo } from '../interfaces/solicitudes-desarrollo';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesDesarrolloService {
  private apiUrl = 'api/solicitudes-desarrollo'; // Ajusta según tu backend

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<SolicitudDesarrollo[]> {
    return this.http.get<SolicitudDesarrollo[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<SolicitudDesarrollo> {
    return this.http.get<SolicitudDesarrollo>(`${this.apiUrl}/${id}`);
  }

  crear(solicitud: SolicitudDesarrollo): Observable<SolicitudDesarrollo> {
    return this.http.post<SolicitudDesarrollo>(this.apiUrl, solicitud);
  }

  actualizar(id: number, solicitud: SolicitudDesarrollo): Observable<SolicitudDesarrollo> {
    return this.http.put<SolicitudDesarrollo>(`${this.apiUrl}/${id}`, solicitud);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerDatosColaborador(email: string): Observable<any> {
    return this.http.get<any>(`api/par_persona/colaborador?email=${email}`);
  }
}