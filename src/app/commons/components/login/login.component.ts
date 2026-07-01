import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SecurityService } from '../../services/security.service';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../services/common.service';
import { HttpClient } from '@angular/common/http';
import { AfilInfo } from '../../services/constants';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

    public loginForm: FormGroup;
    public loginControls = {
        numeroDocumento: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required])
    };

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private commonService: CommonService,
        private security: SecurityService,
        private http: HttpClient
    ) {
        this.loginForm = this.fb.group({
            login_numeroDocumento: this.loginControls.numeroDocumento,
            login_password: this.loginControls.password
        });
    };

    ngOnInit() {

    }

    public loginUser(): void {
        this.commonService.clearMessages();
        let pass = environment.origin + " ";
        pass += btoa(this.loginForm.value.login_numeroDocumento + ":" + this.loginForm.value.login_password);
        this.security.setLocalAuthKey(pass);

        this.commonService.loadingBar(true);
        this.security.requestAuth(pass).subscribe({
            next: (data: any) => {
                this.commonService.clearMessages();

                if (data['token']) {
                    this.security.setLocalAuthKey(data['token']);
                    this.security.setUserOnSession(this.loginForm.value.login_numeroDocumento, "admin");

                    // ============================================================
                    // OBTENER Y GUARDAR DATOS DEL COLABORADOR
                    // ============================================================
                    this.obtenerYGuardarDatosColaborador();

                    this.router.navigate(['/hyl/inicio']);
                    localStorage.setItem("userAsmet", this.loginForm.value.login_numeroDocumento);
                }
            },
            error: (err: any) => {
                this.commonService.clearMessages();
                if (err.status == 401) {
                    this.loginForm.reset();
                    this.commonService.openSnackBar("Usuario o contraseña inválido", "error");
                }
                else {
                    this.commonService.openSnackBar("Error al iniciar sesión", "error");
                }
            }
        });
    }

    // ============================================================
    // OBTENER Y GUARDAR DATOS DEL COLABORADOR
    // ============================================================
    private obtenerYGuardarDatosColaborador(): void {
        console.log('📥 Obteniendo datos del colaborador...');

        const username = this.loginForm.value.login_numeroDocumento;

        // Intentar obtener datos desde el backend
        this.http.get('http://localhost:8090/api/v1/colaborador/actual').subscribe({
            next: (data: any) => {
                console.log('📡 Datos del colaborador obtenidos:', data);
                console.log('📋 Nombre completo desde backend:', data.nombreCompleto);

                // ============================================================
                // CREAR OBJETO AfilInfo COMPLETO
                // ============================================================
                const afilInfo: AfilInfo = {
                    idAfiliado: data.idAfiliado || 0,
                    nroIdentificacion: data.nroIdentificacion || data.documento || username,
                    codigoDocumento: data.codigoDocumento || 1,
                    codigoTipoDocumento: data.codigoTipoDocumento || 'CC',
                    codigoGenero: data.codigoGenero || 'M',
                    nombre1: data.nombre1 || '',
                    nombre2: data.nombre2 || '',
                    apellido1: data.apellido1 || '',
                    apellido2: data.apellido2 || '',
                    descripcionTipoAfiliacion: data.descripcionTipoAfiliacion || 'Cotizante',
                    descripcionRegimen: data.descripcionRegimen || 'Contributivo',
                    afiliadoActivo: data.afiliadoActivo !== undefined ? data.afiliadoActivo : true,
                    habeasDataAcepta: data.habeasDataAcepta !== undefined ? data.habeasDataAcepta : true,
                    portabilidad: data.portabilidad !== undefined ? data.portabilidad : false,
                    datosContacto: data.datosContacto !== undefined ? data.datosContacto : true,
                    registrado: data.registrado !== undefined ? data.registrado : true,
                    email: data.email || data.correo || username + '@asmetsalud.com',
                    username: username,
                    public: data.public !== undefined ? data.public : false,
                    sessionDateTime: Date.now(),
                    sessionIP: data.sessionIP || '127.0.0.1',
                    nombreCompleto: data.nombreCompleto || data.nombre || username
                };

                console.log('📋 AfilInfo.nombreCompleto antes de guardar:', afilInfo.nombreCompleto);

                // Guardar en sessionStorage
                this.security.setAfilInfo(afilInfo);
                console.log('💾 Datos completos guardados en sessionStorage:', afilInfo);
                
                // Verificar que se guardó correctamente
                const verificar = this.security.getAfilInfo();
                console.log('📋 Verificación después de guardar:', verificar);
            },
            error: (err: any) => {
                console.warn('⚠️ No se pudo obtener datos del colaborador:', err);
                
                // Fallback: guardar datos básicos desde el username
                const afilInfo: AfilInfo = {
                    idAfiliado: 0,
                    nroIdentificacion: username,
                    codigoDocumento: 1,
                    codigoTipoDocumento: 'CC',
                    codigoGenero: 'M',
                    nombre1: username,
                    nombre2: '',
                    apellido1: '',
                    apellido2: '',
                    descripcionTipoAfiliacion: 'Cotizante',
                    descripcionRegimen: 'Contributivo',
                    afiliadoActivo: true,
                    habeasDataAcepta: true,
                    portabilidad: false,
                    datosContacto: true,
                    registrado: true,
                    email: username + '@asmetsalud.com',
                    username: username,
                    public: false,
                    sessionDateTime: Date.now(),
                    sessionIP: '127.0.0.1',
                    nombreCompleto: username
                };

                this.security.setAfilInfo(afilInfo);
                console.log('💾 Datos básicos guardados en sessionStorage (fallback):', afilInfo);
            }
        });
    }
}