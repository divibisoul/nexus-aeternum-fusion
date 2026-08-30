# SOUL — Failure Immunity Directive

## Status
ACTIVE · CUMULATIVE

Toda falha, ausência, inconsistência, fragilidade, desconexão ou implementação incompleta encontrada durante uma auditoria deve gerar ação corretiva imediata sempre que tecnicamente possível.

### Ciclo obrigatório

DETECTAR → DIAGNOSTICAR → CORRIGIR → INTEGRAR → VALIDAR → REGISTRAR → REAUDITAR

### Classes cobertas

- ausente
- incompleto
- frágil
- desconectado
- declarado mas não implementado
- implementado mas não registrado
- implementado mas não exposto
- implementado mas não utilizado
- incompatível
- duplicado ou redundante
- mock onde deveria existir execução real
- falha de integração
- falha de descoberta/delegação
- falha de observabilidade, segurança ou resiliência

### Regra de continuidade

Uma falha não encerra a etapa. Deve-se procurar a solução adequada no código existente, preservar o que funciona e fortalecer a implementação. Se a primeira correção falhar, investigar e aplicar uma alternativa tecnicamente válida, sem declarar sucesso sem validação.

### Regra de escopo

A correção deve preservar a arquitetura existente e evitar sistemas paralelos desnecessários. Toda alteração deve ser compatível com a Soul Mesh e com as interfaces dos demais núcleos.

### Regra de sinergia

Após cada correção, verificar se a mudança permite ou exige integração adicional entre agentes, ferramentas e capabilities, e registrar a oportunidade quando houver fundamento técnico.

### Critério

"Identificar" não significa "concluir". Uma falha só deixa de estar pendente quando a correção foi implementada e validada, ou quando existe bloqueio técnico real explicitamente documentado.

Esta diretriz é cumulativa ao Prompt Mestre SOUL e a todas as diretrizes anteriores.
