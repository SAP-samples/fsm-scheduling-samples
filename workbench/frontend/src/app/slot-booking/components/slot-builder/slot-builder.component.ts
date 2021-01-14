import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { validSlots } from '../../validators/has-overlaps.validator';

const HTML_INPUT_DATE_FORMAT = 'YYYY-MM-DDTHH:mm';

export interface Slot { start: string, end: string };

@Component({
  selector: 'slot-builder',
  templateUrl: './slot-builder.component.html',
  styleUrls: ['./slot-builder.component.scss']
})
export class SlotBuilderComponent implements OnInit, OnDestroy {

  @Output() change = new EventEmitter<Slot[]>();
  form: FormGroup;

  onDistroy$ = new Subject();

  options: {
    form: FormGroup;
    n: number[],
  }

  constructor(private fb: FormBuilder) { }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public ngOnInit(): void {

    this.form = this.fb.group({
      slots: this.fb.array([])
    }, { validators: validSlots('slots', HTML_INPUT_DATE_FORMAT) });

    const start_of_working_day = 8;
    const end_of_working_day = 18;
    const range = 3;

    this.options = {
      form: this.fb.group({
        size: [5, Validators.required],
        from: [moment(new Date()).add(1, 'days').hour(start_of_working_day).minute(0).second(0), Validators.required],
        to: [moment(new Date()).add(range + 1, 'days').hour(end_of_working_day).minute(0).second(0), Validators.required],
        includeWeekend: [false, Validators.required]
      }),
      n: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }

    this.form.valueChanges.pipe(
      tap((value: { slots: Slot[] }) => {
        const output = value.slots.map(it => {
          return {
            start: (moment(it.start, HTML_INPUT_DATE_FORMAT).format('YYYY-MM-DDTHH:mm:ss') + '.000Z'),
            end: (moment(it.end, HTML_INPUT_DATE_FORMAT).format('YYYY-MM-DDTHH:mm:ss') + '.000Z'),
          }
        });

        this.change.emit(output);
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();

    this.addslots();
  }

  public get slotsCtrl(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  public getDate(it: FormControl | AbstractControl) {
    const { start } = it.value as { start: string, end: string }
    return moment(start, HTML_INPUT_DATE_FORMAT).format('dddd, YYYY-MM-DD');
  }

  public getDuration(it: { start: string, end: string }) {
    return moment.duration(moment(it.end, HTML_INPUT_DATE_FORMAT).diff(moment(it.start, HTML_INPUT_DATE_FORMAT))).hours();
  }

  public copyDay(dayString: string) {
    const all = this.slotsCtrl.controls
    const last = all[all.length - 1].value;
    const next_date = moment(last.end, HTML_INPUT_DATE_FORMAT).add(1, 'day').format('YYYY-MM-DD')

    const newItems = all
      .filter(ctrl => dayString === this.getDate(ctrl))
      .map(ctrl => {
        const { start, end } = ctrl.value;
        const start_time = moment(start, HTML_INPUT_DATE_FORMAT).format('HH:mm');
        const end_time = moment(end, HTML_INPUT_DATE_FORMAT).format('HH:mm');
        return this.fb.group({
          start: [moment(`${next_date} ${start_time}`, 'YYYY-MM-DD HH:mm').format(HTML_INPUT_DATE_FORMAT), Validators.required],
          end: [moment(`${next_date} ${end_time}`, 'YYYY-MM-DD HH:mm').format(HTML_INPUT_DATE_FORMAT), Validators.required]
        })
      })

    newItems.forEach(ctrl => this.slotsCtrl.push(ctrl));
  }

  public remove(idx: number) {
    this.slotsCtrl.removeAt(idx);
  }

  public removeAll() {
    this.slotsCtrl.clear();
  }

  public addslots() {
    const { size, from, to, includeWeekend } = this.options.form.value as { size: number, from: moment.Moment, to: moment.Moment, includeWeekend: boolean };

    const workTimeStart = from.format('HH:mm');
    const workTimeEnd = to.format('HH:mm');

    let dayIterator = moment(from);
    while (dayIterator.isBefore(to)) {

      if (includeWeekend || (!includeWeekend && dayIterator.isoWeekday() !== 6 && dayIterator.isoWeekday() !== 7)) {

        const workDayStart = moment(`${dayIterator.format('YYYY-MM-DD')} ${workTimeStart}`, 'YYYY-MM-DD HH:mm')
        const workDayEnd = moment(`${dayIterator.format('YYYY-MM-DD')} ${workTimeEnd}`, 'YYYY-MM-DD HH:mm').add(1, 'minute');

        const timeIterator = moment(workDayStart);
        while (timeIterator.isBefore(workDayEnd)) {

          const slotStart = moment(timeIterator);
          timeIterator.add(size, 'hour');
          const slotEnd = moment(timeIterator);

          if (timeIterator.isBefore(workDayEnd)) {

            // console.log(slotStart.format('YYYY-MM-DD HH:mm'), '-', slotEnd.format('YYYY-MM-DD HH:mm'))

            const slot = this.fb.group({
              start: [slotStart.format(HTML_INPUT_DATE_FORMAT), Validators.required],
              end: [slotEnd.format(HTML_INPUT_DATE_FORMAT), Validators.required]
            });

            this.slotsCtrl.push(slot);

          }

        }

      }

      dayIterator.add(1, 'day');
    }

  }


}
