// RUTA: src/app/solicitudes-desarrollo/components/solicitudes-desarrollo/solicitudes-desarrollo.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { SecurityService } from '../../../../commons/services/security.service';
import { SolicitudesDesarrolloService } from '../../services/solicitudes-desarrollo.service';
import { jsPDF } from 'jspdf';

export interface RequerimientoItem {
  id: string;
  descripcion: string;
  objetivo?: string;
  cargo?: string;
  detalle?: string;
  archivos?: { nombre: string; dataUrl: string }[];
}

export interface SolicitudDesarrollo {
  id?: number;
  numeroSolicitud?: string;
  objetivo?: string;
  cargosImpactados?: string[];
  detalle?: string;
  impacto?: string;
  requerimientosFuncionales?: RequerimientoItem[];
  requerimientosNoFuncionales?: RequerimientoItem[];
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

  datosColaborador = {
    nombreCompleto: '',
    correo: '',
    cargo: '',
    sede: ''
  };

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private solicitudesDesarrolloService: SolicitudesDesarrolloService
  ) {}

  ngOnInit(): void {
    this.cargarEjemplos();
    // Inicializar formularios reactive (requeridos por módulo)
    this.infoGeneralForm = this.fb.group({});
    this.impactoForm = this.fb.group({});
    this.reqFuncionalesForm = this.fb.group({});
    this.reqNoFuncionalesForm = this.fb.group({});
    this.seguridadForm = this.fb.group({});
    this.cargarDatosColaborador();
  }

  cargarDatosColaborador(): void {
    const email = this.securityService.getUserOnSession()?.username;
    if (email) {
      this.solicitudesDesarrolloService.obtenerDatosColaborador(email).subscribe({
        next: (data) => {
          if (data) {
            this.datosColaborador = data;
            this.solicitudActual.solicitante = data.nombreCompleto;
            this.solicitudActual.area = data.sede;
          }
        },
        error: (err) => {
          console.error('Error al obtener datos del colaborador:', err);
        }
      });
    }
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
    this.solicitudActual.numeroSolicitud = 'SD_' + String(this.solicitudes.length + 1).padStart(3, '0');
    this.archivoAdjuntoTemporal = null;
    this.vistaActual = 'wizard';
    this.modoEdicion = false;
    this.pasoActivo = 0;
    this.impactoTexto = '';
    this.errorImpacto = false;
    this.fechaIngreso = new Date().toISOString().substring(0, 10);
    this.formGeneral = { solicitudProceso: '', proceso: '', area: '', vicepresidencia: '', tipoSolicitud: '', observacion: '' };
    this.erroresGeneral = { proceso: false, area: false, vicepresidencia: false, tipoSolicitud: false };
    this.cargarDatosColaborador();
  }

  mostrarBandeja(): void { this.vistaActual = 'bandeja'; }

  volverPrincipal(): void { this.vistaActual = 'principal'; }

  irPaso(paso: number): void { this.pasoActivo = paso; }

  // ============================================================
  // VALIDACIONES DE PASOS
  // ============================================================

  avanzarDesdeColaborador(): void {
    this.pasoActivo = 1;
  }

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
    this.pasoActivo = 2;
  }

  avanzarDesdeImpacto(): void {
    this.errorImpacto = !this.impactoTexto || this.impactoTexto.trim() === '';
    if (this.errorImpacto) return;
    this.solicitudActual.impacto = this.impactoTexto;
    this.pasoActivo = 3;
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
    const numeroSolicitud = this.solicitudActual.numeroSolicitud || `SD_${String(consecutivo).padStart(3, '0')}`;

    const nueva: SolicitudDesarrollo = {
      ...this.solicitudActual,
      id: consecutivo,
      numeroSolicitud,
      solicitante: this.datosColaborador.nombreCompleto || 'Colaborador',
      area: this.datosColaborador.sede || 'Nacional',
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

  archivoAdjuntoTemporal: { nombre: string; dataUrl: string } | null = null;

  seleccionarArchivo(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.archivoAdjuntoTemporal = {
          nombre: file.name,
          dataUrl: e.target.result
        };
      };
      reader.readAsDataURL(file);
    }
  }

  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', objetivo: string, cargo: string = '', detalle: string = ''): void {
    if (!objetivo || objetivo.trim() === '') return;

    const prefijo = tipo === 'funcional' ? 'RF' : 'RNF';
    const lista = tipo === 'funcional'
      ? (this.solicitudActual.requerimientosFuncionales || [])
      : (this.solicitudActual.requerimientosNoFuncionales || []);

    const nuevoId = `${prefijo}_${String(lista.length + 1).padStart(2, '0')}`;
    const nuevo: RequerimientoItem = {
      id: nuevoId,
      descripcion: objetivo.trim(),
      objetivo: objetivo.trim(),
      cargo: cargo,
      detalle: detalle.trim(),
      archivos: this.archivoAdjuntoTemporal ? [this.archivoAdjuntoTemporal] : []
    };

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = [...lista, nuevo];
    } else {
      this.solicitudActual.requerimientosNoFuncionales = [...lista, nuevo];
    }

    this.archivoAdjuntoTemporal = null;
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

  descargarSolicitudPDF(solicitud: SolicitudDesarrollo): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header banner
    doc.setFillColor(52, 177, 182); // brand color #34b1b6
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ASMET SALUD - REQUERIMIENTO DE DESARROLLO', 14, 15);
    
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Solicitud: ${solicitud.numeroSolicitud}  |  Fecha: ${new Date(solicitud.fechaCreacion).toLocaleDateString()}`, 140, 15);

    let y = 35;
    
    // Helper to draw section headers
    const drawSectionHeader = (title: string) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y - 4, 190, 6, 'F');
      doc.setTextColor(50, 50, 50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, 12, y);
      y += 8;
    };

    // Colaborador Info
    drawSectionHeader('INFORMACIÓN DEL COLABORADOR');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Nombre: ${this.datosColaborador.nombreCompleto || solicitud.solicitante || 'No registrado'}`, 14, y);
    doc.text(`Correo: ${this.datosColaborador.correo || 'No registrado'}`, 110, y);
    y += 6;
    doc.text(`Cargo: ${this.datosColaborador.cargo || 'No registrado'}`, 14, y);
    doc.text(`Sede: ${this.datosColaborador.sede || solicitud.area || 'No registrado'}`, 110, y);
    y += 12;

    // General Info
    drawSectionHeader('INFORMACIÓN DE LA SOLICITUD');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Proceso Solicitante: ${solicitud.proceso || 'No especificado'}`, 14, y);
    doc.text(`Área: ${solicitud.area || 'No especificada'}`, 110, y);
    y += 6;
    doc.text(`Vicepresidencia: ${solicitud.vicepresidencia || 'No especificada'}`, 14, y);
    doc.text(`Tipo de Solicitud: ${solicitud.tipoSolicitud || 'No especificada'}`, 110, y);
    y += 12;

    // Impact
    drawSectionHeader('IMPACTO DEL REQUERIMIENTO');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const splitImpact = doc.splitTextToSize(solicitud.impacto || 'Sin descripción', 180);
    doc.text(splitImpact, 14, y);
    y += splitImpact.length * 5 + 8;

    // Helper for Requirements Table
    const drawReqsTable = (title: string, reqs: RequerimientoItem[] | undefined) => {
      drawSectionHeader(title);
      if (!reqs || reqs.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.text('No se registraron requerimientos en esta categoría.', 14, y);
        y += 8;
        return;
      }

      doc.setFont('Helvetica', 'bold');
      doc.text('ID', 14, y);
      doc.text('Objetivo / Cargo', 35, y);
      doc.text('Detalles y Adjuntos', 110, y);
      y += 4;
      doc.line(10, y - 2, 200, y - 2);

      doc.setFont('Helvetica', 'normal');
      reqs.forEach(req => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('Helvetica', 'bold');
        doc.text(req.id, 14, y);
        doc.setFont('Helvetica', 'normal');
        
        const objCargoText = `Obj: ${req.objetivo || req.descripcion || ''}\nCargo: ${req.cargo || 'Todos'}`;
        const splitObj = doc.splitTextToSize(objCargoText, 70);
        doc.text(splitObj, 35, y);

        const adj = (req.archivos && req.archivos.length > 0) ? `\n[Adjunto: ${req.archivos[0].nombre}]` : '';
        const detailText = `${req.detalle || ''}${adj}`;
        const splitDetail = doc.splitTextToSize(detailText, 85);
        doc.text(splitDetail, 110, y);

        const maxHeight = Math.max(splitObj.length * 4.5, splitDetail.length * 4.5);
        y += maxHeight + 4;
        doc.line(10, y - 2, 200, y - 2);
      });
      y += 6;
    };

    drawReqsTable('REQUERIMIENTOS FUNCIONALES', solicitud.requerimientosFuncionales);
    
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    drawReqsTable('REQUERIMIENTOS NO FUNCIONALES', solicitud.requerimientosNoFuncionales);

    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    // Security checklist
    drawSectionHeader('REQUISITOS DE SEGURIDAD');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const segText = 
      "- Autentificación adecuada y control de accesos.\n" +
      "- No uso de campos ocultos para información sensible.\n" +
      "- Comprobación y validación de las entradas.\n" +
      "- Control de límites de valores de salida.\n" +
      "- Asegurar métodos de controles de seguridad privados/finales.\n" +
      "- Evitar uso de datos reales de carácter personal en pruebas.";
    const splitSeg = doc.splitTextToSize(segText, 180);
    doc.text(splitSeg, 14, y);

    doc.save(`Requerimiento_${solicitud.numeroSolicitud}.pdf`);
  }
}