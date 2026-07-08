import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonService } from '../commons/services/common.service';
import { SecurityService, usrSession } from '../commons/services/security.service';
import { BnNgIdleService } from 'bn-ng-idle';
import { MatDrawer } from '@angular/material/sidenav';
import { Router, NavigationEnd } from "@angular/router";
import { environment } from '../../environments/environment';
import { GUIOptions, GUIOptionsDefault } from './shared/interfaces/GUIOptions.interface'
import { Utils } from './shared/utils/utils';
import { EMPTY, iif, Observable, of, ReplaySubject, Subscription, timer } from 'rxjs';
import { switchMap, takeUntil } from "rxjs/operators";
import { MatMenuTrigger } from "@angular/material/menu";
import hotkeys from 'hotkeys-js';

@Component({
  templateUrl: "./hyl.component.html",
  styleUrls: ["./hyl.component.css"],
})




export class HealthLifeComponent implements OnInit, OnDestroy {

  @ViewChild('drawer') drawer: MatDrawer | any;

  public expandMenu: boolean = true;
  public activeRoute: string = "";
  public fullActiveRoute: string = "";


  public entorno = environment.name;
  public guiOptions: GUIOptions | any = GUIOptionsDefault;

  private subs: ReplaySubject<void> = new ReplaySubject();
  public userSession: usrSession | any = {} as usrSession;
  private sessionTimer: Observable<number> = new Observable<number>();
  private timerSub: Subscription = new Subscription();

  constructor(
    private commonService: CommonService,
    private security: SecurityService,
    private bnIdle: BnNgIdleService,
    private cdRef: ChangeDetectorRef,
    private router: Router,

  ) {
    this.updateRoute(router);
  }


  ngOnInit() {


    this.security.userSession.pipe(
      switchMap((valor) => {
        return iif(
          () => valor?.username !== null,
          of(valor),
          EMPTY
        )
      }), takeUntil(this.subs)
    ).subscribe(
      value => {
        this.userSession = value;

      }

    )


    this.sessionTimer = timer(2000, 600000);
    this.timerSub = this.sessionTimer.subscribe(val => {
      let sysTime = (new Date().getTime()) / 1000;
      let remain = (this.security.getLocalToken().exp - sysTime) / 60;
      if (val == 0) {

      }
      if (remain < 60) {

      }
      if (remain <= 0) {
        this.logout();
      }
    });


    hotkeys('alt+m', (event) => {
      event.preventDefault();
      this.drawer.toggle();
    });

    hotkeys('alt+h', (event) => {
      event.preventDefault();
      this.router.navigate(['/hyl/inicio']);
    });


    let optTemp = localStorage.getItem("guiOptions");
    if (optTemp != null) {
      this.guiOptions = optTemp;

    }


    setTimeout(() => {
      this.commonService.windowTitle.subscribe(val => {
        this.activeRoute = val;
        this.cdRef.detectChanges();
      });
    });


    this.commonService.getIPPublica();


    if (this.commonService.getIPPublica() != null || this.commonService.getIPPublica() != undefined) {
      let model =
      {
        ipPublica: this.commonService.getIPPublica(),
        usuario: this.userSession.username
      }

    }
  }

  ngOnDestroy() {
    this.timerSub.unsubscribe();
    hotkeys.unbind();

    this.subs.next();
    this.subs.complete();
    try {
      this.bnIdle.resetTimer();
      this.bnIdle.stopTimer();
    }
    catch { }
  }


  /**

   * @param $event
   * @param menu
   */
  contextMenu($event: MouseEvent, menuTrigger: MatMenuTrigger): void {

    $event.preventDefault();
    menuTrigger?.menu?.focusFirstItem();
    menuTrigger.openMenu();
  }

  /**
   * @param router datos de routing
   */
  updateRoute(router: Router) {
    router.events.subscribe(
      e => {
        if (e instanceof NavigationEnd) {
          this.fullActiveRoute = e.url.toUpperCase().replace("/HYL/", "").replace(/\//g, "\t‣\t").replace(/-/g, " ");

          const url = e.urlAfterRedirects || e.url;
          const shouldCloseMenu = /\/hyl\/solicitudes-desarrollo(\/|$)/.test(url) || /\/hyl\/solicitudes-desarrollo\/.*(nueva|crear|bandeja)/i.test(url);

          if (shouldCloseMenu && this.drawer?.opened) {
            this.drawer.close();
          }
        }
      }
    );

  }


  logout() {
    try {
      if (this.security.getLocalToken().origin != "HyL-Sparta-V2") {
        this.bnIdle.resetTimer();
        this.bnIdle.stopTimer();
      }
    }
    catch { }
    this.security.destroySession();
    this.router.navigate(['/login']);
  }


  private timeoutAction(): void {
    this.router.navigate(['/login']);
    this.bnIdle.resetTimer();
    this.bnIdle.stopTimer();
    this.security.destroySession();
    this.commonService.openSnackBar("Sesión cerrada por inactividad");
  }

  /**
   * @param mouseOver
   */
  public menuMouseEvent(mouseEnter: boolean) {
    if (mouseEnter) {
      if (this.guiOptions.reactiveCorner) {
        this.drawer.toggle();
      }
    }
    else {
      this.drawer.toggle();
    }
  }


  public menuHide() {
    if (this.guiOptions.reactiveCorner) {
      this.drawer.close();
    }
  }

  /**
   * @param opt objeto de configuración
   */
  public updateGUIOptions(opt: GUIOptions) {
    this.guiOptions = opt;
    if (opt.lastUpdate > 0) {
      Utils.saveObjectToLS("guiOptions", opt);
    }
  }
}
