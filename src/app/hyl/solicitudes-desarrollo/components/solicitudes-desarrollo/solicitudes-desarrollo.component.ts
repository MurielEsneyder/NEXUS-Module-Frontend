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
  estado: 'pendiente' | 'en progreso' | 'completada' | 'rechazada';
  solicitante: string;
  area: string;
  proceso?: string;
  vicepresidencia?: string;
  tipoSolicitud?: string;
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
      objetivo: ['', [Validators.required, Validators.minLength(10)]],
      cargos: [[], Validators.required],
      detalle: ['', [Validators.required, Validators.maxLength(2000)]],
      fechaIngreso: [new Date()]
    });

    this.impactoForm = this.fb.group({
      impacto: ['', [Validators.required, Validators.minLength(20)]]
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
      requisitosSeguridad: []
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
        estado: 'en progreso',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital'
      },
      {
        id: 2,
        numeroSolicitud: 'SD_002',
        objetivo: 'REGISTRO DE AFILIACIONES',
        detalle: 'Mejorar el registro de afiliaciones...',
        cargosImpactados: ['Profesional BIG'],
        impacto: 'Optimizará el proceso de afiliaciones...',
        requerimientosFuncionales: [
          { id: 'RF_03', descripcion: 'Nuevo dashboard de afiliaciones' }
        ],
        requerimientosNoFuncionales: [],
        requisitosSeguridad: [],
        fechaCreacion: new Date('2026-01-10'),
        estado: 'pendiente',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital'
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
        estado: 'completada',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital'
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
        estado: 'rechazada',
        solicitante: 'LAURA ALEJANDRA BEDOYA MERA',
        area: 'Transformación Digital'
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

  private resetearFormularios(): void {
    this.infoGeneralForm.reset({
      fechaIngreso: new Date()
    });
    this.impactoForm.reset();
    this.reqFuncionalesForm.reset();
    this.reqNoFuncionalesForm.reset();
    this.seguridadForm.reset();
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

    if (this.modoEdicion && datosCompletos.id) {
      const index = this.solicitudes.findIndex(s => s.id === datosCompletos.id);
      if (index !== -1) {
        this.solicitudes[index] = { ...datosCompletos };
      }
    } else {
      datosCompletos.id = this.solicitudes.length + 1;
      this.solicitudes.push({ ...datosCompletos });
    }

    // Mostrar mensaje de éxito y volver a la bandeja
    alert(`✅ Solicitud ${datosCompletos.numeroSolicitud} guardada exitosamente`);
    this.mostrarBandeja();
  }

  // ============================================================
  // MÉTODOS PARA MANEJAR REQUERIMIENTOS
  // ============================================================

  agregarRequerimiento(tipo: 'funcional' | 'noFuncional', descripcion: string): void {
    if (!descripcion || descripcion.trim() === '') {
      alert('⚠️ Por favor ingrese una descripción para el requerimiento');
      return;
    }

    let lista: { id: string; descripcion: string }[];
    let prefijo: string;

    if (tipo === 'funcional') {
      lista = this.solicitudActual.requerimientosFuncionales || [];
      prefijo = 'RF';
    } else {
      lista = this.solicitudActual.requerimientosNoFuncionales || [];
      prefijo = 'RNF';
    }

    const numeros = lista
      .map(r => parseInt(r.id.replace(`${prefijo}_`, '')))
      .filter(n => !isNaN(n));
    const siguienteNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    const nuevoId = `${prefijo}_${String(siguienteNumero).padStart(2, '0')}`;

    const nuevoRequerimiento = {
      id: nuevoId,
      descripcion: descripcion.trim()
    };

    if (tipo === 'funcional') {
      if (!this.solicitudActual.requerimientosFuncionales) {
        this.solicitudActual.requerimientosFuncionales = [];
      }
      this.solicitudActual.requerimientosFuncionales.push(nuevoRequerimiento);
    } else {
      if (!this.solicitudActual.requerimientosNoFuncionales) {
        this.solicitudActual.requerimientosNoFuncionales = [];
      }
      this.solicitudActual.requerimientosNoFuncionales.push(nuevoRequerimiento);
    }
  }

  eliminarRequerimiento(tipo: 'funcional' | 'noFuncional', index: number): void {
    let lista: { id: string; descripcion: string }[];
    let prefijo: string;

    if (tipo === 'funcional') {
      lista = this.solicitudActual.requerimientosFuncionales || [];
      prefijo = 'RF';
    } else {
      lista = this.solicitudActual.requerimientosNoFuncionales || [];
      prefijo = 'RNF';
    }

    if (index < 0 || index >= lista.length) return;

    const requerimientoEliminar = lista[index];
    if (!confirm(`¿Está seguro que desea eliminar el ${requerimientoEliminar.id}?`)) {
      return;
    }

    lista.splice(index, 1);

    lista.forEach((req, i) => {
      const nuevoNumero = i + 1;
      req.id = `${prefijo}_${String(nuevoNumero).padStart(2, '0')}`;
    });

    if (tipo === 'funcional') {
      this.solicitudActual.requerimientosFuncionales = lista;
    } else {
      this.solicitudActual.requerimientosNoFuncionales = lista;
    }
  }

  editarRequerimiento(tipo: 'funcional' | 'noFuncional', index: number): void {
    let lista: { id: string; descripcion: string }[];

    if (tipo === 'funcional') {
      lista = this.solicitudActual.requerimientosFuncionales || [];
    } else {
      lista = this.solicitudActual.requerimientosNoFuncionales || [];
    }

    if (index < 0 || index >= lista.length) return;

    const req = lista[index];
    const nuevaDescripcion = prompt(
      `Editando ${req.id}\nIngrese la nueva descripción:`,
      req.descripcion
    );

    if (nuevaDescripcion !== null && nuevaDescripcion.trim() !== '') {
      req.descripcion = nuevaDescripcion.trim();
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