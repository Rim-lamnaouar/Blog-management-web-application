const express = require("express");
const app = express();
const axios = require("axios");
const Users = require("./database/data.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secret = "learnExpress";
const cookies = require("cookie-parser");
const session = require('express-session');
const multer = require("multer");
const PORT = 3000;

app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "ejs");
app.use(express.static("Public"));


const alreadyLoged =(req,res,next)=>{
    const token = req.cookies.token
   
    if(token){
        return res.redirect('/allBlogs')
    } 
    next()
  }

const logger =(req,res,next)=>{
    const token = req.cookies.token
    if(!token){
        return res.redirect('/signUp&signIn')
    }
    const decoded = jwt.verify(token,secret)
    
    const {email,userCode,name,image } = decoded
    req.email = email
    req.name = name
    req.image = image
    req.userCode = userCode
    next()
  }


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./Public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/signUp&signIn", alreadyLoged,(req, res) => {
    res.render("signUp&signIn");
  });


app.post("/addingBlog", upload.single("image") ,logger, (req, res) => {
  const { title, description, author } = req.body;
  const userCode =req.userCode
  const image = req.file;
  console.log(image);
  const newBlog = {
    userCode:userCode,
    title: title,
    description: description,
    author: author,
    image: image.filename,
  };
  // console.log(newBlog)
  axios.post("http://localhost:3500/Blog", newBlog);
  res.redirect("/allBlogs");
  res.end();
});

app.post("/signUp", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const image = req.file;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userCode=Date.now().toString(36) + Math.random().toString(36).slice(2)
    const newUser = {
      userCode : userCode,
      name: name,
      email: email,
      password: hashedPassword,
      image: image.filename,
    };
    await axios.post("http://localhost:3500/Users", newUser);

    res.redirect("/signUp&signIn");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
});


app.post("/signIn", (req, res) => {
  const {email, password } = req.body;
  axios
    .get("http://localhost:3500/Users")
    .then( async (response) => {
      const users = await response.data;
      const user = users.find((user) => user.email === email);
      bcrypt.compare(password, user.password, (err, isPasswordCorrect) => {
          if (isPasswordCorrect) {
              const token = jwt.sign({ userCode:user.userCode, name:user.name , image:user.image ,email: email }, secret);
              console.log(token)
        //   req.session.isAuthenticated = true;
        //   req.session.name = user.name;
        //   req.session.image = user.image;
          res.cookie("token", token);
          res.redirect("/dashboard");
        } else {
          return res.send("Invalid user or password");
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// const isAuthenticated = (req, res, next) => {
//     if (req.session.isAuthenticated) {
//       return next();
//     }
//     res.redirect('/signIn');
// };
// isAuthenticated
app.get('/dashboard',logger, (req, res) => {
    const name = req.name;
    const image = req.image;
    // console.log(name)
    res.render("dashboard" ,{ name , image })
});

// app.get("/logout", (req, res) => {
//   res.clearCookie("token");
//   res.redirect("/allBlogs");
// });

app.get('/logout', function(req, res){
    req.session.destroy(function(){
    //    console.log("user logged out.")
    });
    res.redirect('/allBlogs');
  });

app.get("/allBlogs", async (req, res) => {
  let fetchBlogs = await axios.get("http://localhost:3500/Blog");
  let blogs = await fetchBlogs.data;
  // console.log(blogs)
  res.render("allBlogs", { blogs });
});


app.get("/editBlog/:id", async (req, res) => {
  const id = req.params.id;
  let fetchBlog = await axios.get(`http://localhost:3500/Blog/${id}`);
  let blog = await fetchBlog.data;
  res.render("editBlog", { blog });
});

app.post("/editBlog/:id", upload.single("image"), async (req, res) => {
  const id = req.params.id;
  const { title, description, author } = req.body;
  const image = req.file;
  const updatedBlog = {
    title: title,
    description: description,
    author: author
    };
    if (image) {
        updatedBlog.image = image.filename;
    }
    await axios.put(`http://localhost:3500/Blog/${id}`, updatedBlog);
    res.redirect("/allBlogs");
}
);

app.get("/deleteBlog/:id", async (req, res) => {
    const id = req.params.id;
    await axios.delete(`http://localhost:3500/Blog/${id}`);
    res.redirect("/allBlogs");
    }
);

app.get("/personalBlogs",logger, async (req, res) => {
    const userCode = req.userCode;
    try {
      const fetchBlogs = await axios.get("http://localhost:3500/Blog");
      const blogs = fetchBlogs.data;
      const personalBlogs = blogs.filter(b => b.userCode === userCode);
      res.render("personalBlogs", { personalBlogs });
    } catch (error) {
      console.error("Error fetching personal blogs:", error);
      res.status(500).send("Internal Server Error");
    }
});
  
// app.get('/myBlogs', (req, res) =>{
//     res.render("myBlogs")
// });

app.use((req, res, next) => res.render("404"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
