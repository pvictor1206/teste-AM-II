const express = require('express');
const multer = require('multer'); // Middleware para lidar com uploads de arquivos
const { auth, signInWithEmailAndPassword, db, storage, ref, uploadBytes, getDownloadURL, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, deleteObject, createUserWithEmailAndPassword } = require('./firebase');
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

// Rotas e outros códigos permanecem os mesmos
// Rota principal (Home)
app.get('/', async (req, res) => {
    try {
        // Obtém os produtos do Firestore
        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const produtos = produtosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.render('index', { produtos: produtos.length > 0 ? produtos : [], isHomePage: true });
    } catch (error) {
        res.render('index', { produtos: [], error: 'Erro ao buscar produtos', isHomePage: true });
    }
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

// Rota para exibir produtos (GET) com paginação
app.get('/produtos', async (req, res) => {
    const user = auth.currentUser;
    const page = parseInt(req.query.page) || 1; // Página atual
    const limit = 20; // Limite de produtos por página
    const startAt = (page - 1) * limit; // Determina o índice inicial

    try {
        // Buscar todos os produtos
        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const totalProdutos = produtosSnapshot.size;

        // Calcular o número total de páginas
        const totalPages = Math.ceil(totalProdutos / limit);

        // Buscar apenas os produtos da página atual
        const produtos = produtosSnapshot.docs.slice(startAt, startAt + limit).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.render('produtos', { 
            produtos, 
            currentPage: page, 
            totalPages, 
            isAuthenticated: !!user 
        });
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
        res.redirect('/login');
    }
});

// Rota de exclusão com logs e exclusão da imagem
app.post('/excluir-produto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Buscar o documento do Firestore para obter a URL da imagem
        const produtoRef = doc(db, 'produtos', id);
        const produtoSnapshot = await getDoc(produtoRef);

        if (produtoSnapshot.exists()) {
            const produtoData = produtoSnapshot.data();
            console.log("Produto encontrado:", produtoData);

            // Se houver uma URL de imagem, excluí-la do Storage
            if (produtoData.imagemURL) {
                const storageRef = ref(storage, `produtos/${id}/imagem`);
                try {
                    console.log("Excluindo imagem associada ao produto:", produtoData.imagemURL);
                    await deleteObject(storageRef); // Excluir a imagem do Firebase Storage
                    console.log("Imagem excluída com sucesso.");
                } catch (imageDeleteError) {
                    console.error("Erro ao excluir imagem:", imageDeleteError);
                }
            } else {
                console.log("Produto não possui imagem associada.");
            }

            // Excluir o documento do produto no Firestore
            console.log("Excluindo produto com ID:", id);
            await deleteDoc(produtoRef);
            console.log("Produto excluído com sucesso.");

            res.redirect('/produtos');
        } else {
            console.log("Produto não encontrado com ID:", id);
            res.send('Produto não encontrado.');
        }
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.render('produtos', { error: 'Erro ao excluir produto: ' + error.message });
    }
});

// Rota de edição com logs e atualização de imagem
app.post('/editar-produto/:id', upload.single('imagemProduto'), async (req, res) => {
    const { id } = req.params;
    const { nomeProduto, descricao, preco } = req.body;
    const imagemProduto = req.file; // Captura a nova imagem, se enviada

    try {
        console.log("Editando produto com ID:", id);

        // Referência ao documento do Firestore
        const produtoRef = doc(db, 'produtos', id);
        const produtoSnapshot = await getDoc(produtoRef);

        if (produtoSnapshot.exists()) {
            const produtoData = produtoSnapshot.data();

            // Atualiza os campos básicos do produto
            const updateData = {
                nome: nomeProduto,
                descricao: descricao,
                preco: parseFloat(preco),
            };

            // Se uma nova imagem foi enviada, precisamos substituir a anterior
            if (imagemProduto) {
                // Se o produto tiver uma imagem antiga, excluí-la do Storage
                if (produtoData.imagemURL) {
                    const oldImageRef = ref(storage, `produtos/${id}/imagem`);
                    await deleteObject(oldImageRef);
                    console.log("Imagem antiga excluída com sucesso.");
                }

                // Fazer o upload da nova imagem
                const storageRef = ref(storage, `produtos/${id}/imagem`);
                const metadata = { contentType: imagemProduto.mimetype };
                await uploadBytes(storageRef, imagemProduto.buffer, metadata);

                // Obter a nova URL da imagem
                const downloadURL = await getDownloadURL(storageRef);
                updateData.imagemURL = downloadURL; // Atualizar a URL da imagem no Firestore
                console.log("Nova imagem enviada com sucesso.");
            }

            // Atualizar o documento do produto no Firestore
            await updateDoc(produtoRef, updateData);
            console.log("Produto atualizado com sucesso.");

            res.redirect('/produtos');
        } else {
            res.send('Produto não encontrado.');
        }
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

// Rota GET para exibir a página de configurações
app.get('/settings', (req, res) => {
    const user = auth.currentUser;

    if (user) {
        res.render('settings', { isAuthenticated: !!user, isHomePage: false });
    } else {
        res.redirect('/login'); // Redireciona para login se não estiver autenticado
    }
});

// Rota POST para processar o formulário de criação de novo usuário
app.post('/settings', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Cria um novo usuário no Firebase Authentication
        await createUserWithEmailAndPassword(auth, email, senha);

        // Passar uma mensagem de sucesso para a view
        res.render('settings', { successMessage: 'Administrador criado com sucesso!', isAuthenticated: true, isHomePage: false });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.render('settings', { error: 'Erro ao criar usuário: ' + error.message, isAuthenticated: true, isHomePage: false });
    }
});

// Rota para editar produto inline
app.post('/editar-produto-inline', upload.fields([{ name: 'imagemProduto', maxCount: 1 }]), async (req, res) => {
    try {
        // Itera pelos produtos para salvar as edições
        for (const key in req.body) {
            const produtoId = key.split('_')[1]; // Extrai o ID do produto a partir do nome do campo

            // Recupera o produto correspondente no Firestore
            const produtoRef = doc(db, 'produtos', produtoId);
            const produtoSnapshot = await getDoc(produtoRef);

            if (produtoSnapshot.exists()) {
                const produtoData = produtoSnapshot.data();

                // Dados atualizados
                const nome = req.body[`nomeProduto_${produtoId}`];
                const descricao = req.body[`descricao_${produtoId}`];
                const preco = parseFloat(req.body[`preco_${produtoId}`]);

                // Monta o objeto de atualização
                const updateData = { nome, descricao, preco };

                // Se houver uma nova imagem, faz o upload
                if (req.files[`imagemProduto_${produtoId}`]) {
                    const imagemProduto = req.files[`imagemProduto_${produtoId}`][0];
                    const storageRef = ref(storage, `produtos/${produtoId}/imagem`);
                    const metadata = { contentType: imagemProduto.mimetype };

                    // Faz o upload do novo arquivo de imagem
                    await uploadBytes(storageRef, imagemProduto.buffer, metadata);

                    // Obtém a URL de download da imagem
                    const downloadURL = await getDownloadURL(storageRef);
                    updateData.imagemURL = downloadURL; // Atualiza a URL da imagem no Firestore
                }

                // Atualiza o documento do produto
                await updateDoc(produtoRef, updateData);
            }
        }

        res.redirect('/produtos');
    } catch (error) {
        res.redirect('/produtos');
    }
});
