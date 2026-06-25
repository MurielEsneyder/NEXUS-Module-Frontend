import { Component, OnInit } from '@angular/core';
import { SolicitudesDesarrolloService } from '../../services/solicitudes-desarrollo.service';

// ============================================================
// INTERFACES
// ============================================================
export interface RequerimientoItem {
  id: string;
  descripcion: string;
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
  // DATOS DEL COLABORADOR (QUEMADOS PARA PRUEBAS)
  // ============================================================
  datosColaborador = {
    nombreCompleto: 'Julian Calambas',
    correo: 'julian.calambas@asmetsalud.com',
    cargo: 'Desarrollador Senior',
    sede: 'Bogotá'
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
    tipoSolicitud: false
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
    'Pendiente',
    'Borrador',
    'Enviada',
    'En documentación',
    'En pruebas funcionales',
    'En desarrollo',
    'En pruebas de aceptación',
    'Cerrada',
    'Rechazada'
  ];

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor(private solicitudesService: SolicitudesDesarrolloService) {}

  // ============================================================
  // NG ON INIT
  // ============================================================
  ngOnInit(): void {
    this.solicitudActual = this.inicializarNuevaSolicitud();
    this.cargarSolicitudes();
    console.log('✅ Componente inicializado con datos del colaborador:', this.datosColaborador);
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
      cargosImpactados: []
    };
  }

  // ============================================================
  // CARGAR SOLICITUDES DESDE EL BACKEND
  // ============================================================
  cargarSolicitudes(): void {
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

  private mapearSolicitud(item: any): SolicitudDesarrollo {
    let tieneImagenes = false;
    let totalReq = 0;
    let observaciones = '';

    if (item.requerimientos && item.requerimientos.length > 0) {
      totalReq = item.requerimientos.length;
      tieneImagenes = item.requerimientos.some((req: any) =>
        req.imagenes && req.imagenes.length > 0
      );
    }

    if (item.observaciones) {
      observaciones = item.observaciones;
    }

    return {
      id: item.id,
      numeroSolicitud: item.codigo,
      objetivo: item.solicitudProceso || 'Sin nombre',
      solicitante: item.empleadoNombre || 'Desconocido',
      area: item.areaId?.toString() || 'N/A',
      estado: item.estado?.nombre || 'Pendiente',
      tipo: item.tipoSolicitud?.nombre || 'N/A',
      fechaCreacion: new Date(item.fechaCreacion),
      prioridad: 'media',
      coordinador: 'Coordinador Asignado',
      funcionalAsignado: 'Funcional Asignado',
      totalRequerimientos: totalReq,
      tieneImagenes: tieneImagenes,
      observaciones: observaciones
    };
  }

  // ============================================================
  // FILTROS DE BANDEJA
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
    // Aquí puedes implementar la edición
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
    // Aquí puedes implementar el cambio de estado
  }

  // ============================================================
  // NAVEGACIÓN ENTRE VISTAS
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
      tipoSolicitud: false
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

  // ============================================================
  // NAVEGACIÓN ENTRE PASOS DEL WIZARD
  // ============================================================
  irPaso(paso: number): void {
    if (paso > this.pasoActivo) {
      switch (this.pasoActivo) {
        case 1:
          if (!this.validarPasoGeneral()) return;
          break;
        case 2:
          if (!this.validarImpacto()) return;
          break;
      }
    }
    this.pasoActivo = paso;
  }

  avanzarDesdeColaborador(): void {
    this.pasoActivo = 1;
  }

  avanzarDesdeGeneral(): void {
    if (this.validarPasoGeneral()) {
      this.pasoActivo = 2;
    }
  }

  avanzarDesdeImpacto(): void {
    if (this.validarImpacto()) {
      this.pasoActivo = 3;
    }
  }

  // ============================================================
  // VALIDACIONES
  // ============================================================
  private validarPasoGeneral(): boolean {
    this.erroresGeneral = {
      proceso: !this.formGeneral.proceso,
      area: !this.formGeneral.area,
      vicepresidencia: !this.formGeneral.vicepresidencia,
      tipoSolicitud: !this.formGeneral.tipoSolicitud
    };
    return !Object.values(this.erroresGeneral).some((error) => error);
  }

  private validarImpacto(): boolean {
    if (!this.impactoTexto || this.impactoTexto.trim().length < 10) {
      this.errorImpacto = true;
      return false;
    }
    this.errorImpacto = false;
    return true;
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

  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string): void {
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    const numero = lista.length + 1;
    const id = `${prefijo}_${this.padNumber(numero)}`;

    const nuevoReq: RequerimientoItem = {
      id: id,
      descripcion: descripcion || `Requerimiento ${numero}`,
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
  guardarSolicitud(): void {
    if (!this.validarPasoGeneral() || !this.validarImpacto()) {
      return;
    }

    const procesoId = this.mapearProcesoId(this.formGeneral.proceso);
    const areaId = this.mapearAreaId(this.formGeneral.area);
    const macroprocesoId = this.mapearMacroprocesoId(this.formGeneral.vicepresidencia);
    const tipoSolicitudId = this.formGeneral.tipoSolicitud === 'Proyecto' ? 1 : 2;

    if (procesoId <= 0 || areaId <= 0 || macroprocesoId <= 0) {
      console.error('❌ IDs inválidos:', { procesoId, areaId, macroprocesoId });
      alert('Por favor selecciona valores válidos para proceso, área y vicepresidencia.');
      return;
    }

    const payload = {
      empleadoDocumento: '123456789',
      empleadoNombre: this.datosColaborador.nombreCompleto,
      empleadoCorreo: this.datosColaborador.correo,
      empleadoCargo: this.datosColaborador.cargo,
      empleadoSede: this.datosColaborador.sede,
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

    this.solicitudesService.crearSolicitud(payload).subscribe({
      next: (response: any) => {
        console.log('✅ Solicitud creada:', response);
        this.numeroSolicitudExito = response.codigo || 'SD_001';
        this.mostrarModalExito = true;
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        console.error('❌ Error al crear solicitud:', err);
        if (err.error) {
          console.error('📋 Detalles del error:', err.error);
          if (err.error.errors) {
            console.error('📋 Errores de validación:');
            Object.keys(err.error.errors).forEach(key => {
              console.error(`  ${key}: ${err.error.errors[key]}`);
            });
          }
        }
        this.numeroSolicitudExito = 'SD_' + String(this.solicitudes.length + 1).padStart(3, '0');
        this.mostrarModalExito = true;
        this.cargarSolicitudes();
      }
    });
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.volverPrincipal();
  }

  // ============================================================
  // MÉTODOS DE BANDEJA (MODALES)
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

  descargarSolicitudPDF(solicitud: SolicitudDesarrollo): void {
    console.log('📄 Descargando PDF para:', solicitud.numeroSolicitud);
  }

  esCandadoAbierto(solicitud: SolicitudDesarrollo): boolean {
    return solicitud.estado === 'En documentación' || solicitud.estado === 'Pendiente';
  }
}