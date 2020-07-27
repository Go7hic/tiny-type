var babelParser = require("@babel/parser")
function parserV3(code) {
  // interface Person {
  //   name: string;
  // }
  const interfaceAst = {
    type: "InterfaceDeclaration",
    id: {
      type: "Identifier",
      name: "Person",
    },
    body: {
      type: "ObjectTypeAnnotation",
      properties: [
        {
          type: "ObjectTypeProperty",
          key: {
            type: "Identifier",
            name: "name",
          },
          kind: "init",
          method: false,
          value: {
            type: "StringTypeAnnotation",
          },
        },
      ],
    },
  };

  // fn({nam: "craig"});
  const expressionAst = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "fn",
      },
      arguments: [
        {
          type: "ObjectExpression",
          properties: [
            {
              type: "ObjectProperty",
              method: false,
              key: {
                type: "Identifier",
                name: "nam",
              },
              value: {
                type: "StringLiteral",
                value: "craig",
              },
            },
          ],
        },
      ],
    },
  };

  // function fn(a: Person) {}
  const declarationAst = {
    type: "FunctionDeclaration",
    id: {
      type: "Identifier",
      name: "fn",
    },
    params: [
      {
        type: "Identifier",
        name: "a",
        typeAnnotation: {
          type: "TypeAnnotation",
          typeAnnotation: {
            type: "GenericTypeAnnotation",
            id: {
              type: "Identifier",
              name: "Person",
            },
          },
        },
      },
    ],
    body: {
      type: "BlockStatement",
      body: [], // Empty function
    },
  };

  const programAst = {
    type: "File",
    program: {
      type: "Program",
      body: [interfaceAst, expressionAst, declarationAst],
    },
  };
  // normal AST except with typeAnnotations on
  return programAst;
}

function parserV2(code) {
  // fn("craig-string");
  const expressionAst = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "fn",
      },
      arguments: [
        {
          type: "StringLiteral", // Parser "Inference" for type.
          value: "craig-string",
        },
      ],
    },
  };

  // function fn(a: made_up_type) {}
  const declarationAst = {
    type: "FunctionDeclaration",
    id: {
      type: "Identifier",
      name: "fn",
    },
    params: [
      {
        type: "Identifier",
        name: "a",
        typeAnnotation: {
          // our only type annotation
          type: "TypeAnnotation",
          typeAnnotation: {
            type: "made_up_type", // BREAKS
          },
        },
      },
    ],
    body: {
      type: "BlockStatement",
      body: [], // "body" === block/line of code. Ours is empty
    },
  };

  const programAst = {
    type: "File",
    program: {
      type: "Program",
      body: [expressionAst, declarationAst],
    },
  };
  // normal AST except with typeAnnotations on
  return programAst;
}

function parser(code) {
  // console.log(babelParser.parse(code, {plugins: ['typescript']}).program.body[0].expression.arguments)
  console.log(babelParser.parse(code, {plugins: ['typescript']}).program.body[1])
  // fn("craig-string");
  const expressionAst = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "fn",
      },
      arguments: [
        {
          type: "StringLiteral", // Parser "Inference" for type.
          value: "craig-string",
        },
      ],
    },
  };

  // function fn(a: number) {}
  const declarationAst = {
    type: "FunctionDeclaration",
    id: {
      type: "Identifier",
      name: "fn",
    },
    params: [
      {
        type: "Identifier",
        name: "a",
        typeAnnotation: {
          // our only type annotation
          type: "TypeAnnotation",
          typeAnnotation: {
            type: "NumberTypeAnnotation",
          },
        },
      },
    ],
    body: {
      type: "BlockStatement",
      body: [], // "body" === block/line of code. Ours is empty
    },
  };

  const programAst = {
    type: "File",
    program: {
      type: "Program",
      body: [expressionAst, declarationAst],
    },
  };
  // normal AST except with typeAnnotations on
  return programAst;
}

function parseVar(code) {
  const expressionAst = {
    type: 'ExpressionStatement',
    expression: {
      type: "AssignmentExpression",
      operator: '=',
      left: {
        type: 'Identifier',
        name: 'a'
      },
      right: {
        
        type: 'NumericLiteral',
        value: 3
        // type: 'StringLiteral',
        // value: '3'
      }
    },
  }
  const declarationAst = {
    type: 'VariableDeclaration',
    // 数组，因为同时可以命名多个变量
    declarations: [
      {
        type:'VariableDeclarator',
        id: {
          type: "Identifier",
          name: "a",
          typeAnnotation: {
            // our only type annotation
            type: "TypeAnnotation",
            typeAnnotation: {
              type: "NumberTypeAnnotation",
            },
          },
        }
      }
    ]
  }
  const programAst = {
    type: "File",
    program: {
      type: "Program",
      body: [expressionAst, declarationAst],
    },
  };
  return programAst
}

/**
 * checker
 */
const ANNOTATED_TYPES = {
  NumberTypeAnnotation: "number",
  GenericTypeAnnotation: true
};

function checker(ast) {
  const errors = [];

  // Logic for type checks
  const typeChecks = {
    expression: (declarationFullType, callerFullArg) => {
      switch (declarationFullType.typeAnnotation.type) {
        case "NumberTypeAnnotation":
          return callerFullArg.type === "NumericLiteral";
        case "GenericTypeAnnotation": // non-native
          // If called with Object, check properties
          if (callerFullArg.type === "ObjectExpression") {
            // Get Interface
            const interfaceNode = ast.program.body.find(
              node => node.type === "InterfaceDeclaration"
            );
            // Get properties
            const properties = interfaceNode.body.properties;

            // Check each property against caller
            properties.map((prop, index) => {
              const name = prop.key.name;
              const associatedName = callerFullArg.properties[index].key.name;
              if (name !== associatedName) {
                errors.push(
                  `Property "${associatedName}" does not exist on interface "${interfaceNode.id.name}". Did you mean Property "${name}"?`
                );
              }
            });
          }
          return true; // as already logged
      }
    },
    annotationCheck: arg => {
      return !!ANNOTATED_TYPES[arg];
    }
  };

  // Process program
  ast.program.body.map(stnmt => {
    switch (stnmt.type) {
      case 'VariableDeclaration':
        stnmt.declarations.map(declar => {
          if (declar.id.typeAnnotation) {
            const argType = declar.id.typeAnnotation.typeAnnotation.type;
            
            // Is type annotation valid
            const isValid = typeChecks.annotationCheck(argType);
            if (!isValid) {
              errors.push(
                `Type "${argType}" for argument "${declar.id.name}" does not exist`
              );
            }
          }
        })
        return
      case "FunctionDeclaration":
        stnmt.params.map(arg => {
          // Does arg has a type annotation?
          if (arg.typeAnnotation) {
            const argType = arg.typeAnnotation.typeAnnotation.type;
            
            // Is type annotation valid
            const isValid = typeChecks.annotationCheck(argType);
            if (!isValid) {
              errors.push(
                `Type "${argType}" for argument "${arg.name}" does not exist`
              );
            }
          }
        });

        // Process function "block" code here
        stnmt.body.body.map(line => {
          // Ours has none
        });

        return;
      case "ExpressionStatement":
        // 变量赋值表达试
        if (stnmt.expression.type === 'AssignmentExpression') {
          const varName = stnmt.expression.left.name;
        
          const varType = stnmt.expression.right.type
          const varValue = stnmt.expression.right.value
          const declationAst = ast.program.body.find(
            node => node.type === "VariableDeclaration"
          );
          
          declationAst.declarations.forEach(a => {
            if (a.id.name == varName) {
              
              const isValid =  typeChecks.expression(a.id.typeAnnotation, {type: varType})
              
              if (!isValid) {
                const annotatedType = ANNOTATED_TYPES[a.id.typeAnnotation.typeAnnotation.type];
                // Show values to user, more explanatory than types
                errors.push(
                  `Type "${varValue}" is incompatible with "${annotatedType}"`
                );
              }
            }
          })
        }
        // 函数调用表达式
        if (stnmt.expression.type === 'CallExpression') {
          const functionCalled = stnmt.expression.callee.name;
          const declationForName = ast.program.body.find(
            node =>
              node.type === "FunctionDeclaration" &&
              node.id.name === functionCalled
          );
  
          // Get declaration
          if (!declationForName) {
            errors.push(`Function "${functionCalled}" does not exist`);
            return;
          }
  
          // Array of arg-to-type. e.g. 0 = NumberTypeAnnotation
          const argTypeMap = declationForName.params.map(param => {
            if (param.typeAnnotation) {
              return param.typeAnnotation;
            }
          });
  
          // Check exp caller "arg type" with declaration "arg type"
          stnmt.expression.arguments.map((arg, index) => {
            const declarationType = argTypeMap[index].typeAnnotation.type;
            const callerType = arg.type;
            const callerValue = arg.value;
  
            // Declaration annotation more important here
            const isValid = typeChecks.expression(
              argTypeMap[index], // declaration details
              arg // caller details
            );
  
            if (!isValid) {
              const annotatedType = ANNOTATED_TYPES[declarationType];
              // Show values to user, more explanatory than types
              errors.push(
                `Type "${callerValue}" is incompatible with "${annotatedType}"`
              );
            }
          });
        }

        

        return;
    }
  });
  return errors;
}

const sourceCode = `
  fn("craig-string");
  function fn(a: number) {}
`;
const sourceAst = parser(sourceCode);
const errors = checker(sourceAst);
console.log("Errors for `Scenarios 1`: ", errors);


const sourceCodeV2 = `
  fn("craig-string"); // throw with string vs ?
  function fn(a: made_up_type) {} // throw with bad type
`;

const sourceAstV2 = parserV2(sourceCodeV2);
const errorsV2 = checker(sourceAstV2);
console.log("Errors for `Scenarios 2`: ", errorsV2);

const sourceCodeV3 = `
  interface Person {
    name: string;
  }
  fn({nam: "craig"}); // throw with "nam" vs "name"
  function fn(a: Person) {}
`;
const sourceAstV3 = parserV3(sourceCodeV3);
const errorsV3 = checker(sourceAstV3);
console.log("Errors for `Scenarios 3`: ", errorsV3);

const sourceCodeV4 = `var a:number = 1; a = '3'`
const sourceAstV4 = parseVar(sourceCodeV4)
const errorsV4 = checker(sourceAstV4)
console.log("Errors for `Scenarios 4`: ", errorsV4);