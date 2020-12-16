import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'save-dialog',
  templateUrl: 'save-dialog.html'
})
export class SaveDialog implements OnInit {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SaveDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {}) { }

  ngOnInit() {
    this.form = this.fb.group({
      name: [undefined, Validators.required],
    });
  }

  done(): void {
    if (this.form.invalid) return;
    const { name } = this.form.value;
    this.dialogRef.close(name);
  }
}