var express = require('express');
var session = require('express-session');
var MySQLStore =require('express-mysql-session')(session);
var bodyParser = require('body-parser');

var app =express();
//jade view 파일 이쁘게
app.locals.pretty = true;

//jade 설정
app.set('views', './views');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '1234DSFs@adf1234!@#$asd',
  resave: false,
  saveUninitialized: true,
  store:new MySQLStore({
    host:'localhost',
    port:3306,
    user:'root',
    password:'111111',
    database:'o2'
  })
}));

//라우팅
app.get('/', function(req, res){
  res.render("main")
});
app.get('/boxoffice',function(req,res){
  res.render("box")
});
app.get('/recommendation',function(req,res){
  res.render("rec")
});


app.listen(3000, function(){
  console.log('Connected, 3000 Port!')
});
