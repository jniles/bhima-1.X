// Module: lib/util/util.js

// This modules adds utilities available throughout the
// server.


module.exports = {
  
  isInt : function (i) { return Math.floor(i) === Number(i); },

  // this also works for hexadecimal ('0x12')
  isNumber: function (n) { return !Number.isNaN(Number(i)); },

  isArray: function (arr) { return Object.prototype.toString.call(arr) == '[object Array]'; },

  isString: function (str) { return typeof str == 'string'; },

  isObject: function (obj) { return Object.prototype.toString.call(obj) == '[object Object]'; },

  //convertToMysqlDate: function convertToMysqlDate(dateString){ return toMySqlDate(dateString); }

  convertToMysqlDate : function (dateString) {
    // This style of convert to MySQL date avoids changing
    // the prototype of the global Date object
    return (dateString || new Date()).toISOString().slice(0, 10);
  }

};

/*
function toMySqlDate(dateParam) { 
  var date = new Date(dateParam), annee, mois, jour;
	annee = String(date.getFullYear());
	mois = String(date.getMonth() + 1);
	if (mois.length === 1) {
	mois = "0" + mois;
	}

	jour = String(date.getDate());
	if (jour.length === 1) {
    jour = "0" + jour;
	}      
	return annee + "-" + mois + "-" + jour;

}

Date.prototype.toMySqlDate = function (dateParam) {
	var date = new Date(dateParam), annee, mois, jour;
	annee = String(date.getFullYear());
	mois = String(date.getMonth() + 1);
	if (mois.length === 1) {
	mois = "0" + mois;
	}

	jour = String(date.getDate());
	if (jour.length === 1) {
    jour = "0" + jour;
	}      
	return annee + "-" + mois + "-" + jour;
};
*/
