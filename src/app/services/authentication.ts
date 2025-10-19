import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Authentication {
  
  authenticationChange = new EventEmitter<any>();


  emitChange(){
    this.authenticationChange.emit();
  }
}
