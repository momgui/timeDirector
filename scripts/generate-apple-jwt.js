const jwt = require('jsonwebtoken');
const fs = require('fs');

// ====== À REMPLIR PAR TES SOINS ======
// 1. Le chemin vers ton fichier .p8 téléchargé chez Apple
const privateKeyPath = './scripts/AuthKey_A9W23J74ZX.p8';

// 2. Ton Team ID (10 caractères, récupéré à l'Étape 1)
const teamId = '5F7LCKM88X';

// 3. Ton Service ID (ex: com.momgui.timedirector.service)
const clientId = 'com.momgui.timedirector.service';

// 4. Ton Key ID (10 caractères, récupéré à l'Étape 4)
const keyId = 'A9W23J74ZX';
// =====================================

try {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d', // Valide pour 6 mois (le maximum autorisé par Apple)
    issuer: teamId,
    audience: 'https://appleid.apple.com',
    subject: clientId,
    header: {
      alg: 'ES256',
      kid: keyId,
    }
  });

  console.log('\n=====================================================');
  console.log('=== TON SECRET KEY JWT (À COPIER DANS SUPABASE) ===');
  console.log('=====================================================\n');
  console.log(token);
  console.log('\n=====================================================\n');

} catch (error) {
  console.error("Erreur lors de la lecture du fichier ou de la génération :", error.message);
}
