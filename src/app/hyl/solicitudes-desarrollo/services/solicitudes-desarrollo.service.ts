import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesDesarrolloService {
  private apiUrl = 'http://localhost:8090/api/v1/solicitudes';

  constructor(private http: HttpClient) {}

  // Obtener todas las solicitudes (paginado)
  obtenerTodas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Crear una nueva solicitud
  crearSolicitud(solicitud: any): Observable<any> {
    return this.http.post(this.apiUrl, solicitud);
  }

  // Obtener por ID
  obtenerPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Obtener por código
  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/codigo/${codigo}`);
  }

  // Obtener por empleado
  obtenerPorEmpleado(documento: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${documento}`);
  }

  // Obtener todos los estados
  obtenerEstados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estados`);
  }

  // Obtener todos los tipos
  obtenerTipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipos`);
  }

  // Actualizar solicitud
  actualizar(id: number, solicitud: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, solicitud);
  }

  // Cambiar estado
  cambiarEstado(id: number, nuevoEstadoId: number, observacion?: string): Observable<any> {
    const params = new URLSearchParams();
    params.set('nuevoEstadoId', nuevoEstadoId.toString());
    if (observacion) {
      params.set('observacion', observacion);
    }
    return this.http.patch(`${this.apiUrl}/${id}/estado?${params.toString()}`, {});
  }

  // Eliminar
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Contar por estado
  contarPorEstado(estadoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contar/estado/${estadoId}`);
  }
}