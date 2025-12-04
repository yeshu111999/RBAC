import { HttpInterceptorFn } from '@angular/common/http';

function getTokenSafe(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token');
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getTokenSafe();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
