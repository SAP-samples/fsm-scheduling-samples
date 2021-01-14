import { AbstractControl, FormArray } from '@angular/forms';
import * as moment from 'moment';

export const validSlots = (field: string, HTML_INPUT_DATE_FORMAT: string) => (control: AbstractControl) => {

  const ctrl = control.get(field) as FormArray;

  if (!ctrl || !ctrl.value || !Array.isArray(ctrl.value)) return null;

  let errors = new Set();
  const list = (ctrl.value as { start: string, end: string }[])
    .map(it => {
      const start = moment(it.start, HTML_INPUT_DATE_FORMAT);
      const end = moment(it.end, HTML_INPUT_DATE_FORMAT)
      const st = start.toDate().getTime();
      const et = end.toDate().getTime();
      const durration = et - st;

      return { start, end, st, et, durration };
    })
    .sort((a, b) => a.st - b.et);

  list.forEach((current, idx) => {
    if (current.durration < 0) {
      const msg = `[${idx}] has duration < 0 `;
      errors.add(msg);
      ctrl.controls[idx].setErrors({ durationError: true, msg });
    }

    const pre = list[idx - 1]
    if (pre && pre.et > current.st) {
      const msg = `[${idx}] has ovlapping dates ${current.start.format('YYYY-MM-DD HH:mm')} and ${pre.start.format('YYYY-MM-DD HH:mm')}`;
      errors.add(msg);
      ctrl.controls[idx].setErrors({ overlapping: true, msg });
    }

  });

  return !errors.size ? null : { validSlots: Array.from(errors).join(',') };
}
