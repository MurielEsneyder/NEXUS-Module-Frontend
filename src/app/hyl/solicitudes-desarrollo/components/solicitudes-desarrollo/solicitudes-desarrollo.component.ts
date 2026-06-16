// RUTA: src/app/solicitudes-desarrollo/components/solicitudes-desarrollo/solicitudes-desarrollo.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  // Información adicional para la bandeja
  coordinador?: string;
  funcionalAsignado?: string;
  observaciones?: string;
  enEjecucion?: boolean; // true = candado cerrado
}

@Component({
  selector: 'app-solicitudes-desarrollo',
  templateUrl: './solicitudes-desarrollo.component.html',
  styleUrls: ['./solicitudes-desarrollo.component.css']
})
export class SolicitudesDesarrolloComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Formularios
  infoGeneralForm!: FormGroup;
  impactoForm!: FormGroup;
  reqFuncionalesForm!: FormGroup;
  reqNoFuncionalesForm!: FormGroup;
  seguridadForm!: FormGroup;

  // Datos
  solicitudes: SolicitudDesarrollo[] = [];
  solicitudActual: SolicitudDesarrollo = this.inicializarNueva();

  // Estado de la vista
  vistaActual: 'principal' | 'bandeja' | 'wizard' = 'principal';

  // Estado del wizard
  modoEdicion = false;

  // Navegación de tabs manuales del wizard
  pasoActivo = 0;
  impactoTexto = '';

  // Referencia a String para usar en el template
  String = String;

  // Modal de información
  mostrarModalInf = false;
  solicitudSeleccionada: SolicitudDesarrollo | null = null;
  observacionesModal = '';

  // Modal de confirmación de eliminación de requerimiento
  mostrarModalEliminar = false;
  requerimientoAEliminar: { tipo: 'funcional' | 'noFuncional'; index: number; id: string } | null = null;

  // Modal de éxito (guardar)
  mostrarModalExito = false;
  numeroSolicitudExito = '';

  // Columnas de la tabla de bandeja
  columnasBandeja = ['fecha', 'codigo', 'nombre', 'ver', 'estado', 'candado'];

  // Listas de opciones
  cargosDisponibles = [
    'Profesional jurídico',
    'Profesional funcional',
    'Profesional BIG',
    'Profesional de desarrollo',
    'Líder técnico'
  ];

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

  requisitosSeguridadList = [
    'Autentificar adecuadamente',
    'No utilizar campos ocultos para almacenar información sensible',
    'Comprobar las entradas',
    'Valores límite de salida',
    'Formato de salida',
    'Asegurar métodos de seguridad',
    'Evitar el uso de datos reales de carácter personal'
  ];

  constructor(private fb: FormBuilder) {
    this.crearFormularios();
  }

  ngOnInit(): void {
    this.cargarEjemplos();
  }

  private crearFormularios(): void {
    this.infoGeneralForm = this.fb.group({
      proceso: ['', Validators.required],
      area: ['', Validators.required],
      vicepresidencia: ['', Validators.required],
      tipoSolicitud: ['', Validators.required],
      objetivo: ['', [Validators.required, Validators.minLength(3)]],
      cargos: [[], Validators.required],
      detalle: ['', [Validators.required, Validators.maxLength(2000)]],
      fechaIngreso: [new Date()]
    });

    this.impactoForm = this.fb.group({
      impacto: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.reqFuncionalesForm = this.fb.group({
      requerimientos: this.fb.array([])
    });

    this.reqNoFuncionalesForm = this.fb.group({
      requerimientos: this.fb.array([])
    });

    this.seguridadForm = this.fb.group({
      requisitosSeguridad: [[]]
    });
  }

  private inicializarNueva(): SolicitudDesarrollo {
    return {
      fechaCreacion: new Date(),
      estado: 'pendiente',
      solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
      area: 'Transformación Digital',
      cargosImpactados: [],
      requerimientosFuncionales: [],
      requerimientosNoFuncionales: [],
      requisitosSeguridad: [],
      enEjecucion: false
    };
  }

  private cargarEjemplos(): void {
    this.solicitudes = [
      {
        id: 1,
        numeroSolicitud: 'SD_001',
        objetivo: 'PROYECTO JURIDICA',
        detalle: 'Implementar módulo de gestión jurídica...',
        cargosImpactados: ['Profesional jurídico', 'Profesional funcional'],
        impacto: 'Mejorará la eficiencia en gestión jurídica...',
        requerimientosFuncionales: [
          { id: 'RF_01', descripcion: 'Generar reporte en formato PDF' },
          { id: 'RF_02', descripcion: 'Filtrar reportes por fecha' }
        ],
        requerimientosNoFuncionales: [
          { id: 'RNF_01', descripcion: 'Tiempo de respuesta menor a 3 segundos' }
        ],
        requisitosSeguridad: ['Autentificar adecuadamente', 'Comprobar las entradas'],
        fechaCreacion: new Date('2026-01-01'),
        estado: 'En documentación',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital',
        coordinador: 'Geiber Obando',
        funcionalAsignado: 'Laura Bedoya',
        enEjecucion: false
      },
      {
        id: 2,
        numeroSolicitud: 'SD_002',
        objetivo: 'REGISTRO DE AFILIACIONES',
        detalle: 'Mejorar el registro de afiliaciones...',
        cargosImpactados: ['Profesional BIG'],
        impacto: 'Optimizará el proceso de afiliaciones...',
        requerimientosFuncionales: [
          { id: 'RF_01', descripcion: 'Nuevo dashboard de afiliaciones' }
        ],
        requerimientosNoFuncionales: [],
        requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-10'),
        estado: 'en desarrollo',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital',
        coordinador: 'Geiber Obando',
        funcionalAsignado: 'Laura Bedoya',
        enEjecucion: true
      },
      {
        id: 3,
        numeroSolicitud: 'SD_003',
        objetivo: 'CUENTAS MEDICAS',
        detalle: 'Optimizar el módulo de cuentas médicas...',
        cargosImpactados: ['Profesional funcional'],
        impacto: 'Agilizará el proceso de cuentas médicas...',
        requerimientosFuncionales: [],
        requerimientosNoFuncionales: [],
        requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-15'),
        estado: 'En pruebas funcionales',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital',
        coordinador: 'Geiber Obando',
        funcionalAsignado: 'Laura Bedoya',
        enEjecucion: true
      },
      {
        id: 4,
        numeroSolicitud: 'SD_004',
        objetivo: 'CUENTAS MEDICAS',
        detalle: 'Nuevo módulo de cuentas médicas...',
        cargosImpactados: ['Profesional funcional'],
        impacto: 'Mejorará el proceso de cuentas médicas...',
        requerimientosFuncionales: [],
        requerimientosNoFuncionales: [],
        requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-20'),
        estado: 'En pruebas de aceptación',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital',
        coordinador: 'Geiber Obando',
        funcionalAsignado: 'Laura Bedoya',
        enEjecucion: true
      }
    ];
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  mostrarPrincipal(): void {
    this.vistaActual = 'principal';
  }

  mostrarNuevaSolicitud(): void {
    this.solicitudActual = this.inicializarNueva();
    this.vistaActual = 'wizard';
    this.modoEdicion = false;
    this.pasoActivo = 0;
    this.impactoTexto = '';
    this.resetearFormularios();
    if (this.stepper) {
      this.stepper.reset();
    }
  }

  mostrarBandeja(): void {
    this.vistaActual = 'bandeja';
  }

  volverPrincipal(): void {
    this.vistaActual = 'principal';
  }

  irPaso(paso: number): void {
    this.pasoActivo = paso;
  }

  irPasoSiguienteImpacto(): void {
    if (!this.impactoTexto || this.impactoTexto.trim() === '') {
      alert('Debe describir el impacto antes de continuar.');
      return;
    }
    this.pasoActivo = 2;
  }

  private resetearFormularios(): void {
    this.infoGeneralForm.reset({ fechaIngreso: new Date() });
    this.impactoForm.reset();
    this.reqFuncionalesForm.reset();
    this.reqNoFuncionalesForm.reset();
    this.seguridadForm.reset();
  }

  // ============================================================
  // BANDEJA - MODAL DE INFORMACIÓN
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
  // GUARDAR SOLICITUD
  // ============================================================

  guardarSolicitud(): void {
    const datosCompletos: SolicitudDesarrollo = {
      ...this.solicitudActual,
      ...this.infoGeneralForm.value,
      ...this.impactoForm.value,
      ...this.reqFuncionalesForm.value,
      ...this.reqNoFuncionalesForm.value,
      ...this.seguridadForm.value
    };

    const consecutivo = this.solicitudes.length + 1;
    datosCompletos.numeroSolicitud = `SD_${String(consecutivo).padStart(3, '0')}`;
    datosCompletos.estado = 'En documentación';
    datosCompletos.enEjecucion = false;
    datosCompletos.coordinador = 'Geiber Obando';
    datosCompletos.funcionalAsignado = 'Laura Bedoya';

    if (this.modoEdicion && datosCompletos.id) {
      const index = this.solicitudes.findIndex(s => s.id === datosCompletos.id);
      if (index !== -1) {
        this.solicitudes[index] = { ...datosCompletos };
      }
    } else {
      datosCompletos.id = this.solicitudes.length + 1;
      this.solicitudes.push({ ...datosCompletos });
    }

    this.numeroSolicitudExito = datosCompletos.numeroSolicitud;
    this.mostrarModalExito = true;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.mostrarBandeja();
  }

  // ============================================================
  // MÉTODOS PARA MANEJAR REQUERIMIENTOS
  // ============================================================

  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string): void {
    if (!descripcion || descripcion.trim() === '') return;

    let lista: { id: string; descripcion: string }[];
    let prefijo: string;

    if (tipo === 'funcional') {
      lista = this.solicitudActual.requerimientosFuncionales || [];
      prefijo = 'RF';
    } else {
      lista = this.solicitudActual.requerimientosNoFuncionales || [];
      prefijo = 'RNF';
    }

    const siguienteNumero = lista.length + 1;
    const nuevoId = `${prefijo}_${String(siguienteNumero).padStart(2, '0')}`;

    const nuevoRequerimiento = { id: nuevoId, descripcion: descripcion.trim() };

    if (tipo === 'funcional') {
      if (!this.solicitudActual.requerimientosFuncionales) {
        this.solicitudActual.requerimientosFuncionales = [];
      }
      this.solicitudActual.requerimientosFuncionales = [...this.solicitudActual.requerimientosFuncionales, nuevoRequerimiento];
    } else {
      if (!this.solicitudActual.requerimientosNoFuncionales) {
        this.solicitudActual.requerimientosNoFuncionales = [];
      }
      this.solicitudActual.requerimientosNoFuncionales = [...this.solicitudActual.requerimientosNoFuncionales, nuevoRequerimiento];
    }
  }

  confirmarEliminarRequerimiento(tipo: 'funcional' | 'noFuncional', index: number): void {
    let lista: { id: string; descripcion: string }[];

    if (tipo === 'funcional') {
      lista = this.solicitudActual.requerimientosFuncionales || [];
    } else {
      lista = this.solicitudActual.requerimientosNoFuncionales || [];
    }

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
    let lista: { id: string; descripcion: string }[];
    let prefijo: string;

    if (tipo === 'funcional') {
      lista = [...(this.solicitudActual.requerimientosFuncionales || [])];
      prefijo = 'RF';
    } else {
      lista = [...(this.solicitudActual.requerimientosNoFuncionales || [])];
      prefijo = 'RNF';
    }

    lista.splice(index, 1);

    // Re-numerar automáticamente
    lista.forEach((req, i) => {
      req.id = `${prefijo}_${String(i + 1).padStart(2, '0')}`;
    });

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = lista;
    } else {
      this.solicitudActual.requerimientosNoFuncionales = lista;
    }

    this.cancelarEliminar();
  }

  editarRequerimiento(tipo: 'funcional' | 'noFuncional', req: { id: string; descripcion: string }): void {
    // Autocompletar el formulario con los datos del requerimiento seleccionado para su edición
    // (Comportamiento: cargar datos en el formulario inferior para actualizar)
    const nueva = prompt(`Editando ${req.id}\nIngrese la nueva descripción:`, req.descripcion);
    if (nueva !== null && nueva.trim() !== '') {
      req.descripcion = nueva.trim();
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get cargosArray() {
    return this.cargosDisponibles;
  }

  get requisitosSeguridadArray() {
    return this.requisitosSeguridadList;
  }
}