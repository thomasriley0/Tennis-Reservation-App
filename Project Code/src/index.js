//From lab example
app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

//Login API Routes
app.get('/login',(req,res) =>{
    res.render('pages/login');
});

app.post('/login', async(req,res)=>{
    try {
        const username = req.body.username;
        const password = req.body.password;
        const query= `select * from users where username='${username}';`;
        let user= await db.any(query);
        //console.log(user);

        if(user.length!=0){
            // check if password from request matches with password in DB
            const match = await bcrypt.compare(req.body.password, user[0].password);
            if(match.err){
                throw new Error("Incorrect username or password");
            }else{//save user details in session like in lab 8
                req.session.user = user;
                req.session.save();
                res.redirect('/discover');
            }
        }else{
            res.redirect('/register');
        } 
    } catch(error) {
        res.render('pages/login', {message:error});
    }
});

//Start server
module.exports = app.listen(3000);