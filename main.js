const express = require("express")
const fs = require("fs")
const session = require('express-session')
const multer = require('multer')

const app = express();


app.use(express.static("public"));
app.use( express.static("uploads") );
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const upload = multer({ dest: "uploads" });

app.set('view engine', 'ejs');
app.set("views","./views");

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
	
}))

app.get("/", Home);

app.get("/username",function(req,res)
{  
   res.send(req.session.username);
});

app.route("/todo").get(GetTodo).post(upload.single("taskPic"),PostTodo);

app.route("/logout").get(function(req,res)
{
  res.redirect("/login");
})
.post(function (req, res)
{
	req.session.destroy();
	res.redirect("/login");
	
});

app.listen(3000, function()
{
	console.log("server is live")
})

app.route("/login").get(function (req, res) {
	// res.sendFile(__dirname + "/public/html/login.html");
	res.render("login",{error : ""})
})
.post(function (req, res) {
	getUser(function (users) {
	
			const user = users.filter(function (user) {
				if (user.username === req.body.username && user.password === req.body.password) {
					return true
				}
			
			})

			if (user.length) {
				req.session.isLoggedIn = true;
				req.session.currentuser = user[0];
				res.redirect("/")
			}
			else {
				// res.end("login failed");
				res.render("login",{error : "Incorrect username or password"})

			}
		});
});

app.route("/signup").get(function (req, res)
{
	res.sendFile(__dirname+"/public/html/signup.html");
})
.post(upload.single("profilePic"), function (req, res)
{
	// console.log(req.file);

	const user = {
		username: req.body.username,
		password: req.body.password,
		profilePic: req.file.filename
	}
	saveUser(user, function (err)
	{
		if (err)
		{
			res.end("Username already exists");
		}
		else
		{
			res.redirect("/login");	
		}
	})
})


function Home(req, res)
{   

	if (req.session.isLoggedIn)
	{   
		getTodos(function(err, todos)
		{
			
			const userTodos = todos.filter(function(todo)
			{
				return todo.createdBy === req.session.currentuser.username
			})

			res.render("index", {  data: userTodos, 
				user : req.session.currentuser
			});
		})
		
	}
	else
	{
	res.redirect("/login");
	}
	
}

function GetTodo(req, res)
{   
	if(req.session.isLoggedIn)
	{
	getTodos(function(err, todos)
	{
		if (err)
		{
			res.send("error in reading data from file");
			res.end();
		} 
		  const userTodos = todos.filter(function(todo)
			{
				return todo.createdBy === req.session.currentuser.username
			})

      res.json(userTodos);
	})
	}
	else
	{
    res.redirect("/login");
	}
}

function PostTodo(req, res)
{   
	// console.log(req.file);
	// console.log(req.body);
	const todo = {
		text: req.body.text,
		createdBy: req.session.currentuser.username,
		taskPic: req.file.filename
	}

	saveTodo(todo, function()
	{
		res.redirect("/");
	})

}

function getTodos(callback)
{
	fs.readFile("./todo.txt","utf-8", function(err, data)
	{
		if(err)
		{  
			callback(err, null)
			return
		}
		
		callback(null, JSON.parse(data))
	})
}


function saveTodo(todo, callback)
{
	getTodos(function(err, todos)
	{
		todos.push(todo);

		fs.writeFile("./todo.txt",JSON.stringify(todos), function(err)
		{

			if(err)
			{
				callback(err, null)
				return
			}

			callback(null);
		})

	})
}

function saveUser(user, callback)
{
	getUser(function (users)
	{   
        const val = users.filter(function (task) {
			if (user.username === task.username) {
				return true;
			}
		
		})
		
		if (val.length)
		{
			callback(val);
			return;
		}


		users.push(user);
		fs.writeFile("./users.txt", JSON.stringify(users), function () {
			callback();
		});
	})
}

function getUser(callback)
{
	fs.readFile("./users.txt", "utf-8", function (err, data)
	{
		if (data)
		{
			callback(JSON.parse(data));
		}
	})
}