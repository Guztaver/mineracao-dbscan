# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Pessoas que querem conferir uma leitura de consumo elétrico por hora. No contexto deste projeto acadêmico, a professora e a turma também usam o site para testar entradas novas durante a demonstração.

## Product Purpose
O Pulso recebe a hora e o consumo de uma leitura e indica se ela se aproxima do padrão aprendido no conjunto de demonstração. O sucesso é a pessoa entender o resultado e como o agrupamento chegou a ele, sem precisar conhecer DBSCAN.

## Positioning
O resultado vem de um DBSCAN treinado uma vez em leituras sintéticas. Para novas leituras, o site compara a entrada padronizada aos pontos centrais do agrupamento e sinaliza ruído quando nenhum núcleo está dentro de eps.

## Operating Context
O usuário pode analisar uma leitura no formulário ou várias por arquivo CSV. O serviço é uma demonstração acadêmica pública, testada com valores novos durante a apresentação.

## Capabilities and Constraints
- Hora de 0 a 23,99 e consumo de 0 a 50 kWh.
- CSV com cabeçalhos `hora` e `consumo_kwh`; entradas ausentes ou fora da faixa são rejeitadas com mensagem de validação.
- Base de 1.600 linhas sintéticas, gerada pelo script do repositório; não representa medições reais.
- O alerta é um sinal para conferência, não um diagnóstico de defeito, consumo ou conta.
- Interface estática em HTML, CSS e JavaScript; artefato DBSCAN serializado em JSON, sem treino a cada acesso.

## Evidence on Hand
- Dataset: `data/leituras_consumo.csv`.
- Gerador: `src/generate_data.py`.
- Treino e avaliação: `src/model.py` e `notebooks/treino_avaliacao.ipynb`.
- Modelo e métricas persistidos: `artifacts/dbscan_consumo.json`.
- Avaliação holdout atual: precisão 100,0%, revocação 89,5%, F1 94,4%; rótulos e métricas referem-se somente aos dados sintéticos.

## Product Principles
- Explique o resultado em linguagem simples.
- Identifique claramente que dados e casos de anomalia são simulados.
- Não transforme o alerta em diagnóstico ou promessa de previsão.
- Valide entradas e ajude a pessoa a corrigir valores rejeitados.

## Accessibility & Inclusion
O site é web e deve funcionar em telas pequenas, por teclado e com rótulos e mensagens compreensíveis para leitores de tela.
