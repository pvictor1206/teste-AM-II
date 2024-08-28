const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    const produtos = [
        { nome: 'Notebook', descricao: 'Notebook Dell', preco: 2999.99 },
        { nome: 'Mouse', descricao: 'Mouse sem fio', preco: 99.99 }
    ];
    res.render('index', { produtos });
});

// Rota de produtos
app.get('/produtos', (req, res) => {
    const produtos = [
        { nome: 'Notebook', descricao: 'Notebook Dell', preco: 2999.99 },
        { nome: 'Mouse', descricao: 'Mouse sem fio', preco: 99.99 }
    ];
    res.render('produtos', { produtos });
});

// Rota de login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    res.render('login', { error: 'Credenciais inválidas' });
});

// Rota de cadastro
app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    res.render('cadastro', { error: 'Erro ao cadastrar usuário' });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});