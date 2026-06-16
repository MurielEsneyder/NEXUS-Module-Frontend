// RUTA: src/app/solicitudes-desarrollo/components/solicitudes-desarrollo/solicitudes-desarrollo.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';

export interface SolicitudDesarrollo {
  id?: number;
  numeroSolicitud?: string;
  objetivo?: string;
  cargosImpactados?: string[];
  detalle?: string;
  impacto?: string;
  requerimientosFuncionales?: { id: string; descripcion: string }[];
  requerimientosNoFuncionales?: { id: string; descripcion: string }[];
  requisitosSeguridad?: string[];
  fechaCreacion: Date;
  estado: string;
  solicitante: string;
  area: string;
  proceso?: string;
  vicepresidencia?: string;
  tipoSolicitud?: string;
  coordinador?: string;
  funcionalAsignado?: string;
  observaciones?: string;
  enEjecucion?: boolean;
}

@Component({
  selector: 'app-solicitudes-desarrollo',
  templateUrl: './solicitudes-desarrollo.component.html',
  styleUrls: ['./solicitudes-desarrollo.component.css']
})
export class SolicitudesDesarrolloComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Formularios reactive (mantenidos por compatibilidad con imports del módulo)
  infoGeneralForm!: FormGroup;
  impactoForm!: FormGroup;
  reqFuncionalesForm!: FormGroup;
  reqNoFuncionalesForm!: FormGroup;
  seguridadForm!: FormGroup;

  // Datos
  solicitudes: SolicitudDesarrollo[] = [];
  solicitudActual: SolicitudDesarrollo = this.inicializarNueva();

  // Vista activa
  vistaActual: 'principal' | 'bandeja' | 'wizard' = 'principal';
  modoEdicion = false;

  // Navegación wizard
  pasoActivo = 0;
  fechaIngreso: any = new Date().toISOString().substring(0, 10);
  impactoTexto = '';
  errorImpacto = false;

  // Modelo del formulario de Información General (ngModel directo)
  formGeneral = {
    solicitudProceso: '',
    proceso: '',
    area: '',
    vicepresidencia: '',
    tipoSolicitud: '',
    observacion: ''
  };

  // Errores de validación del paso 0
  erroresGeneral = {
    proceso: false,
    area: false,
    vicepresidencia: false,
    tipoSolicitud: false
  };

  // Modales
  mostrarModalInf = false;
  solicitudSeleccionada: SolicitudDesarrollo | null = null;
  observacionesModal = '';

  mostrarModalEliminar = false;
  requerimientoAEliminar: { tipo: 'funcional' | 'noFuncional'; index: number; id: string } | null = null;

  mostrarModalExito = false;
  numeroSolicitudExito = '';

  // Columnas tabla bandeja
  columnasBandeja = ['fecha', 'codigo', 'nombre', 'ver', 'estado', 'candado'];

  // Listas de opciones
  procesosSolicitante = [
    'Gestión de Auditoría Integral',
    'Gestión de la Información',
    'Cuentas médicas',
    'Gestión de acceso'
  ];

  areas = [
    'Servicios de salud financiera',
    'Transformación Digital',
    'Talento Humano',
    'Gestión Documental'
  ];

  vicepresidencias = [
    'Vicepresidencia de Salud',
    'Vicepresidencia Administrativa',
    'Vicepresidencia Financiera'
  ];

  tiposSolicitud = ['Proyecto', 'Mejora'];

  cargosDisponibles = [
    'Profesional jurídico',
    'Profesional funcional',
    'Profesional BIG',
    'Profesional de desarrollo',
    'Líder técnico'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.cargarEjemplos();
    // Inicializar formularios reactive (requeridos por módulo)
    this.infoGeneralForm = this.fb.group({});
    this.impactoForm = this.fb.group({});
    this.reqFuncionalesForm = this.fb.group({});
    this.reqNoFuncionalesForm = this.fb.group({});
    this.seguridadForm = this.fb.group({});
  }

  // ============================================================
  // MOCK DATA
  // ============================================================

  private cargarEjemplos(): void {
    this.solicitudes = [
      {
        id: 1, numeroSolicitud: 'SD_001', objetivo: 'PROYECTO JURIDICA',
        detalle: 'Implementar módulo de gestión jurídica...',
        cargosImpactados: ['Profesional jurídico'],
        impacto: 'Mejorará la eficiencia en gestión jurídica...',
        requerimientosFuncionales: [
          { id: 'RF_01', descripcion: 'Generar reporte en formato PDF' },
          { id: 'RF_02', descripcion: 'Filtrar reportes por fecha' }
        ],
        requerimientosNoFuncionales: [{ id: 'RNF_01', descripcion: 'Tiempo de respuesta menor a 3 segundos' }],
        requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-01'),
        estado: 'En documentación', solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital', coordinador: 'Geiber Obando',
        funcionalAsignado: 'Laura Bedoya', enEjecucion: false
      },
      {
        id: 2, numeroSolicitud: 'SD_002', objetivo: 'REGISTRO DE AFILIACIONES',
        detalle: 'Mejorar el registro de afiliaciones...',
        cargosImpactados: ['Profesional BIG'], impacto: 'Optimizará el proceso...',
        requerimientosFuncionales: [{ id: 'RF_01', descripcion: 'Dashboard de afiliaciones' }],
        requerimientosNoFuncionales: [], requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-10'), estado: 'en desarrollo',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA', area: 'Transformación Digital',
        coordinador: 'Geiber Obando', funcionalAsignado: 'Laura Bedoya', enEjecucion: true
      },
      {
        id: 3, numeroSolicitud: 'SD_003', objetivo: 'CUENTAS MEDICAS',
        detalle: 'Optimizar el módulo de cuentas médicas...',
        cargosImpactados: ['Profesional funcional'], impacto: 'Agilizará el proceso...',
        requerimientosFuncionales: [], requerimientosNoFuncionales: [], requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-15'), estado: 'En pruebas funcionales',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA', area: 'Transformación Digital',
        coordinador: 'Geiber Obando', funcionalAsignado: 'Laura Bedoya', enEjecucion: true
      },
      {
        id: 4, numeroSolicitud: 'SD_004', objetivo: 'CUENTAS MEDICAS',
        detalle: 'Nuevo módulo de cuentas médicas...',
        cargosImpactados: ['Profesional funcional'], impacto: 'Mejorará el proceso...',
        requerimientosFuncionales: [], requerimientosNoFuncionales: [], requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-20'), estado: 'En pruebas de aceptación',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA', area: 'Transformación Digital',
        coordinador: 'Geiber Obando', funcionalAsignado: 'Laura Bedoya', enEjecucion: true
      }
    ];
  }

  private inicializarNueva(): SolicitudDesarrollo {
    return {
      fechaCreacion: new Date(), estado: 'pendiente',
      solicitante: '', area: '',
      cargosImpactados: [],
      requerimientosFuncionales: [],
      requerimientosNoFuncionales: [],
      requisitosSeguridad: [], enEjecucion: false
    };
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  mostrarPrincipal(): void { this.vistaActual = 'principal'; }

  mostrarNuevaSolicitud(): void {
    this.solicitudActual = this.inicializarNueva();
    this.vistaActual = 'wizard';
    this.modoEdicion = false;
    this.pasoActivo = 0;
    this.impactoTexto = '';
    this.errorImpacto = false;
    this.fechaIngreso = new Date().toISOString().substring(0, 10);
    this.formGeneral = { solicitudProceso: '', proceso: '', area: '', vicepresidencia: '', tipoSolicitud: '', observacion: '' };
    this.erroresGeneral = { proceso: false, area: false, vicepresidencia: false, tipoSolicitud: false };
  }

  mostrarBandeja(): void { this.vistaActual = 'bandeja'; }

  volverPrincipal(): void { this.vistaActual = 'principal'; }

  irPaso(paso: number): void { this.pasoActivo = paso; }

  // ============================================================
  // VALIDACIONES DE PASOS
  // ============================================================

  avanzarDesdeGeneral(): void {
    this.erroresGeneral = {
      proceso: !this.formGeneral.proceso,
      area: !this.formGeneral.area,
      vicepresidencia: !this.formGeneral.vicepresidencia,
      tipoSolicitud: !this.formGeneral.tipoSolicitud
    };

    const hayError = Object.values(this.erroresGeneral).some(v => v);
    if (hayError) return;

    // Guardar datos en solicitudActual
    this.solicitudActual.proceso = this.formGeneral.proceso;
    this.solicitudActual.area = this.formGeneral.area;
    this.solicitudActual.vicepresidencia = this.formGeneral.vicepresidencia;
    this.solicitudActual.tipoSolicitud = this.formGeneral.tipoSolicitud;
    this.solicitudActual.fechaCreacion = new Date(this.fechaIngreso);
    this.pasoActivo = 1;
  }

  avanzarDesdeImpacto(): void {
    this.errorImpacto = !this.impactoTexto || this.impactoTexto.trim() === '';
    if (this.errorImpacto) return;
    this.solicitudActual.impacto = this.impactoTexto;
    this.pasoActivo = 2;
  }

  // ============================================================
  // BANDEJA - MODAL INF
  // ============================================================

  abrirModalInf(solicitud: SolicitudDesarrollo): void {
    this.solicitudSeleccionada = solicitud;
    this.observacionesModal = solicitud.observaciones || '';
    this.mostrarModalInf = true;
  }

  cerrarModalInf(): void {
    this.mostrarModalInf = false;
    this.solicitudSeleccionada = null;
  }

  guardarObservaciones(): void {
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.observaciones = this.observacionesModal;
      this.cerrarModalInf();
    }
  }

  esCandadoAbierto(solicitud: SolicitudDesarrollo): boolean {
    return !solicitud.enEjecucion;
  }

  // ============================================================
  // GUARDAR SOLICITUD FINAL
  // ============================================================

  guardarSolicitud(): void {
    const consecutivo = this.solicitudes.length + 1;
    const numeroSolicitud = `SD_${String(consecutivo).padStart(3, '0')}`;

    const nueva: SolicitudDesarrollo = {
      ...this.solicitudActual,
      id: consecutivo,
      numeroSolicitud,
      objetivo: this.formGeneral.solicitudProceso || this.formGeneral.proceso,
      impacto: this.impactoTexto,
      estado: 'En documentación',
      enEjecucion: false,
      coordinador: 'Geiber Obando',
      funcionalAsignado: 'Laura Bedoya'
    };

    this.solicitudes.push(nueva);
    this.numeroSolicitudExito = numeroSolicitud;
    this.mostrarModalExito = true;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.mostrarBandeja();
  }

  // ============================================================
  // REQUERIMIENTOS
  // ============================================================

  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string): void {
    if (!descripcion || descripcion.trim() === '') return;

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    const nuevoId = `${prefijo}_${String(lista.length + 1).padStart(2, '0')}`;
    const nuevo = { id: nuevoId, descripcion: descripcion.trim() };

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = [...lista, nuevo];
    } else {
      this.solicitudActual.requerimientosNoFuncionales = [...lista, nuevo];
    }
  }

  confirmarEliminarRequerimiento(tipo: 'funcional' | 'noFuncional', index: number): void {
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);
    if (index < 0 || index >= lista.length) return;
    this.requerimientoAEliminar = { tipo, index, id: lista[index].id };
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.requerimientoAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.requerimientoAEliminar) return;
    const { tipo, index } = this.requerimientoAEliminar;
    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';

    let lista = tipo === 'funcional'
      ? [...(this.solicitudActual.requerimientosFuncionales || [])]
      : [...(this.solicitudActual.requerimientosNoFuncionales || [])];

    lista.splice(index, 1);
    // Re-numerar
    lista = lista.map((req, i) => ({ ...req, id: `${prefijo}_${String(i + 1).padStart(2, '0')}` }));

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = lista;
    } else {
      this.solicitudActual.requerimientosNoFuncionales = lista;
    }
    this.cancelarEliminar();
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get cargosArray() { return this.cargosDisponibles; }

  padNumber(num: number): string {
    return String(num).padStart(2, '0');
  }
}