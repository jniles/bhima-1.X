//ce module a pour role de transformer une requette tres generale de l'arbre en un requette approprie, tenant compte de l'utilisateur et ses droits
var db = require('../database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler = require('../database/myQueryHandler')
  , url = require('url');

exports.manageUser = function(req, res, next) {
  var myRequest = decodeURIComponent(url.parse(req.url).query);
  var jsRequest = JSON.parse(myRequest);  
  var Qo = queryHandler.getQueryObj(jsRequest); //Qo est la requette envoyee par l'arbre
  var field = Qo.cond[0].cl; //champs concerne de l;a table
  var value = Qo.cond[0].v; 
  var id_user = req.session.user_id;
  getItems(id_user, field, value, Qo, req, res);
};

var getItems = function(id_user, field, value, client_request, req, res) {
  if(value === 0){
    processMetadata(id_user, field, value, client_request, res);
  }
  //la requette ne concerne pas la racine
  else{
   processData(id_user, value, res);
  }
};

var containes = function(value, tableau){
  return tableau.some(function(v) { return v === value; });
};

var processMetadata = function(id_user, field, value, client_request, res){
  //on demande les fils de la racine
  if(field == 'parent'){
     //checking permission dans la base des donnees
    var sql = 'SELECT `unit`.`parent`, `permission`.`id`, `user`.`id` ' + 
               'FROM `unit` JOIN `permission` JOIN `user` ' + 
               'ON `permission`.`id_unit`=`unit`.`id` ' +
                  'AND `permission`.`id_user`=`user`.`id` ' +
                  'AND `permission`.`id_user`='+id_user; 

    db.execute(sql, function(err, results){
      if(err){
        throw err;
      }
      var taille = results.length;
      if(taille>0){
        var tab_id_role = [];
        tab_id_role.push(results[0].parent);
        for(var i=1; i<taille; i++){
          if(!containes(results[i].parent, tab_id_role)){
            tab_id_role.push(results[i].parent);
          }
        }
        //les fils a retourner se trouve dans le tableau tab_id_role, donc requette appropriee
        var requette_approprie = {'entities' : [{t : 'unit',c : ['id', 'name', 'description', 'parent', 'has_children', 'p_url']}],
                                  'cond' : [{t : 'unit',cl: 'parent',z : '=',v : value,l:'AND'},{t:'unit',cl:'id',z:'IN',v:"(" + tab_id_role.toString() + ")"}]
                                 };
        var sql = db.select(requette_approprie);
        db.execute(sql, function(err, results){
          if(err){
            throw err;
          }
          res.json(results);
        });
      }
    });
  }
  //on demande la racine elle meme
  else{
    var sql = db.select(client_request);    
    db.execute(sql, function(err, results){
      if(err){
        throw err;
      }
      res.json(results);
    });
  }
};

var processData = function(id_user, value, res){
   //checking permission
    var permission_req = {'entities':[{t:'permission', c:['id_unit']},{t:'user', c:['id']},{t:'unit', c:['id']}],
                          'jcond':[{ts:['permission', 'user'], c:['id_user', 'id'], l:'AND'},{ts:['permission','unit'], c:['id_unit', 'id'], l:'AND'}],
                          'cond':[{t:'user', cl:'id', z:'=', v:id_user, l:'AND'},{t:'unit', cl:'parent', z:'=', v:value}]
                         };
    var sql = db.select(permission_req);
    db.execute(sql, function(err, results){
      if(err){
        next(err);
      }
      var tab_ids = [];
      var taille = results.length;
      if(taille>0){
        for(var i=0; i<results.length; i++){
          tab_ids.push(results[i].id_unit);
        }
        //une requette appropriee pour l'arbre
        var requette_approprie = {'entities' : [{t : 'unit',c : ['id', 'name', 'description', 'parent', 'has_children', 'p_url']}],
                                  'cond' : [{t : 'unit',cl: 'parent',z : '=',v : value,l:'AND'},{t:'unit',cl:'id',z:'IN',v:"(" + tab_ids.toString() + ")"}]
                                 };
        var sql = db.select(requette_approprie);
        db.execute(sql, function(err, results){
          if(err){
            throw err;
          }
          res.json(results);
        });
      }
    });
};
