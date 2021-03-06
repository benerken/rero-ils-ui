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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RecordService } from '@rero/ng-core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemsService } from '../../service/items.service';
import { OrganisationService } from '../../service/organisation.service';
import { Item, ItemAction, Loan, LoanState } from '../../class/items';
import { PatronTransactionService } from '../patron-transaction.service';

@Component({
  selector: 'admin-item',
  templateUrl: './item.component.html'
})
export class ItemComponent implements OnInit {

  /** Current item */
  @Input() item: any;

  /** Current patron */
  @Input() patron: any;

  /** Item has fees */
  @Output() hasFeesEmitter = new EventEmitter<boolean>();

  /** Is collapsed */
  isCollapsed = true;

  /** Total amount of fee */
  totalAmountOfFee = 0;

  /** Notifications related to the current loan */
  notifications$: Observable<any>;

  /** ItemAction reference */
  itemAction = ItemAction;

  /**
   * Constructor
   * @param _recordService: Record Service
   * @param _organisationService: Organisation Service
   * @param _patronTransactionService: Patron transaction Service
   * @param _itemService: Item Service
   */
  constructor(
    private _recordService: RecordService,
    private _organisationService: OrganisationService,
    private _patronTransactionService: PatronTransactionService,
    private _itemService: ItemsService
  ) {  }

  /**
   * On init hook
   */
  ngOnInit() {
    if (this.item && this.item.loan && this.item.loan.pid) {
      const loanPid = this.item.loan.pid;

      this._patronTransactionService.patronTransactionsByLoan$(loanPid, 'overdue', 'open').subscribe(
        (transactions) => {
          this.totalAmountOfFee = this._patronTransactionService.computeTotalTransactionsAmount(transactions);
          if (this.totalAmountOfFee > 0) {
            this.hasFeesEmitter.emit(true);
          }
        }
      );

      this.notifications$ = this._recordService.getRecords(
        'notifications', `loan.pid:${loanPid}`, 1, RecordService.MAX_REST_RESULTS_SIZE).pipe(
        map((results: any) => results.hits.hits)
      );
    }
  }

  /** Get transit location pid
   * @param item: current item
   * @return: transit location pid
   */
  getTransitLocationPid(item: Item) {
    if (this.patron) {
      if (item.loan && item.loan.state === LoanState.ITEM_IN_TRANSIT_FOR_PICKUP) {
        return item.loan.pickup_location_pid;
      }
      if (item.loan && item.loan.state === LoanState.ITEM_IN_TRANSIT_TO_HOUSE) {
        return item.location.pid;
      }
    } else {
      const validatedLoan = new Loan(item.action_applied[ItemAction.validate]);
      const checkedInLoan = new Loan(item.action_applied[ItemAction.checkin]);
      if (validatedLoan && validatedLoan.state === LoanState.ITEM_IN_TRANSIT_FOR_PICKUP) {
        return validatedLoan.pickup_location_pid;
      }
      if (checkedInLoan && checkedInLoan.state === LoanState.ITEM_IN_TRANSIT_TO_HOUSE) {
        return item.location.pid;
      }
    }
    return null;
  }

  /** Get current organisation
   * @return: current organisation
   */
  get organisation() {
    return this._organisationService.organisation;
  }

  /** Is a callout wrapper is required for this item.
   *
   * @param item: the item to analyse
   * @param type: the callout type (error, warning, info, ...)
   */
  needCallout(item: Item, type?: string): boolean {
    return this._itemService.needCallout(item, type);
  }
}
