const express = require('express');
const { auth, signInWithEmailAndPassword, db, collection, addDoc } = require('./firebase'); // Inclua Firestore
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true })); // Para interpretar os dados do formulário
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
        await signInWithEmailAndPassword(auth, email, senha);
        res.redirect('/home');
    } catch (error) {
        res.render('login', { error: 'Erro ao fazer login: Credenciais inválidas' });
    }
});

// Rota de cadastro de produtos (GET)
app.get('/cadastro-produtos', (req, res) => {
    res.render('cadastro-produtos');
});

// Rota de cadastro de produtos (POST)
app.post('/cadastro-produtos', async (req, res) => {
    const { nomeProduto, descricao, preco } = req.body; // Captura os dados enviados pelo formulário

    try {
        // Salvar o produto no Firestore
        await addDoc(collection(db, 'produtos'), {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco)
        });

        res.redirect('/produtos'); // Redireciona para a lista de produtos após o cadastro
    } catch (error) {
        res.render('cadastro-produtos', { error: 'Erro ao cadastrar produto: ' + error.message });
    }
});

// Rota para exibir produtos (GET)
app.get('/produtos', async (req, res) => {
    try {
        // Busca todos os produtos cadastrados no Firestore
        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const produtos = produtosSnapshot.docs.map(doc => ({
            id: doc.id, // Adiciona o ID do documento
            ...doc.data() // Adiciona os dados do documento
        }));

        // Renderiza a página de produtos, garantindo que produtos seja um array
        res.render('produtos', { produtos: produtos.length ? produtos : [] });
    } catch (error) {
        res.render('produtos', { produtos: [], error: 'Erro ao buscar produtos: ' + error.message });
    }
});

// Rota para a página 'home' após login bem-sucedido
app.get('/home', (req, res) => {
    res.render('home');
});

// Rota de logout
app.get('/logout', (req, res) => {
    auth.signOut().then(() => {
        res.redirect('/login'); // Redireciona o usuário para a página de login após o logout
    }).catch((error) => {
        res.send('Erro ao fazer logout: ' + error.message);
    });
});

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
