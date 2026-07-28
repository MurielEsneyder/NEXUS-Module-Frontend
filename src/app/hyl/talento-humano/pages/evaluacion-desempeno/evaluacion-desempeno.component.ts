import { Component, ChangeDetectionStrategy, AfterViewInit, OnInit, ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { EvaluacionDesempenoService } from '../../services/evaluacion-desempeno.service';
import { NexusSecurityService } from '../../../shared/services/nexus-security.service';
import { CommonService } from 'src/commons/services/common.service';
import { PersonalElement, Cuestionario, ItemsCuestionario, Pregunta, OpcinesEvaluador, PorcentajeCuestionario } from '../../models/telento-humano';

@Component({
  selector: 'app-evaluacion-desempeno',
  templateUrl: './evaluacion-desempeno.component.html',
  styleUrl: './evaluacion-desempeno.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluacionDesempenoComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['position', 'Nombre', 'Cargo', 'EvaluacionCompetencias', 'EvaluacionDesempeno', 'EvaluacionCompetenciasAuto', 'EvaluacionDesempenoAuto', 'Total', 'Acciones'];
  displayedColumnsAutoevaluacion: string[] = ['position', 'Nombre', 'Cargo', 'EvaluacionCompetenciasAuto', 'EvaluacionDesempenoAuto', 'Acciones'];
  cargosEvaluadores: OpcinesEvaluador[] = [];
  filtroFinalEvaluadores: OpcinesEvaluador[] = [];
  filtroOpcionesEvaluacion = new Set();

  PERSONAL_DATA: PersonalElement[] = [];
  dataSource = new MatTableDataSource<PersonalElement>([]);

  PERSONAL_DATA_AUTOEVALUACION: PersonalElement[] = [];
  dataSourceAutoEvalauacion = new MatTableDataSource<PersonalElement>([]);


  cuestionario: any[] = [];
  itemsCuestionario: any[] = [];
  preguntas: any[] = [];


  dataItems: any[] = [];
  userSesssion: any = null;
  datosEvaluador: any = {};
  escalaCalificacion = [1, 2, 3, 4, 5];
  dataPersonasEvaluar: any = [];
  dataPersonaAutoevaluacion: any = [];
  dataRespuestas: any = [];
  empleadoSeleccionado: any = [];
  visualizarInformacion = false;
  cuestionarioTemporal: any = [];
  respuestas: any = [];
  fecha: string = '';
  periodo: number = 0;
  sumatoriaCompetencia = 0;
  sumatoriaDesempeno = 0;
  sumatoriaCompetenciaAuto = 0;
  sumatoriaDesempenoAuto = 0;
  isAutoEvaluacion = true;
  rol_si_evaldesempeno_niv1 = false;
  rol_si_evaldesempeno_niv0 = false;

  porcentajesCuest: Array<PorcentajeCuestionario> = [] as Array<PorcentajeCuestionario>;
  porcentajesItemCuest: Array<PorcentajeCuestionario> = [] as Array<PorcentajeCuestionario>;


  @ViewChild(MatPaginator) paginator: MatPaginator = {} as MatPaginator;
  @ViewChild(MatPaginator) paginatorAutoevaluacion: MatPaginator = {} as MatPaginator;
  @ViewChild('dialogContent') dialogContent!: TemplateRef<any>;
  @ViewChild('stepper') stepper!: MatStepper;

  dialogRef: MatDialogRef<any> | null = null;

  form!: FormGroup;
  control: any = {};


  constructor(private evaluacionService: EvaluacionDesempenoService, public dialog: MatDialog, private Security: NexusSecurityService, private commonService: CommonService, private cdRef: ChangeDetectorRef, private router: Router,) {

  }

  ngOnInit(): void {
    this.OpcionesEvaluadores();
    this.userSesssion = this.Security.getUserOnSession()?.username;

    if (this.userSesssion) {
      this.obtenerInfoEvaluador();
      this.obtenerDataCuestionario(this.userSesssion);
    }



    let roles = this.Security.getLocalToken()?.roles;
    this.rol_si_evaldesempeno_niv1 = roles?.includes('si_evaldesempeno_niv1');
    this.rol_si_evaldesempeno_niv0 = roles?.includes('si_evaldesempeno_niv0');
    this.obtenerFecha();
    this.cargarPorcentajesCuestionarios()
    this.cargarPorcentajesItemsCuestionarios()



  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSourceAutoEvalauacion.paginator = this.paginatorAutoevaluacion;

  }

  obtenerFecha() {
    const _fecha = new Date();
    const _dia = _fecha.getUTCDate().toString().padStart(2, '0');
    const _mes = (_fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const _anio = _fecha.getUTCFullYear();
    this.fecha = `${_anio}-${_mes}-${_dia}`;
    this.periodo = _anio;
  }

  OpcionesEvaluadores() {

    this.evaluacionService.getOpcionesEvaluador().subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {
            this.cargosEvaluadores = data;
          }
        },
        error: (err) => {
          this.commonService.openSnackBar(err, "error");
        }
      }
    )

  }

  consultarPersonal(valor: number): void {

    this.PERSONAL_DATA = this.dataPersonasEvaluar.filter((element: any) => element.nivelCargo.idListaValor == valor);
    this.dataSource = new MatTableDataSource(this.PERSONAL_DATA);
    this.dataSource.paginator = this.paginator;
    this.sumatoriaPorcentaje();


  }

  consultarPersonaAutoevaluacion() {
    this.PERSONAL_DATA_AUTOEVALUACION = this.dataPersonaAutoevaluacion;
    this.dataSourceAutoEvalauacion = new MatTableDataSource(this.PERSONAL_DATA_AUTOEVALUACION);
    this.dataSourceAutoEvalauacion.paginator = this.paginatorAutoevaluacion;
  }

  obtenerInfoEvaluador() {
    let model = { usuario: this.userSesssion }


    this.evaluacionService.getInfoEvaluador(model).subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {
            this.datosEvaluador = data[0];
            this.obtenerPersonaAutoEvaluacion();
            this.obtenerPersonasEvaluar();
          } else {

            this.obtenerPersonaAutoEvaluacion();
          }
        },
        error: (err) => {
          this.commonService.openSnackBar(err, "error");
        }
      }
    )
  }

  obtenerPersonasEvaluar() {
    let banderaEvaluacion = 1;
    let model = { idCargoEvaluador: this.datosEvaluador.idCargo, periodo: this.periodo, email: this.userSesssion, bandera: banderaEvaluacion }
    this.evaluacionService.getInfoPersonasEvaluar(model).subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {
            this.ordenarInfoRespuestas(data, banderaEvaluacion);

          }
        },
        error: (err) => {
          this.commonService.openSnackBar(err, "error");
        }
      }
    )
  }

  obtenerPersonaAutoEvaluacion() {
    let banderaAutoevaluacion = 2;
    let model = { idCargoEvaluador: 0, periodo: this.periodo, email: this.userSesssion, bandera: banderaAutoevaluacion }
    this.evaluacionService.getInfoPersonasEvaluar(model).subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {
            this.ordenarInfoRespuestas(data, banderaAutoevaluacion);

          }
        },
        error: (err) => {
          this.commonService.openSnackBar(err, "error");
        }
      }
    )
  }


  ordenarInfoRespuestas(data: any, bandera: number) {

    let respuestasOrganizadas: any = [];


    data.map((object: any) => {

      let cuestionario: any = [];
      let resp: any;
      resp = object.respuestas;


      if (resp != null) {
        resp.map((elemento: any) => {

          let item = elemento.pregunta["itemsCuestionario"];
          let busqueda = cuestionario.findIndex((el: any) => el.idCuestionario == item.cuestionario["idCuestionario"]);

          let itemCuestionarioPost = this.porcentajesItemCuest.find((itemx: any) => itemx['itemsCuestionario'].idItemsCuestionario == item.idItemsCuestionario && elemento['pregunta']['clasificacionPreg']['idListaValor'] == itemx['comListaValores']['idListaValor']);

          item['valorPonderado'] = itemCuestionarioPost?.valorPonderado;
          if (busqueda == -1) {
            let auxiliarCuest = { ...item }
            delete auxiliarCuest.cuestionario;
            item.cuestionario["itemsCuestionario"] = [auxiliarCuest];
            cuestionario.push(item.cuestionario);
            busqueda = cuestionario.length - 1;

          }
          let elModificando = cuestionario[busqueda]["itemsCuestionario"];

          let busqItem = elModificando.findIndex((el: any) => el.idItemsCuestionario == item.idItemsCuestionario);
          if (busqItem == -1) {
            cuestionario[busqueda]["itemsCuestionario"].push(item)
            busqItem = cuestionario[busqueda]["itemsCuestionario"].length - 1;

          }
          if (!("respuestas" in cuestionario[busqueda]["itemsCuestionario"][busqItem])) {
            cuestionario[busqueda]["itemsCuestionario"][busqItem]["respuestas"] = [];
          }
          delete elemento.pregunta["itemsCuestionario"];

          cuestionario[busqueda]["itemsCuestionario"][busqItem]["respuestas"].push(elemento);

        })
        object["respOrdenadas"] = cuestionario;

      }
      else {
        object["respOrdenadas"] = [];
      }
      respuestasOrganizadas.push(object);

    });

    this.calcularResultadoEvaluados(respuestasOrganizadas, bandera);
  }

  calcularResultadoEvaluados(data: any, bandera: number): void {
    let dataPersonas: any = [];

    data.map((element: any) => {

      let cuestionarios = element["respOrdenadas"];

      cuestionarios?.map((cuestionario: any) => {
        let cuestionarioTemp: any = {};
        let items = cuestionario['itemsCuestionario'];
        let itemsResultados: any = [];
        let sumResult = 0;
        cuestionarioTemp = this.porcentajesCuest.find((cuest: any) => cuest.cuestionario.idCuestionario == cuestionario.idCuestionario && element['tipoCargo']['idListaValor'] == cuest['comListaValores']['idListaValor']);
        items.map((item: any) => {
          let respuestas = item['respuestas'];
          let ponderado = item['valorPonderado'];

          let totalPreguntas = respuestas.length;

          if (totalPreguntas > 0) {
            let resultado = 0;
            respuestas.map((respuesta: any) => {
              resultado += respuesta['respuesta'];
            })

            resultado = (resultado / totalPreguntas) * (ponderado / 100);

            item['itemResultado'] = parseFloat(resultado.toFixed(2));
            sumResult += parseFloat(resultado.toFixed(2));
            itemsResultados.push({ ponderado: ponderado, itemsResultado: parseFloat(resultado.toFixed(2)) })
          } else {
            item['itemResultado'] = null;
          }
        })

        let evaluacion = 0;


        sumResult = (sumResult * (cuestionarioTemp["valorPonderado"] / 100)) / 5;

        cuestionario['evaluacion'] = parseFloat(sumResult.toFixed(2));

      })
      dataPersonas.push(element);
      this.filtroOpcionesEvaluacion.add(element.nivelCargo.idListaValor);
    })


    if (bandera == 1) {
      this.dataPersonasEvaluar = dataPersonas;


      let cargosFiltrados = [...this.filtroOpcionesEvaluacion];

      let filtros: OpcinesEvaluador[] = [];
      cargosFiltrados.forEach((x: any) => {
        this.cargosEvaluadores.forEach((d: OpcinesEvaluador) => {
          if (x == d.idListaValor) {
            filtros.push(d);
          }
        })
      })
      this.filtroFinalEvaluadores = [...filtros];
      this.cdRef.detectChanges();


    }

    if (bandera == 2) {
      this.dataPersonaAutoevaluacion = dataPersonas;
      this.consultarPersonaAutoevaluacion();
    }

  }

  obtenerPorcentaje(data: any, idCuestionario: number): string {
    let cuestionario = data['respOrdenadas'].find((x: any) => x.idCuestionario == idCuestionario);
    if (cuestionario) {
      return (cuestionario['evaluacion'] * 100).toFixed(1) + '%';
    }
    return 'sin evaluar';
  }

  resultadoTotal(data: any): number {
    let respuestas = data.respOrdenadas;

    let resEvaluacion = 0;
    let resAutoEvaluacion = 0;
    let total = 0;

    if (respuestas.length > 0) {
      respuestas.forEach((item: any) => {

        if (item.idCuestionario == 1 || item.idCuestionario == 2) {
          resEvaluacion += item.evaluacion;
        }
        if (item.idCuestionario == 3 || item.idCuestionario == 4) {
          resAutoEvaluacion += item.evaluacion;
        }
      });

      total = ((resEvaluacion * 0.8) + (resAutoEvaluacion * 0.2)) * 100;
      return parseFloat(total.toFixed(1));
    } else {
      return 0;
    }
  }

  sumatoriaPorcentaje(): void {
    this.sumatoriaCompetencia = 0;
    this.sumatoriaDesempeno = 0;
    this.sumatoriaCompetenciaAuto = 0;
    this.sumatoriaDesempenoAuto = 0;
    let sumCompetencia = 0;
    let sumDesempeno = 0;
    let sumCompetenciaAuto = 0;
    let sumDesempenoAuto = 0;

    let totalPersona = this.PERSONAL_DATA.length;
    if (totalPersona > 0) {
      this.PERSONAL_DATA.map((data: any) => {
        data['respOrdenadas'].map((res: any) => {

          if (res['idCuestionario'] == 1) {
            sumCompetencia += (res['evaluacion'] * 100);
          }
          if (res['idCuestionario'] == 2) {
            sumDesempeno += (res['evaluacion'] * 100);
          }
          if (res['idCuestionario'] == 3) {
            sumCompetenciaAuto += (res['evaluacion'] * 100);
          }
          if (res['idCuestionario'] == 4) {
            sumDesempenoAuto += (res['evaluacion'] * 100);
          }
        })
      })

      this.sumatoriaCompetencia = parseFloat((sumCompetencia / totalPersona).toFixed(2));
      this.sumatoriaDesempeno = parseFloat((sumDesempeno / totalPersona).toFixed(2));
      this.sumatoriaCompetenciaAuto = parseFloat((sumCompetenciaAuto / totalPersona).toFixed(2));
      this.sumatoriaDesempenoAuto = parseFloat((sumDesempenoAuto / totalPersona).toFixed(2));
    }

  }





  obtenerDataCuestionario(user: string): void {
    let model = {
      usuario: user
    }

    this.evaluacionService.getCuestionario(model).subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {

            this.extraerInfoCuestionario(data);
          }
        },
        error: (err) => {
          this.commonService.openSnackBar("error al obtener cuestionario..", "error");
        }
      }
    )
  }
  //
  extraerInfoCuestionario(data: any): void {

    const _preguntas: any = [];
    const _itemCuestionario: any = [];
    const _cuestionario: any = [];




    data.forEach((element: Pregunta) => {
      const { itemsCuestionario } = element;
      if (itemsCuestionario && itemsCuestionario.cuestionario) {
        const { cuestionario } = itemsCuestionario;

        _preguntas.push({ ...element, itemsCuestionario: undefined, idItemsCuestionario: itemsCuestionario.idItemsCuestionario });
        _itemCuestionario.push({ ...itemsCuestionario, cuestionario: undefined, idCuestionario: cuestionario.idCuestionario });
        _cuestionario.push(cuestionario);
      } else {

        _preguntas.push({ ...element, itemsCuestionario: undefined });
        _itemCuestionario.push({ ...itemsCuestionario });

      }

    });




    const uniqueCuestionarios = _cuestionario.reduce((acc: any, current: any) => {

      if (!acc.some((item: Cuestionario) => item.idCuestionario === current.idCuestionario)) {
        acc.push(current);
      }
      return acc;
    }, []);


    const uniqueItemCuestionario = _itemCuestionario.reduce((acc: any, current: any) => {

      if (!acc.some((item: ItemsCuestionario) => item.idItemsCuestionario === current.idItemsCuestionario)) {
        acc.push(current);
      }
      return acc;
    }, []);


    this.cuestionario = [...uniqueCuestionarios];
    this.itemsCuestionario = [...uniqueItemCuestionario];
    this.preguntas = [..._preguntas];
  }

  openDialog(empleado: any, opcionCuestionario: number): void {

    this.cuestionarioTemporal = [...this.cuestionario];
    this.visualizarInformacion = false;
    this.dialogRef = this.dialog.open(this.dialogContent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      data: empleado
    });




    let localCuestionario = JSON.parse(localStorage.getItem('ThPorcentajesCuestionario') || '');

    this.cuestionarioTemporal.forEach((element: any) => {

      localCuestionario.forEach((cuest: any) => {
        if (element.idCuestionario == cuest['cuestionario']['idCuestionario'] && empleado['tipoCargo']['idListaValor'] == cuest['comListaValores']['idListaValor']) {
          element['porcentaje'] = cuest['valorPonderado'];
        }
      });
    });




    if (opcionCuestionario != 1) {
      this.cuestionarioTemporal = this.cuestionario.filter((x: any) => x.idCuestionario >= 3);


    }




    this.empleadoSeleccionado = empleado;

    if (this.datosEvaluador?.descCargoEvaluador?.includes('AGENTE INTERVENTOR')) {
      this.obtenerDataCuestionario(empleado.email);
    }





    this.dialogRef.afterClosed().subscribe(result => {

      this.resetStepper();
      this.dataItems = [];
      this.visualizarInformacion = false;
      this.isAutoEvaluacion = true;
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.visualizarInformacion = false;
      this.isAutoEvaluacion = true;
      this.dialogRef.close();
    }
  }

  listarItemCuestionario(cuestionario: number, data: any): void {

    let dataInicial: any[] = [];
    let dataPregunta: any[] = [];
    this.isAutoEvaluacion = true;


    this.itemsCuestionario.forEach((x) => {
      if (x.idCuestionario == cuestionario) {
        dataPregunta = [];
        let itemCuestionarioPost;
        this.preguntas.forEach((z) => {

          if (z.idItemsCuestionario == x.idItemsCuestionario && z.clasificacionPreg.idListaValor == this.empleadoSeleccionado.tipoCargo.idListaValor) {
            dataPregunta.push(z);
          }
        })



        itemCuestionarioPost = this.porcentajesItemCuest.find((item: any) => item['itemsCuestionario'].idItemsCuestionario == x.idItemsCuestionario && this.empleadoSeleccionado['tipoCargo'].idListaValor == item['comListaValores'].idListaValor);


        x['valorPonderado'] = itemCuestionarioPost?.valorPonderado;
        dataInicial.push({ data: x, preguntas: dataPregunta });
      }
    })

    dataInicial = dataInicial.filter(data => data.preguntas.length > 0);

    if (this.empleadoSeleccionado['respOrdenadas']) {
      let encontroInfo = this.empleadoSeleccionado['respOrdenadas'].find((d: any) => d.idCuestionario == cuestionario);
      if (encontroInfo) {
        this.visualizarInformacion = true;
        this.dataItems = dataInicial;
        this.respuestas = encontroInfo;
        return;
      } else {
        this.visualizarInformacion = false;
      }
    }

    let username = data.email.split("@");
    if (this.userSesssion !== username[0] && (cuestionario == 3 || cuestionario == 4)) {
      this.isAutoEvaluacion = false;
      return;
    }


    this.crearFormulario(dataInicial)

  }

  crearFormulario(data: any): void {

    if (!data || data.length === 0) {
      return;
    }

    this.control = {};
    this.control = data.reduce((acc: any, item: any) => {
      item.preguntas.forEach((pre: any) => {
        const stringIdPregunta = pre.idPregunta.toString();
        acc[stringIdPregunta] = new FormControl(1, Validators.required);
      });
      return acc;
    }, {});

    this.form = new FormGroup(this.control);
    this.dataItems = data;

    this.resetStepper();
  }

  validarFormulario(dataEvaluado: any): void {
    if (this.form.valid) {
      const respuestas = this.form.value;

      this.craarEstructuraRespuesta(respuestas, dataEvaluado);
    }
  }

  craarEstructuraRespuesta(respuestas: any, dataEvaluado: any): void {
    let data: any = [];
    Object.keys(respuestas).forEach((element) => {
      data.push({ fechaCreacion: this.fecha, idEvaluado: dataEvaluado.idPersona, idUsuario: this.datosEvaluador.idPersona, periodo: this.periodo, respuesta: parseInt(respuestas[element]), pregunta: { idPregunta: parseInt(element) } })
    })

    this.guardarRespuestasEvaluador(data);
  }

  guardarRespuestasEvaluador(data: any): void {
    this.evaluacionService.guardarRespuestas(data).subscribe(
      {
        next: (data: any) => {
          if (data.length > 0) {

            this.commonService.openSnackBar("Registro exitoso.", "info");
            this.dataSource = new MatTableDataSource<PersonalElement>([]);
            this.dataSource.paginator = this.paginator;
            this.form.reset();
            this.obtenerPersonasEvaluar();
            this.closeDialog();
            this.obtenerPersonaAutoEvaluacion();
          }
        },
        error: (err) => {

          this.commonService.openSnackBar("error al guardar las respuestas: " + err, "error");
        }
      }
    )
  }


  trackByStep(index: number, item: any): any {
    return item.id || index;
  }

  isStepValid(stepIndex: number): boolean {
    const step = this.dataItems[stepIndex];

    return step.preguntas.every((pre: any) => {
      const control = this.form.get(pre.idPregunta.toString());
      return control?.valid;
    });
  }

  resetStepper() {
    if (this.stepper) {
      this.stepper?.reset();
      this.form?.reset();
    }
  }

  cargarPorcentajesCuestionarios() {

    let dataPrc = localStorage.getItem("ThPorcentajesCuestionario");
    if (dataPrc) {
      this.porcentajesCuest = JSON.parse(dataPrc);
    } else {

      this.evaluacionService.getPorcentajesCuestionarios(this.periodo).subscribe({
        next: (data: any) => {

          if (data.length > 0) {
            this.porcentajesCuest = data;
            localStorage.setItem("ThPorcentajesCuestionario", JSON.stringify(this.porcentajesCuest));
          }
        },
        error: (err) => {
          this.commonService.openSnackBar("Error al cargar la informacion de los porcentajes de los cuestionarios")
        }
      });
    }
  }

  cargarPorcentajesItemsCuestionarios() {

    let dataPrc = localStorage.getItem("ThPorcentajesItemsCuestionario");
    if (dataPrc) {
      this.porcentajesItemCuest = JSON.parse(dataPrc);
    } else {

      this.evaluacionService.getPorcentajesItemsCuestionarios(this.periodo).subscribe({
        next: (data: any) => {

          if (data.length > 0) {
            this.porcentajesItemCuest = data;
            localStorage.setItem("ThPorcentajesItemsCuestionario", JSON.stringify(this.porcentajesItemCuest));
          }
        },
        error: (err) => {
          this.commonService.openSnackBar("Error al cargar la informacion de los porcentajes de los Items de cuestionario")
        }
      });
    }
  }

}
