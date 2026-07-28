import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableModule} from '@angular/material/table';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {MatRadioModule} from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import {MatStepperModule} from '@angular/material/stepper';
import { TalentoHumanoRoutingModule } from './talento-humano-routing.module';
import { EvaluacionDesempenoComponent } from './pages/evaluacion-desempeno/evaluacion-desempeno.component';
import { MatCardModule } from '@angular/material/card';


@NgModule({
  declarations: [EvaluacionDesempenoComponent
  ],
  imports: [
    CommonModule,
    TalentoHumanoRoutingModule,
    MatCardModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatListModule,
    MatPaginator,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    MatStepperModule,
    MatIconModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    MatGridListModule
  ]
})
export class TalentoHumanoModule { }
