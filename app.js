const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy

const app = express();

passport.use(new LocalStrategy(
	{usernameField: 'username'},
	function(username, password, done) {
		axios.get('http://localhost:5000/users?username=' + username).then(function(res){
			const user = res.data[0];
			if(!user) {
				return done(null, false, {message: 'Invalid credentials.\n'});
			}
			if(!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {message: 'Invalid credentials.\n'});
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

app.get('/signup', function(req, res) {
	res.render('signup');
});

app.post('/signup', function(req, res) {
	if(!req.body.username || !req.body.password) {
		res.status("400");
		res.send("Invalid details!");
	} else {
		axios.get('http://localhost:5000/users?username=' + req.body.username).then(function(result){
			if(!result.data[0]) {
				axios.post('http://localhost:5000/users', {
					username: req.body.username,
					password: bcrypt.hashSync(req.body.password)
				});
				req.session.user = {username: req.body.username, password: req.body.password};
				res.redirect('/some_page');
			} else {
				res.render('signup', { message: "Username already exists! Login or choose another username" });
			}
		}).catch(function(err){
			console.log(err);
		});
	}
});

app.get('/some_page', function(req, res) {
	var username = req.session.user.username;
	res.send("SOME PAGE for you: " + username);
});

app.listen(3000);