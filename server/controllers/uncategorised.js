var db = require('./../lib/db');
var sanitize = require('./../lib/sanitize');

// Route specific requirements
var synthetic = require('./synthetic');

exports.services = function (req, res, next) { 
  var sql =
    'SELECT `service`.`id`, `service`.`name` AS `service`, `service`.`project_id`, `service`.`cost_center_id`, `service`.`profit_center_id`, `cost_center`.`text` AS `cost_center`, `profit_center`.`text` AS `profit_center`, `project`.`name` AS `project` '+
    'FROM `service` JOIN `cost_center` JOIN `profit_center` JOIN `project` ON `service`.`cost_center_id`=`cost_center`.`id` AND `service`.`profit_center_id`=`profit_center`.`id` '+
    'AND `service`.`project_id`=`project`.`id`';
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.availableCenters = function (req, res, next) { 
  var sql =
    'SELECT `cost_center`.`text`, `cost_center`.`id`, `cost_center`.`project_id`, `service`.`name` '+
    'FROM `cost_center` LEFT JOIN `service` ON `service`.`cost_center_id`=`cost_center`.`id`';

  function process(ccs) {
    var costCenters = ccs.filter(function(item) {
      return !item.name;
    });
    return costCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listEmployees = function (req, res, next) { 
  var sql =
    "SELECT " +
    "`employee`.`id`, `employee`.`code` AS `code_employee`, `employee`.`prenom`, `employee`.`name`, " +
    "`employee`.`postnom`, `employee`.`sexe`, `employee`.`dob`, `employee`.`date_embauche`, `employee`.`service_id`, " +
    "`employee`.`nb_spouse`, `employee`.`nb_enfant`, `employee`.`grade_id`, `grade`.`text`, `grade`.`basic_salary`, " +
    "`employee`.`phone`, `employee`.`email`, `employee`.`adresse`, `employee`.`bank`, `employee`.`bank_account`, `employee`.`daily_salary`, `employee`.`location_id`, " +  
    "`grade`.`code` AS `code_grade`, `debitor`.`uuid` as `debitor_uuid`, `debitor`.`text` AS `debitor_text`,`debitor`.`group_uuid` as `debitor_group_uuid`, " + 
    "`creditor`.`uuid` as `creditor_uuid`, `creditor`.`text` AS `creditor_text`, `creditor`.`group_uuid` as `creditor_group_uuid` " +
    "FROM " +
    "`employee`, `grade`, `debitor`, `creditor` " +
    "WHERE " +
    "`employee`.`grade_id` = `grade`.`uuid` AND " + 
    "`employee`.`debitor_uuid` = `debitor`.`uuid` AND " +
    "`employee`.`creditor_uuid` = `creditor`.`uuid` "

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listJournal = function (req, res, next) { 
  var sql =
    "SELECT `posting_journal`.`uuid`, `posting_journal`.`fiscal_year_id`, `posting_journal`.`period_id`, " + 
    "`posting_journal`.`trans_id`, `posting_journal`.`trans_date`, `posting_journal`.`doc_num`, " + 
    "`posting_journal`.`description`, `posting_journal`.`account_id`, `posting_journal`.`debit`, " +
    "`posting_journal`.`credit`, `posting_journal`.`currency_id`, `posting_journal`.`deb_cred_uuid`, " +
    "`posting_journal`.`deb_cred_type`, `posting_journal`.`inv_po_id`, " +
    "`posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, `posting_journal`.`currency_id`, " + 
    "`posting_journal`.`comment`, `posting_journal`.`user_id`, `posting_journal`.`pc_id`, " + 
    "`posting_journal`.`cc_id`, `account`.`account_number`, `user`.`first`, " +
    "`user`.`last`, `currency`.`symbol`, `cost_center`.`text` AS `cc`, " +
    "`profit_center`.`text` AS `pc` " +
    "FROM `posting_journal` JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` " + 
    "JOIN `user` ON `posting_journal`.`user_id`=`user`.`id` " + 
    "JOIN `currency` ON `posting_journal`.`currency_id`=`currency`.`id` " + 
    "LEFT JOIN `cost_center` ON `posting_journal`.`cc_id`=`cost_center`.`id` " + 
    "LEFT JOIN `profit_center` ON `posting_journal`.`pc_id`=`profit_center`.`id`"

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listHolidays = function (req, res, next) { 
  var pp = JSON.parse(req.params.pp);
  var sql =
    "SELECT `hollyday`.`id`, `hollyday`.`label`, `hollyday`.`dateFrom`, `hollyday`.`dateTo` " + 
    "FROM `hollyday` WHERE " + 
    "((`hollyday`.`dateFrom`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " +
    "(`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " + 
    "(`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ")) AND " +
    "`hollyday`.`employee_id`=" + sanitize.escape(req.params.employee_id) + ";"; 

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listAvailableProfitCenters = function (req, res, next) { 
  var sql =
    'SELECT `profit_center`.`text`, `profit_center`.`id`, `profit_center`.`project_id`, `service`.`name` '+
    'FROM `profit_center` LEFT JOIN `service` ON `service`.`profit_center_id`=`profit_center`.`id`';

  function process(pcs) {
    var profitCenters = pcs.filter(function(item) {
      return !item.name;
    });
    return profitCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.currentProject = function (req, res, next) { 
  var sql =
    'SELECT `project`.`id`, `project`.`name`, `project`.`abbr`, `project`.`enterprise_id`, `enterprise`.`currency_id`, `enterprise`.`location_id`, `enterprise`.`name` as \'enterprise_name\', `enterprise`.`phone`, `enterprise`.`email`, `village`.`name` as \'village\', `sector`.`name` as \'sector\' ' +
    'FROM `project` JOIN `enterprise` ON `project`.`enterprise_id`=`enterprise`.`id` JOIN `village` ON `enterprise`.`location_id`=`village`.`uuid` JOIN `sector` ON `village`.`sector_uuid`=`sector`.`uuid` ' +
    'WHERE `project`.`id`=' + req.session.project_id + ';';
  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
};

// FIXME Remove
exports.userSession = function (req, res, next) { 
  res.send({ id: req.session.user_id });
};

exports.pcashTransferSummers = function (req, res, next) { 
  var sql =
    'SELECT `primary_cash`.`reference`, `primary_cash`.`date`, `primary_cash`.`cost`, `primary_cash`.`currency_id` '+
    'FROM `primary_cash` WHERE `primary_cash`.`origin_id`= (SELECT DISTINCT `primary_cash_module`.`id` FROM `primary_cash_module` '+
    'WHERE `primary_cash_module`.`text`=\'transfer\') ORDER BY date, reference DESC LIMIT 20;'; //FIX ME : this request doesn't sort
  db.exec(sql)
  .then(function () {
    var d = []; //for now
    res.send(d);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.authenticatePin = function (req, res, next) { 
  var decrypt = req.params.pin >> 5;
  var sql = 'SELECT pin FROM user WHERE user.id = ' + req.session.user_id +
    ' AND pin = \'' + decrypt + '\';';
  db.exec(sql)
  .then(function (rows) {
    res.send({ authenticated : !!rows.length });
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.lookupMaxTableId = function (req, res, next) { 
  var maxRequest, id = req.params.id,
      table = req.params.table,
      join = req.params.join;

  maxRequest = 'SELECT MAX(' + id + ') FROM ';

  maxRequest += '(SELECT MAX(' + id + ') AS `' + id + '` FROM ' + table;
  if (join) {
    maxRequest += ' UNION ALL SELECT MAX(' + id + ') AS `' + id + '` FROM ' + join + ')a;';
  } else {
    maxRequest += ')a;';
  }

  db.exec(maxRequest)
  .then(function (ans) {
    res.send({max: ans[0]['MAX(' + id + ')']});
  })
  .catch(function (err) {
    res.send(500, {info: 'SQL', detail: err});
    console.error(err);
    return;
  })
  .done();
};

exports.listInExAccounts = function (req, res, next) { 
  // var sql = 'SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = ''+req.params.id_enterprise+'''+
  // ' AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'';
  var sql =
    'SELECT account.id, account.account_number, account.account_txt, parent ' +
    'FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ';';
  function process(accounts) {
    var InExAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0;
    });
    return InExAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseAccounts = function (req, res, next) { 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseProfitAccounts = function (req, res, next) { 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.costCenterCost = function (req, res, next) { 
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`cc_id` = ' + sanitize.escape(req.params.cc_id) + 
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {cost : 0};}
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });

    var cost = availablechargeAccounts.reduce(function (x, y) {
      return x + (y.debit - y.credit);

    }, 0);

    return {cost : cost};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('ccc', req.params.id_project, {cc_id : req.params.cc_id, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
};

exports.processProfitCenter = function (req, res, next) { 
  function process (values) {
    if (values.length <= 0) { return {profit : 0}; }
    var som = 0;
    values.forEach(function (value) {
      som+= value.credit;
    });
    return {profit:som};
  }

  synthetic('sp', req.params.id_project, {service_id : req.params.service_id}, function (err, data) {
    if (err) { return next(err); }
    res.send(process(data));
  });
};

exports.costCenterAccount = function (req, res, next) { 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN cost_center ' +
    'ON account.cc_id = cost_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id = ' + sanitize.escape(req.params.cost_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.profitCenterAccount = function (req, res, next) { 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN profit_center ' +
    'ON account.pc_id = profit_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id = ' + sanitize.escape(req.params.profit_center_id) + ';';

  function process(accounts) {
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availableprofitAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.removeFromCostCenter = function (req, res, next) { 
  var tabs = JSON.parse(req.params.tab);

  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`cc_id` = NULL WHERE `account`.`id` IN ('+tabs.join(',')+')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

exports.removeFromProfitCenter = function (req, res, next) { 
  var tabs = JSON.parse(req.params.tab);
  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`pc_id` = NULL WHERE `account`.`id` IN (' + tabs.join(',') + ')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

exports.auxCenterAccount = function (req, res, next) { 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN auxiliairy_center ' +
    'ON account.auxiliairy_center_id = auxiliairy_center.id ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.auxiliairy_center_id = ' + sanitize.escape(req.params.auxiliairy_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.checkHoliday = function (req, res, next) { 
  var sql = "SELECT id, employee_id, label, dateTo, dateFrom FROM hollyday WHERE employee_id = '"+ req.query.employee_id +"'"
          + " AND ((dateFrom >= '" + req.query.dateFrom +"') OR (dateTo >= '" + req.query.dateFrom + "') OR (dateFrom >= '"+ req.query.dateTo +"')"
          + " OR (dateTo >= '" + req.query.dateTo + "'))"
          + " AND ((dateFrom <= '" + req.query.dateFrom +"') OR (dateTo <= '" + req.query.dateFrom + "') OR (dateFrom <= '"+ req.query.dateTo +"')"
          + " OR (dateTo <= '" + req.query.dateTo + "'))"
  if (req.query.line !== ""){
    sql += " AND id <> '" + req.query.line + "'";
  }

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.checkOffday = function (req, res, next) { 
  var sql ="SELECT * FROM offday WHERE date = '" + req.query.date + "'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

