const express = require('express');
const { auth, signInWithEmailAndPassword, db, collection, addDoc, getDocs, deleteDoc, doc } = require('./firebase'); // Inclua `doc`
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
    const { nomeProduto, descricao, preco } = req.body;

    try {
        // Salvar o produto no Firestore
        await addDoc(collection(db, 'produtos'), {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco)
        });

        res.redirect('/produtos');
    } catch (error) {
        res.render('cadastro-produtos', { error: 'Erro ao cadastrar produto: ' + error.message });
    }
});

// Rota para exibir produtos (GET)
app.get('/produtos', async (req, res) => {
    try {
        // Buscar todos os produtos no Firestore
        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const produtos = produtosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(produtos); // Verificar se os produtos estão sendo retornados corretamente

        res.render('produtos', { produtos: produtos.length ? produtos : [] });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.render('produtos', { produtos: [], error: 'Erro ao buscar produtos: ' + error.message });
    }
});

// Rota para excluir um produto (POST)
app.post('/excluir-produto/:id', async (req, res) => {
    const produtoId = req.params.id; // Captura o ID do produto da URL

    try {
        // Referência ao documento do Firestore
        const produtoRef = doc(db, 'produtos', produtoId);

        // Excluir o documento
        await deleteDoc(produtoRef);

        // Redireciona para a lista de produtos após a exclusão
        res.redirect('/produtos');
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.send('Erro ao excluir produto: ' + error.message);
    }
});

// Rota para a página 'home' após login bem-sucedido
app.get('/home', (req, res) => {
    res.render('home');
});

// Rota de logout
app.get('/logout', (req, res) => {
    auth.signOut().then(() => {
        res.redirect('/login');
    }).catch((error) => {
        res.send('Erro ao fazer logout: ' + error.message);
    });
});

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
