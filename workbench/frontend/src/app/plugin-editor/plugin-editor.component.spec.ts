import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginEditorComponent } from './plugin-editor.component';

describe('PluginEditorComponent', () => {
  let component: PluginEditorComponent;
  let fixture: ComponentFixture<PluginEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PluginEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
