angular.module('bhima.controllers')
.controller('cash.extra_payment', [
  '$scope',
  '$http',
  '$translate',
  'validate',
  'messenger',
  'appstate',
  'appcache',
  'exchange',
  '$window',
  function ($scope, $http, $translate, validate, messenger, appstate, Appcache, exchange, $window) {


    var dependencies = {};
    $scope.img = 'placeholder.gif';
    var session = $scope.session = {},
      state = $scope.state,
      cache = new Appcache('extra');

    dependencies.patients = {
      required : true,
      query : {
        tables : {
          patient : {columns : ['uuid', 'project_id', 'reference', 'debitor_uuid', 'first_name', 'last_name', 'sex', 'dob', 'origin_location_id', 'registration_date']},
          debitor : { columns : ['text']},
          debitor_group : { columns : ['account_id', 'price_list_uuid', 'is_convention']},
          project : { columns : ['abbr']}
        },
        join : ['patient.debitor_uuid=debitor.uuid', 'debitor.group_uuid=debitor_group.uuid', 'patient.project_id=project.id']
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' :{
            columns : ['id', 'account_txt', 'account_number']
          }
        },
        where : ['account.classe=4']
      }
    };

    dependencies.user = {
      query : '/user_session/'
    };

    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol']
          }
        }
      }
    };

    cache.fetch('account').then(getAccount);

    $scope.formatPatient = function (patient) {
      return patient ? [patient.first_name, patient.last_name].join(' ') : '';
    };

    $scope.formatAccount = function (ac) {
      if(ac){return ac.account_number + ' - ' + ac.account_txt;}
    };

    function processModels(models) {
      angular.extend(session, models);
      session.date = new Date();
    }

    function handleErrors(err) {
      messenger.danger('An error occured:' + JSON.stringify(err));
    }

    function getAccount(ac) {
      if (!ac) { return; }
       session.configured = true;
       session.ac = ac;
       session.complete = true;
    }

    function setCurrency(obj) {
      if (obj.currency === 1 && obj.currency_id === 2) {
        obj.balance = obj.balance * exchange.rate(null, obj.currency);
        obj.cost = obj.balance;
        obj.currency_id=obj.currency;
      } else if (obj.currency === 2 && obj.currency_id === 1) {
        obj.balance = obj.balance / exchange.rate(null, obj.currency_id);
        obj.cost = obj.balance;
        obj.currency_id=obj.currency;
      }
    }

    function search() {
      $scope.state = 'generate';
      session.patient = session.selected;
      session.configured = true;

      var id = session.patient.debitor_uuid,
        account_id = session.patient.account_id;

      dependencies.sales = {
        query : {
          tables : {
            'sale' : {
              columns : ['uuid', 'debitor_uuid']
            },
            'patient' : {
              columns : ['first_name', 'middle_name', 'last_name']
            }
          },
          join : ['sale.debitor_uuid=patient.debitor_uuid'],
          where : ['patient.debitor_uuid=' + id]
        }
      };
      validate.process(dependencies, ['sales'])
      .then(function (model) {
        var sales = model.sales.data;
        $scope.saleData = [];
        sales.forEach(function (sale) {
          $http.get('/ledgers/debitor/'+sale.debitor_uuid)
          .success(function (rows) {
            var items = rows.filter(function (row) {
              return row.balance > 0;
            });
            items.forEach(function (row) {
              row.debitor_first = sale.first_name;
              row.debitor_middle = sale.middle_name;
              row.debitor_last = sale.last_name;
              row.transaction = row.abbr + row.reference;
              row.cost = row.balance;
              row.currency = 2; // values are always in $ by default
              row.currency_id = 2; // values are always in $ by default
            });
            $scope.saleData = $scope.saleData.concat(items);
            $scope.saleDataUnique = filterUnique($scope.saleData, 'transaction');
          });
        });  
      });

      function filterUnique(array, key) {
        var filter = {},
            unique = [],
            k;
        array.forEach(function (element, idx) {
          k = array[idx][key];
          if (typeof(unique[k]) === 'undefined') {
            unique.push(array[idx]);
          }
          unique[k] = 1;
        });
        return unique;
      }
    }

    $scope.isOutstanding = function isoutstanding(receipt) {
      return receipt.debit - receipt.credit !== 0;
    };

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(processModels, handleErrors);
    });

    function submit (sale) {
      var details = {
        user_id      : session.user.data.id,
        project_id   : $scope.project.id,
        sale_uuid     : sale.inv_po_id,
        wait_account : session.account.id,
        debitor_uuid : sale.deb_cred_uuid,
        cost         : sale.cost || 0,
        currency_id  : sale.currency_id
      };

      $http.post('/extraPayment/', {
        params : {
          user_id : details.user_id,
          sale_uuid : details.sale_uuid,
          details : details
        }
      })
      .success( function() {
        validate.refresh(dependencies)
        .then(function () {
          messenger.success($translate.instant('UTIL.SUCCESS'), true);
        });
      });
    }
    function reconfigure () {
      $scope.state = null;
      session.selected = null;
    }

    function print () { $window.print(); }
    $scope.search = search;
    $scope.print = print;
    $scope.reconfigure = reconfigure;
    $scope.setCurrency = setCurrency;
    $scope.submit = submit;
  }
]);
