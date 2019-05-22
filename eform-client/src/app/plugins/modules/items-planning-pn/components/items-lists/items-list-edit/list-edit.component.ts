import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {
  ItemsPlanningPnListsService} from 'src/app/plugins/modules/items-planning-pn/services';
import {ItemsListPnItemModel, ItemsListPnModel, ItemsListPnUpdateModel} from '../../../models/list';
import {TemplateListModel, TemplateRequestModel} from '../../../../../../common/models/eforms';
import {debounceTime, switchMap} from 'rxjs/operators';
import {EFormService} from '../../../../../../common/services/eform';

@Component({
  selector: 'app-items-planning-pn-list-edit',
  templateUrl: './list-edit.component.html',
  styleUrls: ['./list-edit.component.scss']
})
export class ListEditComponent implements OnInit {
  @ViewChild('frame') frame;
  @Output() onListUpdated: EventEmitter<void> = new EventEmitter<void>();
  spinnerStatus = false;
  selectedListModel: ItemsListPnModel = new ItemsListPnModel();
  templateRequestModel: TemplateRequestModel = new TemplateRequestModel();
  templatesModel: TemplateListModel = new TemplateListModel();
  typeahead = new EventEmitter<string>();
  constructor(private trashInspectionPnListsService: ItemsPlanningPnListsService,
              private cd: ChangeDetectorRef,
              private eFormService: EFormService) {
    this.typeahead
      .pipe(
        debounceTime(200),
        switchMap(term => {
          this.templateRequestModel.nameFilter = term;
          return this.eFormService.getAll(this.templateRequestModel);
        })
      )
      .subscribe(items => {
        this.templatesModel = items.model;
        this.cd.markForCheck();
      });
  }

  ngOnInit() {
  }

  show(listModel: ItemsListPnModel) {
    this.getSelectedList(listModel.id);
    this.frame.show();
  }

  getSelectedList(id: number) {
    // debugger;
    this.spinnerStatus = true;
    this.trashInspectionPnListsService.getSingleList(id).subscribe((data) => {
      if (data && data.success) {
        this.selectedListModel = data.model;
      } this.spinnerStatus = false;
    });
  }

  updateList() {
    this.spinnerStatus = true;
    const model = new ItemsListPnUpdateModel(this.selectedListModel);
    this.trashInspectionPnListsService.updateList(model)
      .subscribe((data) => {
      if (data && data.success) {
        this.onListUpdated.emit();
        this.selectedListModel = new ItemsListPnModel();
        this.frame.hide();
      } this.spinnerStatus = false;
    });
  }

  onSelectedChanged(e: any) {
    // debugger;
    // this.selectedListModel.eFormId = e.id;
  }
  addNewItem() {
    const newItem = new ItemsListPnItemModel();
    // set corresponding id
    if (!this.selectedListModel.items.length) {
      newItem.id = this.selectedListModel.items.length;
    } else {
      newItem.id = this.selectedListModel.items[this.selectedListModel.items.length - 1].id + 1;
    }
    this.selectedListModel.items.push(newItem);
  }

  removeItem(id: number) {
    this.selectedListModel.items = this.selectedListModel.items.filter(x => x.id !== id);
  }
}