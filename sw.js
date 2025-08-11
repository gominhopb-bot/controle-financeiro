// Nome do cache para a nossa aplicação
const CACHE_NAME = 'financial-control-cache-v1';

// Lista de arquivos e URLs essenciais para o funcionamento offline
const urlsToCache = [
  '/', // A página principal
  '/index.html', // O arquivo HTML principal (ajuste se o nome for diferente)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2' // A fonte Inter
  // Se você adicionar outros arquivos locais (CSS, imagens), adicione-os aqui.
];

// Evento 'install': é disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  // Espera até que o cache seja aberto e todos os arquivos essenciais sejam adicionados.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto e arquivos essenciais adicionados');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': é disparado para cada requisição que a página faz (ex: carregar uma imagem, um script).
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar a requisição no cache primeiro.
    caches.match(event.request)
      .then(response => {
        // Se a resposta for encontrada no cache, retorna-a diretamente.
        if (response) {
          return response;
        }

        // Se não estiver no cache, faz a requisição à rede.
        return fetch(event.request).then(
          networkResponse => {
            // Verifica se recebemos uma resposta válida da rede.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta. Uma resposta é um "stream" e só pode ser consumida uma vez.
            // Precisamos de uma cópia para o navegador e outra para salvar no cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Salva a nova resposta no cache para futuras requisições.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// Evento 'activate': é disparado quando um novo Service Worker é ativado.
// É o momento ideal para limpar caches antigos e desatualizados.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Lista de caches que queremos manter.

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se um cache antigo não estiver na nossa lista de permissões, ele é excluído.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
