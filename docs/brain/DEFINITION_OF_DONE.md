# Definition of Done

Uma tarefa só pode ser descrita como concluída quando todas as condições aplicáveis estiverem satisfeitas.

## Funcionalidade

- comportamento solicitado implementado de ponta a ponta;
- nenhum botão sem efeito final;
- nenhum formulário que apenas pareça salvar;
- persistência, API, autenticação e regras de domínio implementadas quando exigidas;
- loading, vazio, erro e offline tratados quando aplicáveis;
- sem integração real inventada;
- DEMO identificado como DEMO.

## Código e prova

- requisito comparado novamente com a especificação;
- testes relevantes executados;
- lint/typecheck/build executados;
- Playwright executado para interação de usuário quando coberta pela infraestrutura;
- GitHub Actions do SHA/PR consultados;
- falhas obrigatórias iguais a zero.

## Proibições

Não concluir com:
- `TODO`;
- `TBD`;
- placeholder definitivo;
- mock temporário apresentado como integração;
- erro ignorado;
- requisito sem implementação;
- afirmação de teste que não foi executado.

## Relato final

Separar:
- **verificado**;
- **não verificável no runtime atual**;
- **dependência externa pendente**.
