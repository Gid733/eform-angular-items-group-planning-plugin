import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {saveAs} from 'file-saver';
import {ActivatedRoute} from '@angular/router';
import {SharedPnService} from '../../../../shared/services';
import {ItemsPlanningPnCasesService, ItemsPlanningPnReportsService} from '../../../services';
import {PageSettingsModel} from '../../../../../../common/models/settings';
import {ItemListCasesPnRequestModel} from '../../../models/list/item-list-cases-pn-request.model';
import {ItemListPnCaseResultListModel, ItemsListPnCaseResultModel} from '../../../models/list';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ReportPnGenerateModel} from '../../../models/report';
import {ToastrService} from 'ngx-toastr';
import {format} from "date-fns";
import {ItemsListPnItemCaseModel} from '../../../models/list/items-list-case-pn.model';

@Component({
  selector: 'app-items-planning-pn-list-case-result-page',
  templateUrl: './list-case-result-page.component.html',
  styleUrls: ['./list-case-result-page.component.scss']
})

export class ListCaseResultPageComponent implements OnInit {
  @ViewChild('uploadedDataModal') uploadedDataModal;
  @Output() generateReport: EventEmitter<ReportPnGenerateModel> = new EventEmitter();
  @Output() saveReport: EventEmitter<ReportPnGenerateModel> = new EventEmitter();
  generateForm: FormGroup;
  localPageSettings: PageSettingsModel = new PageSettingsModel();
  listCaseRequestModel: ItemListCasesPnRequestModel = new ItemListCasesPnRequestModel();
  casesModel: ItemListPnCaseResultListModel = new ItemListPnCaseResultListModel();
  spinnerStatus = false;
  id: number;

  constructor(private activateRoute: ActivatedRoute,
              private sharedPnService: SharedPnService,
              private formBuilder: FormBuilder,
              private itemsPlanningPnCasesService: ItemsPlanningPnCasesService,
              private toastrService: ToastrService) {
    const activatedRouteSub = this.activateRoute.params.subscribe(params => {
      this.id = +params['id'];
    });
  }

  ngOnInit(): void {
    this.generateForm = this.formBuilder.group({
      dateRange: ['', Validators.required]
    });
    this.getLocalPageSettings();
    // this.getLocalPageSettings();
  }

  onGenerateReport() {
    this.listCaseRequestModel.dateFrom = format(this.generateForm.value.dateRange[0], 'YYYY-MM-DD');
    this.listCaseRequestModel.dateTo = format(this.generateForm.value.dateRange[1], 'YYYY-MM-DD');
    this.listCaseRequestModel.offset = 0;
    this.listCaseRequestModel.listId = this.id;
    this.getAllInitialData();
    // this.spinnerStatus = true;
    // this.reportService.generateReport(model).subscribe((data) => {
    //   if (data && data.success) {
    //     this.reportModel = data.model;
    //   }
    //   this.spinnerStatus = false;
    // });
  }

  onSaveReport() {
    this.spinnerStatus = true;
    // debugger;
    this.listCaseRequestModel.dateFrom = format(this.generateForm.value.dateRange[0], 'YYYY-MM-DD');
    this.listCaseRequestModel.dateTo = format(this.generateForm.value.dateRange[1], 'YYYY-MM-DD');
    this.listCaseRequestModel.offset = 0;
    this.listCaseRequestModel.listId = this.id;
    this.itemsPlanningPnCasesService.getGeneratedReport(this.listCaseRequestModel).subscribe(((data) => {
      saveAs(data, this.listCaseRequestModel.dateFrom + '_' + this.listCaseRequestModel.dateTo + '_report.xlsx');
      this.spinnerStatus = false;
    }), error => {
      this.toastrService.error();
      this.spinnerStatus = false;
    });
  }

  getLocalPageSettings() {
    this.localPageSettings = this.sharedPnService.getLocalPageSettings
    ('itemsPlanningPnSettings', 'ItemCaseResults').settings;
  }

  updateLocalPageSettings() {
    this.sharedPnService.updateLocalPageSettings
    ('itemsPlanningPnSettings', this.localPageSettings, 'ItemCaseResults');
    this.getAllInitialData();
  }


  getAllInitialData() {
    this.getAllCases();
  }

  getAllCases() {
    this.spinnerStatus = true;
    this.listCaseRequestModel.isSortDsc = this.localPageSettings.isSortDsc;
    this.listCaseRequestModel.sort = this.localPageSettings.sort;
    this.listCaseRequestModel.pageSize = this.localPageSettings.pageSize;
    this.listCaseRequestModel.listId = this.id;
    this.itemsPlanningPnCasesService.getAllCaseResults(this.listCaseRequestModel).subscribe((data) => {
      if (data && data.success) {
        this.casesModel = data.model;
      } this.spinnerStatus = false;
    });
  }

  sortTable(sort: string) {
    if (this.localPageSettings.sort === sort) {
      this.localPageSettings.isSortDsc = !this.localPageSettings.isSortDsc;
    } else {
      this.localPageSettings.isSortDsc = false;
      this.localPageSettings.sort = sort;
    }
    this.updateLocalPageSettings();
  }

  showListCasePdfModal(itemCase: ItemListPnCaseResultListModel) {
    this.uploadedDataModal.show(itemCase);
  }
  changePage(e: any) {
    if (e || e === 0) {
      this.listCaseRequestModel.offset = e;
      if (e === 0) {
        this.listCaseRequestModel.pageIndex = 0;
      } else {
        this.listCaseRequestModel.pageIndex
          = Math.floor(e / this.listCaseRequestModel.pageSize);
      }
      this.getAllCases();
    }
  }
}