const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const elastic = require('./elastic')

const app = express();

passport.use(new LocalStrategy(
	{usernameField: 'username'},
	function(username, password, done) {
		axios.get('http://localhost:5000/users?username=' + username).then(function(res){
			const user = res.data[0];
			if(!user) {
				return done(null, false, {message: 'Username doesn\'t exists.\n'});
			}
			if(!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {message: 'Wrong password.\n'});
			}
			return done(null, user);
		}).catch(function(err){
			console.log(err);
			done(err);
		});
	}
));
passport.serializeUser(function(user, done){
	done(null, user.id);
});
passport.deserializeUser(function(id, done){
	axios.get('http://localhost:5000/users/' + id).then(function(res){
		done(null, res.data);
	}).catch(function(err){
		console.log(err);
		done(err, false);
	});
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "Your secret key" }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
	res.redirect('/login');
})

app.get('/signup', function(req, res) {
	res.render('signup');
});

app.get('/login', function(req, res) {
	res.render('login');
});

app.post('/signup', function(req, res) {
	if(!req.body.username || !req.body.password) {
		res.render('signup', { message: 'All fields need to be filled' })
	} else {
		axios.get('http://localhost:5000/users?username=' + req.body.username).then(function(result){
			if(!result.data[0]) {
				axios.post('http://localhost:5000/users', {
					username: req.body.username,
					password: bcrypt.hashSync(req.body.password)
				});
				req.session.user = {username: req.body.username, password: req.body.password};
				res.redirect('/login');
			} else {
				res.render('signup', { message: "Username already exists! Login or choose another username" });
			}
		}).catch(function(err){
			console.log(err);
		});
	}
});

app.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if(!user) return res.render('login', { message: info.message });
		if(err) return next(err);
		req.login(user, function(error) {
			if(error) return next(err);
			return res.redirect('/some_page');
		});
	})(req, res, next);
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
})

app.get('/some_page', function(req, res) {
	if(req.isAuthenticated()) {
		res.render('some_page');
	} else {
		res.render('login', { message: 'You must be logged!' });
	}
});

app.get('/all_games', function(req, res) {
	if(req.isAuthenticated()) {
		elastic.getAllGames().then(function(result) {
			res.json(result)
		})
	} else {
		res.render('login', { message: 'You must be logged!' });
	}
});

app.post('/games', function(req, res) {
	if(req.isAuthenticated()) {
		if(!req.body.gameName) {
			res.render('some_page', { message: "Something must be passed" })
		} else {
			elastic.getGames(req.body.gameName).then(function(result) {
				res.json(result);
			});
		}
	} else {
		res.render('login', { message: "You must be logged!" });
	}
});

app.listen(3000);