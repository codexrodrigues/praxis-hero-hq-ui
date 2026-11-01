# Temas e tipografia do Hero HQ

Insígnia é o tema inicial; Brasa, Essência, Aurora e Órbita continuam disponíveis.
Preferências existentes são preservadas. A proposta de vidro escuro Véu Petróleo
permanece um estudo separado e não integra o catálogo runtime deste snapshot.

## Fontes canônicas

As paletas pertencem a `src/styles/workspace-themes.scss`; a tradução para Material
e componentes Praxis pertence a `src/styles/theme-praxis.scss`. A configuração
inicial dos componentes usa `GLOBAL_CONFIG_SEED`. Corrigir comportamento interno
compartilhado na biblioteca proprietária, sem duplicar contratos no host.

Insígnia combina navy `#0D1B2A`, marfim `#F9F7F1` e azul `#415A77` nas ações sobre
superfícies claras. Em menus navy, o destaque ocre `#B8860B` conserva a distinção
visual. Os tokens de primeiro plano, foco e gradiente acompanham o escopo do menu.

Insígnia e Brasa usam Manrope nos títulos e Source Sans 3 no corpo, servidas em
WOFF2 locais. O ritmo base usa corpo 400 e títulos 500; Material Symbols usa eixo
`wght` 300. Ênfase semântica pode permanecer em 600. Pesos explicitamente
authorados são preservados; seleção de linha não deve tornar todas as células
negritas. Os outros temas preservam suas famílias de fontes.

## Validação e limites

O snapshot adota os 22 pacotes públicos `@praxisui/*` na versão exata
`10.0.0-rc.43`, com lockfile do registry. Instalação limpa, contratos do host,
build e verificação de temas foram executados nessa versão. O build mantém o
aviso existente de orçamento inicial (17,11 MB para limiar de aviso de 15 MB).

Os auxiliares em `scripts/workspace` documentam ensaios reproduzíveis. As provas
com HTTP simulado verificam componentes e layout; não certificam autenticação,
permissões ou banco. Os ensaios de navegador anteriores não foram repetidos
integralmente sobre a rc.43. A revisão autenticada depende de uma sessão de teste
autorizada. O experimento de atualização do cache de ações da tabela continua
fora deste snapshot, com validação pendente.
