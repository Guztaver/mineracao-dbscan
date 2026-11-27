---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Pulso — tela de monitoramento

## Escopo e modo
Tela principal web para análise operacional de leituras horárias, com análise individual, CSV em lote, visualização do conjunto e explicação do método.

## Público, tarefa, conteúdo e limites
A pessoa quer saber se uma leitura de hora e consumo se aproxima do padrão e entender o motivo. A professora e a turma também testam valores novos durante a demonstração. A interface prova o comportamento do DBSCAN usando dados sintéticos; não deve sugerir medição real, diagnóstico elétrico ou previsão de conta. O formulário e o processamento CSV continuam funcionais e acessíveis.

## Direção escolhida
Carta de sondagem: um plano de densidade em azul-noite, com bandas e linhas de contorno que mostram onde o DBSCAN encontra leituras concentradas. Uma leitura informada aparece como marcador situado no campo; um caso fora da concentração recebe destaque próprio. O gráfico é o momento visual memorável, sem substituir a estrutura familiar de formulário, resultado e explicação.

## Decisões em aberto
Nenhuma para esta tela. Conservar os fatos do produto, a validação, os estados de resultado e a adaptação a telas pequenas.

## Direction contract
THESIS: A pessoa lê a posição da medição num campo de densidade, em vez de receber um alerta sem contexto.

OWN-WORLD: Plano cartográfico azul-noite com papel de plotagem azul profundo, linhas de densidade em azul gelo e lilás claro, etiquetas em marfim e marca de leitura anômala em âmbar. Formulários e resultados usam superfícies sólidas azul-ardósia, limites completos e tipografia de instrumento legível; contornos são reservados ao mapa calculado.

STORY: A pessoa informa hora e consumo, vê o marcador pousar no mapa, recebe uma explicação simples e pode examinar mais leituras por CSV.

FIRST VIEWPORT: Cabeçalho compacto com marca Pulso e selo “dados simulados”; abaixo, título “Leia a paisagem do consumo” e resumo curto do conjunto. A coluna principal é o gráfico de contornos com eixo e legenda; à direita, o formulário de análise e a resposta. Em telas estreitas, formulário e resultado vêm antes do mapa. Precisão, revocação e F1 aparecem junto à seção recolhível “Como funciona”.

FORM: candidato 7, Carta de sondagem, escolhido como `assigned`; seed:359cdf7e760967dd.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
