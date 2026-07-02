import { Component, OnInit } from '@angular/core';
import { SolicitudesDesarrolloService } from '../../services/solicitudes-desarrollo.service';
import { SecurityService } from '../../../../commons/services/security.service';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable no tiene tipos
import autoTable from 'jspdf-autotable';

// ============================================================
// INTERFACES
// ============================================================
export interface RequerimientoItem {
  id: string;
  descripcion: string;
  detalle?: string;
  cargoImpactado?: string;
  archivos?: any[];
  tieneImagen?: boolean;
}

export interface SolicitudDesarrollo {
  id?: number;
  numeroSolicitud?: string;
  objetivo: string;
  detalle?: string;
  solicitante: string;
  area: string;
  prioridad?: 'alta' | 'media' | 'baja';
  estado: string;
  tipo?: string;
  fechaCreacion: Date;
  fechaLimite?: Date;
  coordinador?: string;
  funcionalAsignado?: string;
  cargosImpactados?: string[];
  requerimientosFuncionales?: RequerimientoItem[];
  requerimientosNoFuncionales?: RequerimientoItem[];
  archivos?: any[];
  tieneImagenes?: boolean;
  totalRequerimientos?: number;
  observaciones?: string;
  // 🔥 NUEVOS CAMPOS
  proceso?: string;
  vicepresidencia?: string;
  correo?: string;
  cargo?: string;
  sede?: string;
}

@Component({
  selector: 'app-solicitudes-desarrollo',
  templateUrl: './solicitudes-desarrollo.component.html',
  styleUrls: ['./solicitudes-desarrollo.component.css']
})
export class SolicitudesDesarrolloComponent implements OnInit {

  // ============================================================
  // VARIABLES DE ESTADO
  // ============================================================
  vistaActual: 'principal' | 'bandeja' | 'wizard' = 'principal';
  pasoActivo = 0;
  mostrarModalInf = false;
  mostrarModalEliminar = false;
  mostrarModalExito = false;
  mostrarModalDetalle = false;
  numeroSolicitudExito = '';
  observacionesModal = '';
  impactoTexto = '';
  errorImpacto = false;
  archivoAdjuntoTemporal: any = null;

  // ============================================================
  // DATOS
  // ============================================================
  solicitudes: SolicitudDesarrollo[] = [];
  solicitudesFiltradas: SolicitudDesarrollo[] = [];
  solicitudActual!: SolicitudDesarrollo;
  solicitudSeleccionada: SolicitudDesarrollo | null = null;
  requerimientoAEliminar: { id: string; index: number; tipo: 'funcional' | 'noFuncional' } | null = null;

  // ============================================================
  // DATOS DEL COLABORADOR
  // ============================================================
  datosColaborador = {
    nombreCompleto: 'Cargando...',
    correo: 'Cargando...',
    cargo: 'Cargando...',
    sede: 'Cargando...'
  };

  fechaIngreso = new Date().toISOString().split('T')[0];

  // ============================================================
  // FORMULARIO GENERAL
  // ============================================================
  formGeneral = {
    solicitudProceso: '',
    proceso: '',
    area: '',
    vicepresidencia: '',
    tipoSolicitud: '',
    observacion: ''
  };

  erroresGeneral = {
    proceso: false,
    area: false,
    vicepresidencia: false,
    tipoSolicitud: false,
    solicitudProceso: false
  };

  // ============================================================
  // LISTAS DE OPCIONES (CATÁLOGOS)
  // ============================================================
  procesosSolicitante = [
    'Desarrollo Tecnológico',
    'Gestión Documental',
    'Contabilidad',
    'Talento Humano'
  ];

  areas = [
    'Transformación Digital',
    'Servicios de salud financiera',
    'Gestión Documental',
    'Talento Humano',
    'Desarrollo Organizacional'
  ];

  vicepresidencias = [
    'Vicepresidencia de Salud',
    'Vicepresidencia Administrativa',
    'Vicepresidencia Financiera'
  ];

  tiposSolicitud = ['Proyecto', 'Mejora'];

  cargosArray = [
    'Profesional jurídico',
    'Profesional funcional',
    'Profesional BIG',
    'Profesional de desarrollo',
    'Líder técnico'
  ];

  estadosDisponibles: string[] = [
    'Enviada',
    'En desarrollo',
    'Cerrada',
    'Rechazada'
  ];

  // ============================================================
  // MAPA DE ÁREAS
  // ============================================================
  private areaMap: { [key: number]: string } = {
    1: 'Transformación Digital',
    2: 'Servicios de salud financiera',
    3: 'Gestión Documental',
    4: 'Talento Humano',
    5: 'Desarrollo Organizacional'
  };

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor(
    private solicitudesService: SolicitudesDesarrolloService,
    private securityService: SecurityService,
    private http: HttpClient
  ) {}

  // ============================================================
  // NG ON INIT
  // ============================================================
  ngOnInit(): void {
    this.obtenerDatosColaborador();
  }

  // ============================================================
  // OBTENER DATOS DEL COLABORADOR
  // ============================================================
  private obtenerDatosColaborador(): void {
    console.log('🔍 Iniciando obtención de datos del colaborador...');

    try {
      const afilInfo = this.securityService.getAfilInfo();
      if (afilInfo && afilInfo.nombreCompleto && afilInfo.nombreCompleto !== 'undefined') {
        this.datosColaborador = {
          nombreCompleto: afilInfo.nombreCompleto || '',
          correo: (afilInfo as any).email || (afilInfo as any).correo || '',
          cargo: (afilInfo as any).cargo || '',
          sede: (afilInfo as any).sede || ''
        };
        console.log('✅ Datos desde sessionStorage:', this.datosColaborador);
        this.continuarInicializacion();
        return;
      }
    } catch (e) {
      console.warn('⚠️ Error en getAfilInfo():', e);
    }

    try {
      const token = this.securityService.getLocalToken();
      if (token && token.sub) {
        this.datosColaborador = {
          nombreCompleto: token.sub || 'Usuario',
          correo: token.email || token.sub + '@asmetsalud.com',
          cargo: token.cargo || 'Colaborador',
          sede: token.sede || 'Sede Principal'
        };
        console.log('✅ Datos desde el token:', this.datosColaborador);
        this.continuarInicializacion();
        return;
      }
    } catch (e) {
      console.warn('⚠️ Error al leer el token:', e);
    }

    console.warn('⚠️ No se pudieron obtener datos, usando fallback');
    this.datosColaborador = {
      nombreCompleto: 'Usuario de Prueba',
      correo: 'usuario@asmetsalud.com',
      cargo: 'Colaborador',
      sede: 'Sede Principal'
    };
    this.continuarInicializacion();
  }

  // ============================================================
  // CONTINUAR INICIALIZACIÓN
  // ============================================================
  private continuarInicializacion(): void {
    console.log('✅ Datos finales del colaborador:', this.datosColaborador);
    this.solicitudActual = this.inicializarNuevaSolicitud();
    this.cargarSolicitudes();
  }

  // ============================================================
  // INICIALIZAR NUEVA SOLICITUD
  // ============================================================
  private inicializarNuevaSolicitud(): SolicitudDesarrollo {
    return {
      objetivo: '',
      solicitante: this.datosColaborador.nombreCompleto,
      area: '',
      prioridad: 'media',
      estado: 'Pendiente',
      fechaCreacion: new Date(),
      requerimientosFuncionales: [],
      requerimientosNoFuncionales: [],
      cargosImpactados: [],
      correo: this.datosColaborador.correo,
      cargo: this.datosColaborador.cargo,
      sede: this.datosColaborador.sede
    };
  }

  // ============================================================
  // CARGAR SOLICITUDES
  // ============================================================
  cargarSolicitudes(): void {
    console.log('📥 Cargando solicitudes...');
    this.solicitudesService.obtenerTodas().subscribe({
      next: (data: any) => {
        if (data && data.content) {
          this.solicitudes = data.content.map((item: any) => this.mapearSolicitud(item));
          this.solicitudesFiltradas = [...this.solicitudes];
        } else {
          this.solicitudes = [];
          this.solicitudesFiltradas = [];
        }
        console.log('✅ Solicitudes cargadas:', this.solicitudes.length);
      },
      error: (err: any) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.solicitudes = [];
        this.solicitudesFiltradas = [];
      }
    });
  }

  // ============================================================
  // MAPEAR SOLICITUD (ACTUALIZADO CON NUEVOS CAMPOS)
  // ============================================================
  private mapearSolicitud(item: any): SolicitudDesarrollo {
    let tieneImagenes = false;
    let totalReq = 0;

    if (item.totalRequerimientos !== undefined) {
      totalReq = item.totalRequerimientos;
    }

    if (item.requerimientos && item.requerimientos.length > 0) {
      tieneImagenes = item.requerimientos.some((req: any) =>
        req.imagenes && req.imagenes.length > 0
      );
    }

    const areaNombre = this.areaMap[item.areaId] || 'Área no definida';

    // Mapear requerimientos
    const reqFuncionales: RequerimientoItem[] = [];
    const reqNoFuncionales: RequerimientoItem[] = [];

    if (item.requerimientos && Array.isArray(item.requerimientos)) {
      item.requerimientos.forEach((req: any) => {
        const reqMapped: RequerimientoItem = {
          id: req.id ? String(req.id) : '',
          descripcion: req.objetivo || req.detalle || 'Sin descripción',
          detalle: req.detalle || '',
          cargoImpactado: req.cargoImpactado || '',
          archivos: req.imagenes || []
        };

        if (req.tipoRequerimiento === 0) {
          reqMapped.id = reqMapped.id || `RF_${reqFuncionales.length + 1}`;
          reqFuncionales.push(reqMapped);
        } else if (req.tipoRequerimiento === 1) {
          reqMapped.id = reqMapped.id || `RNF_${reqNoFuncionales.length + 1}`;
          reqNoFuncionales.push(reqMapped);
        }
      });
    }

    // Obtener proceso y vicepresidencia
    const procesoNombre = item.proceso?.nombre || item.procesoNombre || 'No especificado';
    const vicepresidenciaNombre = item.macroproceso?.nombre || item.vicepresidenciaNombre || 'No especificada';

    return {
      id: item.id,
      numeroSolicitud: item.codigo,
      objetivo: item.solicitudProceso || 'Sin nombre',
      solicitante: item.empleadoNombre || 'Desconocido',
      area: areaNombre,
      estado: item.estado?.nombre || 'Pendiente',
      tipo: item.tipoSolicitud?.nombre || 'N/A',
      fechaCreacion: new Date(item.fechaCreacion),
      prioridad: 'media',
      coordinador: 'Coordinador Asignado',
      funcionalAsignado: 'Funcional Asignado',
      totalRequerimientos: totalReq,
      tieneImagenes: tieneImagenes,
      observaciones: item.observaciones || '',
      requerimientosFuncionales: reqFuncionales,
      requerimientosNoFuncionales: reqNoFuncionales,
      // NUEVOS CAMPOS
      proceso: procesoNombre,
      vicepresidencia: vicepresidenciaNombre,
      correo: item.empleadoCorreo || 'No registrado',
      cargo: item.empleadoCargo || 'No registrado',
      sede: item.empleadoSede || 'No registrada'
    };
  }

  // ============================================================
  // FILTROS
  // ============================================================
  filtrarSolicitudes(texto: string): void {
    if (!texto || texto.trim() === '') {
      this.solicitudesFiltradas = [...this.solicitudes];
      return;
    }
    const term = texto.toLowerCase().trim();
    this.solicitudesFiltradas = this.solicitudes.filter(s =>
      s.objetivo.toLowerCase().includes(term) ||
      s.numeroSolicitud?.toLowerCase().includes(term) ||
      s.solicitante.toLowerCase().includes(term)
    );
  }

  filtrarPorEstado(estado: string): void {
    if (!estado || estado === '') {
      this.solicitudesFiltradas = [...this.solicitudes];
      return;
    }
    this.solicitudesFiltradas = this.solicitudes.filter(s => s.estado === estado);
  }

  // ============================================================
  // ACCIONES DE BANDEJA
  // ============================================================
  verDetalle(solicitud: SolicitudDesarrollo): void {
    this.solicitudSeleccionada = solicitud;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.solicitudSeleccionada = null;
  }

  editarSolicitud(solicitud: SolicitudDesarrollo): void {
    console.log('✏️ Editar solicitud:', solicitud.numeroSolicitud);
  }

  eliminarSolicitud(solicitud: SolicitudDesarrollo): void {
    if (confirm(`¿Está seguro que desea eliminar la solicitud ${solicitud.numeroSolicitud}?`)) {
      if (solicitud.id) {
        this.solicitudesService.eliminar(solicitud.id).subscribe({
          next: () => {
            console.log('✅ Solicitud eliminada');
            this.cargarSolicitudes();
          },
          error: (err) => console.error('❌ Error al eliminar:', err)
        });
      }
    }
  }

  cambiarEstadoSolicitud(solicitud: SolicitudDesarrollo): void {
    console.log('🔄 Cambiar estado de:', solicitud.numeroSolicitud);
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================
  mostrarPrincipal(): void {
    this.vistaActual = 'principal';
  }

  mostrarNuevaSolicitud(): void {
    this.solicitudActual = this.inicializarNuevaSolicitud();
    this.vistaActual = 'wizard';
    this.pasoActivo = 0;
    this.impactoTexto = '';
    this.errorImpacto = false;
    this.formGeneral = {
      solicitudProceso: '',
      proceso: '',
      area: '',
      vicepresidencia: '',
      tipoSolicitud: '',
      observacion: ''
    };
    this.erroresGeneral = {
      proceso: false,
      area: false,
      vicepresidencia: false,
      tipoSolicitud: false,
      solicitudProceso: false
    };
    this.archivoAdjuntoTemporal = null;
  }

  mostrarBandeja(): void {
    this.vistaActual = 'bandeja';
    this.cargarSolicitudes();
  }

  volverPrincipal(): void {
    this.vistaActual = 'principal';
  }

  irAtras(): void {
    window.history.back();
  }

  // ============================================================
  // NAVEGACIÓN ENTRE PASOS DEL WIZARD
  // ============================================================
  irPaso(paso: number): void {
    if (paso <= this.pasoActivo) {
      this.pasoActivo = paso;
      return;
    }

    switch (this.pasoActivo) {
      case 1:
        if (!this.validarPasoGeneral()) {
          this.mostrarErroresGeneral();
          return;
        }
        break;
      case 2:
        if (!this.validarImpacto()) {
          this.errorImpacto = true;
          return;
        }
        break;
      case 3:
        if (!this.validarRequerimientosFuncionales()) {
          alert('⚠️ Debe agregar al menos un requerimiento funcional.');
          return;
        }
        break;
      case 4:
        if (!this.validarRequerimientosNoFuncionales()) {
          alert('⚠️ Debe agregar al menos un requerimiento no funcional.');
          return;
        }
        break;
    }

    this.pasoActivo = paso;
  }

  avanzarDesdeColaborador(): void {
    this.pasoActivo = 1;
  }

  avanzarDesdeGeneral(): void {
    if (this.validarPasoGeneral()) {
      this.pasoActivo = 2;
    } else {
      this.mostrarErroresGeneral();
    }
  }

  avanzarDesdeImpacto(): void {
    if (this.validarImpacto()) {
      this.pasoActivo = 3;
    } else {
      this.errorImpacto = true;
    }
  }

  // ============================================================
  // VALIDACIONES
  // ============================================================
  private validarPasoGeneral(): boolean {
    this.erroresGeneral = {
      proceso: !this.formGeneral.proceso || this.formGeneral.proceso === '',
      area: !this.formGeneral.area || this.formGeneral.area === '',
      vicepresidencia: !this.formGeneral.vicepresidencia || this.formGeneral.vicepresidencia === '',
      tipoSolicitud: !this.formGeneral.tipoSolicitud || this.formGeneral.tipoSolicitud === '',
      solicitudProceso: !this.formGeneral.solicitudProceso || this.formGeneral.solicitudProceso.trim() === ''
    };
    return !Object.values(this.erroresGeneral).some((error) => error);
  }

  private mostrarErroresGeneral(): void {
    let mensaje = '⚠️ Por favor complete los siguientes campos:\n';
    if (this.erroresGeneral.solicitudProceso) mensaje += '• Solicitud del proceso\n';
    if (this.erroresGeneral.proceso) mensaje += '• Proceso solicitante\n';
    if (this.erroresGeneral.area) mensaje += '• Área\n';
    if (this.erroresGeneral.vicepresidencia) mensaje += '• Vicepresidencia\n';
    if (this.erroresGeneral.tipoSolicitud) mensaje += '• Tipo de solicitud\n';
    alert(mensaje);
  }

  private validarImpacto(): boolean {
    if (!this.impactoTexto || this.impactoTexto.trim().length < 10) {
      this.errorImpacto = true;
      return false;
    }
    this.errorImpacto = false;
    return true;
  }

  private validarRequerimientosFuncionales(): boolean {
    const lista = this.solicitudActual.requerimientosFuncionales || [];
    return lista.length > 0;
  }

  private validarRequerimientosNoFuncionales(): boolean {
    const lista = this.solicitudActual.requerimientosNoFuncionales || [];
    return lista.length > 0;
  }

  // ============================================================
  // MÉTODOS DE MAPEO DE IDs
  // ============================================================
  private mapearProcesoId(procesoNombre: string): number {
    const map: { [key: string]: number } = {
      'Desarrollo Tecnológico': 1,
      'Gestión Documental': 2,
      'Contabilidad': 3,
      'Talento Humano': 4
    };
    return map[procesoNombre] || 1;
  }

  private mapearAreaId(areaNombre: string): number {
    const map: { [key: string]: number } = {
      'Transformación Digital': 1,
      'Servicios de salud financiera': 2,
      'Gestión Documental': 3,
      'Talento Humano': 4,
      'Desarrollo Organizacional': 5
    };
    return map[areaNombre] || 1;
  }

  private mapearMacroprocesoId(vicepresidenciaNombre: string): number {
    const map: { [key: string]: number } = {
      'Vicepresidencia de Salud': 1,
      'Vicepresidencia Administrativa': 2,
      'Vicepresidencia Financiera': 3
    };
    return map[vicepresidenciaNombre] || 1;
  }

  // ============================================================
  // MÉTODOS DEL WIZARD
  // ============================================================
  padNumber(num: number): string {
    return String(num).padStart(2, '0');
  }

  seleccionarArchivo(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoAdjuntoTemporal = {
        nombre: file.name,
        tipo: file.type,
        size: file.size,
        archivo: file
      };
    }
  }

  // ============================================================
  // AGREGAR REQUERIMIENTO
  // ============================================================
  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string, cargo?: string, detalle?: string): void {
    if (!descripcion || descripcion.trim() === '') {
      alert('⚠️ Por favor ingrese una descripción para el requerimiento.');
      return;
    }

    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    const numero = lista.length + 1;
    const id = `${prefijo}_${this.padNumber(numero)}`;

    const nuevoReq: RequerimientoItem = {
      id: id,
      descripcion: descripcion.trim(),
      detalle: detalle?.trim() || '',
      cargoImpactado: cargo || '',
      archivos: this.archivoAdjuntoTemporal ? [{ ...this.archivoAdjuntoTemporal }] : []
    };

    if (tipo === 'funcional') {
      if (!this.solicitudActual.requerimientosFuncionales) {
        this.solicitudActual.requerimientosFuncionales = [];
      }
      this.solicitudActual.requerimientosFuncionales.push(nuevoReq);
    } else {
      if (!this.solicitudActual.requerimientosNoFuncionales) {
        this.solicitudActual.requerimientosNoFuncionales = [];
      }
      this.solicitudActual.requerimientosNoFuncionales.push(nuevoReq);
    }

    this.archivoAdjuntoTemporal = null;
  }

  verAdjunto(req: RequerimientoItem): void {
    if (!req.archivos || req.archivos.length === 0) {
      alert('Este requerimiento no tiene archivos adjuntos.');
      return;
    }
    const archivo = req.archivos[0];
    if (archivo.url) {
      window.open(archivo.url, '_blank');
    } else if (archivo.base64) {
      const byteCharacters = atob(archivo.base64.split(',')[1] || archivo.base64);
      const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: archivo.tipo || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else {
      alert('No se puede abrir el archivo. Intente descargándolo nuevamente.');
    }
  }

  // ============================================================
  // ELIMINAR REQUERIMIENTO
  // ============================================================
  confirmarEliminarRequerimiento(tipo: 'funcional' | 'noFuncional', index: number): void {
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    if (index >= 0 && index < lista.length) {
      this.requerimientoAEliminar = {
        id: lista[index].id,
        index: index,
        tipo: tipo
      };
      this.mostrarModalEliminar = true;
    }
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.requerimientoAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.requerimientoAEliminar) return;

    const { tipo, index } = this.requerimientoAEliminar;
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    lista.splice(index, 1);

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    lista.forEach((req: RequerimientoItem, i: number) => {
      req.id = `${prefijo}_${this.padNumber(i + 1)}`;
    });

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = lista;
    } else {
      this.solicitudActual.requerimientosNoFuncionales = lista;
    }

    this.mostrarModalEliminar = false;
    this.requerimientoAEliminar = null;
  }

  // ============================================================
  // GUARDAR SOLICITUD
  // ============================================================
  // ============================================================
// GUARDAR SOLICITUD (CORREGIDO)
// ============================================================
guardarSolicitud(): void {
  console.log('🔍 Iniciando guardado de solicitud...');
  
  // Validar paso general
  if (!this.validarPasoGeneral()) {
    this.mostrarErroresGeneral();
    return;
  }

  // Validar impacto
  if (!this.validarImpacto()) {
    this.errorImpacto = true;
    alert('⚠️ Debe describir el impacto (mínimo 10 caracteres).');
    this.pasoActivo = 2;
    return;
  }

  // Validar requerimientos funcionales
  if (!this.validarRequerimientosFuncionales()) {
    alert('⚠️ Debe agregar al menos un requerimiento funcional.');
    this.pasoActivo = 3;
    return;
  }

  // Validar requerimientos no funcionales
  if (!this.validarRequerimientosNoFuncionales()) {
    alert('⚠️ Debe agregar al menos un requerimiento no funcional.');
    this.pasoActivo = 4;
    return;
  }

  // Mapear IDs
  const procesoId = this.mapearProcesoId(this.formGeneral.proceso);
  const areaId = this.mapearAreaId(this.formGeneral.area);
  const macroprocesoId = this.mapearMacroprocesoId(this.formGeneral.vicepresidencia);
  const tipoSolicitudId = this.formGeneral.tipoSolicitud === 'Proyecto' ? 1 : 2;

  // Validar IDs
  if (procesoId <= 0 || areaId <= 0 || macroprocesoId <= 0) {
    console.error('❌ IDs inválidos:', { procesoId, areaId, macroprocesoId });
    alert('Por favor selecciona valores válidos para proceso, área y vicepresidencia.');
    return;
  }

  // Construir payload
  const payload = {
    empleadoDocumento: '123456789',
    empleadoNombre: this.datosColaborador.nombreCompleto || 'Usuario',
    empleadoCorreo: this.datosColaborador.correo || 'usuario@asmetsalud.com',
    empleadoCargo: this.datosColaborador.cargo || 'Colaborador',
    empleadoSede: this.datosColaborador.sede || 'Sede Principal',
    solicitudProceso: this.formGeneral.solicitudProceso || this.solicitudActual.objetivo,
    procesoId: procesoId,
    areaId: areaId,
    macroprocesoId: macroprocesoId,
    tipoSolicitudId: tipoSolicitudId,
    estadoId: 2,
    observaciones: this.formGeneral.observacion || '',
    impacto: this.impactoTexto,
    requerimientos: [
      ...(this.solicitudActual.requerimientosFuncionales || []).map((req: RequerimientoItem) => ({
        tipoRequerimiento: 0,
        objetivo: req.descripcion,
        detalle: req.descripcion
      })),
      ...(this.solicitudActual.requerimientosNoFuncionales || []).map((req: RequerimientoItem) => ({
        tipoRequerimiento: 1,
        objetivo: req.descripcion,
        detalle: req.descripcion
      }))
    ]
  };

  console.log('📤 Enviando solicitud:', payload);

  // Mostrar loading
  const loadingMsg = '⏳ Enviando solicitud...';
  console.log(loadingMsg);

  // Enviar solicitud
  this.solicitudesService.crearSolicitud(payload).subscribe({
    next: (response: any) => {
      console.log('✅ Solicitud creada exitosamente:', response);
      
      // Asignar número de solicitud
      this.numeroSolicitudExito = response.codigo || `SD_${String(this.solicitudes.length + 1).padStart(3, '0')}`;
      
      // Mostrar modal de éxito
      this.mostrarModalExito = true;
      console.log('✅ Modal de éxito mostrado');
      
      // Recargar solicitudes
      this.cargarSolicitudes();
    },
    error: (err: any) => {
      console.error('❌ Error al crear solicitud:', err);
      
      // Mostrar detalles del error
      let errorMsg = 'Error al guardar la solicitud.';
      if (err.error) {
        console.error('📋 Detalles del error:', err.error);
        if (err.error.errors) {
          console.error('📋 Errores de validación:');
          Object.keys(err.error.errors).forEach(key => {
            console.error(`  ${key}: ${err.error.errors[key]}`);
          });
          errorMsg = Object.values(err.error.errors).join('\n');
        } else if (err.error.message) {
          errorMsg = err.error.message;
        }
      }
      
      // Mostrar error
      alert(`❌ ${errorMsg}`);
      
      // Asignar número temporal
      this.numeroSolicitudExito = `SD_${String(this.solicitudes.length + 1).padStart(3, '0')}`;
      
      // Mostrar modal de éxito aunque haya error (para no perder el progreso)
      this.mostrarModalExito = true;
      
      // Recargar solicitudes
      this.cargarSolicitudes();
    }
  });
}

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.volverPrincipal();
  }

  // ============================================================
  // BANDEJA (MODALES)
  // ============================================================
  abrirModalInf(solicitud: SolicitudDesarrollo): void {
    this.solicitudSeleccionada = solicitud;
    this.observacionesModal = '';
    this.mostrarModalInf = true;
  }

  cerrarModalInf(): void {
    this.mostrarModalInf = false;
    this.solicitudSeleccionada = null;
    this.observacionesModal = '';
  }

  guardarObservaciones(): void {
    if (this.solicitudSeleccionada && this.observacionesModal) {
      console.log('📝 Guardando observaciones para:', this.solicitudSeleccionada.numeroSolicitud);
      console.log('📝 Observaciones:', this.observacionesModal);
    }
    this.cerrarModalInf();
  }

  // ============================================================
  // PDF - GENERAR Y DESCARGAR (COMPLETO Y CORREGIDO)
  // ============================================================
  descargarSolicitudPDF(solicitud: SolicitudDesarrollo): void {
    try {
      console.log('📄 Generando PDF para:', solicitud.numeroSolicitud);
      console.log('📄 Datos de la solicitud:', solicitud);

      const doc = new jsPDF();

      // ============================================================
      // ENCABEZADO PRINCIPAL
      // ============================================================
      doc.setFillColor(59, 175, 182);
      doc.rect(0, 0, 210, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ASMET SALUD - REQUERIMIENTO DE DESARROLLO', 10, 16);

      // Fecha y número de solicitud
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let fechaStr = 'No registrada';
      if (solicitud.fechaCreacion) {
        const fechaObj = new Date(solicitud.fechaCreacion);
        if (!isNaN(fechaObj.getTime())) {
          fechaStr = fechaObj.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
      const headerRight = `Solicitud: ${solicitud.numeroSolicitud || 'N/A'}  |  Fecha: ${fechaStr}`;
      doc.text(headerRight, 200, 16, { align: 'right' });

      let yPos = 30;

      // ============================================================
      // TABLA 1: INFORMACIÓN DEL COLABORADOR (DATOS REALES)
      // ============================================================
      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['INFORMACIÓN DEL COLABORADOR', '']],
        body: [
          [`Nombre: ${solicitud.solicitante || 'No registrado'}`, `Correo: ${solicitud.correo || 'No registrado'}`],
          [`Cargo: ${solicitud.cargo || 'No registrado'}`, `Sede: ${solicitud.sede || 'No registrada'}`]
        ],
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });
      yPos += 5;

      // ============================================================
      // TABLA 2: INFORMACIÓN DE LA SOLICITUD (DATOS REALES)
      // ============================================================
      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['INFORMACIÓN DE LA SOLICITUD', '']],
        body: [
          [`Proceso Solicitante: ${solicitud.proceso || 'No especificado'}`, `Área: ${solicitud.area || 'No especificada'}`],
          [`Vicepresidencia: ${solicitud.vicepresidencia || 'No especificada'}`, `Tipo de Solicitud: ${solicitud.tipo || 'No especificada'}`],
          [`Prioridad: ${solicitud.prioridad || 'No especificada'}`, `Estado: ${solicitud.estado || 'Pendiente'}`],
          [`Coordinador: ${solicitud.coordinador || 'No asignado'}`, `Funcional Asignado: ${solicitud.funcionalAsignado || 'No asignado'}`]
        ],
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });
      yPos += 5;

      // ============================================================
      // TABLA 3: IMPACTO DEL REQUERIMIENTO
      // ============================================================
      const impactoTexto = solicitud.observaciones && solicitud.observaciones.trim() !== '' 
        ? solicitud.observaciones 
        : 'No se especificó impacto.';

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['IMPACTO DEL REQUERIMIENTO']],
        body: [[impactoTexto]],
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });
      yPos += 5;

      // ============================================================
      // TABLA 4: REQUERIMIENTOS FUNCIONALES (CON DETALLES REALES)
      // ============================================================
      const reqFuncionales = (solicitud.requerimientosFuncionales || []).map((r: any) => [
        r.id || 'N/A',
        `Objetivo: ${r.descripcion || 'Sin descripción'}\nCargo Impactado: ${r.cargoImpactado || 'No especificado'}`,
        `Detalle: ${r.detalle || 'Sin detalles'}`
      ]);

      if (reqFuncionales.length === 0) {
        reqFuncionales.push(['N/A', 'No hay requerimientos funcionales registrados.', '']);
      }

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 10, textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [200, 200, 200] },
        headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [
          [{ content: 'REQUERIMIENTOS FUNCIONALES', colSpan: 3, styles: { fillColor: [240, 240, 240], lineWidth: 0 } }],
          ['ID', 'Objetivo / Cargo Impactado', 'Detalles']
        ],
        body: reqFuncionales,
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });
      yPos += 5;

      // ============================================================
      // TABLA 5: REQUERIMIENTOS NO FUNCIONALES (CON DETALLES REALES)
      // ============================================================
      const reqNoFuncionales = (solicitud.requerimientosNoFuncionales || []).map((r: any) => [
        r.id || 'N/A',
        `Objetivo: ${r.descripcion || 'Sin descripción'}\nCargo Impactado: ${r.cargoImpactado || 'No especificado'}`,
        `Detalle: ${r.detalle || 'Sin detalles'}`
      ]);

      if (reqNoFuncionales.length === 0) {
        reqNoFuncionales.push(['N/A', 'No hay requerimientos no funcionales registrados.', '']);
      }

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 10, textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [200, 200, 200] },
        headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [
          [{ content: 'REQUERIMIENTOS NO FUNCIONALES', colSpan: 3, styles: { fillColor: [240, 240, 240], lineWidth: 0 } }],
          ['ID', 'Objetivo / Cargo Impactado', 'Detalles']
        ],
        body: reqNoFuncionales,
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });
      yPos += 5;

      // ============================================================
      // TABLA 6: REQUISITOS DE SEGURIDAD
      // ============================================================
      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 9, textColor: [80, 80, 80] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 10 },
        head: [['REQUISITOS DE SEGURIDAD']],
        body: [[
          `• Autentificación adecuada y control de accesos.\n` +
          `• No uso de campos ocultos para información sensible.\n` +
          `• Comprobación y validación de las entradas.\n` +
          `• Control de límites de valores de salida.\n` +
          `• Asegurar métodos de controles de seguridad privados/finales.\n` +
          `• Evitar uso de datos reales de carácter personal en pruebas.`
        ]],
        didDrawPage: (data: any) => { yPos = data.cursor?.y || yPos; }
      });

      // ============================================================
      // GUARDAR PDF
      // ============================================================
      const nombreArchivo = `Solicitud_Desarrollo_${solicitud.numeroSolicitud || new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
      
      console.log('✅ PDF generado exitosamente:', nombreArchivo);

    } catch (error) {
      console.error('❌ E rror al generar PDF:', error);
      alert('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
    }
  }

  esCandadoAbierto(solicitud: SolicitudDesarrollo): boolean {
    return solicitud.estado === 'En documentación' || solicitud.estado === 'Pendiente';
  }
}