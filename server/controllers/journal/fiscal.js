var q         = require('q'),
    core      = require('./core'),
    uuid      = require('../../lib/guid'),
    sanitize  = require('../../lib/sanitize'),
    validate  = require('../../lib/validate')(),
    util      = require('../../lib/util'),
    db        = require('../../lib/db');

exports.close = close;

/*
 * Closes a fiscal year, migrating data over to the 
 *
 *
 * FIXME - this route has been overloaded to do both opening
 * and closing a fiscal year.  We should really only ever do
 * one operation in the posting journal with one function...
 * This code is very difficult to test.
 *
 */
function close(id, user_id, data, cb) {
  'use strict';

  /*
  * param id : new fiscal year ID
  * param user_id : user ID
  * param data : useful data
  */

  var cfg = {},
      reference,
      resAccount = data.resultat_account,
      array6 = data.class6,
      array7 = data.class7,
      array8Charge = data.solde8Charge,
      array8Profit = data.solde8Profit,   
      transactionDate,
      forcingDate;

  // FIXME - under what condition would forcing date be undefined?
  // What is forcing date?  Why make it a new date if it is undefined?
  if (typeof data.forcingDate === 'undefined' || data.forcingDate === null || !data.forcingDate) {
    forcingDate = new Date(data.forcingDate);
    cfg.isForClosing = false;
  } else {
    forcingDate = new Date(data.forcingDate);
    cfg.isForClosing = true;
  }

  getOrigin()
  .then(function () {
    cfg.user_id = user_id;
    cfg.project_id = 1; // HBB by default
    transactionDate = cfg.isForClosing ? forcingDate : new Date();
    return [
      core.queries.origin('journal'),
      core.queries.period(transactionDate)
    ];
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(cfg.project_id);
  })
  .then(function (transId) {
    cfg.trans_id = trans_id;
    if (cfg.isForClosing) {
      cfg.descrip =  'Locking Fiscal Year/' + String(transactionDate);
    } else {
      cfg.descrip =  'New Fiscal Year/' + new Date().toISOString().slice(0, 10).toString();
    }
  })
  .then(function () {
    return postingResultat(resAccount);
  })
  .then(function (res){
    return cb(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });



  function postingResultat (resAccount) {
    var processClass6 = array6.map(function (account6) {
      return processDebCred6(resAccount.id, account6);
    });

    var processClass7 = array7.map(function (account7) {
      return processDebCred7(resAccount.id, account7);
    });

    var processClass8Charge = array8Charge.map(function (account8c) {
      return processDebCred6(resAccount.id, account8c);
    });

    var processClass8Profit = array8Profit.map(function (account8p) {
      return processDebCred7(resAccount.id, account8p);
    });

    return q.all([processClass6, processClass7, processClass8Charge, processClass8Profit]);
  }

  function processDebCred6 (resultatAccount, class6Account) {
    var bundle = {
          class6Account : class6Account,
          solde         : class6Account.debit_equiv - class6Account.credit_equiv,
          currency_id   : class6Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class6Account.id, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(bundle.class6Account.id, bundle), credit(resultatAccount, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal ' +
        '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }

  function processDebCred7 (resultatAccount, class7Account) {
    var bundle = {
          class7Account : class7Account,
          solde         : class7Account.credit_equiv - class7Account.debit_equiv,
          currency_id   : class7Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(bundle.class7Account.id, bundle), credit(resultatAccount, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class7Account.id, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal '+
        '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal (' +
        'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', account.id, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM account WHERE account.id= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }
}

