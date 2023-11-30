import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedSkillsService {
  private selectedSkillsSubject = new BehaviorSubject<string[]>([]);
  selectedSkills$ = this.selectedSkillsSubject;

  updateSelectedSkills(selectedSkills: string[]): void {
    this.selectedSkillsSubject.next(selectedSkills);
  }
}
