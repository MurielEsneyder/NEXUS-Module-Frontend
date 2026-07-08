import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HealthLifeComponent } from "./hyl.component";
import { InicioComponent } from "./shared/components/inicio/inicio.component";


const routes: Routes = [{
  path: "",
  component: HealthLifeComponent,
  children: [
    {
      path: "inicio",
      component: InicioComponent
    },
    {
      path: "talento-humano",
      loadChildren: () =>
        import("./talento-humano/talento-humano.module").then(
          (m) => m.TalentoHumanoModule
        ),
    },
    {
      path: "solicitudes-desarrollo",
      loadChildren: () =>
        import("./solicitudes-desarrollo/solicitudes-desarrollo.module").then(
          (m) => m.SolicitudesDesarrolloModule
        ),
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HealthLifeRouting {

}
