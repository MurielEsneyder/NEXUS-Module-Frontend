import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Area, Proceso, Vicepresidencia, Cargo } from '../models/solicitudes-desarrollo.models';
import { DataService } from '../../../commons/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesDesarrolloService {
  constructor(private dataService: DataService) {}

  // ============================================================
  // MÉTODOS EXISTENTES
  // ============================================================

  obtenerAreas(): Observable<Area[]> {
    return this.dataService.requestGet({}, 'solicitudes/areas', 'v1') as Observable<Area[]>;
  }

  obtenerProcesos(): Observable<Proceso[]> {
    return this.dataService.requestGet({}, 'solicitudes/procesos', 'v1') as Observable<Proceso[]>;
  }

  obtenerVicepresidencias(): Observable<Vicepresidencia[]> {
    return this.dataService.requestGet({}, 'solicitudes/vicepresidencias', 'v1') as Observable<Vicepresidencia[]>;
  }

  obtenerCargos(): Observable<Cargo[]> {
    return this.dataService.requestGet({}, 'solicitudes/cargos', 'v1') as Observable<Cargo[]>;
  }

  obtenerColaboradorActual(): Observable<any> {
    return this.dataService.requestGet({}, 'colaborador/actual', 'v1');
  }

  obtenerTodas(): Observable<any> {
    return this.dataService.requestGet({}, 'solicitudes', 'v1');
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.dataService.requestPost(solicitud, 'solicitudes', 'v1');
  }

  obtenerPorId(id: number): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes/${id}/detalle`, 'v1');
  }

  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes/codigo/${codigo}`, 'v1');
  }

  obtenerPorEmpleado(documento: string): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes/empleado/${documento}`, 'v1');
  }

  obtenerEstados(): Observable<any[]> {
    return this.dataService.requestGet({}, 'solicitudes/estados', 'v1') as Observable<any[]>;
  }

  obtenerTipos(): Observable<any[]> {
    return this.dataService.requestGet({}, 'solicitudes/tipos', 'v1') as Observable<any[]>;
  }

  obtenerPrioridades(): Observable<any[]> {
    return this.dataService.requestGet({}, 'solicitudes/prioridades', 'v1') as Observable<any[]>;
  }

  actualizar(id: number, solicitud: any): Observable<any> {
    return this.dataService.requestPut(solicitud, `solicitudes/${id}`, 'v1');
  }

  cambiarEstado(id: number, nuevoEstadoId: number, observacion?: string): Observable<any> {
    const params = new URLSearchParams();
    params.set('nuevoEstadoId', nuevoEstadoId.toString());
    if (observacion) {
      params.set('observacion', observacion);
    }
    return this.dataService.requestPost({}, `solicitudes/${id}/estado?${params.toString()}`, 'v1');
  }

  actualizarPrioridad(id: number, prioridad: string): Observable<any> {
    console.log(`POST /api/solicitudes/${id}/prioridad - Actualizando prioridad a: ${prioridad}`);
    const params = new URLSearchParams();
    params.set('prioridad', prioridad);
    return this.dataService.requestPost({}, `solicitudes/${id}/prioridad?${params.toString()}`, 'v1');
  }

  eliminar(id: number): Observable<void> {
    return this.dataService.requestDelete({}, `solicitudes/${id}`, 'v1') as unknown as Observable<void>;
  }

  contarPorEstado(estadoId: number): Observable<number> {
    return this.dataService.requestGet({}, `solicitudes/contar/estado/${estadoId}`, 'v1') as Observable<number>;
  }

  // ============================================================
  // PDF (Nuevos métodos)
  // ============================================================

  descargarPdf(id: number): Observable<Blob> {
    return this.dataService.requestGetBlob({}, `solicitudes/${id}/pdf`, 'v1') as Observable<Blob>;
  }

  verPdf(id: number): Observable<Blob> {
    return this.dataService.requestGetBlob({}, `solicitudes/${id}/pdf/ver`, 'v1') as Observable<Blob>;
  }

  // ============================================================
  // NUEVOS MÉTODOS PARA CARGAR TODAS LAS SOLICITUDES
  // ============================================================

  obtenerTodasCompletas(): Observable<any> {
    // Tamaño reducido: carga más rápida al hacer menos joins en el backend
    return this.dataService.requestGet({}, 'solicitudes?page=0&size=100', 'v1');
  }

  obtenerTodasSinPaginacion(): Observable<any> {
    return this.dataService.requestGet({}, 'solicitudes/todas', 'v1');
  }

  obtenerTotalSolicitudes(): Observable<number> {
    return this.dataService.requestGet({}, 'solicitudes/total', 'v1') as Observable<number>;
  }

  obtenerTodasConTamanio(tamanio: number = 1000): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes?page=0&size=${tamanio}`, 'v1');
  }

  // ============================================================
  // ENVÍO DE CORREOS
  // ============================================================

  enviarNotificacionCorreo(payload: any): Observable<any> {
    return this.dataService.requestPostText(payload, 'correo/enviar-correo', 'v1');
  }

  /**
   * Envía la notificación por correo con el PDF adjunto.
   * Ruta mapeada en BD #265: /api/solicitudes/{id}/enviar-notificacion
   * @param id       ID de la solicitud
   * @param payload  Objeto con los datos del correo (destinatario, asunto, cuerpo, pdfBase64, nombrePdf)
   */
  enviarNotificacion(id: number, payload: any): Observable<any> {
    return this.dataService.requestPostText(payload, `solicitudes/${id}/enviar-notificacion`, 'v1');
  }

  // ============================================================
  // HISTORIAL DE CAMBIOS Y MIS SOLICITUDES
  // ============================================================

  obtenerHistorialCambios(solicitudId: number): Observable<any[]> {
    return this.dataService.requestGet({}, `solicitudes/${solicitudId}/historial`, 'v1') as Observable<any[]>;
  }

  obtenerMisSolicitudes(documento: string, page: number = 0, size: number = 100): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes/mis-solicitudes/${documento}?page=${page}&size=${size}`, 'v1');
  }

  obtenerMisSolicitudesPorCorreo(correo: string, page: number = 0, size: number = 100): Observable<any> {
    return this.dataService.requestGet({}, `solicitudes/mis-solicitudes/correo/${encodeURIComponent(correo)}?page=${page}&size=${size}`, 'v1');
  }
}