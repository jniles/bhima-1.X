angular.module('bhima.controllers')
.controller('receipt.loss', [
  '$scope',
  'validate',
  'appstate',
  'messenger',
  function ($scope, validate, appstate, messenger) {
    var dependencies = {}, model = $scope.model = {common : {}};

    dependencies.loss = {
      query : {
        identifier : 'uuid',
          tables : {
            consumption : { columns : ['quantity', 'date', 'uuid'] },
            consumption_loss : { columns : ['document_uuid'] },
            stock : {columns : ['tracking_number', 'lot_number', 'entry_date']},
            inventory : {columns : ['text', 'purchase_price']}
          },
          join : ['consumption.uuid=consumption_loss.consumption_uuid', 'consumption.tracking_number=stock.tracking_number', 'stock.inventory_uuid=inventory.uuid']
      }
    };

    function buildInvoice (res) {
      model.loss = res.loss.data;
    }

    appstate.register('receipts.commonData', function (commonData) {
      commonData.then(function (values) {
        model.common.location = values.location.data.pop();
        model.common.InvoiceId = values.invoiceId;
        model.common.enterprise = values.enterprise.data.pop();
        dependencies.loss.query.where =  ['consumption.document_id=' + values.invoiceId];
        validate.process(dependencies)
        .then(buildInvoice)
        .catch(function (err){
          messenger.danger('error', err);
        });
      });     
    });    
  }
]);