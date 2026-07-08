// RUTA: src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './commons/components/login/login.component';
import { NotFoundComponent } from './commons/components/not-found/not-found.component';
import { NotAuthorizedComponent } from './commons/components/not-authorized/not-authorized.component';
import { GuardService } from './commons/services/guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    children: [
      { path: '', component: LoginComponent },
      { path: 'login', component: LoginComponent },
      { path: 'not-auth', component: NotAuthorizedComponent },
      {
        path: 'hyl',
        loadChildren: () => import("./hyl/hyl.module").then(m => m.HylModule),
        canActivate: [GuardService],
        data: { expectedRoles: null }
      },
      { path: '**', component: NotFoundComponent }
    ]
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }