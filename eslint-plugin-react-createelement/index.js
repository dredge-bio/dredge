module.exports = {
  rules: {
    'arrays-require-keys': {
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name !== 'h') return
            if (node.arguments.length !== 3) return

            const childArg = node.arguments[2]

            if (childArg.type !== 'ArrayExpression') return

            const missingKey = childArg.elements.some(node => {
              if (node.type !== 'CallExpression' || node.callee.name !== 'h') return false

              // call to createElement not passed a props object
              if (node.arguments.length < 2) return true

              // Check for object literal props. Ignore if it's not that
              if (node.arguments[1].type !== 'ObjectExpression') return false

              const propsNode = node.arguments[1]

              return !propsNode.properties.some(propertyNode =>
                propertyNode.key.name === 'key' ||
                propertyNode.key.value === 'key'
              )
            })

            if (missingKey) {
              context.report({
                node,
                message: 'Unexpected child array without key values',
              })
            }
          },
        }
      },
    },
    'createelement-arguments': {
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.name !== 'h') return

            if (node.arguments.length === 1) return

            let propsArg = node.arguments[1]

            if (propsArg.type === 'ConditionalExpression') {
              propsArg = propsArg.consequent
            }

            const check = node => (
              node.type === 'ObjectExpression' ||
              node.type === 'CallExpression' ||
              (
                node.type === 'SpreadElement' &&
                node.argument.type !== 'ArrayExpression'
              ) ||
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
