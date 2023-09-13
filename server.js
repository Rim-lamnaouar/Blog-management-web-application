const express = require("express");
const app = express();
const axios = require("axios");
const Users = require("./database/data.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secret = "learnExpress";
const cookies = require("cookie-parser");
const multer = require("multer");
const PORT = 3000;

app.use(cookies())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static('Public'))

app.get('/addBlog', (req, res) =>{
    res.render('addBlog')
})

app.get('/dashboard', (req, res) =>{
    res.render('dashboard')
})

app.get('/signUp&signIn', (req, res) =>{
    res.render('signUp&signIn')
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './Public/uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });

app.post('/addingBlog', upload.single("image"), (req, res) =>{
    const {title, description, author} = req.body 
    const image = req.file;  
    console.log(image)
    const newBlog = {
        title: title,
        description: description,
        author: author,
        image: image.filename
    }
    // console.log(newBlog)
    axios.post('http://localhost:3500/Blog', newBlog)
    res.redirect('/allBlogs')
    res.end()

})

// app.post('/signUp', upload.single("image"),(req, res) =>{
//     const {name, email, password} = req.body 
//     const image = req.file;  
//     console.log(image)
//     const newUser = {
//         name: name,
//         email: email,
//         password: password,
//         image: image.filename
//     }
//     // console.log(newUser)
//     axios.post('http://localhost:8500/Users', newUser)
//     res.redirect('/signUp&signIn')
//     res.end()

// })


app.post('/signUp', upload.single("image"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const image = req.file;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name: name,
      email: email,
      password: hashedPassword,
      image: image.filename
    }
    await axios.post('http://localhost:3500/Users', newUser);

    res.redirect('/signUp&signIn');
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
});


app.post('/signIn', (req,res) =>{
    const {email, password} = req.body 
    axios.get('http://localhost:3500/Users')
    .then((response) =>{
        const users = response.data
        const user = users.find(user => user.email === email)

        bcrypt.compare(password, user.password, (err, isPasswordCorrect) => {
            if(isPasswordCorrect){
                const token = jwt.sign({email: email}, secret)
                res.cookie('token', token)
                res.redirect('/allBlogs')
            } else {
                return res.send("Invalid user or password");
           }
        });
    })
    .catch((err) =>{
        console.log(err)
    })
})


// app.post("/signIn", (req, res) => {
//     const { email, password } = req.body;
//     const user = users.users.find((u) => u.email == email);
//     if (!user) {
//       return res.send("user not found");
//     }
//     if (!(user.password == password)) {
//       return res.send("password incorrect");
//     }
//     const token = jwt.sign({ email: email, image: user.image }, secret);
//     res.cookie("token_auth", token);
//     res.redirect("/allBlogs");
//   });

// app.get('/logout', (req,res) =>{
//     res.clearCookie('token')
//     res.redirect('/signUp&signIn')
// })

app.get('/allBlogs', async (req,res)=>{
    let fetchBlogs = await axios.get('http://localhost:3500/Blog')
    let blogs =await fetchBlogs.data
    // console.log(blogs) 
    res.render('allBlogs',{blogs})
})


app.use((req,res,next) =>res.render('404'))

app.listen(PORT, () =>{
    console.log(`Server listening on port ${PORT}`)
});
