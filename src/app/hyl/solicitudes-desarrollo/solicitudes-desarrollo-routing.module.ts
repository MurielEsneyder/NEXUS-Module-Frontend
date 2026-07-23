import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitudesDesarrolloComponent } from './components/solicitudes-desarrollo/solicitudes-desarrollo.component';

const routes: Routes = [
  { path: 'solicitudes-desarrollo',
    component:SolicitudesDesarrolloComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SolicitudesDesarrolloRoutingModule { }