var express = require('express');
var session = require('express-session');
var MySQLStore =require('express-mysql-session')(session);
var bodyParser = require('body-parser');

//로그인 작업
var bkfd2Password = require("pbkdf2-password");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var hasher = bkfd2Password();

//db 연결
var mysql = require('mysql');
var conn = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '111111',
  database : 'watcha'
});
conn.connect();

var app =express();
//jade view 파일 이쁘게
app.locals.pretty = true;

//로그인 작업 설정
app.use(passport.initialize());
app.use(passport.session());

//jade 설정
app.set('views', './views');
app.set('view engine', 'jade');


app.use(bodyParser.urlencoded({ extended: false }));
//세션 설정
app.use(session({
  secret: '1234DSFs@adf1234!@#$asd',
  resave: false,
  saveUninitialized: true,
  store:new MySQLStore({
    host:'localhost',
    port:3306,
    user:'root',
    password:'111111',
    database:'watcha'
  })
}));

//passport serialize 설정
passport.serializeUser(function(user,done){
  console.log('serializeuser', user);
  done(null, user.authId);
});
passport.deserializeUser(function(id, done){
  console.log("deserializeUser", id);
  var sql = 'SELECT * FROM users WHERE authId=?';
  conn.qeury(sql,[id], function(err,results){
    if(err){
      console.log(err);
      done('There is no user')
    }else{
      done(null, results[0]);
    };
  });
});
//passport 전략 설정
passport.use(new LocalStrategy(
  function(username, password, done){
    var uname = username;
    var pwd = password;
    var sql = "SELECT * FROM users WHERE authId=?";
    conn.query(sql, ['local:'+uname],function(err, results){
      if(err){
        return done('There is no user.');
      }
      var user = results[0];
      return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
        if(hash === user.password){
          console.log('LocalStrategy', user);
          done(null, user);
        }else{
          done(null, false);
        }

      });
    });
  }
));

passport.use(new FacebookStrategy({
  clientID: '102742520230194',
  clientSecret: '54e3ae01a654e4b71d898f1a3df0c69e',
  callbackURL: "/auth/facebook/callback",
  profileFields:['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'displayName']
},
  function(accessToken, refreshToken, profile, done){
    console.log(profile);
    var authId = 'facebook:'+profile.id;
    var sql = 'SELECT * FROM users WHERE authId=?';
    conn.query(sql, [authId], function(err, results){
      if(results.length>0){
        done(null, results[0]);
      }else{
        var newuser = {
          'authId':authId,
          'displayName':profile.displayName,
          'email':profile.emails[0].value
        };
        var sql ='INSERT INTO users SET ?'
        conn.query(sql, newuser, function(err, results){
          if(err){
            console.log(err);
            done('Error');
          }else{
            done(null, newuser);
          }
        })
      }
    });
  }
));

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


//로그인 로그아웃
app.get('/auth/login', function(req, res){
  res.render('auth/login');
});

app.post(
  '/auth/login',
  passport.authenticate(
    'local',
    {
      successRedirect: '/',
      failureRedirect: 'auth/login',
      failureFlash: false
    }
  )
);

app.get('/auth/register', function(req, res){
  res.render('auth/register')
});
app.post('/auth/register', function(req, res){
  hasher({password : req.body.password},function(err, pass, salt, hash){
    var user = {
      authId : 'local:'+req.body.username,
      username:req.body.username,
      password:hash,
      salt:salt,
      displayName:req.body.displayName,
      email:req.body.email
    };
    var sql = 'INSERT INTO users SET ?';
    conn.query(sql, user, function(err, results){
      if(err){
        console.log(err);
        res.status(500);
      }else{
        req.login(user, function(err){
          req.session.save(function(){
            res.redirect('/');
          });
        });
      }
    })
  });
});

app.get(
  '/auth/facebook',
  passport.authenticate(
    'facebook',
    {scope:'email'}
  )
);
app.get(
  '/auth/facebook/callback',
  passport.authenticate(
    'facebook',
    {
      successRedirect: '/',
      failureRedirect: '/auth/login'
    }
  )
);



app.listen(3003, function(){
  console.log('Connected, 3003 Port!')
});
