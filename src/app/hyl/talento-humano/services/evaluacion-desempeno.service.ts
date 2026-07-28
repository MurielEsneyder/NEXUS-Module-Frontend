import { Injectable } from '@angular/core';
import { DataService } from '../../../commons/services/data.service';
import { PorcentajeCuestionario } from '../models/telento-humano';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionDesempenoService {
  constructor(private dataService: DataService) { }


  getCuestionario(userName: any) {
    return this.dataService.requestGet(userName, 'preguntas/obtPreguntasMacro', 'v1');
  }

  getInfoEvaluador(userName: any) {
    return this.dataService.requestGet(userName, 'par_persona/obtenerPersonaParametrica', 'v1');
  }

  getInfoPersonasEvaluar(cargo: any) {
    return this.dataService.requestGet(cargo, 'par_persona/obtenerdatos', 'v1');
  }

  getRespuestasEvaluados() {
    return this.dataService.requestGet({}, 'respuestas', 'v1');
  }

  guardarRespuestas(data: any) {
    return this.dataService.requestPost(data, 'respuestas', 'v1');
  }

  getOpcionesEvaluador() {
    return this.dataService.requestGet({}, 'lista-valores', 'v1');
  }

  getPorcentajesCuestionarios(vigencia: number) {
    return this.dataService.requestGet({}, 'porcentaje-cuestionarios/getByVigencia/' + vigencia, 'v1');
  }
  getPorcentajesItemsCuestionarios(vigencia: number) {
    return this.dataService.requestGet({}, 'porcentaje-items-cuestionarios/getByVigencia/' + vigencia, 'v1');
  }


}
