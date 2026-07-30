import { MatIconModule } from '@angular/material/icon';
import { AppRoutingModule } from './app-routing.module';
import { NgModule } from '@angular/core';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DataService } from './commons/services/data.service';
import { SecurityService } from './commons/services/security.service';
import { CommonService } from './commons/services/common.service';
import { ResizeService } from './commons/services/resize.service';
import { BnNgIdleService } from 'bn-ng-idle';
import { GuardService } from './commons/services/guard.service';
import { CurrencyPipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { SpinnerInterceptor } from './hyl/shared/interceptors/spinner.interceptor';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, HttpClientModule, withInterceptors } from '@angular/common/http';
import { LoginComponent } from './commons/components/login/login.component';
import { NotAuthorizedComponent } from './commons/components/not-authorized/not-authorized.component';
import { NotFoundComponent } from './commons/components/not-found/not-found.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressBar } from '@angular/material/progress-bar';
import { LoadingComponent } from './commons/components/loading/loading.component';
import { SnackbarComponent } from './commons/components/snackBar/snackBar.component';
import { MatInputModule } from '@angular/material/input';
import { LoggingInterceptor } from './hyl/shared/interceptors/logging.interceptor';
import { AuthInterceptor } from './commons/services/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NotAuthorizedComponent,
    NotFoundComponent,
    LoadingComponent,
    SnackbarComponent

  ],
  imports: [
    ReactiveFormsModule,
    BrowserModule, // Requiere el módulo del navegador
    AppRoutingModule,// Asegúrate de importar el módulo de enrutamiento
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatGridListModule,
    MatProgressBar,
    MatInputModule,

    // HttpClientModule


  ],
  providers: [
    provideAnimationsAsync(),
    DataService,
    ResizeService,
    BnNgIdleService,
    GuardService,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideHttpClient(withInterceptors([AuthInterceptor, LoggingInterceptor, SpinnerInterceptor])),
    CurrencyPipe,
    // provideHttpClient()

  ],
  bootstrap: [AppComponent]  // El componente raíz de la aplicación
})
export class AppModule { }
