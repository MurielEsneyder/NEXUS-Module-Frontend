// solicitudes-desarrollo.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SolicitudesDesarrolloService } from '../../services/solicitudes-desarrollo.service';
import { NexusSecurityService } from '../../../shared/services/nexus-security.service';
import { NexusMenuService } from '../../../shared/services/nexus-menu.service';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable no tiene tipos
import autoTable from 'jspdf-autotable';
import { Area, Proceso, Vicepresidencia, Cargo } from '../../models/solicitudes-desarrollo.models';

// ============================================================
// INTERFACES
// ============================================================
export interface RequerimientoItem {
  id: string;
  dbId?: number;
  codigo?: string;
  descripcion: string;
  detalle?: string;
  cargoImpactado?: string;
  archivos?: any[];
  tieneImagen?: boolean;
  imagenesUrls?: { url: string, orden: number }[];
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
  impacto?: string;
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
export class SolicitudesDesarrolloComponent implements OnInit, OnDestroy {

  // ============================================================
  // VARIABLES DE ESTADO Y ROLES
  // ============================================================
  esColaborador = false;    
  esAdministrador = false;

  vistaActual: string = 'principal';
  pasoActivo = 0;
  mostrarModalInf = false;
  mostrarModalEliminar = false;
  mostrarModalEliminarSolicitud = false;
  mostrarModalExito = false;
  mostrarModalDetalle = false;
  mostrarModalRequerimiento = false;
  puedeEditarDetalle = true;
  numeroSolicitudExito = '';
  observacionesModal = '';
  impactoTexto = '';
  errorImpacto = false;
  archivosAdjuntosTemporales: any[] = [];
  mostrarModalCambioEstado = false;
  nuevoEstadoSeleccionadoId: number | null = null;
  observacionCambioEstado = '';
  estadosList: any[] = [];
  prioridadesList: any[] = [];

  // Límite máximo de imágenes por requerimiento
  public readonly MAX_IMAGENES_POR_REQ = 4;

  // VARIABLES PARA EDICIÓN EN MODAL
  modoEdicion = false;
  estadoEditado = '';
  prioridadEditada = 'media';
  guardandoCambios = false;
  cargandoDetalleModal = false;

  // ============================================================
  // DATOS
  // ============================================================
  solicitudes: SolicitudDesarrollo[] = [];
  solicitudesFiltradas: SolicitudDesarrollo[] = [];
  solicitudActual!: SolicitudDesarrollo;
  solicitudSeleccionada: SolicitudDesarrollo | null = null;
  requerimientoAEliminar: { id: string; index: number; tipo: 'funcional' | 'noFuncional' } | null = null;
  solicitudAEliminar: SolicitudDesarrollo | null = null;
  requerimientoSeleccionadoModal: RequerimientoItem | null = null;
  requerimientoSeleccionadoTipo: 'funcional' | 'noFuncional' = 'funcional';
  requerimientoSeleccionadoIndex: number = -1;
  modoEdicionReq = false;
  mensajeErrorRequerimiento = '';
  nuevaUrlImagenModal = '';

  // ============================================================
  // VARIABLES PARA CARGA MEJORADA
  // ============================================================
  cargandoSolicitudes: boolean = false;
  totalSolicitudesBD: number = 0;
  solicitudesCargadas: number = 0;
  errorCargandoSolicitudes: boolean = false;
  todasCargadas: boolean = false;
  guardando: boolean = false;
  private PAGE_SIZE = 20;
  private paginaActual = 0;
  private totalPaginas = 0;

  // ============================================================
  // VARIABLES PARA HISTORIAL Y MIS SOLICITUDES
  // ============================================================
  historialCambios: any[] = [];
  cargandoHistorial: boolean = false;
  mostrarModalHistorial: boolean = false;
  misSolicitudes: SolicitudDesarrollo[] = [];
  cargandoMisSolicitudes: boolean = false;
  totalMisSolicitudesBD: number = 0;

  // ============================================================
  // DATOS DEL COLABORADOR
  // ============================================================
  datosColaborador = {
    nombreCompleto: 'Cargando...',
    correo: 'Cargando...',
    cargo: 'Cargando...',
    sede: 'Cargando...',
    documento: '',
    idPersona: null as number | null,
    codUser: ''
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
    prioridad: 'media',
    observacion: ''
  };

  erroresGeneral = {
    proceso: false,
    area: false,
    vicepresidencia: false,
    tipoSolicitud: false,
    solicitudProceso: false,
    prioridad: false
  };

  // ============================================================
  // LISTAS DE OPCIONES (CATÁLOGOS)
  // Los que tienen endpoint se cargan del backend; los demás son estáticos
  // ============================================================

  // Estáticos (sin endpoint en el backend) - ACTUALIZADO: Ya no son estáticos
  procesosSolicitante: Proceso[] = [];

  areas: Area[] = [];

  vicepresidencias: Vicepresidencia[] = [];

  cargosArray: Cargo[] = [];

  // Dinámicos (se cargan del backend, con fallback si el backend no responde)
  tiposSolicitud: any[] = [];
  estadosDisponibles: any[] = [];

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
    private securityService: NexusSecurityService,
    private nexusMenuService: NexusMenuService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  getEstadoVisual(estado?: string): string {
    const valor = (estado || '').toString().trim().toLowerCase();

    if (!valor) {
      return 'Pendiente';
    }

    if (valor.includes('borr') || valor.includes('pend')) {
      return 'Pendiente';
    }

    if (valor.includes('envi')) {
      return 'Enviada';
    }

    if (valor.includes('doc')) {
      return 'En documentación';
    }

    if (valor === 'en pruebas') {
      return 'En Pruebas';
    }

    if (valor.includes('funcional')) {
      return 'En pruebas funcionales';
    }

    if (valor.includes('desarrollo')) {
      return 'En desarrollo';
    }

    if (valor.includes('acept')) {
      return 'En pruebas de aceptación';
    }

    if (valor.includes('cerr') || valor === 'realizada') {
      return 'Realizada';
    }

    if (valor.includes('rech')) {
      return 'Rechazada';
    }

    return estado || 'Pendiente';
  }

  // ============================================================
  // ROLES
  // ============================================================
  ngOnInit(): void {
    // Cerrar automáticamente el menú lateral al ingresar al módulo
    this.nexusMenuService.closeMenu();
    this.verificarRoles();
    this.obtenerDatosColaborador();
    window.addEventListener('popstate', this.manejarPopState);
  }

  private verificarRoles(): void {
    // Verificamos si el token tiene los roles requeridos
    this.esAdministrador = this.securityService.hasRole('si_administrador_nivel_1') || this.securityService.isAuthorizedPath(['si_administrador_nivel_1']);
    this.esColaborador = this.securityService.hasRole('si_colaborador_solicitud_nivel_0') || this.securityService.isAuthorizedPath(['si_colaborador_solicitud_nivel_0']);
    
    // Si no tiene ningún rol detectado (ej. entorno de desarrollo o token diferente), le damos rol básico
    if (!this.esAdministrador && !this.esColaborador) {
      console.warn('⚠️ No se detectaron roles específicos. Asignando rol de colaborador por defecto para visualización.');
      this.esColaborador = true;
    }
    
    console.log('Roles detectados -> Administrador:', this.esAdministrador, 'Colaborador:', this.esColaborador);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.manejarPopState);
  }

  // ============================================================
  // OBTENER DATOS DEL COLABORADOR
  // ============================================================
  private obtenerDatosColaborador(): void {
    console.log('Iniciando obtención de datos del colaborador...');
    let dataLocalLista = false;

    try {
      const afilInfo: any = this.securityService.getAfilInfo();
      if (afilInfo) {
        
        let nombreAjustado = afilInfo.nombreCompleto ? afilInfo.nombreCompleto.trim() : '';
        
        if (!nombreAjustado || nombreAjustado.toLowerCase() === (afilInfo.username || '').toLowerCase() || nombreAjustado === 'undefined') {
            const tokenAux = this.securityService.getLocalToken();
            if (tokenAux && tokenAux.sub && tokenAux.sub.toLowerCase() !== (afilInfo.username || '').toLowerCase()) {
                nombreAjustado = tokenAux.sub;
            } else {
                nombreAjustado = [afilInfo.nombre1, afilInfo.nombre2, afilInfo.apellido1, afilInfo.apellido2]
                  .filter(Boolean)
                  .join(' ')
                  .trim();
            }
            if (!nombreAjustado || nombreAjustado.trim() === '') {
                nombreAjustado = afilInfo.nombre || afilInfo.username || 'Usuario';
            }
        }

        let correoAjustado = afilInfo.email || afilInfo.correo || '';
        if (correoAjustado) {
            correoAjustado = correoAjustado.split('@')[0] + '@asmetsalud.com';
        }

        this.datosColaborador = {
          nombreCompleto: nombreAjustado,
          correo: correoAjustado,
          cargo: afilInfo.cargo || '',
          sede: afilInfo.sede || '',
          documento: afilInfo.nroIdentificacion || '',
          idPersona: afilInfo.idPersona || null,
          codUser: afilInfo.codUser || ''
        };
        console.log('Datos desde sessionStorage:', this.datosColaborador);
        dataLocalLista = true;
      }
    } catch (e) {
      console.warn('Error en getAfilInfo():', e);
    }

    if (!dataLocalLista) {
      try {
        const token = this.securityService.getLocalToken();
        // console.log('🔍 DEBUG - Token extraido:', token);
        if (token && token.sub) {
          let correoToken = token.email || token.sub;
          if (correoToken) {
             correoToken = correoToken.split('@')[0] + '@asmetsalud.com';
          }
          this.datosColaborador = {
            nombreCompleto: token.sub || 'Usuario',
            correo: correoToken,
            cargo: token.cargo || 'Colaborador',
            sede: token.sede || 'Sede Principal',
            documento: '',
            idPersona: null,
            codUser: ''
          };
          console.log('Datos desde el token:', this.datosColaborador);
          dataLocalLista = true;
        }
      } catch (e) {
        console.warn('Error al leer el token:', e);
      }
    }

    if (!dataLocalLista) {
      console.warn('No se pudieron obtener datos del colaborador, usando fallback.');
      this.datosColaborador = {
        nombreCompleto: 'Usuario de Prueba',
        correo: 'usuario@asmetsalud.com',
        cargo: 'Colaborador',
        sede: 'Sede Principal',
        documento: '',
        idPersona: null,
        codUser: ''
      };
    }

    // Doble validación: Si el nombre sigue siendo el username, intentamos forzar la consulta al backend
    const usernameActual = (this.datosColaborador.correo || '').split('@')[0];
    // console.log('🔍 DEBUG - Comparando nombre:', this.datosColaborador.nombreCompleto, 'con username:', usernameActual);
    
    if (this.datosColaborador.nombreCompleto.toLowerCase() === usernameActual.toLowerCase() || this.datosColaborador.nombreCompleto === 'Usuario de Prueba' || this.datosColaborador.nombreCompleto === 'Usuario') {
      console.log('GET /api/colaborador/actual - Obteniendo nombre real del colaborador desde el backend...');
      this.solicitudesService.obtenerColaboradorActual().subscribe({
        next: (res: any) => {
          if (res && res.nombreCompleto) {
            this.datosColaborador.nombreCompleto = res.nombreCompleto;
            if (res.cargo) this.datosColaborador.cargo = res.cargo;
            if (res.sede) this.datosColaborador.sede = res.sede;
            console.log('GET /api/colaborador/actual - Nombre corregido:', this.datosColaborador.nombreCompleto);
          } else {
            console.warn('GET /api/colaborador/actual - Respuesta sin nombreCompleto:', res);
          }
          this.continuarInicializacion();
        },
        error: (err) => {
          console.error('GET /api/colaborador/actual - Error al obtener colaborador:', err);
          this.continuarInicializacion();
        }
      });
    } else {
      this.continuarInicializacion();
    }
  }

  // ============================================================
  // CONTINUAR INICIALIZACIÓN
  // ============================================================
  private continuarInicializacion(): void {
    console.log('Colaborador listo para inicializar:', this.datosColaborador.nombreCompleto);
    this.solicitudActual = this.inicializarNuevaSolicitud();
    this.cargarCatalogos();
    this.cargarSolicitudes();
  }

  // ============================================================
  // CARGAR CATÁLOGOS DESDE EL BACKEND
  // ============================================================
  private cargarCatalogos(): void {
    // Cargar Tipos de Solicitud desde el backend
    this.solicitudesService.obtenerTipos().subscribe({
      next: (tipos: any[]) => {
        this.tiposSolicitud = (tipos && tipos.length > 0) ? tipos : this.getFallbackTipos();
        console.log('GET /api/solicitudes/tipos - Tipos de solicitud cargados:', this.tiposSolicitud.length);
      },
      error: (err: any) => {
        console.warn('GET /api/solicitudes/tipos - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.tiposSolicitud = this.getFallbackTipos();
      }
    });

    // Cargar Áreas
    this.solicitudesService.obtenerAreas().subscribe({
      next: (data) => {
        this.areas = (data && data.length > 0) ? data : this.getFallbackAreas();
        if (this.areas && Array.isArray(this.areas)) {
          this.areas.forEach((a: any) => {
            if (a.id && a.nombre) {
              this.areaMap[a.id] = a.nombre;
            }
          });
        }
      },
      error: (err) => {
        console.warn('GET /api/solicitudes/areas - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.areas = this.getFallbackAreas();
      }
    });

    // Cargar Procesos
    this.solicitudesService.obtenerProcesos().subscribe({
      next: (data) => {
        this.procesosSolicitante = (data && data.length > 0) ? data : this.getFallbackProcesos();
      },
      error: (err) => {
        console.warn('GET /api/solicitudes/procesos - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.procesosSolicitante = this.getFallbackProcesos();
      }
    });

    // Cargar Vicepresidencias
    this.solicitudesService.obtenerVicepresidencias().subscribe({
      next: (data) => {
        this.vicepresidencias = (data && data.length > 0) ? data : this.getFallbackVicepresidencias();
      },
      error: (err) => {
        console.warn('GET /api/solicitudes/vicepresidencias - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.vicepresidencias = this.getFallbackVicepresidencias();
      }
    });

    // Cargar Cargos
    this.solicitudesService.obtenerCargos().subscribe({
      next: (data) => {
        this.cargosArray = (data && data.length > 0) ? data : this.getFallbackCargos();
      },
      error: (err) => {
        console.warn('GET /api/solicitudes/cargos - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.cargosArray = this.getFallbackCargos();
      }
    });

    // Cargar Estados desde el backend
    this.solicitudesService.obtenerEstados().subscribe({
      next: (estados: any[]) => {
        if (estados && estados.length > 0) {
          this.estadosDisponibles = estados;
          this.estadosList = estados;
        } else {
          this.estadosDisponibles = this.getFallbackEstadosList();
          this.estadosList = this.getFallbackEstadosList();
        }
        console.log('GET /api/solicitudes/estados - Estados cargados:', this.estadosDisponibles.length);
      },
      error: (err: any) => {
        console.warn('GET /api/solicitudes/estados - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.estadosDisponibles = this.getFallbackEstadosList();
        this.estadosList = this.getFallbackEstadosList();
      }
    });

    // Cargar Prioridades desde el backend
    this.solicitudesService.obtenerPrioridades().subscribe({
      next: (prioridades: any[]) => {
        this.prioridadesList = (prioridades && prioridades.length > 0) ? prioridades : this.getFallbackPrioridadesList();
        console.log('GET /api/solicitudes/prioridades - Prioridades cargadas:', this.prioridadesList.length);
      },
      error: (err: any) => {
        console.warn('GET /api/solicitudes/prioridades - Backend no disponible (status ' + err.status + '). Usando datos locales.');
        this.prioridadesList = this.getFallbackPrioridadesList();
      }
    });
  }

  private getFallbackPrioridadesList(): any[] {
    return [
      { id: 64, nombre: 'BAJA' },
      { id: 65, nombre: 'MEDIA' },
      { id: 66, nombre: 'ALTA' }
    ];
  }

  private getFallbackTipos(): any[] {
    return [
      { id: 1, codigo: 'PROYECTO', nombre: 'Proyecto' },
      { id: 2, codigo: 'MEJORA', nombre: 'Mejora' }
    ];
  }

  private getFallbackEstadosList(): any[] {
    return [
      { id: 1, codigo: 'BORRADOR', nombre: 'Borrador' },
      { id: 2, codigo: 'ENVIADA', nombre: 'Enviada' },
      { id: 3, codigo: 'EN_DOCUMENTACION', nombre: 'En documentación' },
      { id: 4, codigo: 'EN_PRUEBAS_FUNCIONALES', nombre: 'En pruebas funcionales' },
      { id: 5, codigo: 'EN_DESARROLLO', nombre: 'En desarrollo' },
      { id: 6, codigo: 'EN_PRUEBAS_ACEPTACION', nombre: 'En pruebas de aceptación' },
      { id: 7, codigo: 'CERRADA', nombre: 'Cerrada' },
      { id: 8, codigo: 'RECHAZADA', nombre: 'Rechazada' }
    ];
  }

  private getFallbackAreas(): Area[] {
    return [
      { id: 1, nombre: 'Transformación Digital' },
      { id: 2, nombre: 'Servicios de salud financiera' },
      { id: 3, nombre: 'Gestión Documental' },
      { id: 4, nombre: 'Talento Humano' },
      { id: 5, nombre: 'Desarrollo Organizacional' }
    ];
  }

  private getFallbackProcesos(): Proceso[] {
    return [
      { id: 1, nombre: 'Desarrollo Tecnológico' },
      { id: 2, nombre: 'Gestión Documental' },
      { id: 3, nombre: 'Contabilidad' },
      { id: 4, nombre: 'Talento Humano' }
    ];
  }

  private getFallbackVicepresidencias(): Vicepresidencia[] {
    return [
      { id: 1, nombre: 'Vicepresidencia de Salud' },
      { id: 2, nombre: 'Vicepresidencia Administrativa' },
      { id: 3, nombre: 'Vicepresidencia Financiera' }
    ];
  }

  private getFallbackCargos(): Cargo[] {
    return [
      { id: 1, nombre: 'Profesional jurídico' },
      { id: 2, nombre: 'Profesional funcional' },
      { id: 3, nombre: 'Profesional BIG' },
      { id: 4, nombre: 'Profesional de desarrollo' },
      { id: 5, nombre: 'Líder técnico' }
    ];
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
  // ORDENAR SOLICITUDES POR ID DESCENDENTE (MÁS RECIENTE PRIMERO)
  // ============================================================
  private ordenarSolicitudesPorId(solicitudes: SolicitudDesarrollo[]): SolicitudDesarrollo[] {
    return solicitudes.sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      return idB - idA; // Descendente (mayor a menor - el más reciente primero)
    });
  }

  // ============================================================
  // ACTUALIZAR LISTAS ORDENADAS
  // ============================================================
  private actualizarListasOrdenadas(): void {
    this.solicitudes = this.ordenarSolicitudesPorId([...this.solicitudes]);
    this.solicitudesFiltradas = this.ordenarSolicitudesPorId([...this.solicitudesFiltradas]);
  }

  // ============================================================
  // CARGAR SOLICITUDES - VERSIÓN OPTIMIZADA Y SILENCIOSA
  // ============================================================
  cargarSolicitudes(): void {
    if (this.cargandoSolicitudes) {
      return;
    }

    this.errorCargandoSolicitudes = false;

    // 1. Mostrar caché instantáneamente SIN spinner (evita bloquear la UI)
    //    Pero primero verificamos que la caché no sea muy vieja (> 5 min)
    const cacheEdad = this.getCacheEdadMs();
    const cacheValida = cacheEdad < 5 * 60 * 1000; // 5 minutos
    const cargadoDesdeCache = cacheValida && this.cargarSolicitudesDesdeLocalStorage();
    if (cargadoDesdeCache) {
      this.actualizarListasOrdenadas();
      // Con caché válida: no mostramos spinner, el refresh es silencioso
      this.cargandoSolicitudes = false;
    } else {
      if (!cacheValida) {
        // Limpiar caché vieja para no mostrar datos desactualizados
        localStorage.removeItem('solicitudes_desarrollo_cache');
        localStorage.removeItem('solicitudes_desarrollo_cache_ts');
      }
      // Sin caché: mostrar spinner hasta que llegue el backend
      this.cargandoSolicitudes = true;
    }

    // 2. Refrescar desde backend silenciosamente
    this.solicitudesService.obtenerTodasCompletas().subscribe({
      next: (data: any) => {
        if (data && data.content) {
          const nuevas = data.content.map((item: any) => this.mapearSolicitud(item));
          const ordenadas = this.ordenarSolicitudesPorId(nuevas);
          const hayCambios = this.hayCambiosSignificativos(ordenadas);

          if (hayCambios || !cargadoDesdeCache) {
            this.solicitudes = ordenadas;
            this.solicitudesFiltradas = [...this.solicitudes];
            this.totalSolicitudesBD = data.totalElements || this.solicitudes.length;
            this.solicitudesCargadas = this.solicitudes.length;
            this.todasCargadas = true;
            this.guardarSolicitudesEnCache();
          } else {
            this.totalSolicitudesBD = data.totalElements || this.solicitudes.length;
            this.todasCargadas = true;
          }
        } else if (!cargadoDesdeCache) {
          this.solicitudes = [];
          this.solicitudesFiltradas = [];
          this.totalSolicitudesBD = 0;
        }
        this.cargandoSolicitudes = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('GET /api/solicitudes - Error:', err.message || err);
        this.cargandoSolicitudes = false;
        if (!cargadoDesdeCache) {
          this.errorCargandoSolicitudes = true;
          this.solicitudes = [];
          this.solicitudesFiltradas = [];
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // VERIFICAR SI HAY CAMBIOS SIGNIFICATIVOS
  // ============================================================
  private hayCambiosSignificativos(nuevasSolicitudes: SolicitudDesarrollo[]): boolean {
    if (!this.solicitudes || this.solicitudes.length === 0) return true;
    if (nuevasSolicitudes.length !== this.solicitudes.length) return true;

    // Verificar si cambió el ID, estado, prioridad o cantidad de requerimientos
    for (let i = 0; i < nuevasSolicitudes.length; i++) {
      const nueva = nuevasSolicitudes[i];
      const actual = this.solicitudes[i];
      if (
        nueva.id !== actual.id ||
        nueva.estado !== actual.estado ||
        nueva.prioridad !== actual.prioridad ||
        nueva.totalRequerimientos !== actual.totalRequerimientos
      ) {
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // MOSTRAR NOTIFICACIÓN TIPO SNACKBAR (SIN ALERTAS)
  // ============================================================
  private mostrarNotificacionSnackbar(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }

  // ============================================================
  // RECARGAR SOLICITUDES (FORZADO)
  // ============================================================
  recargarSolicitudes(): void {
    console.log('CACHE - Limpiando caché y recargando solicitudes desde el backend...');
    localStorage.removeItem('solicitudes_desarrollo_cache');
    this.cargarSolicitudes();
  }

  // ============================================================
  // CARGAR DESDE LOCAL STORAGE (FALLBACK)
  // ============================================================
  private cargarSolicitudesDesdeLocalStorage(): boolean {
    try {
      const stored = localStorage.getItem('solicitudes_desarrollo_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.solicitudes = this.ordenarSolicitudesPorId(parsed);
          this.solicitudesFiltradas = [...this.solicitudes];
          this.totalSolicitudesBD = this.solicitudes.length;
          this.solicitudesCargadas = this.solicitudes.length;
          this.todasCargadas = true;
          console.log('CACHE - Solicitudes restauradas desde localStorage:', this.solicitudes.length);
          return true;
        }
      }
    } catch (e) {
      console.warn('CACHE - Error al leer localStorage:', e);
    }
    return false;
  }

  // ============================================================
  // GUARDAR EN LOCAL STORAGE (CACHE)
  // ============================================================
  private guardarSolicitudesEnCache(): void {
    try {
      if (this.solicitudes && this.solicitudes.length > 0) {
        const solicitudesOrdenadas = this.ordenarSolicitudesPorId([...this.solicitudes]);
        localStorage.setItem('solicitudes_desarrollo_cache', JSON.stringify(solicitudesOrdenadas));
        localStorage.setItem('solicitudes_desarrollo_cache_ts', Date.now().toString());
      }
    } catch (e) {
      console.warn('CACHE - Error al escribir en localStorage:', e);
    }
  }

  // Retorna los milisegundos de edad de la caché (Infinity si no existe)
  private getCacheEdadMs(): number {
    try {
      const ts = localStorage.getItem('solicitudes_desarrollo_cache_ts');
      if (!ts) return Infinity;
      return Date.now() - parseInt(ts, 10);
    } catch {
      return Infinity;
    }
  }

  // ============================================================
  // OBTENER PROGRESO DE CARGA
  // ============================================================
  getProgresoCarga(): number {
    if (this.totalSolicitudesBD === 0) return 0;
    return Math.round((this.solicitudesCargadas / this.totalSolicitudesBD) * 100);
  }

  // ============================================================
  // VERIFICAR SI HAY MÁS SOLICITUDES POR CARGAR
  // ============================================================
  tieneMasSolicitudes(): boolean {
    return !this.todasCargadas && this.solicitudesCargadas < this.totalSolicitudesBD;
  }

  // ============================================================
  // MAPEAR SOLICITUD
  // ============================================================
  public normalizarPrioridad(valor: unknown): 'alta' | 'media' | 'baja' {
    const texto = String(valor ?? '').trim().toLowerCase();
    if (texto === 'alta' || texto === 'high') return 'alta';
    if (texto === 'baja' || texto === 'low') return 'baja';
    if (texto === 'media' || texto === 'medio' || texto === 'medium') return 'media';
    return 'media';
  }

  private extraerPrioridad(item: any): 'alta' | 'media' | 'baja' {
    const cruda = item?.prioridad ?? item?.prioridadNombre ?? item?.prioridadCodigo;
    if (cruda === undefined || cruda === null || String(cruda).trim() === '') {
      return 'media';
    }
    return this.normalizarPrioridad(cruda);
  }

  private mapearSolicitud(item: any): SolicitudDesarrollo {
    let tieneImagenes = false;
    let totalReq = 0;

    if (item.totalRequerimientos !== undefined) {
      totalReq = item.totalRequerimientos;
    }

    if (item.requerimientos && item.requerimientos.length > 0) {
      tieneImagenes = item.requerimientos.some((req: any) =>
        (req.imagenes && req.imagenes.length > 0) || (req.archivos && req.archivos.length > 0)
      );
    }

    // Resolver Área
    let areaNombre = 'No especificada';
    if (item.area && item.area.nombre) {
      areaNombre = item.area.nombre;
    } else if (item.areaNombre) {
      areaNombre = item.areaNombre;
    } else if (item.areaId) {
      const areaIdNum = Number(item.areaId);
      const foundInAreas = (this.areas || []).find((a: any) => Number(a.id) === areaIdNum);
      if (foundInAreas && foundInAreas.nombre) {
        areaNombre = foundInAreas.nombre;
      } else if (this.areaMap && this.areaMap[areaIdNum]) {
        areaNombre = this.areaMap[areaIdNum];
      } else {
        const defaultAreaMap: { [key: number]: string } = {
          44: 'Transformación Digital',
          45: 'Servicios de Salud Financiera',
          46: 'Gestión Documental',
          47: 'Talento Humano',
          48: 'Desarrollo Organizacional',
          1: 'Transformación Digital',
          2: 'Servicios de Salud Financiera',
          3: 'Gestión Documental',
          4: 'Talento Humano',
          5: 'Desarrollo Organizacional'
        };
        areaNombre = defaultAreaMap[areaIdNum] || `Área #${areaIdNum}`;
      }
    } else if (item.solicitudProceso) {
      areaNombre = item.solicitudProceso;
    }

    // Resolver Proceso Solicitante
    let procesoNombre = 'No especificado';
    if (item.proceso && item.proceso.nombre) {
      procesoNombre = item.proceso.nombre;
    } else if (item.procesoNombre) {
      procesoNombre = item.procesoNombre;
    } else if (item.procesoId) {
      const procesoIdNum = Number(item.procesoId);
      const foundProceso = (this.procesosSolicitante || []).find((p: any) => Number(p.id) === procesoIdNum);
      if (foundProceso && foundProceso.nombre) {
        procesoNombre = foundProceso.nombre;
      } else {
        const defaultProcesoMap: { [key: number]: string } = {
          40: 'Desarrollo Tecnológico',
          41: 'Gestión Documental',
          42: 'Contabilidad',
          43: 'Talento Humano',
          1: 'Desarrollo Tecnológico',
          2: 'Gestión Documental',
          3: 'Contabilidad',
          4: 'Talento Humano'
        };
        procesoNombre = defaultProcesoMap[procesoIdNum] || `Proceso #${procesoIdNum}`;
      }
    }

    // Resolver Vicepresidencia / Macroproceso
    let vicepresidenciaNombre = 'No especificada';
    if (item.macroproceso && item.macroproceso.nombre) {
      vicepresidenciaNombre = item.macroproceso.nombre;
    } else if (item.vicepresidenciaNombre) {
      vicepresidenciaNombre = item.vicepresidenciaNombre;
    } else if (item.macroprocesoId) {
      const macroIdNum = Number(item.macroprocesoId);
      const foundVice = (this.vicepresidencias || []).find((v: any) => Number(v.id) === macroIdNum);
      if (foundVice && foundVice.nombre) {
        vicepresidenciaNombre = foundVice.nombre;
      } else {
        const defaultViceMap: { [key: number]: string } = {
          49: 'Vicepresidencia de Salud',
          50: 'Vicepresidencia Administrativa',
          51: 'Vicepresidencia Financiera',
          1: 'Vicepresidencia de Salud',
          2: 'Vicepresidencia Administrativa',
          3: 'Vicepresidencia Financiera'
        };
        vicepresidenciaNombre = defaultViceMap[macroIdNum] || `Vicepresidencia #${macroIdNum}`;
      }
    }

    const reqFuncionales: RequerimientoItem[] = [];
    const reqNoFuncionales: RequerimientoItem[] = [];

    if (item.requerimientos && Array.isArray(item.requerimientos)) {
      const reqsOrdenados = [...item.requerimientos].sort((a: any, b: any) => {
        const tipoA = Number(a.tipoRequerimiento !== undefined ? a.tipoRequerimiento : (a.tipo_requerimiento || 0));
        const tipoB = Number(b.tipoRequerimiento !== undefined ? b.tipoRequerimiento : (b.tipo_requerimiento || 0));
        if (tipoA !== tipoB) return tipoA - tipoB;
        const ordA = a.numeroOrden !== undefined && a.numeroOrden !== null ? Number(a.numeroOrden) : (a.id ? Number(a.id) : 0);
        const ordB = b.numeroOrden !== undefined && b.numeroOrden !== null ? Number(b.numeroOrden) : (b.id ? Number(b.id) : 0);
        return ordA - ordB;
      });

      reqsOrdenados.forEach((req: any) => {
        const rawImgs = req.imagenesUrls || req.imagenes || req.archivos || [];
        const mappedImgsUrls = rawImgs.map((img: any, idx: number) => {
          if (typeof img === 'string') return { url: img, orden: idx + 1 };
          return { url: img.url || img.base64 || img.url_imagen || '', orden: img.orden || idx + 1 };
        });

        if (mappedImgsUrls.length > 0) {
          tieneImagenes = true;
        }

        const reqMapped: RequerimientoItem = {
          id: '',
          dbId: req.id ? Number(req.id) : undefined,
          codigo: req.codigo || '',
          descripcion: req.objetivo || req.detalle || 'Sin descripción',
          detalle: req.detalle || '',
          cargoImpactado: req.cargoImpactado || '',
          archivos: rawImgs,
          imagenesUrls: mappedImgsUrls
        };

        const tipoReq = req.tipoRequerimiento !== undefined ? req.tipoRequerimiento : req.tipo_requerimiento;
        const tipoReqNum = tipoReq !== null && tipoReq !== undefined ? Number(tipoReq) : -1;
        const tipoNombre = req.tipoRequerimientoNombre ? String(req.tipoRequerimientoNombre).toLowerCase() : '';

        if (tipoReqNum === 0 || (tipoNombre.includes('funcional') && !tipoNombre.includes('no'))) {
          reqMapped.id = req.codigo || `RF_${this.padNumber(reqFuncionales.length + 1)}`;
          reqFuncionales.push(reqMapped);
        } else if (tipoReqNum === 1 || tipoNombre.includes('no funcional')) {
          reqMapped.id = req.codigo || `RNF_${this.padNumber(reqNoFuncionales.length + 1)}`;
          reqNoFuncionales.push(reqMapped);
        } else {
          reqMapped.id = req.codigo || `RF_${this.padNumber(reqFuncionales.length + 1)}`;
          reqFuncionales.push(reqMapped);
        }
      });
    }

    return {
      id: item.id,
      numeroSolicitud: item.codigo,
      objetivo: item.solicitudProceso || 'Sin nombre',
      solicitante: item.empleadoNombre || 'Desconocido',
      area: areaNombre,
      estado: (item.estado?.nombre || 'Pendiente').toUpperCase(),
      tipo: item.tipoSolicitud?.nombre || 'N/A',
      fechaCreacion: item.createdAt ? new Date(item.createdAt) : (item.fechaCreacion ? new Date(item.fechaCreacion) : new Date()),
      prioridad: this.extraerPrioridad(item),
      coordinador: 'Coordinador Asignado',
      funcionalAsignado: 'Funcional Asignado',
      totalRequerimientos: totalReq,
      tieneImagenes: tieneImagenes,
      observaciones: item.observaciones || '',
      impacto: item.impacto || '',
      requerimientosFuncionales: reqFuncionales,
      requerimientosNoFuncionales: reqNoFuncionales,
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
      // Mantener orden descendente al filtrar
      this.solicitudesFiltradas = this.ordenarSolicitudesPorId(this.solicitudesFiltradas);
      return;
    }
    const term = texto.toLowerCase().trim();
    this.solicitudesFiltradas = this.solicitudes.filter(s =>
      s.objetivo.toLowerCase().includes(term) ||
      s.numeroSolicitud?.toLowerCase().includes(term) ||
      s.solicitante.toLowerCase().includes(term) ||
      s.area.toLowerCase().includes(term)
    );
    // Ordenar los resultados filtrados (descendente)
    this.solicitudesFiltradas = this.ordenarSolicitudesPorId(this.solicitudesFiltradas);
  }

  filtrarPorEstado(estado: string): void {
    if (!estado || estado === '') {
      this.solicitudesFiltradas = [...this.solicitudes];
      // Mantener orden descendente al filtrar
      this.solicitudesFiltradas = this.ordenarSolicitudesPorId(this.solicitudesFiltradas);
      return;
    }
    this.solicitudesFiltradas = this.solicitudes.filter(s => s.estado === estado);
    // Ordenar los resultados filtrados (descendente)
    this.solicitudesFiltradas = this.ordenarSolicitudesPorId(this.solicitudesFiltradas);
  }

  // ============================================================
  // ACCIONES DE BANDEJA
  // ============================================================
  private manejarPopState = (): void => {
    if (this.vistaActual !== 'principal') {
      this.volverPrincipal();
    }
  };

  verDetalle(solicitud: SolicitudDesarrollo): void {
    console.log('UI - Abriendo detalle de solicitud:', solicitud.numeroSolicitud);
    this.solicitudSeleccionada = { ...solicitud };
    this.puedeEditarDetalle = this.vistaActual === 'bandeja';
    this.modoEdicion = false;
    this.estadoEditado = this.solicitudSeleccionada.estado;
    this.prioridadEditada = this.solicitudSeleccionada.prioridad || 'media';
    this.mostrarModalDetalle = true;
    this.cargandoDetalleModal = true;

    if (solicitud.id) {
      this.solicitudesService.obtenerPorId(solicitud.id).subscribe({
        next: (detalleBackend) => {
          if (detalleBackend) {
            const solicitudMapeada = this.mapearSolicitud(detalleBackend);
            this.solicitudSeleccionada = { ...solicitudMapeada };
          }
          this.cargandoDetalleModal = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('No se pudo cargar detalle extendido:', err);
          this.cargandoDetalleModal = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cargandoDetalleModal = false;
    }
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.solicitudSeleccionada = null;
    this.modoEdicion = false;
  }

  editarSolicitud(solicitud: SolicitudDesarrollo): void {
    console.log('UI - Abriendo edición directa de solicitud:', solicitud.numeroSolicitud);
    this.solicitudSeleccionada = { ...solicitud };
    this.puedeEditarDetalle = true;
    this.modoEdicion = true;
    this.estadoEditado = this.solicitudSeleccionada.estado;
    this.prioridadEditada = this.solicitudSeleccionada.prioridad || 'media';
    this.mostrarModalDetalle = true;
    this.cargandoDetalleModal = true;

    if (solicitud.id) {
      this.solicitudesService.obtenerPorId(solicitud.id).subscribe({
        next: (detalleBackend) => {
          if (detalleBackend) {
            const solicitudMapeada = this.mapearSolicitud(detalleBackend);
            this.solicitudSeleccionada = {
              ...solicitudMapeada,
              estado: this.estadoEditado,
              prioridad: this.normalizarPrioridad(this.prioridadEditada)
            };
          }
          this.cargandoDetalleModal = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('No se pudo cargar detalle extendido:', err);
          this.cargandoDetalleModal = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  obtenerImagenesUnicas(req: any): { url: string, orden: number }[] {
    if (!req) return [];
    const imagenes: { url: string, orden: number }[] = [];
    const vistas = new Set<string>();

    const procesarLista = (lista: any[]) => {
      if (!lista || !Array.isArray(lista)) return;
      lista.forEach((item: any) => {
        let urlVal = '';
        if (typeof item === 'string') {
          urlVal = item;
        } else if (item && typeof item === 'object') {
          urlVal = item.url || item.base64 || item.url_imagen || '';
        }
        if (urlVal && !vistas.has(urlVal)) {
          vistas.add(urlVal);
          imagenes.push({
            url: urlVal,
            orden: item.orden || (imagenes.length + 1)
          });
        }
      });
    };

    procesarLista(req.imagenesUrls);
    procesarLista(req.archivos);
    procesarLista(req.imagenes);

    return imagenes;
  }

  // ============================================================
  // MODO DETALLE DE REQUERIMIENTO
  // ============================================================
  verDetalleRequerimiento(req: RequerimientoItem, tipo: 'funcional' | 'noFuncional', index: number): void {
    this.requerimientoSeleccionadoModal = JSON.parse(JSON.stringify(req));
    this.requerimientoSeleccionadoTipo = tipo;
    this.requerimientoSeleccionadoIndex = index;
    this.modoEdicionReq = false;
    this.mostrarModalRequerimiento = true;
  }

  editarRequerimiento(req: RequerimientoItem, tipo: 'funcional' | 'noFuncional', index: number): void {
    this.requerimientoSeleccionadoModal = JSON.parse(JSON.stringify(req));
    this.requerimientoSeleccionadoTipo = tipo;
    this.requerimientoSeleccionadoIndex = index;
    this.modoEdicionReq = true;
    this.mostrarModalRequerimiento = true;
  }

  cerrarModalRequerimiento(): void {
    this.mostrarModalRequerimiento = false;
    this.requerimientoSeleccionadoModal = null;
    this.modoEdicionReq = false;
  }

  toggleModoEdicionReq(): void {
    this.modoEdicionReq = !this.modoEdicionReq;
  }

  guardarCambiosRequerimiento(): void {
    if (!this.requerimientoSeleccionadoModal) return;

    const tipo = this.requerimientoSeleccionadoTipo;
    const index = this.requerimientoSeleccionadoIndex;

    // Actualizar en solicitudActual (Wizard de creación)
    if (this.solicitudActual) {
      const listaActual = tipo === 'funcional'
        ? (this.solicitudActual.requerimientosFuncionales || [])
        : (this.solicitudActual.requerimientosNoFuncionales || []);

      if (index >= 0 && index < listaActual.length) {
        listaActual[index] = JSON.parse(JSON.stringify(this.requerimientoSeleccionadoModal));
      }
    }

    // Actualizar en solicitudSeleccionada (Modal de detalle de solicitud)
    if (this.solicitudSeleccionada) {
      const listaSeleccionada = tipo === 'funcional'
        ? (this.solicitudSeleccionada.requerimientosFuncionales || [])
        : (this.solicitudSeleccionada.requerimientosNoFuncionales || []);

      if (index >= 0 && index < listaSeleccionada.length) {
        listaSeleccionada[index] = JSON.parse(JSON.stringify(this.requerimientoSeleccionadoModal));
      }
    }

    this.modoEdicionReq = false;
    this.mostrarModalRequerimiento = false;
    this.mostrarNotificacionSnackbar('Requerimiento actualizado exitosamente', 'success');
  }

  eliminarRequerimientoDesdeModal(): void {
    this.confirmarEliminarRequerimiento(this.requerimientoSeleccionadoTipo, this.requerimientoSeleccionadoIndex);
    this.mostrarModalRequerimiento = false;
  }

  agregarImagenUrlModal(): void {
    if (!this.requerimientoSeleccionadoModal) return;
    if (!this.nuevaUrlImagenModal || this.nuevaUrlImagenModal.trim() === '') return;
    
    if (!this.requerimientoSeleccionadoModal.imagenesUrls) {
      this.requerimientoSeleccionadoModal.imagenesUrls = [];
    }
    
    // Asignar orden automáticamente
    const orden = this.requerimientoSeleccionadoModal.imagenesUrls.length + 1;
    const urlAgregada = this.nuevaUrlImagenModal.trim();
    this.requerimientoSeleccionadoModal.imagenesUrls.push({
      url: urlAgregada,
      orden: orden
    });
    console.log('ADJUNTOS - URL agregada al requerimiento:', urlAgregada, '| Orden:', orden);
    this.nuevaUrlImagenModal = ''; // Limpiar input
  }

  eliminarImagenUrlModal(index: number): void {
    if (!this.requerimientoSeleccionadoModal || !this.requerimientoSeleccionadoModal.imagenesUrls) return;
    this.requerimientoSeleccionadoModal.imagenesUrls.splice(index, 1);
    // Reordenar las imágenes restantes
    this.requerimientoSeleccionadoModal.imagenesUrls.forEach((img, idx) => {
      img.orden = idx + 1;
    });
  }

  // ============================================================
  // MODO EDICIÓN EN MODAL
  // ============================================================
  toggleModoEdicion(): void {
    if (!this.puedeEditarDetalle) {
      this.modoEdicion = false;
      return;
    }

    this.modoEdicion = !this.modoEdicion;
    if (this.modoEdicion && this.solicitudSeleccionada) {
      this.estadoEditado = this.solicitudSeleccionada.estado;
      this.prioridadEditada = this.solicitudSeleccionada.prioridad || 'media';
    }
  }

  get hayCambiosEnDetalle(): boolean {
    if (!this.solicitudSeleccionada || !this.modoEdicion) return false;
    const targetId = this.solicitudSeleccionada.id;
    const solicitudOriginal = this.solicitudes.find(s => s.id === targetId) ||
                              this.misSolicitudes.find(s => s.id === targetId) ||
                              this.solicitudSeleccionada;

    const estadoVisualActual = this.getEstadoVisual(solicitudOriginal.estado).toLowerCase().trim();
    const estadoOriginalStr = (solicitudOriginal.estado || '').toLowerCase().trim();
    const estadoNuevoStr = (this.estadoEditado || '').toLowerCase().trim();
    const estadoCambiado = estadoNuevoStr !== '' && estadoNuevoStr !== estadoVisualActual && estadoNuevoStr !== estadoOriginalStr;

    const prioridadOriginalStr = (solicitudOriginal.prioridad || 'media').toLowerCase().trim();
    const prioridadNuevaStr = (this.prioridadEditada || 'media').toLowerCase().trim();
    const prioridadCambiada = prioridadNuevaStr !== prioridadOriginalStr;

    return estadoCambiado || prioridadCambiada;
  }

  // ============================================================
  // GUARDAR CAMBIOS DEL MODAL
  // ============================================================
  guardarCambiosDetalle(): void {
    if (!this.solicitudSeleccionada || !this.solicitudSeleccionada.id) {
      console.warn('UI - Intento de guardar sin solicitud seleccionada.');
      return;
    }

    this.guardandoCambios = true;
    const targetId = this.solicitudSeleccionada.id;
    const solicitudOriginal = this.solicitudes.find(s => s.id === targetId) ||
                              this.misSolicitudes.find(s => s.id === targetId) ||
                              this.solicitudSeleccionada;

    const estadoVisualActual = this.getEstadoVisual(solicitudOriginal.estado).toLowerCase();
    const estadoNuevoStr = (this.estadoEditado || '').toLowerCase();
    const estadoCambiado = estadoNuevoStr !== estadoVisualActual && estadoNuevoStr !== (solicitudOriginal.estado || '').toLowerCase();

    const prioridadOriginalStr = (solicitudOriginal.prioridad || 'media').toLowerCase();
    const prioridadNuevaStr = (this.prioridadEditada || 'media').toLowerCase();
    const prioridadCambiada = prioridadNuevaStr !== prioridadOriginalStr;

    if (!estadoCambiado && !prioridadCambiada) {
      this.guardandoCambios = false;
      this.mostrarNotificacionSnackbar('No hay cambios para guardar', 'info');
      this.modoEdicion = false;
      return;
    }

    if (estadoCambiado) {
      const estadoSeleccionado = this.estadosList.find(e => e.nombre.toLowerCase() === estadoNuevoStr);
      if (estadoSeleccionado) {
        const observacion = `Cambio de estado desde edición: ${solicitudOriginal.estado} → ${this.estadoEditado}`;
        this.solicitudesService.cambiarEstado(targetId, estadoSeleccionado.id, observacion).subscribe({
          next: () => {
            console.log('POST /api/solicitudes/{id}/estado - Estado actualizado correctamente.');
            if (prioridadCambiada) {
              this.actualizarPrioridadEnServicio(targetId, prioridadNuevaStr);
            } else {
              this.finalizarGuardado();
            }
          },
          error: (err) => {
            console.error('POST /api/solicitudes/{id}/estado - Error al actualizar estado:', err.message || err);
            if (prioridadCambiada) {
              this.actualizarPrioridadEnServicio(targetId, prioridadNuevaStr);
            } else {
              this.guardandoCambios = false;
              this.mostrarNotificacionSnackbar('Error al actualizar el estado', 'error');
            }
          }
        });
      } else {
        if (prioridadCambiada) {
          this.actualizarPrioridadEnServicio(targetId, prioridadNuevaStr);
        } else {
          this.finalizarGuardado();
        }
      }
    } else if (prioridadCambiada) {
      this.actualizarPrioridadEnServicio(targetId, prioridadNuevaStr);
    } else {
      this.finalizarGuardado();
    }
  }

  private actualizarPrioridadEnServicio(id: number, prioridad: string): void {
    this.solicitudesService.actualizarPrioridad(id, prioridad).subscribe({
      next: () => {
        console.log('POST /api/solicitudes/{id}/prioridad - Prioridad actualizada correctamente.');
        this.finalizarGuardado();
      },
      error: (err) => {
        console.error('POST /api/solicitudes/{id}/prioridad - Error al actualizar:', err.message || err);
        this.guardandoCambios = false;
        this.mostrarNotificacionSnackbar('Error al actualizar la prioridad', 'error');
      }
    });
  }

  private finalizarGuardado(): void {
    this.guardandoCambios = false;
    this.modoEdicion = false;
    this.mostrarNotificacionSnackbar('Cambios guardados exitosamente', 'success');

    // Actualizar localmente sin recargar del backend
    if (this.solicitudSeleccionada) {
      const nuevoEstado = this.estadoEditado;
      const nuevaPrioridad = this.normalizarPrioridad(this.prioridadEditada);
      this.solicitudSeleccionada.estado = nuevoEstado;
      this.solicitudSeleccionada.prioridad = nuevaPrioridad;

      // Actualizar en las listas en memoria
      const id = this.solicitudSeleccionada.id;
      [this.solicitudes, this.solicitudesFiltradas, this.misSolicitudes].forEach(lista => {
        const idx = lista.findIndex(s => s.id === id);
        if (idx >= 0) {
          lista[idx] = { ...lista[idx], estado: nuevoEstado, prioridad: nuevaPrioridad };
        }
      });

      // Actualizar caché local
      this.guardarSolicitudesEnCache();
      this.cdr.detectChanges();
    }
  }

  // ============================================================
  // ELIMINAR SOLICITUD
  // ============================================================
  eliminarSolicitud(solicitud: SolicitudDesarrollo): void {
    this.solicitudAEliminar = solicitud;
    this.mostrarModalEliminarSolicitud = true;
  }

  cancelarEliminarSolicitud(): void {
    this.mostrarModalEliminarSolicitud = false;
    this.solicitudAEliminar = null;
  }

  confirmarEliminarSolicitud(): void {
    if (!this.solicitudAEliminar || !this.solicitudAEliminar.id) return;
    
    this.solicitudesService.eliminar(this.solicitudAEliminar.id).subscribe({
      next: () => {
        console.log('DELETE /api/solicitudes/{id} - Solicitud eliminada correctamente.');
        this.cargarSolicitudes();
        if (this.vistaActual === 'historial') {
          this.cargarMisSolicitudes();
        }
        this.mostrarModalEliminarSolicitud = false;
        this.solicitudAEliminar = null;
        this.mostrarNotificacionSnackbar('Solicitud eliminada exitosamente', 'success');
      },
      error: (err) => {
        console.error('DELETE /api/solicitudes/{id} - Error al eliminar:', err.message || err);
        this.mostrarNotificacionSnackbar('Error al eliminar la solicitud', 'error');
        this.mostrarModalEliminarSolicitud = false;
        this.solicitudAEliminar = null;
      }
    });
  }

  // ============================================================
  // CARGAR ESTADOS
  // ============================================================
  cargarEstados(): void {
    this.solicitudesService.obtenerEstados().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.estadosList = data;
          this.estadosList.sort((a, b) => (a.id || 0) - (b.id || 0));
        } else {
          this.setFallbackEstados();
        }
      },
      error: (err) => {
        console.error('GET /api/solicitudes/estados - Error al obtener estados:', err.message || err);
        this.setFallbackEstados();
      }
    });
  }

  private setFallbackEstados(): void {
    this.estadosList = [
      { id: 1, codigo: 'BORRADOR', nombre: 'Borrador' },
      { id: 2, codigo: 'ENVIADA', nombre: 'Enviada' },
      { id: 3, codigo: 'EN_DOCUMENTACION', nombre: 'En documentación' },
      { id: 4, codigo: 'EN_PRUEBAS_FUNCIONALES', nombre: 'En pruebas funcionales' },
      { id: 5, codigo: 'EN_DESARROLLO', nombre: 'En desarrollo' },
      { id: 6, codigo: 'EN_PRUEBAS_ACEPTACION', nombre: 'En pruebas de aceptación' },
      { id: 7, codigo: 'CERRADA', nombre: 'Cerrada' },
      { id: 8, codigo: 'RECHAZADA', nombre: 'Rechazada' }
    ];
  }

  // ============================================================
  // MODAL CAMBIO DE ESTADO
  // ============================================================
  abrirModalCambioEstado(solicitud: SolicitudDesarrollo): void {
    this.solicitudSeleccionada = solicitud;
    const currentEstado = this.estadosList.find(e => e.nombre === solicitud.estado);
    this.nuevoEstadoSeleccionadoId = currentEstado ? currentEstado.id : null;
    this.observacionCambioEstado = '';
    this.mostrarModalCambioEstado = true;
  }

  cambiarEstadoSolicitud(solicitud: SolicitudDesarrollo): void {
    this.abrirModalCambioEstado(solicitud);
  }

  cerrarModalCambioEstado(): void {
    this.mostrarModalCambioEstado = false;
    this.nuevoEstadoSeleccionadoId = null;
    this.observacionCambioEstado = '';
  }

  guardarCambioEstado(): void {
    if (!this.solicitudSeleccionada || !this.solicitudSeleccionada.id || !this.nuevoEstadoSeleccionadoId) {
      console.warn('UI - Cambio de estado cancelado: falta solicitud seleccionada o ID de estado.');
      return;
    }

    const id = this.solicitudSeleccionada.id;
    const nuevoEstadoId = Number(this.nuevoEstadoSeleccionadoId);
    const observacion = this.observacionCambioEstado.trim();

    console.log(`POST /api/solicitudes/${id}/estado - Cambiando a estadoId=${nuevoEstadoId}...`);

    this.solicitudesService.cambiarEstado(id, nuevoEstadoId, observacion).subscribe({
      next: (response) => {
        console.log('POST /api/solicitudes/{id}/estado - Cambio exitoso:', response);
        this.cerrarModalCambioEstado();
        this.cerrarModalDetalle();
        this.cargarSolicitudes();
        this.mostrarNotificacionSnackbar('El estado de la solicitud ha sido actualizado correctamente', 'success');
      },
      error: (err) => {
        console.error('POST /api/solicitudes/{id}/estado - Error:', err.message || err);
        let mensajeError = 'Hubo un error al intentar cambiar el estado de la solicitud.';
        if (err.error && err.error.message) {
          mensajeError += '\n' + err.error.message;
        }
        this.mostrarNotificacionSnackbar(mensajeError, 'error');
      }
    });
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
    this.puedeEditarDetalle = false;
    this.pasoActivo = 0;
    this.impactoTexto = '';
    this.errorImpacto = false;
    this.formGeneral = {
      solicitudProceso: '',
      proceso: '',
      area: '',
      vicepresidencia: '',
      tipoSolicitud: '',
      prioridad: 'media',
      observacion: ''
    };
    this.erroresGeneral = {
      proceso: false,
      area: false,
      vicepresidencia: false,
      tipoSolicitud: false,
      solicitudProceso: false,
      prioridad: false
    };
    this.archivosAdjuntosTemporales = [];
  }

  mostrarBandeja(): void {
    this.vistaActual = 'bandeja';
    this.puedeEditarDetalle = true;
    // Ordenar descendente al mostrar la bandeja (más reciente primero)
    if (this.solicitudes.length > 0) {
      this.solicitudes = this.ordenarSolicitudesPorId([...this.solicitudes]);
      this.solicitudesFiltradas = this.ordenarSolicitudesPorId([...this.solicitudesFiltradas]);
    }
    this.cargarSolicitudes();
    if (typeof window !== 'undefined') {
      window.history.pushState({ vista: this.vistaActual }, '', window.location.href);
    }
  }

  volverPrincipal(): void {
    this.vistaActual = 'principal';
    this.puedeEditarDetalle = true;
    this.pasoActivo = 0;
    this.mostrarModalDetalle = false;
    this.mostrarModalRequerimiento = false;
    this.mostrarModalEliminar = false;
    this.mostrarModalEliminarSolicitud = false;
    this.mostrarModalExito = false;
    this.mostrarModalCambioEstado = false;
  }

  irAtras(): void {
    if (this.vistaActual === 'principal') {
      this.router.navigate(['/hyl/inicio']).then(() => {
        setTimeout(() => this.nexusMenuService.openMenu(), 50);
      });
    } else {
      this.volverPrincipal();
    }
  }

  // ============================================================
  // HISTORIAL DE CAMBIOS Y MIS SOLICITUDES
  // ============================================================

  mostrarMisSolicitudes(): void {
    this.vistaActual = 'historial';
    this.puedeEditarDetalle = false;
    this.cargarMisSolicitudes();
    if (typeof window !== 'undefined') {
      window.history.pushState({ vista: this.vistaActual }, '', window.location.href);
    }
  }

  cargarMisSolicitudes(): void {
    if (!this.misSolicitudes || this.misSolicitudes.length === 0) {
      this.cargandoMisSolicitudes = true;
    }
    const doc = this.datosColaborador.documento || '';
    const correo = this.datosColaborador.correo || '';

    // Si no tenemos documento, usamos el correo como identificador
    if (!doc && correo) {
      console.log('GET /api/solicitudes/mis-solicitudes/correo/{correo} - Buscando por correo:', correo);
      this.solicitudesService.obtenerMisSolicitudesPorCorreo(correo, 0, 100).subscribe({
        next: (data: any) => {
          if (data && data.content) {
            this.misSolicitudes = this.ordenarSolicitudesPorId(
              data.content.map((item: any) => this.mapearSolicitud(item))
            );
            this.totalMisSolicitudesBD = data.totalElements;
          } else {
            this.misSolicitudes = [];
            this.totalMisSolicitudesBD = 0;
          }
          this.cargandoMisSolicitudes = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('GET /api/solicitudes/mis-solicitudes/correo - Error:', err.message || err);
          this.cargandoMisSolicitudes = false;
          this.misSolicitudes = [];
          this.mostrarNotificacionSnackbar('Error al cargar mis solicitudes', 'error');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    console.log('GET /api/solicitudes/mis-solicitudes/{doc} - Buscando por documento:', doc);
    this.solicitudesService.obtenerMisSolicitudes(doc, 0, 100).subscribe({
      next: (data: any) => {
        if (data && data.content) {
          this.misSolicitudes = this.ordenarSolicitudesPorId(
            data.content.map((item: any) => this.mapearSolicitud(item))
          );
          this.totalMisSolicitudesBD = data.totalElements;
        } else {
          this.misSolicitudes = [];
          this.totalMisSolicitudesBD = 0;
        }
        this.cargandoMisSolicitudes = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
          console.error('GET /api/solicitudes/mis-solicitudes - Error:', err.message || err);
        this.cargandoMisSolicitudes = false;
        this.misSolicitudes = [];
        this.mostrarNotificacionSnackbar('Error al cargar mis solicitudes', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  verHistorialCambios(solicitud: SolicitudDesarrollo): void {
    if (!solicitud.id) return;
    this.solicitudSeleccionada = solicitud;
    this.cargandoHistorial = true;
    this.mostrarModalHistorial = true;
    this.historialCambios = [];

    this.solicitudesService.obtenerHistorialCambios(solicitud.id).subscribe({
      next: (data) => {
        this.historialCambios = data;
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('GET /api/solicitudes/{id}/historial - Error al obtener historial:', err.message || err);
        this.cargandoHistorial = false;
        this.mostrarNotificacionSnackbar('Error al obtener el historial de cambios', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalHistorial(): void {
    this.mostrarModalHistorial = false;
    this.solicitudSeleccionada = null;
    this.historialCambios = [];
  }

  // ============================================================
  // MODAL ALERTA DE MENSAJE CUSTOM
  // ============================================================
  mostrarModalAlertaMensaje: boolean = false;
  tituloAlertaMensaje: string = 'Atención';
  mensajeAlertaMensaje: string = '';
  iconoAlertaMensaje: string = 'ℹ️';

  mostrarAlerta(mensaje: string, titulo: string = 'Atención', icono: string = 'ℹ️'): void {
    this.tituloAlertaMensaje = titulo;
    this.mensajeAlertaMensaje = mensaje;
    this.iconoAlertaMensaje = icono;
    this.mostrarModalAlertaMensaje = true;
  }

  cerrarModalAlertaMensaje(): void {
    this.mostrarModalAlertaMensaje = false;
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
          this.mostrarAlerta('Debe agregar al menos un requerimiento funcional.', 'Campo Requerido', '⚠️');
          return;
        }
        break;
      case 4:
        if (!this.validarRequerimientosNoFuncionales()) {
          this.mostrarAlerta('Debe agregar al menos un requerimiento no funcional.', 'Campo Requerido', '⚠️');
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
    if (!this.validarPasoGeneral()) {
      this.mostrarErroresGeneral();
      return;
    }
    this.pasoActivo = 2;
  }

  avanzarDesdeImpacto(): void {
    if (!this.validarImpacto()) {
      this.errorImpacto = true;
      return;
    }
    this.pasoActivo = 3;
  }

  // ============================================================
  // VALIDACIONES
  // ============================================================
  private validarPasoGeneral(): boolean {
    this.erroresGeneral = {
      // Solo validar si el array tiene opciones (vinieron datos del backend)
      proceso: this.procesosSolicitante.length > 0 && (!this.formGeneral.proceso || this.formGeneral.proceso === ''),
      area: this.areas.length > 0 && (!this.formGeneral.area || this.formGeneral.area === ''),
      vicepresidencia: this.vicepresidencias.length > 0 && (!this.formGeneral.vicepresidencia || this.formGeneral.vicepresidencia === ''),
      tipoSolicitud: this.tiposSolicitud.length > 0 && (!this.formGeneral.tipoSolicitud || this.formGeneral.tipoSolicitud === ''),
      solicitudProceso: !this.formGeneral.solicitudProceso || this.formGeneral.solicitudProceso.trim() === '',
      prioridad: !this.formGeneral.prioridad || this.formGeneral.prioridad === ''
    };
    return !Object.values(this.erroresGeneral).some((error) => error);
  }

  private mostrarErroresGeneral(): void {
    let mensaje = 'Por favor complete los siguientes campos requeridos:\n';
    if (this.erroresGeneral.solicitudProceso) mensaje += '• Solicitud del proceso\n';
    if (this.erroresGeneral.proceso) mensaje += '• Proceso solicitante\n';
    if (this.erroresGeneral.area) mensaje += '• Área\n';
    if (this.erroresGeneral.vicepresidencia) mensaje += '• Vicepresidencia\n';
    if (this.erroresGeneral.tipoSolicitud) mensaje += '• Tipo de solicitud\n';
    if (this.erroresGeneral.prioridad) mensaje += '• Prioridad\n';
    this.mostrarAlerta(mensaje, 'Campos Incompletos', '⚠️');
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
  abrirImagenCompleta(url: string): void {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const win = window.open();
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Vista Previa de Imagen</title>
                <style>
                  body { margin: 0; background: #0e171e; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
                  img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                </style>
              </head>
              <body>
                <img src="${url}" alt="Imagen Completa" />
              </body>
            </html>
          `);
          win.document.close();
        }
      } catch (e) {
        console.error('Error al abrir la imagen base64:', e);
      }
    } else {
      window.open(url, '_blank');
    }
  }

  private mapearProcesoId(procesoNombre: string): number {
    if (!procesoNombre) return 40;
    const nombreClean = procesoNombre.toLowerCase().trim();

    const found = (this.procesosSolicitante || []).find((p: any) =>
      (p.nombre && p.nombre.toLowerCase().trim() === nombreClean) ||
      (typeof p === 'string' && p.toLowerCase().trim() === nombreClean)
    );
    if (found && found.id) return Number(found.id);

    const map: { [key: string]: number } = {
      'desarrollo tecnológico': 40,
      'desarrollo tecnologico': 40,
      'gestión documental': 41,
      'gestion documental': 41,
      'contabilidad': 42,
      'talento humano': 43
    };
    return map[nombreClean] || 40;
  }

  private mapearAreaId(areaNombre: string): number {
    if (!areaNombre) return 44;
    const nombreClean = areaNombre.toLowerCase().trim();

    const areaObj = (this.areas || []).find((a: any) =>
      a.nombre && a.nombre.toLowerCase().trim() === nombreClean
    );
    if (areaObj && areaObj.id) return Number(areaObj.id);

    const map: { [key: string]: number } = {
      'transformación digital': 44,
      'transformacion digital': 44,
      'servicios de salud financiera': 45,
      'gestión documental': 46,
      'gestion documental': 46,
      'talento humano': 47,
      'desarrollo organizacional': 48
    };
    return map[nombreClean] || 44;
  }

  private mapearMacroprocesoId(vicepresidenciaNombre: string): number {
    if (!vicepresidenciaNombre) return 49;
    const nombreClean = vicepresidenciaNombre.toLowerCase().trim();

    const found = (this.vicepresidencias || []).find((v: any) =>
      (v.nombre && v.nombre.toLowerCase().trim() === nombreClean) ||
      (typeof v === 'string' && v.toLowerCase().trim() === nombreClean)
    );
    if (found && found.id) return Number(found.id);

    const map: { [key: string]: number } = {
      'vicepresidencia de salud': 49,
      'vicepresidencia administrativa': 50,
      'vicepresidencia financiera': 51
    };
    return map[nombreClean] || 49;
  }

  // ============================================================
  // MÉTODOS DEL WIZARD
  // ============================================================
  padNumber(num: number): string {
    return String(num).padStart(2, '0');
  }

  seleccionarArchivo(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const disponibles = this.MAX_IMAGENES_POR_REQ - this.archivosAdjuntosTemporales.length;
      if (disponibles <= 0) {
        this.mostrarNotificacionSnackbar(`Máximo ${this.MAX_IMAGENES_POR_REQ} imágenes permitidas por requerimiento.`, 'info');
        event.target.value = '';
        return;
      }

      const cantidadCargar = Math.min(files.length, disponibles);
      if (files.length > disponibles) {
        this.mostrarNotificacionSnackbar(`Solo se agregaron ${cantidadCargar} imágenes para no superar el límite de ${this.MAX_IMAGENES_POR_REQ}.`, 'info');
      }

      for (let i = 0; i < cantidadCargar; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = () => {
          this.archivosAdjuntosTemporales.push({
            nombre: file.name,
            tipo: file.type,
            size: file.size,
            archivo: file,
            base64: reader.result
          });
          console.log('ADJUNTOS - Imagen cargada localmente:', file.name, '| Total temporales:', this.archivosAdjuntosTemporales.length);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
    event.target.value = '';
  }

  eliminarArchivoTemporal(index: number): void {
    this.archivosAdjuntosTemporales.splice(index, 1);
  }

  seleccionarArchivoModal(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      if (this.requerimientoSeleccionadoModal) {
        if (!this.requerimientoSeleccionadoModal.archivos) {
          this.requerimientoSeleccionadoModal.archivos = [];
        }

        const actuales = this.obtenerImagenesUnicas(this.requerimientoSeleccionadoModal).length;
        const disponibles = this.MAX_IMAGENES_POR_REQ - actuales;
        if (disponibles <= 0) {
          this.mostrarNotificacionSnackbar(`Máximo ${this.MAX_IMAGENES_POR_REQ} imágenes permitidas por requerimiento.`, 'info');
          event.target.value = '';
          return;
        }

        const cantidadCargar = Math.min(files.length, disponibles);
        if (files.length > disponibles) {
          this.mostrarNotificacionSnackbar(`Solo se agregaron ${cantidadCargar} imágenes para no superar el límite de ${this.MAX_IMAGENES_POR_REQ}.`, 'info');
        }

        for (let i = 0; i < cantidadCargar; i++) {
          const file = files[i];
          const reader = new FileReader();
          reader.onload = () => {
            this.requerimientoSeleccionadoModal!.archivos!.push({
              nombre: file.name,
              tipo: file.type,
              size: file.size,
              archivo: file,
              base64: reader.result
            });
            this.cdr.detectChanges();
          };
          reader.readAsDataURL(file);
        }
      }
    }
    event.target.value = '';
  }

  eliminarImagenModal(index: number): void {
    if (this.requerimientoSeleccionadoModal && this.requerimientoSeleccionadoModal.archivos) {
      this.requerimientoSeleccionadoModal.archivos.splice(index, 1);
    }
  }

  // ============================================================
  // AGREGAR REQUERIMIENTO
  // ============================================================
  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string, cargo?: string, detalle?: string): void {
    const error = this.validarCamposRequerimiento(descripcion, cargo, detalle);
    if (error) {
      this.mensajeErrorRequerimiento = error;
      return;
    }

    this.mensajeErrorRequerimiento = '';

    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    const numero = lista.length + 1;
    const id = `${prefijo}_${this.padNumber(numero)}`;

    // Garantizar el límite máximo de imágenes en el momento de crear el requerimiento
    const archivosParaAgregar = this.archivosAdjuntosTemporales.slice(0, this.MAX_IMAGENES_POR_REQ);
    if (this.archivosAdjuntosTemporales.length > this.MAX_IMAGENES_POR_REQ) {
      console.warn(`REQUERIMIENTO - Se superó el límite de ${this.MAX_IMAGENES_POR_REQ} imágenes. Solo se tomarán las primeras ${this.MAX_IMAGENES_POR_REQ}.`);
    }

    const imagenesUrlsMapped = archivosParaAgregar.map((a: any, idx: number) => ({
      url: typeof a === 'string' ? a : (a.base64 || a.url || ''),
      orden: idx + 1
    }));

    const nuevoReq: RequerimientoItem = {
      id: id,
      descripcion: descripcion.trim(),
      detalle: detalle?.trim() || '',
      cargoImpactado: cargo?.trim() || '',
      archivos: [...archivosParaAgregar],
      imagenesUrls: imagenesUrlsMapped,
      tieneImagen: imagenesUrlsMapped.length > 0
    };

    if (imagenesUrlsMapped.length > 0) {
      this.solicitudActual.tieneImagenes = true;
    }

    console.log('REQUERIMIENTO - Requerimiento agregado:', id, '| Imágenes adjuntas:', nuevoReq.imagenesUrls?.length || 0);

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

    this.archivosAdjuntosTemporales = [];
  }

  agregarRequerimientoConReset(
    tipo: 'funcional' | 'noFuncional',
    descripcion: string,
    cargo: string,
    detalle: string,
    objetivoInput?: HTMLInputElement,
    cargoInput?: HTMLSelectElement,
    detalleInput?: HTMLTextAreaElement
  ): void {
    this.agregarRequerimiento(tipo, descripcion, cargo, detalle);

    if (!this.mensajeErrorRequerimiento) {
      if (objetivoInput) {
        objetivoInput.value = '';
      }
      if (cargoInput) {
        cargoInput.value = '';
      }
      if (detalleInput) {
        detalleInput.value = '';
      }
    }
  }

  private validarCamposRequerimiento(descripcion: string, cargo?: string, detalle?: string): string | null {
    if (!descripcion || descripcion.trim() === '') {
      return 'El objetivo del requerimiento es obligatorio.';
    }

    if (!cargo || cargo.trim() === '') {
      return 'Debe seleccionar un cargo impactado.';
    }

    if (!detalle || detalle.trim() === '') {
      return 'El detalle del requerimiento es obligatorio.';
    }

    return null;
  }

  verAdjunto(req: RequerimientoItem): void {
    if (!req.archivos || req.archivos.length === 0) {
      this.mostrarAlerta('Este requerimiento no tiene archivos adjuntos.', 'Sin Archivos', '📄');
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
      this.mostrarAlerta('No se puede abrir el archivo. Intente descargándolo nuevamente.', 'Error de Archivo', '⚠️');
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
  guardarSolicitud(): void {
    console.log('UI - Validando formulario y preparando payload para crear solicitud...');

    if (!this.validarPasoGeneral()) {
      this.mostrarErroresGeneral();
      return;
    }

    if (!this.validarImpacto()) {
      this.errorImpacto = true;
      this.mostrarAlerta('Debe describir el impacto (mínimo 10 caracteres).', 'Campo Requerido', '⚠️');
      this.pasoActivo = 2;
      return;
    }

    if (!this.validarRequerimientosFuncionales()) {
      this.mostrarAlerta('Debe agregar al menos un requerimiento funcional.', 'Campo Requerido', '⚠️');
      this.pasoActivo = 3;
      return;
    }

    if (!this.validarRequerimientosNoFuncionales()) {
      this.mostrarAlerta('Debe agregar al menos un requerimiento no funcional.', 'Campo Requerido', '⚠️');
      this.pasoActivo = 4;
      return;
    }

    // Resolver IDs desde los catálogos cargados del backend
    // Si los catálogos no tienen datos (arrays vacíos), usar default 1
    const procesoId = this.mapearProcesoId(this.formGeneral.proceso);
    const areaId = this.mapearAreaId(this.formGeneral.area);
    const macroprocesoId = this.mapearMacroprocesoId(this.formGeneral.vicepresidencia);

    // Para el tipo: buscar el objeto en el array cargado del backend
    const tipoObj = this.tiposSolicitud.find((t: any) => t.nombre === this.formGeneral.tipoSolicitud);
    const tipoSolicitudId = tipoObj ? tipoObj.id : 1;

    const payload = {
      empleadoDocumento: this.datosColaborador.documento || '123456789',
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
      prioridad: this.normalizarPrioridad(this.formGeneral.prioridad),
      observaciones: this.formGeneral.observacion || '',
      impacto: this.impactoTexto,
      requerimientos: [
        ...(this.solicitudActual.requerimientosFuncionales || []).map((req: RequerimientoItem) => {
          const imgsUrls = (req.imagenesUrls && req.imagenesUrls.length > 0)
            ? req.imagenesUrls
            : (req.archivos || []).map((a: any, idx: number) => ({
                url: typeof a === 'string' ? a : (a.base64 || a.url || ''),
                orden: idx + 1
              })).filter((a: any) => a.url);

          console.log('PAYLOAD - RF', req.id, '| Imágenes enviadas al backend:', imgsUrls.length);

          return {
            tipoRequerimiento: 0,
            objetivo: req.descripcion,
            detalle: req.detalle || req.descripcion,
            cargoImpactado: req.cargoImpactado || '',
            imagenesUrls: imgsUrls
          };
        }),
        ...(this.solicitudActual.requerimientosNoFuncionales || []).map((req: RequerimientoItem) => {
          const imgsUrls = (req.imagenesUrls && req.imagenesUrls.length > 0)
            ? req.imagenesUrls
            : (req.archivos || []).map((a: any, idx: number) => ({
                url: typeof a === 'string' ? a : (a.base64 || a.url || ''),
                orden: idx + 1
              })).filter((a: any) => a.url);

          console.log('PAYLOAD - RNF', req.id, '| Imágenes enviadas al backend:', imgsUrls.length);

          return {
            tipoRequerimiento: 1,
            objetivo: req.descripcion,
            detalle: req.detalle || req.descripcion,
            cargoImpactado: req.cargoImpactado || '',
            imagenesUrls: imgsUrls
          };
        })
      ]
    };

    console.log('POST /api/solicitudes - Enviando nueva solicitud:', payload);
    this.guardando = true;

    this.solicitudesService.crearSolicitud(payload).subscribe({
      next: (response: any) => {
        this.guardando = false;
        console.log('POST /api/solicitudes - Solicitud creada. Código:', response?.codigo, '| ID:', response?.id);
        this.numeroSolicitudExito = response.codigo || `SD_${String(this.solicitudes.length + 1).padStart(3, '0')}`;

        // Enviar correo con PDF adjunto usando la ruta #265 /api/solicitudes/{id}/enviar-notificacion
        if (response && response.id) {
          this.enviarNotificacionConPdf(response);
        }

        this.mostrarModalExito = true;
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        this.guardando = false;
        console.error('POST /api/solicitudes - Error al crear solicitud:', err.message || err);
        let errorMsg = 'Error al guardar la solicitud.';
        if (err.error) {
          console.error('POST /api/solicitudes - Detalle del backend:', err.error);
          if (err.error.errors) {
            console.error('POST /api/solicitudes - Errores de validación:');
            Object.keys(err.error.errors).forEach(key => {
              console.error(`  Campo ${key}: ${err.error.errors[key]}`);
            });
            errorMsg = Object.values(err.error.errors).join('\n');
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }
        }
        this.mostrarAlerta(errorMsg, 'Error al Guardar Solicitud', '⚠️');
      }
    });
  }

  enviarNotificacionConPdf(response: any): void {
    if (!response || !response.id) return;
    console.log('POST /api/solicitudes/' + response.id + '/enviar-notificacion - Enviando notificación de correo con PDF...');
    this.solicitudesService.enviarNotificacion(response.id, {}).subscribe({
      next: (res) => {
        console.log('POST /api/solicitudes/{id}/enviar-notificacion - Correo enviado correctamente:', res);
      },
      error: (err) => {
        console.error('POST /api/solicitudes/{id}/enviar-notificacion - Error al enviar correo:', err.message || err);
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
      console.log('UI - Guardando observaciones para solicitud:', this.solicitudSeleccionada.numeroSolicitud);
    }
    this.cerrarModalInf();
  }

  // ============================================================
  // PDF - GENERAR Y DESCARGAR
  // ============================================================
  private obtenerDimensionesImagen(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      if (!src) {
        return resolve({ width: 800, height: 600 });
      }
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width || 800;
        const h = img.naturalHeight || img.height || 600;
        resolve({ width: w, height: h });
      };
      img.onerror = () => {
        resolve({ width: 800, height: 600 });
      };
      img.src = src;
    });
  }

  async generarDocumentoPDF(solicitud: SolicitudDesarrollo): Promise<jsPDF | null> {
    try {
      console.log('PDF - Generando documento para solicitud:', solicitud.numeroSolicitud);

      const doc = new jsPDF();

      doc.setFillColor(59, 175, 182);
      doc.rect(0, 0, 210, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ASMET SALUD - REQUERIMIENTO DE DESARROLLO', 10, 15);

      doc.setFontSize(9);
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
      doc.text(headerRight, 200, 15, { align: 'right' });

      let yPos = 30;

      // 1. INFORMACIÓN DEL COLABORADOR
      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['INFORMACIÓN DEL COLABORADOR', '']],
        body: [
          [`Nombre: ${solicitud.solicitante || 'No registrado'}`, `Correo: ${solicitud.correo || 'No registrado'}`],
          [`Cargo: ${solicitud.cargo || 'No registrado'}`, `Sede: ${solicitud.sede || 'No registrada'}`]
        ]
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // 2. INFORMACIÓN DE LA SOLICITUD
      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['INFORMACIÓN DE LA SOLICITUD', '']],
        body: [
          [`Solicitud del Proceso: ${solicitud.objetivo || 'No especificado'}`, `Tipo de Solicitud: ${solicitud.tipo || 'No especificada'}`],
          [`Proceso Solicitante: ${solicitud.proceso || 'No especificado'}`, `Área: ${solicitud.area || 'No especificada'}`],
          [`Vicepresidencia: ${solicitud.vicepresidencia || 'No especificada'}`, `Prioridad: ${solicitud.prioridad || 'No especificada'}`],
          [`Estado: ${solicitud.estado || 'Pendiente'}`, `Coordinador: ${solicitud.coordinador || 'No asignado'}`],
          [`Funcional Asignado: ${solicitud.funcionalAsignado || 'No asignado'}`, ``]
        ]
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // 3. IMPACTO DEL REQUERIMIENTO
      const impactoTexto = solicitud.impacto && solicitud.impacto.trim() !== ''
        ? solicitud.impacto
        : 'No se especificó impacto.';

      autoTable(doc, {
        startY: yPos,
        theme: 'plain',
        styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        head: [['IMPACTO DEL REQUERIMIENTO']],
        body: [[impactoTexto]]
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // 4. OBSERVACIONES (SI EXISTEN)
      if (solicitud.observaciones && solicitud.observaciones.trim() !== '') {
        autoTable(doc, {
          startY: yPos,
          theme: 'plain',
          styles: { cellPadding: 3, fontSize: 10, textColor: [0, 0, 0] },
          headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
          head: [['OBSERVACIONES']],
          body: [[solicitud.observaciones]]
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
      }

      // 5. REQUERIMIENTOS FUNCIONALES
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
        body: reqFuncionales
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // 6. REQUERIMIENTOS NO FUNCIONALES
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
        body: reqNoFuncionales
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // 7. REQUISITOS DE SEGURIDAD
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
        ]]
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // 8. ADJUNTOS / IMÁGENES
      const todosReqs = [...(solicitud.requerimientosFuncionales || []), ...(solicitud.requerimientosNoFuncionales || [])];
      let hasImgHeader = false;

      console.log('PDF - Procesando imágenes para PDF. Solicitud:', solicitud.numeroSolicitud, '| Total Reqs:', todosReqs.length);

      for (const req of todosReqs) {
        const imagenesList: string[] = [];
        if (req.imagenesUrls && req.imagenesUrls.length > 0) {
          req.imagenesUrls.forEach(img => { if (img.url) imagenesList.push(img.url); });
        }
        if (req.archivos && req.archivos.length > 0) {
          req.archivos.forEach(arch => {
            const val = typeof arch === 'string' ? arch : (arch.base64 || arch.url);
            if (val && !imagenesList.includes(val)) imagenesList.push(val);
          });
        }

        console.log('PDF - Requerimiento:', req.id, '| Imágenes a procesar:', imagenesList.length);

        if (imagenesList.length > 0) {
          if (!hasImgHeader) {
            if (yPos + 25 > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('IMÁGENES ADJUNTAS', 14, yPos);
            yPos += 10;
            hasImgHeader = true;
          }

          for (let idx = 0; idx < imagenesList.length; idx++) {
            const imgVal = imagenesList[idx];

            if (typeof imgVal === 'string' && imgVal.startsWith('data:image')) {
              try {
                const format = imgVal.includes('png') ? 'PNG' : 'JPEG';
                
                // Obtener dimensiones reales de la imagen
                const dims = await this.obtenerDimensionesImagen(imgVal);
                const aspectRatio = dims.width / dims.height;

                // Definir límites de tamaño en la página A4 (ancho disponible: 182mm, alto máximo deseado: 220mm)
                const maxAncho = 182;
                const maxAlto = 220;

                let imgAncho = maxAncho;
                let imgAlto = imgAncho / aspectRatio;

                if (imgAlto > maxAlto) {
                  imgAlto = maxAlto;
                  imgAncho = imgAlto * aspectRatio;
                }

                // Calcular la altura requerida para banner (13mm) + imagen (imgAlto) + margen inferior (12mm)
                const alturaRequerida = 13 + imgAlto + 12;

                // Si no cabe en la página actual (limite 270mm), agregar página nueva ANTES de dibujar banner
                if (yPos + alturaRequerida > 270) {
                  doc.addPage();
                  yPos = 20;
                }

                // Banner con fondo para la cabecera de la imagen
                doc.setFillColor(240, 244, 248);
                doc.rect(14, yPos, 182, 9, 'F');
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(59, 175, 182);
                doc.text(`Requerimiento ${req.id} - Imagen ${idx + 1} de ${imagenesList.length}`, 18, yPos + 6);
                yPos += 13;

                // Centrar imagen según su ancho calculado
                const xCentrado = 14 + (182 - imgAncho) / 2;

                doc.addImage(imgVal, format, xCentrado, yPos, imgAncho, imgAlto);
                
                // Marco sutil alrededor de la imagen
                doc.setDrawColor(210, 215, 220);
                doc.rect(xCentrado, yPos, imgAncho, imgAlto);

                yPos += imgAlto + 15;
                console.log('PDF - Renderizada imagen Base64 proporcionada y centrada para:', req.id, '| Dimensiones:', Math.round(imgAncho), 'x', Math.round(imgAlto), 'mm');
              } catch (e) {
                console.error('PDF - Error renderizando base64 en PDF:', e);
                yPos += 10;
              }
            } else if (typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'))) {
              if (yPos + 35 > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.setFillColor(240, 244, 248);
              doc.rect(14, yPos, 182, 9, 'F');
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(59, 175, 182);
              doc.text(`Requerimiento ${req.id} - Imagen ${idx + 1}`, 18, yPos + 6);
              yPos += 13;

              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 255);
              doc.textWithLink(`[Ver imagen adjunta en navegador]`, 18, yPos, { url: imgVal });
              yPos += 18;
              console.log('PDF - Agregado enlace de URL de imagen para:', req.id);
            }
          }
        }
      }

      return doc;
    } catch (error) {
      console.error('PDF - Error al generar el documento:', error);
      return null;
    }
  }

  async descargarSolicitudPDF(solicitud: SolicitudDesarrollo): Promise<void> {
    if (solicitud && solicitud.id) {
      this.descargarPdfBackend(solicitud.id);
      return;
    }
    const doc = await this.generarDocumentoPDF(solicitud);
    if (doc) {
      const nombreArchivo = `Solicitud_Desarrollo_${solicitud.numeroSolicitud || new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
      console.log('PDF - Descargado exitosamente:', nombreArchivo);
    } else {
      this.mostrarAlerta('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.', 'Error en PDF', '❌');
    }
  }

  descargarPdfBackend(id?: number): void {
    if (!id) return;
    this.solicitudesService.descargarPdf(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Solicitud_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, err => {
      console.error('Error al descargar PDF:', err);
      this.mostrarNotificacionSnackbar('Error al descargar el PDF desde el servidor', 'error');
    });
  }

  verPdfBackend(id?: number): void {
    if (!id) return;
    this.solicitudesService.verPdf(id).subscribe(blob => {
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    }, err => {
      console.error('Error al ver PDF:', err);
      this.mostrarNotificacionSnackbar('Error al visualizar el PDF desde el servidor', 'error');
    });
  }

  esCandadoAbierto(solicitud: SolicitudDesarrollo): boolean {
    return solicitud.estado === 'En documentación' || solicitud.estado === 'Pendiente';
  }
}