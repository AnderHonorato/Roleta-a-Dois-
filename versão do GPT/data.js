window.ROULETTE_DATA = {
  levels: [
    { id:'leve', label:'Leve', score:10, note:'Provoca sem acelerar demais.' },
    { id:'quente', label:'Quente', score:20, note:'Mais direto, ainda confortável.' },
    { id:'intenso', label:'Intenso', score:35, note:'Para quando o clima já subiu.' },
    { id:'hardcore', label:'Hardcore', score:50, note:'Mais ousado, sempre com consentimento.' }
  ],
  challenges: [
    { level:'leve', a:'BEIJO', b:'LENTO', title:'Sem pressa nenhuma', desc:'Um beijo demorado e tranquilo. Vocês decidem quando termina.' },
    { level:'leve', a:'OLHAR', b:'DESAFIO', title:'Quem desvia primeiro?', desc:'Fiquem frente a frente e segurem o olhar até alguém quebrar a pose.' },
    { level:'leve', a:'COLO', b:'PROVOCAÇÃO', title:'Distância mínima', desc:'Fiquem bem próximos e deixem a tensão trabalhar por alguns instantes.' },
    { level:'leve', a:'MASSAGEM', b:'VONTADE', title:'Mãos ocupadas', desc:'Escolham quem começa e façam uma massagem caprichada em uma região confortável.' },

    { level:'quente', a:'COLO', b:'RITMO', title:'Um conduz, o outro acompanha', desc:'Escolham quem começa conduzindo a aproximação e troquem quando quiserem.' },
    { level:'quente', a:'ESPELHO', b:'PROVOCAÇÃO', title:'A cena muda quando vocês olham', desc:'Fiquem diante de um espelho e alternem quem toma a iniciativa.' },
    { level:'quente', a:'MÃOS', b:'GUIA', title:'Sem explicar demais', desc:'Um conduz o outro com as mãos e sinais. Qualquer desconforto encerra a rodada.' },
    { level:'quente', a:'SOFÁ', b:'IMPROVISO', title:'Nada de piloto automático', desc:'Usem o sofá como apoio e inventem uma variação confortável para os dois.' },
    { level:'quente', a:'BEIJO', b:'INTENSO', title:'Agora sem economia', desc:'Comecem devagar e aumentem o ritmo apenas enquanto estiver bom para os dois.' },

    { level:'intenso', a:'PAREDE', b:'PEGADA', title:'Mudem o cenário', desc:'Escolham uma variação em pé com apoio estável e sem forçar equilíbrio.' },
    { level:'intenso', a:'VENDA', b:'CONFIANÇA', title:'Só com combinado claro', desc:'Uma pessoa fecha os olhos enquanto a outra conduz toques leves e seguros.' },
    { level:'intenso', a:'DOMÍNIO', b:'TROCA', title:'O comando muda', desc:'Uma pessoa conduz por um tempo curto e depois vocês invertem os papéis.' },
    { level:'intenso', a:'RITMO', b:'ALTERNADO', title:'Troca de comando', desc:'Alternem quem decide o ritmo da rodada. Sem obrigação de manter intensidade.' },

    { level:'hardcore', a:'COMANDO', b:'INTENSO', title:'Limite combinado', desc:'Definam antes uma palavra de pausa e mantenham o controle compartilhado da rodada.' },
    { level:'hardcore', a:'CENÁRIO', b:'OUSADIA', title:'Quebrem o roteiro', desc:'Escolham um ambiente seguro diferente e criem juntos uma rodada mais ousada.' },
    { level:'hardcore', a:'RITMO', b:'MÁXIMO', title:'Só enquanto continuar bom', desc:'Aumentem a intensidade gradualmente e parem assim que qualquer um quiser.' }
  ],
  messages: {
    rolled: ['O dado escolheu. Agora a coragem é de vocês.','Essa combinação veio com intenção.','O acaso falou. Vocês negociam o resto.','Hmm… isso ficou interessante.'],
    win: ['Boa. Os dois levaram os pontos. 🔥','Rodada concluída. O ranking sentiu.','Os dois encararam. Sequência mantida.','Vitória do casal — e pontos individuais também.'],
    oneQuit: ['Um desistiu. O outro ainda leva pontos de coragem.','Teve desistência individual. O ranking vai lembrar.','Um pulou fora, o outro segurou a rodada.'],
    bothQuit: ['Os dois desistiram. Zero pontos e próxima.','Empate na covardia 😏','Essa ficou para outra noite.'],
    idle: ['Silêncio suspeito por aqui…','Vocês estão ocupados demais para clicar? 👀','O dado ainda está esperando.']
  }
};