var configureDebitorGroupReport = function ($http, $translate, validate, reportConfigService, messenger) {

  var vm = this,
  generatedDocumentPath = null,
  serverUtilityPath = '/report/build/debitor_group_report',
  configuration = reportConfigService.configuration,
  dependencies = {};

  dependencies.debitorGroup = {
      query : {
        identifier : 'uuid',
        tables : {
          'debitor_group' : {
            columns : ['uuid', 'name', 'account_id', 'is_convention']
          }
        },
        where : ['debitor_group.is_convention=1']
      }
  };

  vm.generate_doc = $translate.instant('DEBITOR_GROUP_REPORT.GENERATE_DOC');
  vm.loading = $translate.instant('DEBITOR_GROUP_REPORT.LOADING');

  validate.process(dependencies).then(setDefaultConfiguration);

  // Expose configuration to scope - set module state
  vm.building = false;
  vm.configuration = configuration;

  function selectConfiguration(key, value) {
    configuration[key].selected = value;
  }

  function setDefaultConfiguration(models) {
    angular.extend(vm, models);
    selectConfiguration('language', configuration.language.options[1]);
  }

  // POST configuration object to /report/build/:target
  function generateDocument() {
    var path = serverUtilityPath;
    var configurationObject = {};
    configurationObject.language = configuration.language.selected.value;
    configurationObject.enterprise = configuration.enterprise;
    configurationObject.project = configuration.project;
    configurationObject.involveJournal = vm.involve_journal;
    configurationObject.dg = vm.debitorGroup.get(vm.debitor_group_uuid);
    configurationObject.unsoldOnly = vm.unsold_only;

    // Update state
    vm.building = true;

    $http.post(path, configurationObject)
    .success(function (result) {
      // Expose generated document path to template
      console.log('voici le result', result);
      vm.building = false;
      vm.generatedDocumentPath = result;
    })
    .error(function (code) {
      vm.building = false;
      messenger.danger('error' + code);
    });
  }

  function clearPath() {
    vm.generatedDocumentPath = null;
  }

  vm.selectConfiguration = selectConfiguration;
  vm.generateDocument = generateDocument;
  vm.clearPath = clearPath;
};

configureDebitorGroupReport.$inject =['$http', '$translate', 'validate', 'reportConfigService', 'messenger'];
angular.module('bhima.controllers').controller('configureDebitorGroupReport', configureDebitorGroupReport);
