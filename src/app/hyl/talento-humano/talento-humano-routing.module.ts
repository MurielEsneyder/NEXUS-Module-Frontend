import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EvaluacionDesempenoComponent } from './pages/evaluacion-desempeno/evaluacion-desempeno.component';

const routes: Routes = [
  {
    path:"gestion",
    children:[
      {
        path:"evaluacion-desempeno",
        component:EvaluacionDesempenoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TalentoHumanoRoutingModule {

}
