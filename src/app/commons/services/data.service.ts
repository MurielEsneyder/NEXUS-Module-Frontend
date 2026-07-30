import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { SecurityService } from './security.service'
import { environment } from '../../../environments/environment';
import { HttpHeaders, HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({providedIn:'root'})
export class DataService {


  constructor(private http: HttpClient, private securitySev : SecurityService) {
  }

  public requestMenu():any{

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Version':'v1'
    });

    return this.http.get(environment.menu, { params:{}, headers: headers });
  }

  private requestOptions(params:any,version:string=''): any {
    let dataParams=new HttpParams();

    if (params==null || params=='' || !params){
      params=dataParams;
    }else{
      Object.keys(params).forEach((element) => {
        dataParams=dataParams.set(element,params[element])
      });
    }
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Version':version
    });


    return { params: dataParams, headers: headers };
  }

  private requestOptionsBlob(params:any, wordKey:string): any {
    if (params==null){
      params={};
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'wordKeyWs': wordKey,
    });
    let paramsIn = new HttpParams().set('value', JSON.stringify(params));
    return { params: paramsIn, headers: headers };
  }

  public requestGet(params: any, ruta:string,version:string=''): Observable<Object> {
    let options = this.requestOptions(params,version);
    let url=`${environment.services}/${ruta}`;
    return this.http.get(url, options);
  }

  public requestPost(body: any,ruta:string, version: string='', params: Object | any = null): Observable<Object> {
    let options = this.requestOptions(params, version);

    let url=`${environment.services}/${ruta}`;
    return this.http.post(url, body, options);
  }

  public requestPostText(body: any,ruta:string, version: string='', params: Object | any = null): Observable<Object> {
    let options = this.requestOptions(params, version);
    options.responseType = 'text';

    let url=`${environment.services}/${ruta}`;
    return this.http.post(url, body, options);
  }

  public requestPut(body: any, ruta: string, wordKey: string='', params: Object | any = null): Observable<Object> {
    let options = this.requestOptions(params, wordKey);
    let url=`${environment.services}/${ruta}`;
    return this.http.put(url, body, options);
  }

  public requestPatch(body: any, ruta: string, version: string='', params: Object | any = null): Observable<Object> {
    let options = this.requestOptions(params, version);
    let url=`${environment.services}/${ruta}`;
    return this.http.patch(url, body, options);
  }

  public requestDelete(params: any, ruta: string, wordKey: string=''): Observable<Object> {
    let options = this.requestOptions(params, wordKey);
    let url=`${environment.services}/${ruta}`;
    return this.http.delete(url, options);
  }

  public requestGetBlob(params: any, ruta: string, wordKey: string=''): Observable<Object> {
    let options = this.requestOptionsBlob(params, wordKey);
    options.responseType = 'blob';
    let url=`${environment.services}/${ruta}`;
    return this.http.get(url, options)
  }

}
