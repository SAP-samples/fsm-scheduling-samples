import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { QueryService } from '../../services/query.service';
import { AGHRequestDTO, AGHResponseDTO, TechnicianService } from '../../services/technician.service';

@Component({
  selector: 'resource-query',
  templateUrl: './resource-query.component.html',
  styleUrls: ['./resource-query.component.scss']
})
export class ResourceQueryComponent implements OnInit, OnDestroy {

  public resources$ = new BehaviorSubject<Partial<{ id: string; firstName: string, lastName: string }>[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);

  @Output() changeResource = new EventEmitter<string[]>();

  public form: FormGroup;
  private onDestroy$ = new Subject();

  public filterAttributeControl = new FormControl([]);
  public filterValueControl = new FormControl([]);
  public filterAttributes: string[] = ['Attribute 1', 'Attribute 2', 'Attribute 3'];
  public filterValues: string[] = ['Value 1', 'Value 2', 'Value 3'];

  constructor(
    private fb: FormBuilder,
    private svc: QueryService,
    private snackBar: MatSnackBar,
    private technicianService: TechnicianService
  ) { }

  public ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  ngOnInit(): void {

    const requestObject: AGHRequestDTO = {
      companyNames: [
        'sap-warriors'
      ],
      options: {
        geocodedOnly: true,
        includeInternalPersons: true,
        includeCrowdPersons: false
      },
      bookingsFilter: {
        activitiesToExclude: [],
        considerReleasedAsExclusive: true,
        considerPlannedAsExclusive: true
      },
      personIds: []
    };

    this.resources$
      .pipe(
        tap(list => {
          if (list.length) {
            this.changeResource.next(list.map(it => it.id));
          }
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();

    this.isLoading$.next(true); // Display loading indicator

    this.technicianService.fetchAll(requestObject)
      .pipe(
        catchError(error => {
          console.error(error);

          let errorMessage = error;
          if (error instanceof HttpErrorResponse) {
            errorMessage = `Error [❌ ${error.status} ❌ ]\n\n${error.message}`;
          }

          this.snackBar.open(errorMessage, 'ok', { duration: 3000 });

          return of({} as AGHResponseDTO);
        })
      )
      .subscribe(
        response => {
          this.isLoading$.next(false); // Hide loading indicator
          this.resources$.next(response.results); // Update resources with the technician data
          this.snackBar.open('Technicians retrieved successfully!', 'ok', { duration: 3000 });
        });

    // setTimeout(() => this.onQuery.next(), 100);
  }


  public applyFilter(): void {
    // Get selected filter attributes and values from the form controls
    const selectedAttributes = this.filterAttributeControl.value as string[];
    const selectedValues = this.filterValueControl.value as string[];

    // Perform filtering logic with selected attributes and values

    // Call API with the selected filters ?

  }



}
