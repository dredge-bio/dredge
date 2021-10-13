module.exports = {
  rules: {
    'createelement-arguments': {
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name !== 'h') return

            if (node.arguments.length === 1) return

            const propsArg = node.arguments[1]

            const check = node => (
              node.type === 'ObjectExpression' ||
              node.type === 'CallExpression' ||
              ('value' in node && node.value == null)
            )

            let ok = check(propsArg)

            if (!ok && propsArg.type === 'Identifier') {
              const scope = context.getScope()

              const reference = scope.references.find(x => {
                return x.identifier === propsArg
              })

              const resolved = (
                  reference.resolved &&
                  reference.resolved.defs &&
                  reference.resolved.defs.slice(-1)[0].node.init
              )

              ok = resolved !== null && check(resolved)
            }


            if (!ok) {
              context.report({
                node,
                message: 'Unexpected value for props argument',
              })
            }

            /*
            if (node.arguments[1].type === 'ArrayExpression') {
              context.report({
                node,
                message: 'Unexpected array used as second argument to createElement',
              })
            }

            if (
              node.arguments[1].type === 'Literal' &&
              typeof node.arguments[1].value === 'string'
            ) {
              context.report({
                node,
                message: 'Unexpected literal used as second argument to createElement',
              })
            }

            if (node.arguments[1].type === 'Identifier') {
              const scope = context.getScope()

              const getIdentifierInitializer = (identifier) => {
                const reference = scope.references.find(x => {
                  return x.identifier === identifier
                })

                return (
                  reference.resolved &&
                  reference.resolved.defs &&
                  reference.resolved.defs.slice(-1)[0].node.init
                )
              }

              const resolved = getIdentifierInitializer(node.arguments[1])

              if (resolved && resolved.type === 'ArrayExpression') {
                context.report({
                  node,
                  message: 'Unexpected array used as second argument to createElement',
                })
              }

              if (
                resolved &&
                resolved.type === 'Literal' &&
                typeof resolved.value === 'string'
              ) {
                context.report({
                  node,
                  message: 'Unexpected literal used as second argument to createElement',
                })
              }
            }
            */
          },
        }
      },
    },
  },
}
