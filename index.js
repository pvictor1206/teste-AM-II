const express = require('express');
const { auth, signInWithEmailAndPassword } = require('./firebase'); // Importe o método signInWithEmailAndPassword
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota de login (GET)
app.get('/login', (req, res) => {
    res.render('login');
});

// Exemplo de login usando autenticação Firebase (POST)
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Use o signInWithEmailAndPassword corretamente
        await signInWithEmailAndPassword(auth, email, senha);
        res.redirect('/home');
    } catch (error) {
        res.render('login', { error: 'Erro ao fazer login: Credenciais inválidas' });
    }
});

// Rota para a página 'home' após login bem-sucedido
app.get('/home', (req, res) => {
    res.render('home');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

app.get('/logout', (req, res) => {
    auth.signOut().then(() => {
        res.redirect('/login'); // Redireciona o usuário para a página de login após o logout
    }).catch((error) => {
        res.send('Erro ao fazer logout: ' + error.message);
    });
});
