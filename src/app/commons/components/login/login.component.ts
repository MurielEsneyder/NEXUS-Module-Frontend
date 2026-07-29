
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SecurityService } from '../../services/security.service';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../services/common.service';



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
}


