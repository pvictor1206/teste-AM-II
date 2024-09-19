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

// Rota de login (GET)
app.get('/login', (req, res) => {
    res.render('login');
});

// Rota de login (POST) com redirecionamento para 'home' após login bem-sucedido
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Exemplo básico de autenticação
    if (email === 'user@example.com' && senha === 'password') {
        res.redirect('/home'); // Redireciona para a página home após login
    } else {
        res.render('login', { error: 'Credenciais inválidas' }); // Renderiza erro de login
    }
});

// Rota da página home após login
app.get('/home', (req, res) => {
    res.render('home'); // Renderiza a página home com os botões
});

// Rota de cadastro de produtos (GET)
app.get('/cadastro-produtos', (req, res) => {
    res.render('cadastro-produtos');
});

// Rota de cadastro de produtos (POST)
app.post('/cadastro-produtos', (req, res) => {
    const { nome, email, senha } = req.body;
    res.render('cadastro-produtos', { error: 'Erro ao cadastrar produto' });
});

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
