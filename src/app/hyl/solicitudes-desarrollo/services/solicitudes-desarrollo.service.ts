// solicitudes-desarrollo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesDesarrolloService {
  private apiUrl = 'http://localhost:8085/api/solicitudes';

  constructor(private http: HttpClient) {}

  // ============================================================
  // MÉTODOS EXISTENTES
  // ============================================================

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
    return this.http.get(`${this.apiUrl}/${id}/detalle`);
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

  // Actualizar prioridad
  actualizarPrioridad(id: number, prioridad: string): Observable<any> {
    console.log(`📤 Actualizando prioridad: ID=${id}, Prioridad=${prioridad}`);
    const params = new URLSearchParams();
    params.set('prioridad', prioridad);
    return this.http.patch(`${this.apiUrl}/${id}/prioridad?${params.toString()}`, {});
  }

  // Eliminar
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Contar por estado
  contarPorEstado(estadoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contar/estado/${estadoId}`);
  }

  // ============================================================
  // PDF (Nuevos métodos)
  // ============================================================

  // Descargar PDF
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  // Ver PDF
  verPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf/ver`, { responseType: 'blob' });
  }

  // ============================================================
  // NUEVOS MÉTODOS PARA CARGAR TODAS LAS SOLICITUDES
  // ============================================================

  /**
   * Obtiene TODAS las solicitudes (todas las páginas)
   * @returns Observable con todas las solicitudes
   */
  obtenerTodasCompletas(): Observable<any> {
    return new Observable(observer => {
      let todasLasSolicitudes: any[] = [];
      let paginaActual = 0;
      const tamanioPagina = 1000;
      let totalPages = 1;
      
      console.log('🔄 Iniciando carga de todas las páginas...');
      
      const cargarPagina = () => {
        // Usar el método obtenerTodas() que ya tienes
        // Pero necesitamos pasar parámetros de paginación
        // Si tu backend no soporta parámetros, usaremos la URL con query params
        const url = `${this.apiUrl}?page=${paginaActual}&size=${tamanioPagina}`;
        
        this.http.get(url).subscribe({
          next: (data: any) => {
            console.log(`📄 Página ${paginaActual + 1} cargada:`, data);
            
            if (data && data.content && data.content.length > 0) {
              // Agregar los elementos de esta página
              todasLasSolicitudes = [...todasLasSolicitudes, ...data.content];
              paginaActual++;
              totalPages = data.totalPages || 1;
              
              // Verificar si hay más páginas
              if (paginaActual < totalPages) {
                // Cargar siguiente página con un pequeño delay
                setTimeout(() => cargarPagina(), 150);
              } else {
                // Todas las páginas cargadas
                console.log(`✅ Total cargado: ${todasLasSolicitudes.length} solicitudes`);
                observer.next({ 
                  content: todasLasSolicitudes, 
                  totalElements: todasLasSolicitudes.length,
                  totalPages: paginaActual,
                  last: true
                });
                observer.complete();
              }
            } else {
              // No hay más datos
              console.log(`✅ No hay más páginas. Total: ${todasLasSolicitudes.length}`);
              observer.next({ 
                content: todasLasSolicitudes, 
                totalElements: todasLasSolicitudes.length,
                totalPages: paginaActual,
                last: true
              });
              observer.complete();
            }
          },
          error: (err) => {
            console.error('❌ Error al cargar página:', err);
            observer.error(err);
          }
        });
      };
      
      // Iniciar carga desde la primera página
      cargarPagina();
    });
  }

  /**
   * Obtiene todas las solicitudes en una sola llamada (si el backend lo soporta)
   */
  obtenerTodasSinPaginacion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/todas`);
  }

  /**
   * Obtiene el total de solicitudes
   */
  obtenerTotalSolicitudes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total`);
  }

  /**
   * Obtiene todas las solicitudes con un tamaño de página grande
   */
  obtenerTodasConTamanio(tamanio: number = 1000): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=0&size=${tamanio}`);
  }

  // ============================================================
  // ENVÍO DE CORREOS
  // ============================================================

  /**
   * Envía la solicitud y el PDF al backend para enviar el correo.
   */
  enviarNotificacionCorreo(payload: any): Observable<any> {
    // Nota: Si el endpoint en sv2-commons no tiene esta ruta exacta, deberás ajustarla.
    // En sv2-commons el controlador es /api/correo/enviar-correo
    const correoUrl = 'http://localhost:8082/api/correo/enviar-correo';
    
    // Necesitamos agregar el header "Accept-Version: v1" que requiere sv2-commons
    const headers = new HttpHeaders().set('Accept-Version', 'v1');
    return this.http.post(correoUrl, payload, { headers, responseType: 'text' });
  }

  // ============================================================
  // HISTORIAL DE CAMBIOS Y MIS SOLICITUDES
  // ============================================================

  /**
   * Obtiene el historial de cambios (auditoría) de una solicitud
   */
  obtenerHistorialCambios(solicitudId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${solicitudId}/historial`);
  }

  /**
   * Obtiene las solicitudes de un empleado específico (paginado)
   */
  obtenerMisSolicitudes(documento: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-solicitudes/${documento}?page=${page}&size=${size}`);
  }
}