var express = require('express');
var mysql = require('./dbcon.js');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 7753);
app.use(express.static('public')); //Allows files from the public folder to be accessed

app.get('/',function(req,res,next){
    res.render('home');
  });

// Does get request and sends the database entries where keywords match either the product title or description.
app.get('/search', function(req, res, next){
  var context = {};
  mysql.pool.query('SELECT * FROM products WHERE name REGEXP ? OR description REGEXP ?', [req.query.name, req.query.name], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.results = rows
    res.send(context);
  });
});

app.get('/add',function(req,res,next){
      res.render('add');
    });

app.get('/insert',function(req,res,next){
  var context = {};
  mysql.pool.query("INSERT INTO products(`name`, `price`, `stock`, `description`, `image`, `cart`) VALUES (?,?,?,?,?,?)", 
  [req.query.name, req.query.price, req.query.stock, req.query.description, req.query.image, req.query.cart], function(err, result){
    if(err){
      next(err);
      return;
    }
    context.insert = req.query
    context.results = result
    res.send(context)
  });
});

app.get('/product',function(req,res,next){
  var context = {};
  mysql.pool.query('SELECT * FROM products WHERE id=?', [req.query.id], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.results = rows
  res.render('product', context);
  });
});

app.get('/delete',function(req,res,next){
  var context = {};
  mysql.pool.query("DELETE FROM products WHERE id=?", [req.query.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    context.results = "Deleted " + result.changedRows + " rows.";
    res.render('home', context);
  });
});

///safe-update?id=1&name=The+Task&done=false
app.get('/safe-update',function(req,res,next){
  var context = {};
  mysql.pool.query("SELECT * FROM products WHERE id=?", [req.query.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    if(result.length == 1){
      var curVals = result[0];
      mysql.pool.query("UPDATE products SET name=?, done=?, due=? WHERE id=? ",
        [req.query.name || curVals.name, req.query.done || curVals.done, req.query.due || curVals.due, req.query.id],
        function(err, result){
        if(err){
          next(err);
          return;
        }
        context.results = "Updated " + result.changedRows + " rows.";
        res.render('home', context);
      });
    }
  });
});

app.get('/reset-table',function(req,res,next){
    var context = {};
    mysql.pool.query("DROP TABLE IF EXISTS products", function(err){ //replace your connection pool with the your variable containing the connection pool
      var createString = "CREATE TABLE products("+
      "id INT PRIMARY KEY AUTO_INCREMENT,"+
      "name VARCHAR(255) NOT NULL,"+
      "price INT,"+
      "stock INT,"+
      "description VARCHAR(255),"+
      "image VARCHAR(255),"+
      "cart BOOLEAN)";
      mysql.pool.query(createString, function(err){
        context.results = "Table reset";
        res.render('home', context);
      })
    });
  });

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://flip3.engr.oregonstate.edu/' + app.get('port') + '; press Ctrl-C to terminate.');
});
