const { admin } = require('../utils/firebase');
const { db } = require('../utils/firebase');
const logger = require('../utils/logger');

/**
 * Google OAuth Authentication Handler
 * 
 * Este endpoint recebe os dados do Google OAuth e:
 * 1. Valida o token do Firebase
 * 2. Verifica se o usuário já existe no Firestore
 * 3. Se não existe, cria um novo usuário
 * 4. Retorna os dados do usuário
 */
const handleGoogleAuth = async (req, res) => {
  try {
    const { userType, email, displayName, uid } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const idToken = authHeader.replace('Bearer ', '');

    // Validar token do Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (decodedToken.uid !== uid) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    logger.info(`🔐 [Google Auth] Verificando usuário: ${email}`);

    // Verificar se usuário já existe
    const usersRef = db.collection('users');
    const userQuery = await usersRef
      .where('email', '==', email)
      .where('userType', '==', userType)
      .limit(1)
      .get();

    let userData;

    if (!userQuery.empty) {
      // Usuário já existe
      const userDoc = userQuery.docs[0];
      userData = userDoc.data();
      logger.info(`✅ [Google Auth] Usuário existente encontrado: ${email}`);
      
      // Atualizar último login
      await userDoc.ref.update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Criar novo usuário
      logger.info(`📝 [Google Auth] Criando novo usuário: ${email}`);
      
      userData = {
        uid: uid,
        email: email,
        nomeCompleto: displayName || 'Usuário Google',
        userType: userType,
        cpf: '', // CPF vazio para usuários Google
        googleAuth: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      };

      await usersRef.doc(uid).set(userData);
      logger.info(`✅ [Google Auth] Novo usuário criado: ${email}`);
    }

    // Retornar dados do usuário (sem timestamp para não causar problemas)
    res.status(200).json({
      uid: userData.uid,
      email: userData.email,
      nomeCompleto: userData.nomeCompleto,
      userType: userData.userType,
      cpf: userData.cpf || '',
    });

  } catch (error) {
    logger.error('❌ [Google Auth] Erro:', error.message);
    res.status(500).json({ error: error.message || 'Erro na autenticação Google' });
  }
};

module.exports = {
  handleGoogleAuth,
};
