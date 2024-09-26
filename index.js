const express = require('express');
const multer = require('multer'); // Middleware para lidar com uploads de arquivos
const { auth, signInWithEmailAndPassword, db, storage, ref, uploadBytes, getDownloadURL, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } = require('./firebase');
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Configuração do multer para armazenar a imagem temporariamente
const upload = multer({ storage: multer.memoryStorage() });

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
    const user = auth.currentUser;
    res.render('cadastro-produtos', { isAuthenticated: !!user, isHomePage: false });
});

// Rota de cadastro de produtos (POST) com upload de imagem
app.post('/cadastro-produtos', upload.single('imagemProduto'), async (req, res) => {
    const { nomeProduto, descricao, preco } = req.body;
    const imagemProduto = req.file; // A imagem enviada

    try {
        // Salvar o produto no Firestore
        const produtoDoc = await addDoc(collection(db, 'produtos'), {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco)
        });

        // Se houver uma imagem, faça o upload para o Firebase Storage
        if (imagemProduto) {
            const storageRef = ref(storage, `produtos/${produtoDoc.id}/imagem`);
            const metadata = { contentType: imagemProduto.mimetype };

            // Faz o upload do arquivo
            await uploadBytes(storageRef, imagemProduto.buffer, metadata);

            // Obtém a URL de download da imagem
            const downloadURL = await getDownloadURL(storageRef);

            // Atualiza o documento do produto com a URL da imagem
            await updateDoc(produtoDoc, { imagemURL: downloadURL });
        }

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

// Rota de exclusão com logs
app.post('/excluir-produto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        console.log("Excluindo produto com ID:", id);
        await deleteDoc(doc(db, 'produtos', id));
        res.redirect('/produtos');
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.render('produtos', { error: 'Erro ao excluir produto: ' + error.message });
    }
});

// Rota de edição com logs
app.post('/editar-produto/:id', async (req, res) => {
    const { id } = req.params;
    const { nomeProduto, descricao, preco } = req.body;

    try {
        console.log("Editando produto com ID:", id);
        await updateDoc(doc(db, 'produtos', id), {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco)
        });
        res.redirect('/produtos');
    } catch (error) {
        console.error("Erro ao editar produto:", error);
        res.render('editar-produto', { error: 'Erro ao editar produto: ' + error.message });
    }
});

// Rota para exibir o formulário de edição de um produto (GET)
app.get('/editar-produto/:id', async (req, res) => {
    const produtoId = req.params.id; // Captura o ID do produto da URL

    try {
        // Referência ao documento do Firestore
        const produtoRef = doc(db, 'produtos', produtoId);

        // Buscar o documento do Firestore
        const produtoSnapshot = await getDoc(produtoRef);

        if (produtoSnapshot.exists()) {
            const produto = { id: produtoSnapshot.id, ...produtoSnapshot.data() };
            res.render('editar-produto', { produto });
        } else {
            res.send('Produto não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.send('Erro ao buscar produto: ' + error.message);
    }
});

// Rota para atualizar um produto (POST)
app.post('/editar-produto/:id', async (req, res) => {
    const produtoId = req.params.id; // Captura o ID do produto da URL
    const { nomeProduto, descricao, preco } = req.body; // Captura os novos dados do formulário

    try {
        // Referência ao documento do Firestore
        const produtoRef = doc(db, 'produtos', produtoId);

        // Atualizar o documento no Firestore
        await updateDoc(produtoRef, {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco)
        });

        // Redireciona para a lista de produtos após a edição
        res.redirect('/produtos');
    } catch (error) {
        console.error('Erro ao editar produto:', error);
        res.send('Erro ao editar produto: ' + error.message);
    }
});