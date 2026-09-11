window.ROULETTE_DATA = {
  themes: [
    { id: 'gay', label: 'Gay', tagline: 'Contraste elétrico, violeta e calor.', accent: '#9b7cff' },
    { id: 'lesbian', label: 'Lésbico', tagline: 'Magenta queimado, âmbar e vinho.', accent: '#ff718d' },
    { id: 'hetero', label: 'Hétero', tagline: 'Cobre, cereja e azul profundo.', accent: '#ff7c5b' },
    { id: 'bi', label: 'Bi', tagline: 'Rosa, violeta e azul em camadas.', accent: '#8f77ff' },
    { id: 'queer', label: 'Queer', tagline: 'Editorial, mutável e sem caixinhas.', accent: '#e7ff6b' },
    { id: 'neutral', label: 'Livre', tagline: 'Minimalista, quente e neutro.', accent: '#f6c879' }
  ],
  levels: [
    { id: 'leve', label: 'Leve', score: 10, note: 'Provoca sem acelerar demais.' },
    { id: 'quente', label: 'Quente', score: 20, note: 'Mais direto, ainda confortável.' },
    { id: 'intenso', label: 'Intenso', score: 35, note: 'Para quem já entrou no clima.' },
    { id: 'hardcore', label: 'Hardcore', score: 50, note: 'Só aparece com confirmação extra.' }
  ],
  challenges: [
    { level:'leve', left:'BEIJO', right:'DEMORADO', title:'Sem cronômetro emocional', desc:'Um beijo longo, sem pressa e sem transformar em competição.', tags:['romance','aquecimento'] },
    { level:'leve', left:'MASSAGEM', right:'LENTA', title:'Mãos ocupadas', desc:'Escolham quem começa. O resto da rodada é só atenção e provocação.', tags:['toque'] },
    { level:'leve', left:'OLHAR', right:'SEM FUGIR', title:'Duelo silencioso', desc:'Fiquem frente a frente e segurem o olhar até alguém quebrar a pose.', tags:['jogo'] },
    { level:'leve', left:'COLO', right:'PERTINHO', title:'Distância mínima', desc:'Uma rodada para ficar colado, conversar baixo e deixar a tensão trabalhar.', tags:['proximidade'] },
    { level:'quente', left:'POR CIMA', right:'DEVAGAR', title:'Vocês controlam o ritmo', desc:'Escolham uma posição confortável com uma pessoa conduzindo o ritmo. Consentimento sempre pode mudar no meio.', tags:['posição'] },
    { level:'quente', left:'DE LADO', right:'COLADOS', title:'Pouco espaço entre vocês', desc:'A ideia é proximidade e ritmo tranquilo. Ajustem até ficar bom para os dois.', tags:['posição'] },
    { level:'quente', left:'NO COLO', right:'SEM PRESSA', title:'A cadeira virou cúmplice', desc:'Use uma cadeira ou sofá firme e escolham quem conduz a aproximação.', tags:['posição'] },
    { level:'quente', left:'BEIJO', right:'PROIBIDO PARAR', title:'Só vale interromper para rir', desc:'Comecem devagar e deixem a rodada terminar quando vocês quiserem.', tags:['beijo'] },
    { level:'quente', left:'MÃOS', right:'LIVRES', title:'Improviso autorizado', desc:'Um guia o outro apenas com as mãos e sinais. Se algo não agradar, troquem na hora.', tags:['toque'] },
    { level:'intenso', left:'PAREDE', right:'APOIO', title:'Mudem o cenário', desc:'Escolham uma variação em pé, com apoio estável, sem pressa e sem forçar equilíbrio.', tags:['posição'] },
    { level:'intenso', left:'ESPELHO', right:'DE FRENTE', title:'A cena muda quando vocês olham', desc:'Escolham uma posição confortável perto de um espelho e alternem quem conduz.', tags:['posição'] },
    { level:'intenso', left:'RITMO', right:'ALTERNADO', title:'Troca de comando', desc:'A cada minuto, troquem quem define o ritmo e o próximo movimento.', tags:['jogo','ritmo'] },
    { level:'intenso', left:'SOFÁ', right:'SEM ROTINA', title:'Nada de piloto automático', desc:'Inventem uma variação nova usando o sofá como apoio e parem se algo ficar desconfortável.', tags:['posição'] },
    { level:'intenso', left:'VENDA', right:'CONFIANÇA', title:'Só com combinado claro', desc:'Uma pessoa fecha os olhos; a outra guia toques leves. Palavra de pausa combinada antes.', tags:['sensorial'] },
    { level:'hardcore', left:'COMANDO', right:'ALTERNADO', title:'Intensidade com limite claro', desc:'Definam uma palavra de pausa e alternem quem conduz a rodada. Nada vale mais que o conforto dos dois.', tags:['controle'] },
    { level:'hardcore', left:'DESAFIO', right:'SEM ROTINA', title:'Improviso mais ousado', desc:'Escolham juntos uma variação mais intensa que ambos já tenham vontade de experimentar.', tags:['desafio'] },
    { level:'hardcore', left:'RITMO', right:'MÁXIMO', title:'Só até onde continua bom', desc:'Aumentem a intensidade gradualmente e parem antes de desconforto virar obrigação.', tags:['ritmo'] },
    { level:'hardcore', left:'CENÁRIO', right:'NOVO', title:'Quebrem o roteiro', desc:'Escolham outro cômodo ou apoio seguro e inventem uma rodada completamente diferente.', tags:['desafio'] }
  ],
  messages: {
    start: ['A primeira rodada sempre parece inocente.','Vocês vieram jogar ou só testar a interface? 👀','O dado não julga. Só expõe a coragem.'],
    rolled: ['Agora ficou difícil fingir que não viram.','O acaso falou. Vocês negociam o resto.','Essa combinação veio com segundas intenções.','A roleta fez a parte dela. 👀'],
    done: ['Confirmado. E a pontuação gostou disso. 🔥','Vocês estão ficando perigosamente eficientes.','Mais uma para o histórico da madrugada.','A sequência subiu. O clima também.'],
    skipped: ['Tá bom… vamos fingir que essa nunca apareceu.','Covardia detectada. Próxima 😏','Essa assustou vocês? O dado anotou.','Pulou? A próxima pode vir pior.'],
    idle: ['Vocês estão ocupados demais para clicar? 👀','Silêncio suspeito por aqui…','A roleta continua esperando. Sem julgamentos.','Já faz um tempo. Acho que o jogo perdeu a prioridade.'],
    achievement: ['Isso mereceu uma conquista.','Novo marco desbloqueado. Bonito de ver.','A noite acabou de ganhar um selo novo.']
  },
  banners: [
    { kicker:'SEM PRESSA', title:'Hoje a roleta decide.', style:'ember' },
    { kicker:'SEQUÊNCIA', title:'Quanto mais vocês fazem, mais vale.', style:'violet' },
    { kicker:'SEM ROTEIRO', title:'Troquem o previsível por uma rodada nova.', style:'noir' }
  ],
  achievements: [
    { id:'first', title:'Primeira Faísca', desc:'Concluir a primeira rodada.', threshold:1, type:'done' },
    { id:'five', title:'Sem Freio', desc:'Chegar a 5 confirmações.', threshold:5, type:'done' },
    { id:'streak5', title:'Embalados', desc:'Alcançar sequência ×5.', threshold:5, type:'streak' },
    { id:'points200', title:'Noite Pontuada', desc:'Passar de 200 pontos.', threshold:200, type:'points' }
  ]
};
