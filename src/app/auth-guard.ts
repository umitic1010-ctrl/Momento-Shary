import { CanActivateFn, Router } from '@angular/router';
import {inject} from '@angular/core'
import {Auth} from './auth'

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  
  if (auth.isLoggedIn()) {
  return true;
}
  else{
   return router.createUrlTree(['/login']); 
  }
};
