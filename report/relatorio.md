# Pulso — Monitor de anomalias de consumo

**Projeto final de Mineração de Dados · SIS920**  
**Integrantes:** Alex Gabriel Alves dos Santos e Gustavo Muniz dos Anjos

## Problema e solução

O projeto apresenta um serviço simples para verificar se uma leitura horária de consumo elétrico se distancia do padrão observado para aquele horário. O usuário informa hora e consumo em kWh, ou envia várias leituras por CSV. O site retorna “dentro do padrão” ou “fora do padrão” e posiciona a leitura em um gráfico. O alerta é uma indicação para conferência, não um diagnóstico de defeito.

## Dados

Foi criado por script um conjunto sintético e reprodutível de 1.600 leituras, com duas variáveis de entrada: hora do dia e consumo em kWh. A curva esperada tem baixa demanda na madrugada e picos de manhã e à noite. Foi acrescentado ruído normal com desvio de 0,16 kWh. Em 6% das linhas, o consumo foi substituído por um pico de 2,2 a 5 kWh sobre a curva ou por uma leitura muito baixa (0,02 a 0,08 kWh). A semente 42 fixa a geração. Os dados não foram coletados de pessoas, empresas ou medidores reais.

## Técnica e avaliação

As variáveis foram padronizadas e o DBSCAN foi ajustado com `eps=0.42` e `min_samples=12`. O conjunto foi dividido em 80% treino e 20% teste. Como DBSCAN é um método de agrupamento transdutivo sem `predict`, para pontos novos foi implementada uma regra baseada nos pontos centrais: associa-se ao núcleo mais próximo dentro do raio `eps`; sem núcleo nesse raio, classifica-se como ruído.

No teste (320 leituras), a **precisão** na detecção das anomalias simuladas foi **100,0%**, a **revocação** foi **89,5%** e o **F1** foi **94,4%**. Foram encontrados 17 dos 19 casos artificiais no teste, com nenhum falso positivo e dois falsos negativos. Essas métricas são calculadas contra os rótulos artificiais do gerador e não representam desempenho em dados reais. O gráfico e a seção “Como funciona” do site apresentam a técnica, a origem dos dados, a regra de inferência e os indicadores.

## Limitações

O perfil é simplificado e não considera clima, estação do ano, tipo de imóvel, número de moradores ou equipamentos. A forma de gerar os casos anômalos influencia as métricas. DBSCAN pode variar conforme escala e parâmetros, e a regra de vizinhança para novos casos é uma adaptação explícita do agrupamento. Assim, o resultado serve para demonstrar mineração de dados, não para decidir cobrança, segurança elétrica ou manutenção.

## Divisão de tarefas

Proposta a confirmar pela dupla: **Alex Gabriel Alves dos Santos** — revisar gerador, DBSCAN e avaliação; **Gustavo Muniz dos Anjos** — integrar site, validação de entradas e visualização; **ambos** — conferir métricas, revisar o relatório e preparar a apresentação. Ajustar conforme a participação realmente realizada.
