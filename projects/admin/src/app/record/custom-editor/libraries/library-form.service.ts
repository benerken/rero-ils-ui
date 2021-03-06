/*
 * RERO ILS UI
 * Copyright (C) 2019 RERO
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimeValidator } from '@rero/ng-core';
import { WeekDays } from '../../../class/week-days';

import { Library } from './library';

@Injectable({
   providedIn: 'root'
})
export class LibraryFormService {

  public form;

  constructor(
    private fb: FormBuilder
    ) {
      this.build();
  }

  build() {
    this.form = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(4)
      ]],
      address: ['', Validators.minLength(4)],
      email: ['', Validators.email],
      code: ['', {
        validators: [
          Validators.required
        ]
      }],
      opening_hours: this.fb.array([])
    });
    this.initializeOpeningHours();
  }

  initializeOpeningHours(openingHours = []) {
    const days = Object.keys(WeekDays);
    const hours = this.form.get('opening_hours');
    for (let step = 0; step < 7; step++) {
      hours.push(this.buildOpeningHours(
        false,
        days[step],
        this.fb.array([])
      ));
    }
    this.setOpeningHours(openingHours);
  }

  setOpeningHours(openingHours = []) {
    for (let step = 0; step < 7; step++) {
      const atimes = this.getTimesByDayIndex(step);
      const day = openingHours[step];
      if (day !== undefined) {
        if (day.times.length > 0) {
          atimes.removeAt(0);
          const hours = this.form.get('opening_hours').get(String(step));
          hours.get('is_open').setValue(day.is_open);
          day.times.forEach(time => {
            atimes.push(this.buildTimes(time.start_time, time.end_time));
          });
        }
      } else {
        atimes.push(this.buildTimes('08:00', '18:00'));
      }
    }
  }

  buildOpeningHours(isOpen, day, times): FormGroup {
    return this.fb.group({
      is_open: [isOpen],
      day: [day],
      times
    }, {
      validator: [TimeValidator.RangePeriodValidator()]
    });
  }

  buildTimes(startTime = '00:01', endTime = '23:59'): FormGroup {
    const regex = '^(?!(0:00)|(00:00)$)([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$';
    return this.fb.group({
      start_time: [startTime, {
        validators: [
          Validators.required,
          Validators.pattern(regex)
        ]
      }],
      end_time: [endTime, {
        validators: [
          Validators.required,
          Validators.pattern(regex)
        ]
      }]
    }, {
      validator: TimeValidator.greaterThanValidator('start_time', 'end_time')
    });
  }

  reset() {
    this.build();
  }

  populate(library: Library) {
    this.form.patchValue({
      name: library.name,
      address:  library.address,
      email: library.email,
      code: library.code,
    });
    this.setOpeningHours(library.opening_hours);
  }

  setId(id) { this.form.value.id = id; }
  setLibraryPid(pid) { this.form.value.pid = pid; }
  setSchema(schema) { this.form.value.$schema = schema; }

  get name() { return this.form.get('name'); }
  get address() { return this.form.get('address'); }
  get email() { return this.form.get('email'); }
  get code() { return this.form.get('code'); }
  get opening_hours() {
    return this.form.get('opening_hours') as FormArray;
  }

  getValues() { return this.form.value; }

  addTime(dayIndex): void {
    this.getTimesByDayIndex(dayIndex).push(this.buildTimes());
  }

  deleteTime(dayIndex, timeIndex): void {
    this.getTimesByDayIndex(dayIndex).removeAt(timeIndex);
  }

  getTimesByDayIndex(dayIndex): FormArray {
    return this.form.get('opening_hours')
      .get(String(dayIndex))
      .get('times') as FormArray;
  }
}
