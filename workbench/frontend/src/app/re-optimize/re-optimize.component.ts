import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../common/services/auth.service';

@Component({
  selector: 'app-re-optimize',
  templateUrl: './re-optimize.component.html',
  styleUrls: ['./re-optimize.component.scss']
})
export class ReOptimizeComponent implements OnInit {

  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  public response$ = new BehaviorSubject<null>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  public doRequest() {

  }
}
