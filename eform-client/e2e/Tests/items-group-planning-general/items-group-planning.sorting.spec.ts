import loginPage from '../../Page objects/Login.page';
import itemsGroupPlanningListPage from '../../Page objects/ItemsGroupPlanning/ItemsGroupPlanningList.page';

const expect = require('chai').expect;

describe('Items group planning lists table sorting', function () {
  before(function () {
    loginPage.open('/auth');
    loginPage.login();
    itemsGroupPlanningListPage.goToListsPage();
  });
  it('should create dummy lists', function () {
    itemsGroupPlanningListPage.createDummyLists();
  });
  it ('should be able to sort by ID', function () {
    const listBefore = $$('#listId').map(item => {
      return item.getText();
    });

    // check that sorting is correct in both directions
    for (let i = 0; i < 2; i ++) {
      itemsGroupPlanningListPage.clickIdTableHeader();

      const listAfter = $$('#listId').map(item => {
        return item.getText();
      });

      // get current direction of sorting
      const sortIcon = $('#idTableHeader i').getText();
      let sorted;
      if (sortIcon === 'expand_more') {
        sorted = listBefore.sort().reverse();
      } else if (sortIcon === 'expand_less') {
        sorted = listBefore.sort();
      } else {
        sorted = listBefore;
      }
      expect(sorted, 'Sort by ID incorrect').deep.equal(listAfter);
    }
    $('#spinner-animation').waitForDisplayed({timeout: 90000, reverse: true});
  });
  it ('should be able to sort by Name', function () {
    const listBefore = $$('#listName').map(item => {
      return item.getText();
    });

    // check that sorting is correct in both directions
    for (let i = 0; i < 2; i ++) {
      itemsGroupPlanningListPage.clickNameTableHeader();

      const listAfter = $$('#listName').map(item => {
        return item.getText();
      });

      // get current direction of sorting
      const sortIcon = $('#nameTableHeader i').getText();
      let sorted;
      if (sortIcon === 'expand_more') {
        sorted = listBefore.sort().reverse();
      } else if (sortIcon === 'expand_less') {
        sorted = listBefore.sort();
      } else {
        sorted = listBefore;
      }

      $('#spinner-animation').waitForDisplayed({timeout: 90000, reverse: true});
      expect(sorted, 'Sort by Name incorrect').deep.equal(listAfter);
    }
    $('#spinner-animation').waitForDisplayed({timeout: 90000, reverse: true});
  });
  it ('should be able to sort by Description', function () {
    const listBefore = $$('#listDescription').map(item => {
      return item.getText();
    });

    // check that sorting is correct in both directions
    for (let i = 0; i < 2; i ++) {
      itemsGroupPlanningListPage.clickDescriptionTableHeader();

      const listAfter = $$('#listDescription').map(item => {
        return item.getText();
      });

      // get current direction of sorting
      const sortIcon = $('#descriptionTableHeader i').getText();
      let sorted;
      if (sortIcon === 'expand_more') {
        sorted = listBefore.sort().reverse();
      } else if (sortIcon === 'expand_less') {
        sorted = listBefore.sort();
      } else {
        sorted = listBefore;
      }

      expect(sorted, 'Sort by Description incorrect').deep.equal(listAfter);
    }
    $('#spinner-animation').waitForDisplayed({timeout: 90000, reverse: true});
  });
  it('should clear table', function () {
    itemsGroupPlanningListPage.clearTable();
  });
});
