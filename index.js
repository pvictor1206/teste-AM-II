const express = require('express');
const { auth, signInWithEmailAndPassword, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc  } = require('./firebase'); // Inclua doc
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware para verificar autenticação e passar o estado para as views
app.use((req, res, next) => {
    const user = auth.currentUser;

    // Verifica se há um usuário autenticado
    if (user) {
        res.locals.isAuthenticated = true; // Passa a variável isAuthenticated para todas as views
    } else {
        res.locals.isAuthenticated = false; // Usuário não está logado
    }

    next();
});

// Rota principal (Home)
app.get('/', (req, res) => {
    const user = auth.currentUser; // Verifica se há um usuário logado
    res.render('index', { isHomePage: true, isAuthenticated: !!user }); // Definir isHomePage como true
});

// Rota de login (GET)
app.get('/login', (req, res) => {
    res.render('login', { isAuthenticated: false, isHomePage: false }); // Definir isHomePage como false
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
    const user = auth.currentUser; // Verifica se há um usuário logado
    res.render('cadastro-produtos', { isAuthenticated: !!user, isHomePage: false });
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
    const user = auth.currentUser; // Verifica se há um usuário logado
    try {
        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const produtos = produtosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.render('produtos', { produtos, isAuthenticated: !!user, isHomePage: false });
    } catch (error) {
        res.render('produtos', { produtos: [], error: 'Erro ao buscar produtos', isAuthenticated: !!user });
    }
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

// Rota para a página 'home' após login bem-sucedido
app.get('/home', (req, res) => {
    const user = auth.currentUser; // Verifica se há um usuário logado
    if (user) {
        console.log("Usuário autenticado:", user.email);
        // Renderiza a página home se estiver autenticado
        res.render('home', { isAuthenticated: true, isHomePage: true });
    } else {
        // Redireciona para login se não estiver autenticado
        //res.redirect('/login');
    }
});
