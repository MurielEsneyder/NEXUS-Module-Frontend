import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export function LoggingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  console.log(`[API Request] Ruta consumida: ${req.method} ${req.urlWithParams}`);
  
  // Clonar la petición para agregar el header requerido por Ngrok Free
  const modifiedReq = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  return next(modifiedReq);
}
